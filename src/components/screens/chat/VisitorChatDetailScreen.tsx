"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Hooks & Store
import { useChatStore } from "@/store/useChatStore";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { useChatSocketSync } from "@/hooks/useChatSocketSync";

// Extracted UI Components
import {
  ChatHeader,
  ChatBubble,
  ChatContextMenu,
} from "@/components/screens/chat/ChatUIComponents";

export default function VisitorChatDetailScreen({
  partnerId,
  partnerName,
  onBack,
}: {
  partnerId: string;
  partnerName: string;
  onBack: () => void;
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const queryClient = useQueryClient();

  // --- GLOBAL STATE (Zustand) ---
  const socket = useChatStore((state) => state.socket);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const typingUser = useChatStore((state) => state.typingUser);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const lastSeenMap = useChatStore((state) => state.lastSeenMap);

  // --- LOCAL STATE ---
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Context Menu State
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // --- REFS ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DATA FETCHING & SYNC ---
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChatHistory(userId, partnerId);
  const allMessages = useMemo(
    () => data?.pages.flatMap((page) => page) || [],
    [data],
  );
  const { ref: topSentinel, inView } = useInView({ threshold: 0 });

  // Activate our custom Socket Sync hook
  useChatSocketSync(socket, userId, partnerId);

  // Set active chat on mount, clear on unmount
  useEffect(() => {
    setActiveChat(partnerId);
    return () => setActiveChat(null);
  }, [partnerId, setActiveChat]);

  // Pagination trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage]);

  // Smooth auto-scroll
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      window.requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  useEffect(() => {
    if (allMessages.length > 0 && !isFetchingNextPage) scrollToBottom();
  }, [allMessages.length]);

  // --- CLEAR UNREAD BADGE ON MOUNT ---
  useEffect(() => {
    if (socket?.connected && userId && partnerId) {
      // 1. Tell the database to mark all previous messages from this partner as read
      socket.emit("mark_messages_read", {
        readerId: userId,
        senderId: partnerId,
      });

      // 2. Instantly update the global Zustand store so the badge disappears from the bottom tab
      useChatStore.getState().syncUnreadCount(userId);
    }
  }, [socket, userId, partnerId]);

  // --- DATA TRANSFORMATION (WhatsApp-style Grouping) ---
  const groupedMessages = useMemo(() => {
    const groups: { type: "date" | "message"; value: any; id: string }[] = [];
    allMessages.forEach((msg, index) => {
      const currentDate = new Date(msg.createdAt).toDateString();
      const prevDate =
        index > 0
          ? new Date(allMessages[index - 1].createdAt).toDateString()
          : null;

      if (currentDate !== prevDate) {
        groups.push({
          type: "date",
          value: msg.createdAt,
          id: `date-${msg.createdAt}`,
        });
      }
      groups.push({ type: "message", value: msg, id: msg.id });
    });
    return groups;
  }, [allMessages]);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (date.toDateString() === today) return "Сегодня";
    if (date.toDateString() === yesterday) return "Вчера";
    return format(date, "d MMMM", { locale: ru });
  };

  // --- ACTION HANDLERS ---
  const injectOptimisticMessage = (msg: ChatMessage) => {
    queryClient.setQueryData(["chatHistory", partnerId], (oldData: any) => {
      if (!oldData) return { pages: [[msg]], pageParams: [null] };
      const newPages = [...oldData.pages];
      newPages[newPages.length - 1] = [...newPages[newPages.length - 1], msg];
      return { ...oldData, pages: newPages };
    });
    scrollToBottom();
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value.trim();
    if (!text || !socket?.connected) return;

    const tempId = `temp-${Date.now()}`;
    injectOptimisticMessage({
      id: tempId,
      tempId,
      senderId: userId,
      text,
      createdAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text || "Фото",
            senderId: replyingTo.senderId,
          }
        : undefined,
    });

    socket.emit("send_message", {
      senderId: userId,
      receiverId: partnerId,
      text,
      tempId,
      replyToId: replyingTo?.id,
    });

    inputRef.current!.value = "";
    setReplyingTo(null);
    socket.emit("stop_typing", { senderId: userId, receiverId: partnerId });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket?.connected) return;
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset picker

    try {
      setIsUploading(true);
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1080,
      });
      const tempId = `img-temp-${Date.now()}`;

      injectOptimisticMessage({
        id: tempId,
        tempId,
        senderId: userId,
        imageUrl: URL.createObjectURL(compressedFile),
        createdAt: new Date().toISOString(),
        isRead: false,
        isOptimistic: true,
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              text: replyingTo.text || "Фото",
              senderId: replyingTo.senderId,
            }
          : undefined,
      });

      const formData = new FormData();
      formData.append("image", compressedFile);

      // Update this URL to match your backend port/domain if needed
      const API_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
      const { data } = await axios.post(`${API_URL}/api/chat/upload`, formData);

      socket.emit("send_message", {
        senderId: userId,
        receiverId: partnerId,
        imageUrl: data.url,
        tempId,
        replyToId: replyingTo?.id,
      });

      setReplyingTo(null);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!socket?.connected) return;

    // Optimistically remove from cache
    queryClient.setQueryData(["chatHistory", partnerId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any[]) =>
          page.filter((m: ChatMessage) => m.id !== messageId),
        ),
      };
    });

    socket.emit("delete_message", { messageId, partnerId });
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-0 bg-white z-[100] flex flex-col h-full overflow-hidden"
    >
      {/* 1. HEADER */}
      <ChatHeader
        partnerName={partnerName}
        partnerId={partnerId}
        isOnline={onlineUsers.has(partnerId)}
        lastSeen={lastSeenMap[partnerId]}
        typingUser={typingUser}
        onBack={onBack}
      />

      {/* 2. CHAT HISTORY (MAIN AREA) */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        <div ref={topSentinel} className="h-4 flex justify-center">
          {isFetchingNextPage && (
            <Loader2 className="animate-spin text-green-600" />
          )}
        </div>

        {groupedMessages.map((item) => {
          if (item.type === "date") {
            return (
              <div key={item.id} className="flex justify-center my-4">
                <span className="bg-gray-200 text-gray-600 text-[11px] px-3 py-1 rounded-lg font-bold shadow-sm">
                  {formatDateHeader(item.value)}
                </span>
              </div>
            );
          }

          const msg = item.value as ChatMessage;
          return (
            <ChatBubble
              key={item.id}
              msg={msg}
              isMine={msg.senderId === userId}
              onSwipe={(swipedMsg) => {
                if ("vibrate" in navigator) navigator.vibrate(30);
                setReplyingTo(swipedMsg);
              }}
              onLongPress={(pos, longPressedMsg) => {
                setMenuPosition(pos);
                setSelectedMessage(longPressedMsg);
              }}
            />
          );
        })}
        <div ref={messagesEndRef} className="h-1" />
      </main>

      {/* 3. CONTEXT MENU (Floating, rendered when long-pressed) */}
      {selectedMessage && menuPosition && (
        <ChatContextMenu
          position={menuPosition}
          message={selectedMessage}
          isMine={selectedMessage.senderId === userId}
          onClose={() => {
            setSelectedMessage(null);
            setMenuPosition(null);
          }}
          onReply={() => setReplyingTo(selectedMessage)}
          onDelete={() => handleDeleteMessage(selectedMessage.id)}
        />
      )}

      {/* 4. FOOTER & INPUT AREA */}
      <footer className="p-3 bg-white border-t shrink-0 flex flex-col">
        {/* Reply Preview Bar */}
        {replyingTo && (
          <div className="mb-2 p-2 bg-gray-50 rounded-lg border-l-4 border-green-500 flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <span className="text-xs font-bold text-green-700 block">
                {replyingTo.senderId === userId ? "Вы" : partnerName}
              </span>
              <span className="text-xs text-gray-500 truncate block">
                {replyingTo.text || "Фотография"}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Form Controls */}
        <form onSubmit={handleSendText} className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>

          <input
            ref={inputRef}
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
            placeholder="Сообщение..."
            onChange={() =>
              socket?.emit("typing", {
                senderId: userId,
                receiverId: partnerId,
              })
            }
          />

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-full shadow-md active:scale-95 transition-all"
          >
            <Send className="w-5 h-5 ml-0.5" />{" "}
            {/* ml-0.5 optically centers the send icon */}
          </button>
        </form>
      </footer>
    </motion.div>
  );
}
