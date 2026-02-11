"use client";

import {
  MapPin,
  Phone,
  Image as ImageIcon,
  CheckCircle,
  User,
} from "lucide-react";

// --- TYPES ---
// (Ideally imported from a shared types file, but defined here for portability)
export interface Job {
  id: string;
  description: string;
  cost: number;
  location: string;
  postedBy: {
    name: string;
    image?: string; // Optional in case it's null
    mobile: string;
  };
  jobPhoto: string;
}

interface CompactJobCardProps {
  job: Job;
  onViewPhoto: () => void;
  onCompleteClick: () => void;
  onLocationClick: () => void;
}

export default function CompactJobCard({
  job,
  onViewPhoto,
  onCompleteClick,
  onLocationClick,
}: CompactJobCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-4">
        {/* --- 1. HEADER: Description & Cost --- */}
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
              {job.description || "Нет описания"}
            </h3>

            {/* Clickable Location Pill */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLocationClick();
              }}
              className="mt-2 inline-flex items-center bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors group"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
              <span className="text-xs text-blue-700 font-medium underline decoration-blue-300 group-hover:decoration-blue-700 underline-offset-2">
                {job.location}
              </span>
            </button>
          </div>

          {/* Price Badge */}
          <div className="bg-green-50 px-3 py-1.5 rounded-lg shrink-0 border border-green-100">
            <span className="text-green-700 font-bold text-base whitespace-nowrap">
              {job.cost} ₽
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 my-3" />

        {/* --- 2. USER INFO ROW --- */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Avatar */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
              {job.postedBy.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.postedBy.image}
                  alt={job.postedBy.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Name & Call CTA */}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {job.postedBy.name || "Заказчик"}
              </span>
              <a
                href={`tel:${job.postedBy.mobile}`}
                className="text-xs text-blue-600 font-medium hover:underline flex items-center mt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                Нажмите, чтобы позвонить
              </a>
            </div>
          </div>

          {/* Quick Call Button (Icon) */}
          <a
            href={`tel:${job.postedBy.mobile}`}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 text-green-600 active:bg-green-100 transition-colors shrink-0 ml-2"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* --- 3. ACTION BUTTONS --- */}
        <div className="flex gap-3">
          {/* View Photo Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewPhoto();
            }}
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm active:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <ImageIcon className="w-4 h-4 mr-2 text-gray-500" />
            Фото
          </button>

          {/* Complete Job Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompleteClick();
            }}
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm shadow-sm shadow-green-200 active:scale-[0.98] hover:bg-green-700 transition-all"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Завершить
          </button>
        </div>
      </div>
    </div>
  );
}
