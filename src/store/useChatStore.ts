import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import axios from "axios";

interface ChatState {
  socket: Socket | null;
  totalUnreadCount: number;
  onlineUsers: Set<string>;
  // NEW: Store last seen timestamps { "userId": "2024-..." }
  lastSeenMap: Record<string, string>;
  activeChatId: string | null;
  refreshTrigger: number;
  typingUser: string | null;

  // Actions
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  syncUnreadCount: (userId: string) => Promise<void>;
  // Updated: Bulk sync both online status and last seen timestamps
  setOnlineStatusBulk: (
    onlineIds: string[],
    lastSeenData: Record<string, string>,
  ) => void;
  setActiveChat: (partnerId: string | null) => void;
  decreaseUnreadCount: (amount: number) => void;
}

// Helper for notification sounds
const playNotificationSound = () => {
  if (typeof window !== "undefined") {
    const audio = new Audio("/sounds/notification.wav");
    audio
      .play()
      .catch(() =>
        console.log("Audio playback blocked until user interaction."),
      );
  }
};

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  totalUnreadCount: 0,
  onlineUsers: new Set(),
  lastSeenMap: {}, // Initialize as empty object
  activeChatId: null,
  refreshTrigger: 0,
  typingUser: null,

  connectSocket: (userId: string) => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) return;

    if (currentSocket && !currentSocket.connected) {
      currentSocket.connect();
      return;
    }

    const API_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.emit("user_connected", userId);

    // --- SOCKET EVENT LISTENERS ---

    socket.on("connect", () => {
      console.log("✅ PWA Socket Connected");
      get().syncUnreadCount(userId);
    });

    socket.on("receive_message", (newMessage) => {
      if (get().activeChatId !== newMessage.senderId) {
        get().syncUnreadCount(userId);
        playNotificationSound();
        if ("vibrate" in navigator) navigator.vibrate(200);
      }
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    socket.on("messages_read_by_recipient", () => {
      get().syncUnreadCount(userId);
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    // UPDATED: Handle lastSeen data from the disconnect broadcast
    socket.on(
      "user_status_changed",
      ({ userId: changedUserId, isOnline, lastSeen }) => {
        set((state) => {
          const newSet = new Set(state.onlineUsers);
          const newLastSeenMap = { ...state.lastSeenMap };

          if (isOnline) {
            newSet.add(changedUserId);
          } else {
            newSet.delete(changedUserId);
            // If the user goes offline, store their lastSeen timestamp
            if (lastSeen) {
              newLastSeenMap[changedUserId] = lastSeen;
            }
          }
          return { onlineUsers: newSet, lastSeenMap: newLastSeenMap };
        });
      },
    );

    // FIXED: Your backend sends { senderId }, matching that here
    socket.on("user_typing", ({ senderId }) => {
      if (get().activeChatId === senderId) {
        set({ typingUser: senderId });
      }
    });

    socket.on("user_stopped_typing", () => {
      set({ typingUser: null });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({
      socket: null,
      totalUnreadCount: 0,
      onlineUsers: new Set(),
      lastSeenMap: {},
      typingUser: null,
      activeChatId: null,
    });
  },

  // UPDATED: Replaces setOnlineUsers to handle both online and lastSeen data from /sessions
  setOnlineStatusBulk: (
    onlineIds: string[],
    lastSeenData: Record<string, string>,
  ) => {
    set({
      onlineUsers: new Set(onlineIds),
      lastSeenMap: lastSeenData,
    });
  },

  syncUnreadCount: async (userId: string) => {
    if (!userId) return;
    try {
      const BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
      const { data } = await axios.get(
        `${BASE_URL}/api/chat/unread-count?userId=${userId}`,
      );
      set({ totalUnreadCount: data.totalUnread });
    } catch (error) {
      console.error("❌ Error syncing unread count:", error);
    }
  },

  setActiveChat: (partnerId: string | null) => {
    if (get().activeChatId === partnerId) return;
    set({ activeChatId: partnerId, typingUser: null });
  },

  decreaseUnreadCount: (amount: number) => {
    set((state) => ({
      totalUnreadCount: Math.max(0, state.totalUnreadCount - amount),
    }));
  },
}));
