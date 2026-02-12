"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, ListTodo, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

// --- IMPORT YOUR SCREENS ---
import PostJobScreen from "@/components/screens/visitor/PostJobScreen";
import VisitorMyJobsScreen from "@/components/screens/visitor/VisitorMyJobsScreen";
import VisitorProfileScreen from "@/components/screens/visitor/VisitorProfileScreen";

// --- TAB DEFINITIONS ---
type Tab = "POST_JOB" | "MY_JOBS" | "PROFILE";

export default function VisitorHomeHost() {
  const router = useRouter();

  // 1. Navigation State
  const [currentTab, setCurrentTab] = useState<Tab>("POST_JOB");

  // 2. FCM Subscription
  useEffect(() => {
    console.log("Subscribing to topic: USER_ROLE_VISITOR");
    // In a real PWA: firebase.messaging().subscribe()
  }, []);

  // 3. Render Content based on Tab
  const renderContent = () => {
    switch (currentTab) {
      case "POST_JOB":
        return (
          <PostJobScreen onNavigateToMyJobs={() => setCurrentTab("MY_JOBS")} />
        );
      case "MY_JOBS":
        return <VisitorMyJobsScreen />;
      case "PROFILE":
        return (
          <VisitorProfileScreen onLogout={() => router.replace("/login")} />
        );
    }
  };

  return (
    // Increased padding-bottom to 90px to accommodate the floated nav bar
    <div className="min-h-screen bg-gray-50 pb-[90px]">
      {/* SCREEN CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* BOTTOM NAVIGATION BAR */}
      <VisitorBottomBar currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}

// --- SUB-COMPONENT: BOTTOM BAR ---
function VisitorBottomBar({
  currentTab,
  onTabChange,
}: {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  const tabs = [
    {
      id: "POST_JOB" as Tab,
      label: "Создать", // Shortened from "Создать задачу" for better fit
      icon: PlusCircle,
    },
    {
      id: "MY_JOBS" as Tab,
      label: "Мои задачи",
      icon: ListTodo,
    },
    {
      id: "PROFILE" as Tab,
      label: "Профиль",
      icon: User,
    },
  ];

  return (
    // THEME UPDATE: bg-green-50, border-green-100, shadow-green-100
    <div className="fixed bottom-0 left-0 right-0 bg-green-50 border-t border-green-100 h-[80px] pb-safe z-50 px-4 shadow-lg shadow-green-100/50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center w-full h-full group"
            >
              {/* Icon Container (The Pill) */}
              <div
                className={clsx(
                  "w-16 h-8 rounded-full flex items-center justify-center transition-all duration-300 mb-1",
                  isSelected
                    ? "bg-green-600 shadow-md shadow-green-200 scale-110" // Active: Dark Green
                    : "bg-transparent group-hover:bg-green-100", // Inactive: Transparent
                )}
              >
                <tab.icon
                  className={clsx(
                    "w-5 h-5 transition-colors duration-300",
                    isSelected
                      ? "text-white" // Active Icon: White
                      : "text-green-800/60", // Inactive Icon: Muted Green
                  )}
                />
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
