"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  RefreshCw,
  MapPin,
  Image as ImageIcon,
  Trash2,
  CheckCircle,
  Clock,
  ArrowRight,
  List,
  X,
  Loader2,
  Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

// --- IMPORTS ---
import { useVisitorJobsQuery, useDeleteJob, Job } from "@/services/jobs";

// --- UTILS (Explicitly Typed) ---
const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getReadableStatus = (status: string): string => {
  switch (status) {
    case "OPEN":
      return "В поисках исполнителя";
    case "ACTIVE":
      return "Активно";
    case "IN_PROGRESS":
      return "В процессе";
    case "PAYMENT_REQUIRED":
      return "Требуется оплата";
    case "DONE":
      return "Задача выполнена";
    default:
      return status.replace("_", " ").toLowerCase();
  }
};

// --- MAIN COMPONENT ---
export default function VisitorMyJobsScreen(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userMobile = (session?.user as any)?.mobile;

  // --- STATE ---
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageCaption, setSelectedImageCaption] = useState("");

  // --- QUERIES ---
  const {
    data: jobs = [],
    isLoading,
    isRefetching,
    refetch,
  } = useVisitorJobsQuery(userMobile);

  // --- MUTATIONS ---
  const { mutate: deleteJobItem } = useDeleteJob(() => {
    toast({
      title: "Удалено",
      description: "Заявка успешно удалена.",
      variant: "success",
    });
    queryClient.invalidateQueries({ queryKey: ["visitorJobs"] });
  });

  // --- HANDLERS ---
  const handleDelete = (jobId: number): void => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Вы уверены, что хотите удалить эту заявку?")) {
      deleteJobItem(jobId);
    }
  };

  const openImage = (url: string | null, caption: string): void => {
    if (url) {
      setSelectedImageUrl(url);
      setSelectedImageCaption(caption);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen pb-24">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Мои заявки</h1>
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

      {/* 2. CONTENT */}
      <main className="flex-1 p-4 space-y-4">
        {/* Banner */}
        <MyJobsBanner />

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <List className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-base font-bold text-gray-700">
              Список заявок пуст
            </h3>
            <p className="text-xs text-gray-500 max-w-[200px] mt-1">
              Вы еще не создали ни одной заявки. Создайте новый запрос, чтобы
              найти исполнителя.
            </p>
          </div>
        ) : (
          // Job List
          <div className="space-y-4">
            {jobs.map((job) => (
              <VisitorJobCard
                key={job.id}
                job={job}
                onViewPostedImage={() =>
                  openImage(job.jobPhoto, "Фотография задачи")
                }
                onViewProofImage={() =>
                  openImage(job.jobPhotoDone, "Подтверждение выполнения")
                }
                onDeleteClick={() => handleDelete(job.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 3. IMAGE PREVIEW DIALOG */}
      <AnimatePresence>
        {selectedImageUrl && (
          <ImagePreviewDialog
            imageUrl={selectedImageUrl}
            caption={selectedImageCaption}
            onDismiss={() => setSelectedImageUrl(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function MyJobsBanner(): React.JSX.Element {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-green-600 to-emerald-500 p-4 shadow-md text-white">
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-lg font-bold">Мои задачи</h2>
          <p className="text-xs text-green-100 mt-1">
            Отслеживайте статус ваших заявок
          </p>
        </div>
        <List className="w-10 h-10 text-white/20" />
      </div>
    </div>
  );
}

// Interface for Job Card props to ensure type safety
interface JobCardProps {
  job: Job;
  onViewPostedImage: () => void;
  onViewProofImage: () => void;
  onDeleteClick: () => void;
}

function VisitorJobCard({
  job,
  onViewPostedImage,
  onViewProofImage,
  onDeleteClick,
}: JobCardProps): React.JSX.Element {
  if (job.status === "DONE" || job.status === "COMPLETED") {
    return (
      <CompactCompletedJobCard
        job={job}
        onViewPostedImage={onViewPostedImage}
        onViewProofImage={onViewProofImage}
      />
    );
  } else {
    return (
      <StandardActiveJobCard
        job={job}
        onViewPostedImage={onViewPostedImage}
        onViewProofImage={onViewProofImage}
        onDeleteClick={onDeleteClick}
      />
    );
  }
}

function StandardActiveJobCard({
  job,
  onViewPostedImage,
  onViewProofImage,
  onDeleteClick,
}: JobCardProps): React.JSX.Element {
  const isPaymentRequired = job.status === "PAYMENT_REQUIRED";
  const statusColorClass = isPaymentRequired
    ? "text-orange-700 bg-orange-50"
    : "text-green-700 bg-green-50";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <div
            className={clsx(
              "inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase mb-2",
              statusColorClass,
            )}
          >
            {getReadableStatus(job.status)}
          </div>
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">
            {job.description || "Без описания"}
          </h3>
        </div>
        <div className="text-lg font-bold text-green-600 whitespace-nowrap">
          {job.cost} ₽
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center text-gray-500 mb-4">
        <MapPin className="w-3.5 h-3.5 mr-1" />
        <span className="text-xs truncate">{job.location}</span>
      </div>

      <div className="h-px bg-gray-100 mb-3" />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onViewPostedImage}
          className="flex items-center px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
          Фото
        </button>

        {isPaymentRequired ? (
          <div className="flex gap-2">
            <button
              onClick={onViewProofImage}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 px-2 py-1"
            >
              Пруф
            </button>
            <button
              onClick={() =>
                toast({
                  title: "В разработке",
                  description: "Функция оплаты пока недоступна.",
                })
              }
              className="flex items-center px-4 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 active:scale-95 transition-transform shadow-sm shadow-orange-200"
            >
              <Wallet className="w-3.5 h-3.5 mr-1.5" />
              Оплатить
            </button>
          </div>
        ) : (
          <button
            onClick={onDeleteClick}
            className="flex items-center text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Отменить
          </button>
        )}
      </div>
    </div>
  );
}

interface CompletedJobCardProps {
  job: Job;
  onViewPostedImage: () => void;
  onViewProofImage: () => void;
}

function CompactCompletedJobCard({
  job,
  onViewPostedImage,
  onViewProofImage,
}: CompletedJobCardProps): React.JSX.Element {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm opacity-90">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-bold text-green-700">Выполнено</span>
        </div>
        <span className="text-base font-extrabold text-gray-900">
          {job.cost} ₽
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-1">
        {job.description || "Задание"}
      </p>

      {/* Timeline */}
      <div className="bg-gray-50 rounded-lg p-2 flex justify-between items-center mb-4">
        <TimelineItem
          label="Создано"
          date={formatDate(job.createdAt)}
          icon={<Clock className="w-3 h-3 text-gray-400" />}
        />
        <ArrowRight className="w-3 h-3 text-gray-300" />
        <TimelineItem
          label="Закрыто"
          date={formatDate((job as any).finishedAt || job.createdAt)}
          icon={<CheckCircle className="w-3 h-3 text-green-600" />}
          isHighlight
        />
      </div>

      {/* Dual Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onViewPostedImage}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Задача
        </button>
        <button
          onClick={onViewProofImage}
          className="flex-1 py-2 rounded-lg bg-green-600 text-white text-xs font-bold shadow-sm hover:bg-green-700 transition-colors"
        >
          Результат
        </button>
      </div>
    </div>
  );
}

interface TimelineItemProps {
  label: string;
  date: string;
  icon: React.ReactNode;
  isHighlight?: boolean;
}

function TimelineItem({
  label,
  date,
  icon,
  isHighlight = false,
}: TimelineItemProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 leading-none mb-0.5">
          {label}
        </span>
        <span
          className={clsx(
            "text-[10px] font-semibold leading-none",
            isHighlight ? "text-gray-900" : "text-gray-500",
          )}
        >
          {date}
        </span>
      </div>
    </div>
  );
}

function ImagePreviewDialog({
  imageUrl,
  caption,
  onDismiss,
}: {
  imageUrl: string;
  caption: string;
  onDismiss: () => void;
}): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-0"
      onClick={onDismiss}
    >
      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={caption}
        className="max-w-full max-h-full object-contain"
      />

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-white font-medium text-lg">{caption}</span>
        <button
          onClick={onDismiss}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
    </motion.div>
  );
}
