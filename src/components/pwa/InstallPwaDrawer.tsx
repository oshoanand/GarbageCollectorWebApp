"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePwaInstall } from "@/hooks/use-PwaInstall";

export default function InstallPwaDrawer() {
  const { deferredPrompt, isIOS, isStandalone, installApp } = usePwaInstall();
  const [isOpen, setIsOpen] = useState(false);

  // --- DEBUGGING: Uncomment this to force the drawer to show for testing UI ---
  // const deferredPrompt = true;
  // const isStandalone = false;

  useEffect(() => {
    // Logic: If not installed AND (we have an android prompt OR we are on iOS)
    if (!isStandalone && (deferredPrompt || isIOS)) {
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, isIOS, isStandalone]);

  // If installed, hide completely
  if (isStandalone) return null;

  // If nothing to show (no prompt captured and not iOS), hide.
  // CRITICAL: On real Android, this returns null if Service Worker is broken.
  if (!deferredPrompt && !isIOS) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Z-Index 9998 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer - Z-Index 9999 (Highest Priority) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white z-[9999] p-6 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-safe"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }} // Fallback for safe area
          >
            {/* Handle Bar (Visual cue for dragging/drawer) */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                {/* App Icon Placeholder */}
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    Установить приложение
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Быстрый доступ без браузера
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {isIOS ? (
              // iOS Instructions
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <Share className="w-6 h-6 text-blue-500 shrink-0" />
                  <span>
                    1. Нажмите <b>"Поделиться"</b> внизу
                  </span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <PlusSquare className="w-6 h-6 text-gray-700 shrink-0" />
                  <span>
                    2. Выберите <b>"На экран «Домой»"</b>
                  </span>
                </div>
              </div>
            ) : (
              // Android Install Button
              <button
                onClick={installApp}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-green-200"
              >
                <Download className="w-5 h-5" />
                Установить сейчас
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
