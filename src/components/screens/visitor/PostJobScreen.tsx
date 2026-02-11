"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Camera,
  Image as ImageIcon,
  MapPin,
  FileText,
  Send,
  Edit2,
  Loader2,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

// --- IMPORTS ---
import { useCreateJob } from "@/services/jobs";

// --- PROPS ---
interface PostJobScreenProps {
  onNavigateToMyJobs: () => void;
}

export default function PostJobScreen({
  onNavigateToMyJobs,
}: PostJobScreenProps) {
  const { data: session } = useSession();

  // --- STATE ---
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [cost, setCost] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // Dialog State
  const [showImageSourceDialog, setShowImageSourceDialog] = useState(false);

  // File Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- MUTATION ---
  const { mutate: postJob, isPending: isSubmitting } = useCreateJob(
    () => {
      toast({
        title: "Успешно!",
        description: "Ваша задача опубликована.",
        variant: "success",
      });
      onNavigateToMyJobs();
    },
    (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать задачу.",
        variant: "destructive",
      });
    },
  );

  // --- HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create local preview
      const uri = URL.createObjectURL(file);
      setPreviewUri(uri);

      setShowImageSourceDialog(false);

      // Reset inputs
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!selectedFile) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, добавьте фото.",
        variant: "destructive",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите описание задачи.",
        variant: "destructive",
      });
      return;
    }
    if (!address.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите адрес.",
        variant: "destructive",
      });
      return;
    }
    if (!cost.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите стоимость.",
        variant: "destructive",
      });
      return;
    }

    const userMobile = (session?.user as any)?.mobile;
    if (!userMobile) {
      toast({
        title: "Ошибка",
        description: "Сессия истекла. Войдите снова.",
        variant: "destructive",
      });
      return;
    }

    // Submit
    postJob({
      description,
      location: address,
      cost,
      image: selectedFile,
      mobile: userMobile,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white p-6 pb-24 overflow-y-auto">
      {/* 1. IMAGE UPLOAD SECTION */}
      <div className="mb-2">
        <label className="text-sm font-bold text-green-700 mb-2 block">
          Фотография товаров/мусора
        </label>
      </div>
      <div
        onClick={() => setShowImageSourceDialog(true)}
        className={`
          relative w-full h-[200px] rounded-3xl overflow-hidden cursor-pointer transition-all
          ${
            !previewUri
              ? "bg-green-50 border-2 border-dashed border-green-200 hover:bg-green-100"
              : "bg-gray-100"
          }
        `}
      >
        {/* A. Image Content */}
        {previewUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUri}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          // B. Empty State Placeholder
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-3 text-green-700">
              <Camera className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              Нажмите, чтобы загрузить фотографию
            </p>
          </div>
        )}

        {/* Edit Overlay (If image exists) */}
        {previewUri && (
          <div className="absolute top-4 right-4">
            <div className="bg-white text-green-700 p-2 rounded-xl shadow-lg hover:scale-105 transition-transform">
              <Edit2 className="w-5 h-5" />
            </div>
          </div>
        )}
      </div>
      <div className="h-6" /> {/* Spacer */}
      {/* 2. FORM SECTION */}
      <div className="mb-3">
        <label className="text-sm font-bold text-green-700 mb-2 block">
          Подробности задачи
        </label>
      </div>
      <div className="space-y-4">
        {/* Description */}
        <ElegantTextField
          value={description}
          onChange={setDescription}
          label="Что необходимо сделать?"
          icon={<FileText className="w-5 h-5" />}
          minLines={3}
        />

        {/* Address */}
        <ElegantTextField
          value={address}
          onChange={setAddress}
          label="Местоположение/Адрес"
          icon={<MapPin className="w-5 h-5" />}
        />

        {/* Cost */}
        <ElegantCostTextField
          value={cost}
          onChange={(val) => {
            // Only allow numbers
            if (/^\d*$/.test(val)) setCost(val);
          }}
          label="Предлагаемая сумма"
        />
      </div>
      <div className="h-8" /> {/* Spacer */}
      {/* 3. SUBMIT BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full h-14 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-200 font-bold text-lg flex items-center justify-center hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100"
      >
        {isSubmitting ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <>
            <span>Опубликовать задачу</span>
            <Send className="w-5 h-5 ml-2" />
          </>
        )}
      </button>
      {/* --- DIALOGS --- */}
      <AnimatePresence>
        {showImageSourceDialog && (
          <DialogOverlay onDismiss={() => setShowImageSourceDialog(false)}>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center">
              <div className="mb-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Добавить фото
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Выберите источник для загрузки фотографии места скопления
                  мусора
                </p>
              </div>

              <div className="flex gap-3">
                {/* Camera */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 p-4 rounded-xl bg-blue-50 text-blue-700 flex flex-col items-center hover:bg-blue-100 transition-colors"
                >
                  <Camera className="mb-2 w-6 h-6" />
                  <span className="text-sm font-bold">Камера</span>
                </button>

                {/* Gallery */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 p-4 rounded-xl bg-purple-50 text-purple-700 flex flex-col items-center hover:bg-purple-100 transition-colors"
                >
                  <ImageIcon className="mb-2 w-6 h-6" />
                  <span className="text-sm font-bold">Галерея</span>
                </button>
              </div>

              <button
                onClick={() => setShowImageSourceDialog(false)}
                className="w-full mt-5 py-3 text-gray-400 font-medium text-sm hover:text-gray-600"
              >
                Отмена
              </button>
            </div>
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
          </DialogOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- REUSABLE COMPONENT: Elegant Text Field ---
function ElegantTextField({
  value,
  onChange,
  label,
  icon,
  minLines = 1,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
  icon: React.ReactNode;
  minLines?: number;
}) {
  return (
    <div className="group relative">
      <div className="absolute top-4 left-4 text-green-600">{icon}</div>
      {minLines > 1 ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" " // Important for :placeholder-shown pseudo-class
          rows={minLines}
          className="peer block w-full rounded-2xl border border-gray-200 bg-white p-4 pl-12 text-base text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all resize-none placeholder-transparent"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          className="peer block w-full rounded-2xl border border-gray-200 bg-white p-4 pl-12 text-base text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder-transparent"
        />
      )}

      {/* Floating Label */}
      <label className="absolute left-12 top-4 -translate-y-6 scale-75 text-sm text-green-600 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-400 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-green-600 bg-white px-1 pointer-events-none">
        {label}
      </label>
    </div>
  );
}

// --- REUSABLE COMPONENT: Cost Field (Specific Style) ---
function ElegantCostTextField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
}) {
  return (
    <div className="group relative">
      {/* Custom Leading Icon (Ruble Sign) */}
      <div className="absolute top-4 left-4">
        <span className="text-xl font-medium text-green-600">₽</span>
      </div>

      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="peer block w-full rounded-2xl border border-gray-200 bg-white p-4 pl-12 text-base text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder-transparent"
      />

      <label className="absolute left-12 top-4 -translate-y-6 scale-75 text-sm text-green-600 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-400 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-green-600 bg-white px-1 pointer-events-none">
        {label}
      </label>
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
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
