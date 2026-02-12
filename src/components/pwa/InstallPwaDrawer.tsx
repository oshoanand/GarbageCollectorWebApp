"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePwaInstall } from "@/hooks/use-PwaInstall";

export default function InstallPwaDrawer() {
  const { deferredPrompt, isIOS, isStandalone, installApp } = usePwaInstall();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-show prompt after 3 seconds if not installed
  useEffect(() => {
    if (!isStandalone && (deferredPrompt || isIOS)) {
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, isIOS, isStandalone]);

  if (isStandalone || (!deferredPrompt && !isIOS)) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[99]"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 bg-white z-[100] p-6 rounded-t-2xl shadow-2xl pb-safe"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">Установить приложение</h3>
                <p className="text-sm text-gray-500">
                  Добавьте Услуги64 на главный экран для быстрого доступа
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {isIOS ? (
              // iOS Instructions
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Share className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">
                    1. Нажмите кнопку <b>"Поделиться"</b> внизу экрана
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <PlusSquare className="w-5 h-5 text-gray-700" />
                  <span className="text-sm">
                    2. Выберите <b>"На экран «Домой»"</b>
                  </span>
                </div>
              </div>
            ) : (
              // Android Install Button
              <button
                onClick={installApp}
                className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Download className="w-5 h-5" />
                Установить
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
