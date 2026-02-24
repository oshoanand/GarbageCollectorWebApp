import { useRef } from "react";
import {
  ChevronLeft,
  UserCircle,
  Check,
  CheckCheck,
  Loader2,
  Reply,
  Trash2,
  Send,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/hooks/useChatHistory"; // Ensure this path matches your project

// ==========================================
// 1. CHAT HEADER COMPONENT
// ==========================================
export const ChatHeader = ({
  partnerName,
  partnerId,
  isOnline,
  lastSeen,
  typingUser,
  onBack,
}: any) => (
  <header className="flex items-center gap-3 p-4 border-b bg-white shrink-0 shadow-sm z-20">
    <button
      onClick={onBack}
      className="p-1 -ml-2 active:bg-gray-100 rounded-full transition-colors"
    >
      <ChevronLeft className="w-6 h-6 text-gray-700" />
    </button>
    <UserCircle className="w-10 h-10 text-gray-300 shrink-0" />
    <div className="flex-1 min-w-0">
      <h2 className="font-bold text-gray-900 truncate leading-tight">
        {partnerName}
      </h2>
      {typingUser === partnerId ? (
        <p className="text-xs text-green-600 animate-pulse font-medium">
          печатает...
        </p>
      ) : isOnline ? (
        <p className="text-[11px] text-green-600 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />{" "}
          В сети
        </p>
      ) : (
        <p className="text-[10px] text-gray-400 truncate">
          Был(а){" "}
          {lastSeen
            ? formatDistanceToNow(new Date(lastSeen), {
                addSuffix: true,
                locale: ru,
              })
            : "недавно"}
        </p>
      )}
    </div>
  </header>
);

// ==========================================
// 2. CHAT BUBBLE COMPONENT (Gestures + Media)
// ==========================================
export const ChatBubble = ({
  msg,
  isMine,
  onSwipe,
  onLongPress,
}: {
  msg: ChatMessage;
  isMine: boolean;
  onSwipe: (msg: ChatMessage) => void;
  onLongPress: (pos: { x: number; y: number }, msg: ChatMessage) => void;
}) => {
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Long Press Logic ---
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    pressTimer.current = setTimeout(() => {
      if ("vibrate" in navigator) navigator.vibrate(50);
      onLongPress({ x: clientX, y: clientY }, msg);
    }, 500); // 500ms required to trigger context menu
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 100 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        // Trigger swipe-to-reply if pulled more than 60px right
        if (info.offset.x > 60) onSwipe(msg);
      }}
      className={clsx(
        "flex relative group",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      {/* Hidden Swipe-to-Reply Icon */}
      <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 opacity-0 group-drag:opacity-100 transition-opacity">
        <div className="bg-gray-200 p-1.5 rounded-full shadow-sm">
          <Reply className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      <div
        id={`msg-${msg.id}`}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressEnd} // Cancel timer if user is just scrolling
        className={clsx(
          "max-w-[85%] rounded-2xl shadow-sm relative z-10 select-none",
          isMine
            ? "bg-green-600 text-white rounded-br-none"
            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none",
          msg.isOptimistic && "opacity-70",
          msg.imageUrl ? "p-1" : "px-3.5 py-2", // Tighter padding for images
        )}
      >
        {/* --- Reply Context Box --- */}
        {msg.replyTo && (
          <div
            className={clsx(
              "mb-2 p-2 rounded-lg text-xs border-l-4 flex flex-col cursor-pointer",
              isMine
                ? "bg-green-700/30 border-green-200"
                : "bg-gray-100 border-green-600",
            )}
          >
            <span className="font-bold mb-0.5 opacity-90">
              {/* Note: Partner name could be passed down if needed, defaulting to "Quoted Message" here for simplicity if not */}
              {msg.replyTo.senderId === msg.senderId ? "Вы" : "Сообщение"}
            </span>
            <span className="opacity-80 truncate">
              {msg.replyTo.text || "Фото"}
            </span>
          </div>
        )}

        {/* --- Image Renderer --- */}
        {msg.imageUrl && (
          <div className="relative">
            <img
              src={msg.imageUrl}
              alt="Вложение"
              className="rounded-xl w-full max-h-[300px] object-cover"
            />
            {/* Overlay timestamp for images */}
            <div className="absolute bottom-1 right-2 bg-black/40 text-white px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
              <span className="text-[10px]">
                {format(new Date(msg.createdAt), "HH:mm")}
              </span>
              {isMine &&
                !msg.isOptimistic &&
                (msg.isRead ? (
                  <CheckCheck className="w-3 h-3 text-blue-300" />
                ) : (
                  <Check className="w-3 h-3" />
                ))}
              {isMine && msg.isOptimistic && (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              )}
            </div>
          </div>
        )}

        {/* --- Text Renderer --- */}
        {msg.text && (
          <>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {msg.text}
            </p>
            <div className="flex justify-end items-center gap-1 mt-1 text-[10px] opacity-70">
              <span>{format(new Date(msg.createdAt), "HH:mm")}</span>
              {isMine &&
                !msg.isOptimistic &&
                (msg.isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                ))}
              {isMine && msg.isOptimistic && (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ==========================================
// 3. CHAT CONTEXT MENU COMPONENT
// ==========================================
export const ChatContextMenu = ({
  position,
  message,
  isMine,
  onClose,
  onReply,
  onDelete,
}: {
  position: { x: number; y: number };
  message: ChatMessage;
  isMine: boolean;
  onClose: () => void;
  onReply: () => void;
  onDelete: () => void;
}) => {
  // Math to keep the menu strictly inside the viewport bounds
  const safeY = Math.max(
    100,
    Math.min(position.y - 40, window.innerHeight - 150),
  );
  const safeX = Math.max(
    10,
    Math.min(position.x - 60, window.innerWidth - 160),
  );

  return (
    <AnimatePresence>
      {/* Invisible backdrop to capture outside clicks and close the menu */}
      <div
        className="fixed inset-0 z-[110] bg-black/5 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{ top: safeY, left: safeX }}
        className="fixed z-[120] bg-white shadow-xl rounded-xl border border-gray-100 py-1 min-w-[150px] overflow-hidden"
      >
        <button
          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between transition-colors border-b border-gray-50"
          onClick={() => {
            onReply();
            onClose();
          }}
        >
          Ответить <Reply className="w-4 h-4 text-gray-400" />
        </button>

        {/* Only show delete option if the user sent the message */}
        {isMine && (
          <button
            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 active:bg-red-100 flex items-center justify-between transition-colors"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            Удалить <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
