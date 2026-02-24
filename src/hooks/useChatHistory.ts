import { useInfiniteQuery } from "@tanstack/react-query";
import { apiRequest } from "@/services/http/api-client";

// interface ChatMessage {
//   id: string;
//   senderId: string;
//   text: string;
//   isRead: boolean;
//   isDelivered: boolean;
//   createdAt: string;
// }

// export interface ChatMessage {
//   id: string;
//   senderId: string;
//   isDelivered?: boolean;
//   receiverId?: string;
//   chatSessionId?: string;
//   text: string;
//   createdAt: string;
//   isRead: boolean;

//   isOptimistic?: boolean;
//   tempId?: string;
// }

export interface ChatMessage {
  id: string;
  chatSessionId?: string;
  senderId: string;
  receiverId?: string;
  text?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;

  // --- UI & State Modifiers ---
  isOptimistic?: boolean;
  tempId?: string;

  // --- ADD THIS BLOCK TO FIX THE ERROR ---
  replyTo?: {
    id: string;
    text: string;
    senderId: string;
  };
}

export const useChatHistory = (userId: string, partnerId: string) => {
  return useInfiniteQuery<ChatMessage[]>({
    queryKey: ["chatHistory", partnerId],
    queryFn: async ({ pageParam }) => {
      const response = await apiRequest<ChatMessage[]>({
        url: "/api/chat/history",
        method: "GET",
        params: {
          userId1: userId,
          userId2: partnerId,
          cursor: pageParam ? pageParam : undefined,
          limit: 20,
        },
      });
      // Ensure we always return an array even if the API fails
      return response || [];
    },
    initialPageParam: "",
    getNextPageParam: (lastPage) => {
      // FIX: If the database is empty [] or we reached the end (e.g. 5 messages < 20)
      // we MUST return undefined to stop the loader.
      if (!lastPage || lastPage.length < 20) {
        return undefined;
      }

      // Use the oldest message ID as the next cursor
      return lastPage[0]?.id;
    },
  });
};
