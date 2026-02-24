"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, ListTodo, User, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { useSession } from "next-auth/react";

// --- SCREENS ---
import PostJobScreen from "@/components/screens/visitor/PostJobScreen";
import VisitorMyJobsScreen from "@/components/screens/visitor/VisitorMyJobsScreen";
import VisitorProfileScreen from "@/components/screens/visitor/VisitorProfileScreen";
import VisitorChatListScreen from "@/components/screens/chat/VisitorChatListScreen";

// --- GLOBAL STATE ---
import { useChatStore } from "@/store/useChatStore";

type Tab = "POST_JOB" | "MY_JOBS" | "CHAT" | "PROFILE";

export default function VisitorHomeHost() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [currentTab, setCurrentTab] = useState<Tab>("POST_JOB");

  // 1. Optimized Selectors from Zustand (prevents re-render loops)
  const socket = useChatStore((state) => state.socket);
  const connectSocket = useChatStore((state) => state.connectSocket);
  const totalUnreadCount = useChatStore((state) => state.totalUnreadCount);
  const syncUnreadCount = useChatStore((state) => state.syncUnreadCount);

  // 2. Lifecycle: Initialize Socket Connection once
  useEffect(() => {
    if (userId && !socket?.connected) {
      connectSocket(userId);
      syncUnreadCount(userId);
    }
  }, [userId, socket?.connected, connectSocket, syncUnreadCount]);

  // 3. Render Content Mapper
  const renderContent = useCallback(() => {
    switch (currentTab) {
      case "POST_JOB":
        return (
          <PostJobScreen onNavigateToMyJobs={() => setCurrentTab("MY_JOBS")} />
        );
      case "MY_JOBS":
        return <VisitorMyJobsScreen />;
      case "CHAT":
        return (
          <VisitorChatListScreen
            onNavigateToDetail={(partnerId) => {
              // Standard Next.js routing for detail pages
              router.push(`/chat/${partnerId}`);
            }}
          />
        );
      case "PROFILE":
        return (
          <VisitorProfileScreen onLogout={() => router.replace("/login")} />
        );
      default:
        return (
          <PostJobScreen onNavigateToMyJobs={() => setCurrentTab("MY_JOBS")} />
        );
    }
  }, [currentTab, router]);

  return (
    <div className="min-h-screen bg-gray-50 pb-[90px]">
      {/* Tab Content with Horizontal Slide Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Persistent Bottom Bar */}
      <VisitorBottomBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        badgeCount={totalUnreadCount}
      />
    </div>
  );
}

// --- SUB-COMPONENT: BOTTOM BAR ---
function VisitorBottomBar({
  currentTab,
  onTabChange,
  badgeCount,
}: {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  badgeCount: number;
}) {
  const tabs = [
    { id: "POST_JOB" as Tab, label: "Создать", icon: PlusCircle },
    { id: "MY_JOBS" as Tab, label: "Задачи", icon: ListTodo },
    { id: "CHAT" as Tab, label: "Чаты", icon: MessageSquare },
    { id: "PROFILE" as Tab, label: "Профиль", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-[75px] pb-safe z-50 px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;
          const isChat = tab.id === "CHAT";

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center w-full relative group transition-transform active:scale-95"
            >
              {/* Icon Container */}
              <div
                className={clsx(
                  "w-12 h-7 rounded-full flex items-center justify-center transition-all duration-300 mb-1",
                  isSelected
                    ? "bg-green-600 shadow-md scale-110"
                    : "bg-transparent group-hover:bg-gray-100",
                )}
              >
                <tab.icon
                  className={clsx(
                    "w-5 h-5 transition-colors",
                    isSelected ? "text-white" : "text-gray-400",
                  )}
                />

                {/* --- RED NOTIFICATION BADGE --- */}
                {isChat && badgeCount > 0 && (
                  <span className="absolute -top-1 right-[22%] flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={clsx(
                  "text-[10px] tracking-tight transition-colors",
                  isSelected
                    ? "text-green-700 font-bold"
                    : "text-gray-400 font-medium",
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
