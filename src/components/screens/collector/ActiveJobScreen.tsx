"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react"; // 1. Import Session
import {
  RefreshCw,
  Camera,
  Image as ImageIcon,
  X,
  MapPin,
  Navigation,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast"; // Using your custom toast

import InfoBanner from "@/components/ui/InfoBanner";
import CompactJobCard, { Job as UIJob } from "@/components/ui/CompactJobCard";

// 2. Import the new hooks from services/jobs
import {
  useActiveJobsQuery,
  useCompleteJob,
  Job as ApiJob,
} from "@/services/jobs";

interface ActiveJobsScreenProps {
  onNavigateToMyJobs: () => void;
}

export default function ActiveJobsScreen({
  onNavigateToMyJobs,
}: ActiveJobsScreenProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession(); // 3. Get Session Data

  // --- QUERIES ---
  const {
    data: jobs = [],
    isLoading,
    isRefetching,
    refetch,
  } = useActiveJobsQuery();

  // --- MUTATIONS ---
  const { mutate: submitJob, isPending: isSubmitting } = useCompleteJob(
    () => {
      // On Success
      toast({
        title: "Задание выполнено!",
        description: "Фото-отчет успешно отправлен.",
        variant: "success",
      });
      setShowSourceDialog(false);
      setSelectedJob(null);

      // Refresh list and navigate
      queryClient.invalidateQueries({ queryKey: ["activeJobs"] });
      onNavigateToMyJobs();
    },
    (error) => {
      // On Error
      console.error(error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить отчет.",
        variant: "destructive",
      });
    },
  );

  // --- STATE ---
  const [selectedJob, setSelectedJob] = useState<ApiJob | null>(null);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // --- REFS ---
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedJob) {
      const file = e.target.files[0];

      // 4. Get Mobile from Session
      const userMobile = (session?.user as any)?.mobile;

      if (!userMobile) {
        toast({
          title: "Ошибка авторизации",
          description: "Не удалось определить ваш номер телефона.",
          variant: "destructive",
        });
        return;
      }

      // 5. Call the Mutation
      submitJob({
        jobId: selectedJob.id,
        mobile: userMobile,
        file: file,
      });
    }
  };

  // Helper to convert API Job to UI Job
  const mapToUIJob = (job: ApiJob): UIJob => ({
    id: job.id.toString(),
    description: job.description || "",
    cost: Number(job.cost),
    location: job.location,
    postedBy: {
      name: job.postedBy.name || "Неизвестно",
      image: job.postedBy.image || undefined,
      mobile: job.postedBy.mobile,
    },
    jobPhoto: job.jobPhoto,
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Активные задания</h1>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="p-2 rounded-full active:bg-gray-100 transition-colors"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-600 ${
              isLoading || isRefetching ? "animate-spin" : ""
            }`}
          />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            <p className="text-gray-500 text-sm">Загрузка заданий...</p>
          </div>
        )}

        {!isLoading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Список заявок пуст
            </h3>
            <p className="text-gray-500 max-w-xs mt-2 text-sm">
              Вы еще не создали ни одной заявки. <br />
              Создайте новый запрос, чтобы найти исполнителя.
            </p>
          </div>
        )}

        {!isLoading && jobs.length > 0 && (
          <>
            <InfoBanner
              title="Активные задания"
              message="Выполните работу и загрузите фото-отчет"
            />

            <div className="space-y-4 mt-4">
              {jobs.map((job) => (
                <CompactJobCard
                  key={job.id}
                  job={mapToUIJob(job)}
                  onViewPhoto={() => setViewingPhoto(job.jobPhoto)}
                  onCompleteClick={() => {
                    // Opens the dialog first (Logic flow: Click Card -> Open Dialog -> Select File -> API Call)
                    setSelectedJob(job);
                    setShowSourceDialog(true);
                  }}
                  onLocationClick={() => setSelectedLocation(job.location)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* --- DIALOGS --- */}

      {/* 1. Source Selection Dialog */}
      <AnimatePresence>
        {showSourceDialog && (
          <DialogOverlay
            onDismiss={() => !isSubmitting && setShowSourceDialog(false)}
          >
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center">
              <h3 className="text-lg font-bold mb-2">
                Подтверждение выполнения
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Загрузите фото, чтобы подтвердить завершение работы.
              </p>

              {isSubmitting ? (
                <div className="py-8 flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
                  <p className="text-sm font-semibold text-gray-600">
                    Отправка отчета...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 text-blue-700 active:scale-95 transition-transform hover:bg-blue-100"
                    >
                      <Camera className="w-6 h-6 mb-2" />
                      <span className="font-bold text-sm">Камера</span>
                    </button>

                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-purple-50 text-purple-700 active:scale-95 transition-transform hover:bg-purple-100"
                    >
                      <ImageIcon className="w-6 h-6 mb-2" />
                      <span className="font-bold text-sm">Галерея</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowSourceDialog(false)}
                    className="w-full mt-4 py-3 text-gray-400 font-medium text-sm hover:text-gray-600"
                  >
                    Отмена
                  </button>
                </>
              )}

              {/* Hidden Inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                type="file"
                ref={galleryInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </DialogOverlay>
        )}
      </AnimatePresence>

      {/* 2. Photo Viewer */}
      <AnimatePresence>
        {viewingPhoto && (
          <DialogOverlay onDismiss={() => setViewingPhoto(null)}>
            <div className="relative w-full max-w-lg bg-black rounded-xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setViewingPhoto(null)}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white z-10"
              >
                <X className="w-5 h-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewingPhoto}
                alt="Job Proof"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </DialogOverlay>
        )}
      </AnimatePresence>

      {/* 3. Map Dialog */}
      <AnimatePresence>
        {selectedLocation && (
          <DialogOverlay onDismiss={() => setSelectedLocation(null)}>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Адрес задания</h3>
              <p className="text-gray-800 font-medium text-lg mb-6">
                {selectedLocation}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const encoded = encodeURIComponent(selectedLocation);
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encoded}`,
                      "_blank",
                    );
                    setSelectedLocation(null);
                  }}
                  className="w-full flex items-center justify-center py-3 rounded-xl bg-blue-600 text-white font-bold active:scale-95 transition-transform"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Открыть карту
                </button>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="w-full py-3 text-gray-500 font-medium text-sm"
                >
                  Отмена
                </button>
              </div>
            </div>
          </DialogOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- UTILS ---
function DialogOverlay({
  children,
  onDismiss,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md flex justify-center"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
