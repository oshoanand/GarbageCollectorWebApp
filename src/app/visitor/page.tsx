"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, ListTodo, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

// --- IMPORT YOUR SCREENS ---
// We will implement placeholders for these below if you don't have them yet
import PostJobScreen from "@/components/screens/visitor/PostJobScreen";
import VisitorMyJobsScreen from "@/components/screens/visitor/VisitorMyJobsScreen";
import VisitorProfileScreen from "@/components/screens/visitor/VisitorProfileScreen";

// --- TAB DEFINITIONS ---
type Tab = "POST_JOB" | "MY_JOBS" | "PROFILE";

export default function VisitorHomeHost() {
  const router = useRouter();

  // 1. Navigation State
  // Default tab is POST_JOB based on your android code
  const [currentTab, setCurrentTab] = useState<Tab>("POST_JOB");

  // 2. FCM Subscription (Placeholder)
  useEffect(() => {
    // Equivalent to FcmTopicSubscriber
    console.log("Subscribing to topic: USER_ROLE_VISITOR");
  }, []);

  // 3. Render Content based on Tab
  const renderContent = () => {
    switch (currentTab) {
      case "POST_JOB":
        return (
          <PostJobScreen
            // Navigation Callback: Switch to MyJobs tab
            onNavigateToMyJobs={() => setCurrentTab("MY_JOBS")}
          />
        );
      case "MY_JOBS":
        return <VisitorMyJobsScreen />;
      case "PROFILE":
        return (
          <VisitorProfileScreen
            // Logout Callback: Redirect to Login
            onLogout={() => router.replace("/login")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-[80px]">
      {" "}
      {/* Padding for BottomBar */}
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
      label: "Создать", // "Post Job"
      icon: PlusCircle,
    },
    {
      id: "MY_JOBS" as Tab,
      label: "Мои заявки", // "My Jobs"
      icon: ListTodo,
    },
    {
      id: "PROFILE" as Tab,
      label: "Профиль", // "Profile"
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-[80px] pb-safe z-50 px-4">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center w-full h-full group"
            >
              {/* Icon Container (Pill) */}
              <div
                className={clsx(
                  "px-5 py-1.5 rounded-full transition-colors duration-300 mb-1",
                  isSelected
                    ? "bg-green-100" // secondaryContainer color
                    : "bg-transparent group-hover:bg-gray-100",
                )}
              >
                <tab.icon
                  className={clsx(
                    "w-6 h-6 transition-colors duration-300",
                    isSelected
                      ? "text-green-700" // primary color
                      : "text-gray-500", // onSurfaceVariant
                  )}
                />
              </div>

              {/* Label */}
              <span
                className={clsx(
                  "text-xs font-medium transition-colors duration-300",
                  isSelected ? "text-green-700 font-bold" : "text-gray-500",
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
