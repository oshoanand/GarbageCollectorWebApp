"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Recycle,
  DollarSign,
  Check,
  ArrowRight,
  X,
  LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";

// --- Data Model ---
interface OnboardingPageData {
  title: string;
  description: string;
  icon: LucideIcon;
  secondaryIcon: LucideIcon;
  color: string; // Main accent color
  lightColor: string; // Background tint
}

const PAGES: OnboardingPageData[] = [
  {
    title: "Чистота – залог здоровья",
    description:
      "Увидели мусор? Сфотографируйте и отправьте запрос. Наше сообщество поможет вам убрать его за считанные минуты.",
    icon: Trash2,
    secondaryIcon: Recycle,
    color: "bg-green-500", // #4CAF50 equivalent class
    lightColor: "bg-green-500/10",
  },
  {
    title: "Превратите мусор в деньги",
    description:
      "Ищете быстрый заработок? Беритесь за работы по вывозу мусора, убирайте территорию и получайте оплату мгновенно.",
    icon: DollarSign,
    secondaryIcon: Check,
    color: "bg-teal-600", // #009688 equivalent class
    lightColor: "bg-teal-600/10",
  },
];

interface OnboardingScreenProps {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // --- Persistence Logic ---
  useEffect(() => {
    setIsMounted(true);
    const hasSeenOnboarding = localStorage.getItem("onboarding_complete");
    if (hasSeenOnboarding) {
      onFinish(); // Skip immediately if seen
    }
  }, [onFinish]);

  // Don't render until we verify localStorage (avoids flash)
  if (!isMounted) return null;

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_complete", "true");
    onFinish();
  };

  const pageData = PAGES[currentPage];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {/* 1. Dynamic Background Gradient */}
      <motion.div
        className={clsx(
          "absolute inset-0 z-0 transition-colors duration-700 ease-in-out",
          pageData.lightColor,
        )}
        initial={false}
        animate={{ backgroundColor: pageData.lightColor }} // Ensure colors strictly strictly if using hex
      />

      {/* 2. Skip Button */}
      <div className="relative z-10 w-full flex justify-end p-6 pt-12">
        <button
          onClick={completeOnboarding}
          className="text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors px-4 py-2 rounded-full hover:bg-black/5"
        >
          Пропустить
        </button>
      </div>

      {/* 3. Illustration Area */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full flex justify-center"
          >
            <IllustrationContent page={pageData} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. Bottom Sheet Info Area */}
      <div className="relative z-20 w-full bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex flex-col items-center px-8 py-10 min-h-[320px] justify-between">
          {/* Text Content */}
          <div className="text-center max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4 h-16 flex items-end justify-center">
                  {pageData.title}
                </h2>
                <p className="text-gray-500 text-base leading-relaxed h-20">
                  {pageData.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="w-full flex flex-col items-center gap-8 mt-6">
            {/* Indicators */}
            <div className="flex gap-2">
              {PAGES.map((_, index) => {
                const isSelected = currentPage === index;
                return (
                  <motion.div
                    key={index}
                    className={clsx(
                      "h-2.5 rounded-full transition-colors duration-300",
                      isSelected ? pageData.color : "bg-gray-200",
                    )}
                    animate={{ width: isSelected ? 32 : 10 }}
                  />
                );
              })}
            </div>

            {/* Main Action Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className={clsx(
                "w-full max-w-xs h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg shadow-lg shadow-gray-200 transition-colors duration-300",
                pageData.color,
              )}
            >
              <span>
                {currentPage < PAGES.length - 1 ? "Дальше" : "Начать"}
              </span>
              {currentPage < PAGES.length - 1 ? (
                <ArrowRight className="w-5 h-5" />
              ) : (
                <Check className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Illustration Sub-Component ---
function IllustrationContent({ page }: { page: OnboardingPageData }) {
  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
      {/* Outer Circle (Lightest) */}
      <div
        className={clsx(
          "absolute w-[300px] h-[300px] rounded-full opacity-20",
          page.color,
        )}
      />

      {/* Middle Circle (Medium) */}
      <div
        className={clsx(
          "absolute w-[220px] h-[220px] rounded-full opacity-30",
          page.color,
        )}
      />

      {/* Inner Circle (Solid) */}
      <div
        className={clsx(
          "absolute w-[140px] h-[140px] rounded-full flex items-center justify-center shadow-xl",
          page.color,
        )}
      >
        <page.icon className="w-[70px] h-[70px] text-white" strokeWidth={1.5} />
      </div>

      {/* Floating Badge (Secondary Icon) */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="absolute top-10 right-10 bg-white p-3 rounded-full shadow-lg"
      >
        <page.secondaryIcon
          className={clsx("w-6 h-6", page.color.replace("bg-", "text-"))}
        />
      </motion.div>
    </div>
  );
}
