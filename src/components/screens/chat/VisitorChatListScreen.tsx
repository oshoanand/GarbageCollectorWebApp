"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Loader2, MessageSquare, UserCircle, Search } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { clsx } from "clsx";

interface ChatSession {
  collectorId: string;
  collectorName: string;
  collectorRole: string;
  collectorProfileImage: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: string;
}

export default function VisitorChatListScreen({
  onNavigateToDetail,
}: {
  onNavigateToDetail: (id: string) => void;
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // 1. Zustand Selectors
  const socket = useChatStore((state) => state.socket); // <--Need socket for live updates
  const refreshTrigger = useChatStore((state) => state.refreshTrigger);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const lastSeenMap = useChatStore((state) => state.lastSeenMap);
  const setOnlineStatusBulk = useChatStore(
    (state) => state.setOnlineStatusBulk,
  );
  const decreaseUnreadCount = useChatStore(
    (state) => state.decreaseUnreadCount,
  );

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 2. Optimized Data Fetching (Wrapped in useCallback to use in multiple places)
  const fetchSessions = useCallback(
    async (isSilent = false) => {
      if (!userId) return;
      if (!isSilent) setLoading(true);

      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
        const { data } = await axios.get(
          `${API_URL}/api/chat/sessions?userId=${userId}`,
        );

        // Sync both Online Status and Last Seen timestamps to Global Store
        const currentlyOnline: string[] = [];
        const lastSeenData: Record<string, string> = {};

        data.forEach((s: ChatSession) => {
          if (s.isOnline) {
            currentlyOnline.push(s.collectorId);
          } else if (s.lastSeen) {
            lastSeenData[s.collectorId] = s.lastSeen;
          }
        });

        // Bulk update the store to prevent multiple re-renders
        setOnlineStatusBulk(currentlyOnline, lastSeenData);
        setSessions(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    },
    [userId, setOnlineStatusBulk],
  );

  // Initial fetch and manual refresh trigger
  useEffect(() => {
    fetchSessions(sessions.length > 0);
  }, [fetchSessions, refreshTrigger, sessions.length]);

  // --- NEW: 3. REAL-TIME SOCKET SYNC ---
  // Keeps the list perfectly accurate if messages arrive or are read while on this screen
  useEffect(() => {
    if (!socket || !userId) return;

    const handleSilentRefresh = () => {
      fetchSessions(true); // Refetch list in the background without showing the loader
    };

    socket.on("receive_message", handleSilentRefresh);
    socket.on("read_status_synced", handleSilentRefresh);
    socket.on("messages_read_by_recipient", handleSilentRefresh);

    return () => {
      socket.off("receive_message", handleSilentRefresh);
      socket.off("read_status_synced", handleSilentRefresh);
      socket.off("messages_read_by_recipient", handleSilentRefresh);
    };
  }, [socket, userId, fetchSessions]);

  // 4. Simple Search Logic
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) =>
      s.collectorName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sessions, searchQuery]);

  if (loading && sessions.length === 0) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-green-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <div className="p-4 border-b sticky top-0 bg-white z-10 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Сообщения</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
            <MessageSquare className="w-12 h-12 opacity-10 mb-2" />
            <p className="text-sm">Чаты не найдены</p>
          </div>
        ) : (
          filteredSessions.map((chat) => (
            <ChatListItem
              key={chat.collectorId}
              chat={chat}
              isOnline={onlineUsers.has(chat.collectorId)}
              realTimeLastSeen={lastSeenMap[chat.collectorId]}
              onClick={() => {
                // 1. Decrease global unread count (bottom nav badge)
                decreaseUnreadCount(chat.unreadCount);

                // 2. OPTIMISTIC UPDATE: Instantly wipe the local unread count so it's gone when you come back
                setSessions((prev) =>
                  prev.map((s) =>
                    s.collectorId === chat.collectorId
                      ? { ...s, unreadCount: 0 }
                      : s,
                  ),
                );

                // 3. Navigate to detail screen
                onNavigateToDetail(chat.collectorId);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: CHAT ITEM ---
// (No changes needed in the UI rendering of the list item)
function ChatListItem({
  chat,
  isOnline,
  realTimeLastSeen,
  onClick,
}: {
  chat: ChatSession;
  isOnline: boolean;
  realTimeLastSeen?: string;
  onClick: () => void;
}) {
  const lastActive = realTimeLastSeen || chat.lastSeen || chat.lastMessageTime;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 border-b active:bg-gray-50 transition-colors cursor-pointer group"
    >
      <div className="relative shrink-0">
        <div
          className={clsx(
            "w-14 h-14 rounded-full overflow-hidden border-2 transition-all",
            isOnline
              ? "border-green-500 ring-2 ring-green-100"
              : "border-gray-200",
          )}
        >
          {chat.collectorProfileImage ? (
            <img
              src={chat.collectorProfileImage}
              className="w-full h-full object-cover"
              alt={chat.collectorName}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>
        {isOnline && (
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-bold text-gray-900 truncate group-active:text-green-700">
            {chat.collectorName}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />{" "}
              В сети
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">
              Был(а){" "}
              {formatDistanceToNow(new Date(lastActive), {
                addSuffix: true,
                locale: ru,
              })}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={clsx(
              "text-sm truncate",
              chat.unreadCount > 0 ? "text-black font-bold" : "text-gray-500",
            )}
          >
            {chat.lastMessage}
          </p>
          {chat.unreadCount > 0 && (
            <span className="bg-green-600 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full">
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
