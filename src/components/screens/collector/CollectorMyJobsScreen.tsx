"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react"; // 1. Import Session
import {
  RefreshCw,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Loader2,
  MessageSquareMore,
  User as UserIcon,
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";

// --- IMPORTS ---
import { useJobHistoryQuery, Job } from "@/services/jobs";

export default function CollectorMyJobsScreen() {
  const queryClient = useQueryClient();

  // 2. Get Session to extract Mobile Number
  const { data: session, status } = useSession();
  const userMobile = (session?.user as any)?.mobile;

  // 3. Pass Mobile to Hook
  const {
    data: jobs = [],
    isLoading,
    isRefetching,
    refetch,
  } = useJobHistoryQuery(userMobile);

  // 4. Calculate Total Earnings (Client-side)
  const totalEarnings = useMemo(() => {
    return jobs
      .filter((job) => job.status === "DONE" || job.paymentStatus === "PAID")
      .reduce((sum, job) => sum + Number(job.cost), 0);
  }, [jobs]);

  // Loading State for Session or Initial Data
  if (status === "loading" || (isLoading && !jobs.length)) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 pb-20">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen pb-24">
      {/* 1. Header (Pull to Refresh equivalent) */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Мои задания</h1>
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

      {/* 2. Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* EARNINGS CARD */}
        <EarningsCard totalEarnings={totalEarnings} />

        {/* LIST HEADER */}
        {jobs.length > 0 && (
          <div className="flex justify-between items-end px-1">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              История
            </h2>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              {jobs.length} Задачи
            </span>
          </div>
        )}

        {/* LIST CONTENT */}
        {jobs.length === 0 ? (
          // EMPTY STATE
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-base font-bold text-gray-700">История пуста</h3>
            <p className="text-xs text-gray-500 max-w-[200px] mt-1">
              Выполненные задания будут отображаться здесь.
            </p>
          </div>
        ) : (
          // JOBS LIST
          <div className="space-y-4 pb-8">
            {jobs.map((job) => (
              <CollectorHistoryCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// --- COMPONENT: EARNINGS CARD ---
function EarningsCard({ totalEarnings }: { totalEarnings: number }) {
  return (
    <div className="relative w-full h-[160px] rounded-[28px] overflow-hidden shadow-xl shadow-green-200/50 group transform transition-transform hover:scale-[1.01]">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-500" />

      {/* Decorative Icon (Rotated & Faded) */}
      <Wallet className="absolute -right-6 -bottom-6 w-40 h-40 text-white/10 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        {/* Label */}
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-4 h-4 text-white/80" />
          <span className="text-xs font-bold text-white/80 tracking-widest uppercase">
            Общий доход
          </span>
        </div>

        {/* Number */}
        <div className="flex items-baseline">
          <span className="text-4xl font-extrabold text-white drop-shadow-sm">
            {totalEarnings.toLocaleString("ru-RU")}
          </span>
          <span className="text-xl font-semibold text-white/90 ml-1">₽</span>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT: HISTORY CARD ---
function CollectorHistoryCard({ job }: { job: Job }) {
  // Logic
  const isPaid = job.status === "DONE";
  const isPaymentRequired = job.status === "PAYMENT_REQUIRED";

  // Styles based on status
  const statusText = isPaid ? "Завершено и оплачено" : "Ожидается платеж";
  const statusColorClass = isPaid
    ? "text-green-700 bg-green-50"
    : "text-orange-700 bg-orange-50";
  const statusIcon = isPaid ? (
    <CheckCircle2 className="w-3 h-3 mr-1" />
  ) : (
    <AlertCircle className="w-3 h-3 mr-1" />
  );
  const borderClass = isPaymentRequired
    ? "border-orange-300 ring-1 ring-orange-100"
    : "border-gray-100";

  return (
    <div
      className={clsx(
        "bg-white rounded-xl border p-4 shadow-sm transition-all hover:shadow-md",
        borderClass,
      )}
    >
      {/* 1. Top Row: ID & Status Badge */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          Job #{job.id.toString().slice(-5)}
        </span>

        <div
          className={clsx(
            "flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase",
            statusColorClass,
          )}
        >
          {statusIcon}
          {statusText}
        </div>
      </div>

      {/* 2. Job Details */}
      <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug">
        {job.description || "Без описания"}
      </h3>
      <p className="text-xs text-gray-500 mb-3 line-clamp-1">{job.location}</p>

      {/* 3. Cost */}
      <div className="text-lg font-extrabold text-green-600 mb-4">
        {job.cost} ₽
      </div>

      {/* 4. Contact Section (Only visible if Payment Required) */}
      {isPaymentRequired && (
        <div className="pt-3 border-t border-gray-100 animate-in fade-in duration-500">
          <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">
            Контакт для оплаты
          </span>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                {job.postedBy.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.postedBy.image}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                {job.postedBy.name || "Заказчик"}
              </span>
            </div>
            <div className="flex gap-2">
              {/* Call Button */}
              <a
                href={`tel:+7${job.postedBy.mobile}`}
                className="flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200 transition-colors"
              >
                <Phone className="w-3 h-3" />
              </a>
              {/* chat button */}
              <Link
                href={`/chat/${job.postedBy?.id}`}
                className="flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200 transition-colors"
              >
                <MessageSquareMore className="w-3 h-3 " />
              </Link>
            </div>
            {/* Call Button */}
            {/* <a
              href={`tel:+7${job.postedBy.mobile}`}
              className="flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200 transition-colors"
            >
              <Phone className="w-3 h-3 mr-1.5" />
              Позвонить
            </a> */}
          </div>
        </div>
      )}
    </div>
  );
}
