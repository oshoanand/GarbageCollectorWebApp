"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ListTodo, CheckCircle, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

// --- Import your screens here ---
// Assuming you have these components created or defined in the same file for now
import ActiveJobsScreen from "@/components/screens/collector/ActiveJobScreen";
import CollectorMyJobsScreen from "@/components/screens/collector/CollectorMyJobsScreen";
import CollectorProfileScreen from "@/components/screens/collector/CollectorProfileScreen";

// --- TAB DEFINITIONS ---
type Tab = "ACTIVE_JOBS" | "MY_JOBS" | "PROFILE";

export default function CollectorHomeHost() {
  const router = useRouter();

  // 1. Navigation State (Replaces homeTabNavController)
  const [currentTab, setCurrentTab] = useState<Tab>("ACTIVE_JOBS");

  // 2. FCM Subscription Effect
  useEffect(() => {
    // Equivalent to FcmTopicSubscriber
    console.log("Subscribing to topic: USER_ROLE_COLLECTOR");
    // In a real PWA, you would call your firebase.messaging().subscribe() here
  }, []);

  // 3. Render the Content based on Tab
  const renderContent = () => {
    switch (currentTab) {
      case "ACTIVE_JOBS":
        return (
          <ActiveJobsScreen
            // Equivalent to onNavigateToMyJobs navigation lambda
            onNavigateToMyJobs={() => setCurrentTab("MY_JOBS")}
          />
        );
      case "MY_JOBS":
        return <CollectorMyJobsScreen />;
      case "PROFILE":
        return (
          <CollectorProfileScreen
            // Equivalent to onLogout navigation lambda
            onLogout={() => {
              // Clear session/local storage here if needed
              router.replace("/login");
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-[80px]">
      {" "}
      {/* Padding for BottomBar */}
      {/* SCREEN CONTENT */}
      {/* We use AnimatePresence for a subtle fade effect between tabs (Optional) */}
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
// This mimics Material 3 NavigationBar
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
      label: "Заявки", // Active Jobs
      icon: ListTodo,
    },
    {
      id: "MY_JOBS" as Tab,
      label: "Мои", // My Jobs
      icon: CheckCircle,
    },
    {
      id: "PROFILE" as Tab,
      label: "Профиль", // Profile
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-100 border-t border-slate-200 h-[80px] pb-safe z-50 px-4">
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
                  "w-16 h-8 rounded-full flex items-center justify-center transition-colors duration-300 mb-1",
                  isSelected
                    ? "bg-green-200" // Secondary Container Color
                    : "bg-transparent group-hover:bg-slate-200",
                )}
              >
                <tab.icon
                  className={clsx(
                    "w-6 h-6 transition-colors duration-300",
                    isSelected
                      ? "text-green-900" // On Secondary Container
                      : "text-slate-600", // On Surface Variant
                  )}
                />
              </div>

              {/* Label */}
              <span
                className={clsx(
                  "text-xs font-medium transition-colors duration-300",
                  isSelected ? "text-green-900 font-bold" : "text-slate-600",
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
