"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ListTodo, CheckCircle, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

// --- Import your screens here ---
import ActiveJobsScreen from "@/components/screens/collector/ActiveJobScreen";
import CollectorMyJobsScreen from "@/components/screens/collector/CollectorMyJobsScreen";
import CollectorProfileScreen from "@/components/screens/collector/CollectorProfileScreen";

// --- TAB DEFINITIONS ---
type Tab = "ACTIVE_JOBS" | "MY_JOBS" | "PROFILE";

export default function CollectorHomeHost() {
  const router = useRouter();

  // 1. Navigation State
  const [currentTab, setCurrentTab] = useState<Tab>("ACTIVE_JOBS");

  // 2. FCM Subscription Effect
  useEffect(() => {
    console.log("Subscribing to topic: USER_ROLE_COLLECTOR");
    // In a real PWA, call firebase.messaging().subscribe() here
  }, []);

  // 3. Render the Content based on Tab
  const renderContent = () => {
    switch (currentTab) {
      case "ACTIVE_JOBS":
        return (
          <ActiveJobsScreen
            onNavigateToMyJobs={() => setCurrentTab("MY_JOBS")}
          />
        );
      case "MY_JOBS":
        return <CollectorMyJobsScreen />;
      case "PROFILE":
        return (
          <CollectorProfileScreen
            onLogout={() => {
              router.replace("/login");
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-[90px]">
      {/* SCREEN CONTENT */}
      {/* AnimatePresence for smooth fade transitions between tabs */}
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
      <BottomNavigationBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />
    </div>
  );
}

// --- SUB-COMPONENT: BOTTOM NAVIGATION BAR ---
function BottomNavigationBar({
  currentTab,
  onTabChange,
}: {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  const tabs = [
    {
      id: "ACTIVE_JOBS" as Tab,
      label: "Активные",
      icon: ListTodo,
    },
    {
      id: "MY_JOBS" as Tab,
      label: "История",
      icon: CheckCircle,
    },
    {
      id: "PROFILE" as Tab,
      label: "Профиль",
      icon: User,
    },
  ];

  return (
    // UPDATED: bg-green-50 and border-green-100 to match the Eco theme
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
                    ? "bg-green-600 shadow-md shadow-green-200 scale-110" // Active: Dark Green Pill
                    : "bg-transparent group-hover:bg-green-100", // Inactive: Transparent (Hover Light Green)
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
