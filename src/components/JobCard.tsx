"use client";

import Image from "next/image";
import {
  MapPin,
  Phone,
  Image as ImageIcon,
  CheckCircle,
  Navigation,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

// Types
export interface Job {
  id: string;
  description: string;
  cost: number;
  location: string;
  postedBy: { name: string; image: string; mobile: string };
  jobPhoto: string;
}

interface JobCardProps {
  job: Job;
  onViewPhoto: (url: string) => void;
  onComplete: (jobId: string, file: File) => void;
}

export default function JobCard({
  job,
  onViewPhoto,
  onComplete,
}: JobCardProps) {
  // Handle Map Click
  const openMap = () => {
    // Opens native map app on Android/iOS
    const encoded = encodeURIComponent(job.location);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      "_blank",
    );
  };

  // Handle File Input (Camera)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onComplete(job.id, e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3"
    >
      <div className="p-4">
        {/* Header: Description & Cost */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-3">
            <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2">
              {job.description}
            </h3>

            {/* Location Pill */}
            <button
              onClick={openMap}
              className="mt-2 inline-flex items-center bg-blue-50 px-2.5 py-1 rounded-md active:scale-95 transition-transform"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
              <span className="text-xs text-blue-700 font-medium underline decoration-blue-300 underline-offset-2">
                {job.location}
              </span>
            </button>
          </div>

          <div className="bg-green-50 px-3 py-1.5 rounded-lg shrink-0">
            <span className="text-green-700 font-bold text-base">
              {job.cost} ₽
            </span>
          </div>
        </div>

        <div className="h-px bg-gray-100 my-3" />

        {/* User Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
              <Image
                src={job.postedBy.image}
                alt={job.postedBy.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-900">
                {job.postedBy.name}
              </p>
              <a
                href={`tel:${job.postedBy.mobile}`}
                className="text-xs text-blue-600 font-medium"
              >
                Позвонить
              </a>
            </div>
          </div>

          <a
            href={`tel:${job.postedBy.mobile}`}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 text-green-600 active:bg-green-100"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onViewPhoto(job.jobPhoto)}
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm active:bg-gray-50 transition-colors"
          >
            <ImageIcon className="w-4 h-4 mr-2 text-gray-500" />
            Фото
          </button>

          <div className="flex-1 relative">
            {/* Hidden File Input for Camera */}
            <input
              type="file"
              accept="image/*"
              capture="environment" // Forces rear camera on mobile
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div className="w-full h-full flex items-center justify-center py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm shadow-md shadow-green-200 active:scale-[0.98] transition-transform">
              <CheckCircle className="w-4 h-4 mr-2" />
              Завершить
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
