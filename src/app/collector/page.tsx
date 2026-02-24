"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ListTodo, CheckCircle, User, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { useSession } from "next-auth/react";

// --- Import your screens here ---
import ActiveJobsScreen from "@/components/screens/collector/ActiveJobScreen";
import CollectorMyJobsScreen from "@/components/screens/collector/CollectorMyJobsScreen";
import CollectorProfileScreen from "@/components/screens/collector/CollectorProfileScreen";
import VisitorChatListScreen from "@/components/screens/chat/VisitorChatListScreen";

// --- GLOBAL STATE HOOK ---
import { useChatStore } from "@/store/useChatStore";

type Tab = "ACTIVE_JOBS" | "MY_JOBS" | "CHAT" | "PROFILE";

export default function CollectorHomeHost() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // 1. Navigation State
  const [currentTab, setCurrentTab] = useState<Tab>("ACTIVE_JOBS");

  // 2. Optimized Selectors from Zustand (Crucial for preventing infinite loops)
  const socket = useChatStore((state) => state.socket);
  const connectSocket = useChatStore((state) => state.connectSocket);
  const totalUnreadCount = useChatStore((state) => state.totalUnreadCount);
  const syncUnreadCount = useChatStore((state) => state.syncUnreadCount);

  // 3. Lifecycle: Initialize Socket Connection once
  useEffect(() => {
    // Check .connected to prevent re-triggering while connection is in progress
    if (userId && !socket?.connected) {
      connectSocket(userId);
      syncUnreadCount(userId); // Initial API fetch for badge
    }
  }, [userId, socket?.connected, connectSocket, syncUnreadCount]);

  // 4. Memoized Render Content
  const renderContent = useCallback(() => {
    switch (currentTab) {
      case "ACTIVE_JOBS":
        return (
          <ActiveJobsScreen
            onNavigateToMyJobs={() => setCurrentTab("MY_JOBS")}
          />
        );
      case "MY_JOBS":
        return <CollectorMyJobsScreen />;
      case "CHAT":
        return (
          <VisitorChatListScreen
            onNavigateToDetail={(partnerId) => {
              router.push(`/chat/${partnerId}`);
            }}
          />
        );
      case "PROFILE":
        return (
          <CollectorProfileScreen
            onLogout={() => {
              router.replace("/login");
            }}
          />
        );
      default:
        return (
          <ActiveJobsScreen
            onNavigateToMyJobs={() => setCurrentTab("MY_JOBS")}
          />
        );
    }
  }, [currentTab, router]);

  return (
    <div className="min-h-screen bg-gray-50 pb-[90px]">
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

      <BottomNavigationBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        badgeCount={totalUnreadCount}
      />
    </div>
  );
}

// --- SUB-COMPONENT: BOTTOM NAVIGATION BAR ---
function BottomNavigationBar({
  currentTab,
  onTabChange,
  badgeCount,
}: {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  badgeCount: number;
}) {
  const tabs = [
    { id: "ACTIVE_JOBS" as Tab, label: "Активные", icon: ListTodo },
    { id: "MY_JOBS" as Tab, label: "История", icon: CheckCircle },
    { id: "CHAT" as Tab, label: "Чаты", icon: MessageSquare },
    { id: "PROFILE" as Tab, label: "Профиль", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-green-50 border-t border-green-100 h-[80px] pb-safe z-50 px-2 shadow-lg shadow-green-100/50">
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
              {/* Icon Container (The Pill) */}
              <div
                className={clsx(
                  "w-14 h-7 rounded-full flex items-center justify-center transition-all duration-300 mb-1",
                  isSelected
                    ? "bg-green-600 shadow-md scale-110"
                    : "bg-transparent group-hover:bg-green-100",
                )}
              >
                <tab.icon
                  className={clsx(
                    "w-5 h-5 transition-colors duration-300",
                    isSelected ? "text-white" : "text-green-800/60",
                  )}
                />

                {/* --- RED NOTIFICATION BADGE --- */}
                {isChat && badgeCount > 0 && (
                  <span className="absolute -top-1 right-[22%] flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-green-50">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={clsx(
                  "text-[10px] font-medium transition-colors duration-300",
                  isSelected ? "text-green-800 font-bold" : "text-green-800/60",
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
