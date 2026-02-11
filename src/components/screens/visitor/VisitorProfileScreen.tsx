"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Camera,
  Image as ImageIcon,
  User,
  Edit2,
  Check,
  Phone,
  HelpCircle,
  Share2,
  LogOut,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- CUSTOM HOOKS & UTILS ---
import { useUpdateProfileImage, useUpdateProfileName } from "@/services/user";
import { toast } from "@/hooks/use-toast";

// --- TYPES ---
interface UserProfile {
  name: string;
  mobile: string;
  image?: string;
}

interface CollectorProfileScreenProps {
  onLogout?: () => void;
}

export default function VisitorProfileScreen({
  onLogout,
}: CollectorProfileScreenProps) {
  // 1. Destructure 'update' from useSession
  const { data: session, status, update } = useSession();

  // --- STATE ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Dialogs & Sheets State
  const [showImageSourceDialog, setShowImageSourceDialog] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);

  // Support Form State
  const [supportType, setSupportType] = useState("BUG");
  const [problemDescription, setProblemDescription] = useState("");
  const [problemImage, setProblemImage] = useState<File | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // File Input Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const supportFileRef = useRef<HTMLInputElement>(null);

  // --- MUTATIONS ---

  // 2. Update Profile Image
  const { mutate: uploadImage, isPending: isUploadingImage } =
    useUpdateProfileImage(
      async (data) => {
        toast({
          title: "Фото обновлено",
          description: "Ваша фотография профиля успешно изменена.",
          variant: "success",
        });

        // CRITICAL: Update the session with the new image URL returned by backend
        if (data.imageUrl) {
          await update({ image: data.imageUrl });
          // Ensure local state is consistent with backend
          setUserProfile((prev) =>
            prev ? { ...prev, image: data.imageUrl } : null,
          );
        }
      },
      (error) => {
        console.error(error);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось загрузить фото.",
          variant: "destructive",
        });
      },
    );

  // 3. Update Profile Name
  const { mutate: updateName, isPending: isUpdatingName } =
    useUpdateProfileName(
      async (data) => {
        toast({
          title: "Имя обновлено",
          description: "Личные данные успешно сохранены.",
          variant: "success",
        });
        setIsEditingName(false);

        // CRITICAL: Update the session with the new name
        if (data.name) {
          await update({ name: data.name });
          setUserProfile((prev) =>
            prev ? { ...prev, name: data.name } : null,
          );
        }
      },
      (error) => {
        console.error(error);
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось обновить имя.",
          variant: "destructive",
        });
      },
    );

  // --- HELPERS ---

  // Mask Phone: +7 XXX XXX XX-XX
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length >= 10) {
      const tail = cleaned.slice(-10);
      return `+7 ${tail.substring(0, 3)} ${tail.substring(3, 6)} ${tail.substring(6, 8)}-${tail.substring(8, 10)}`;
    }
    return phone;
  };

  // --- EFFECTS ---

  // Sync State with Session
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as any;
      setUserProfile({
        name: user.name || "Пользователь",
        mobile: formatPhoneNumber(user.mobile || ""),
        image: user.image || undefined,
      });
      setNameInput(user.name || "");
    }
  }, [session, status]);

  // --- HANDLERS ---

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
    if (onLogout) onLogout();
  };

  const handleNameSave = () => {
    if (!nameInput.trim()) {
      toast({
        title: "Внимание",
        description: "Имя не может быть пустым.",
        variant: "destructive",
      });
      return;
    }
    const rawMobile = (session?.user as any)?.mobile;

    // Call Mutation
    if (rawMobile) {
      updateName({
        name: nameInput,
        mobile: rawMobile,
      });
    } else {
      toast({
        title: "Ошибка",
        description: "Мобильный номер не найден",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const rawMobile = (session?.user as any)?.mobile;

      if (!rawMobile) {
        toast({
          title: "Ошибка",
          description: "Не удалось определить номер телефона.",
          variant: "destructive",
        });
        return;
      }

      // Optimistic UI Update (Shows immediately)
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserProfile((prev) =>
          prev ? { ...prev, image: ev.target?.result as string } : null,
        );
      };
      reader.readAsDataURL(file);

      // Call Mutation
      uploadImage({
        file: file,
        mobile: rawMobile,
      });

      // Cleanup UI
      setShowImageSourceDialog(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: "EcoCollect",
      text: "Привет! Попробуй это приложение для уборки мусора! 🌍♻️",
      url: "https://www.rustore.ru/catalog/app/com.neo.garbagecollector",
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share canceled");
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Ссылка скопирована",
        description: "Ссылка на приложение скопирована в буфер обмена.",
        variant: "success",
      });
    }
  };

  const handleSubmitSupport = () => {
    if (!problemDescription) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, опишите проблему.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmittingTicket(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmittingTicket(false);
      setShowSupportSheet(false);
      setProblemDescription("");
      setProblemImage(null);
      toast({
        title: "Отправлено",
        description: "Ваше сообщение успешно отправлено в службу поддержки.",
        variant: "success",
      });
    }, 1500);
  };

  // Loading State
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 bg-white min-h-screen">
      {/* 1. PROFILE HEADER */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        {/* Profile Image Container */}
        <div className="relative group">
          <div className="w-40 h-40 rounded-full border-4 border-green-500 overflow-hidden bg-gray-100 relative">
            {userProfile?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userProfile.image}
                alt="Profile"
                className={`w-full h-full object-cover transition-opacity ${isUploadingImage ? "opacity-50" : "opacity-100"}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User className="w-20 h-20" />
              </div>
            )}

            {/* Loading Spinner Overlay */}
            {isUploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Camera Button */}
          <button
            onClick={() => setShowImageSourceDialog(true)}
            disabled={isUploadingImage}
            className="absolute bottom-1 right-1 bg-green-600 text-white p-2.5 rounded-full shadow-lg active:scale-90 transition-transform hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. FORM FIELDS */}
      <div className="px-6 space-y-5">
        {/* Name Field */}
        <div className="relative">
          <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">
            ФИО
          </label>
          <div className="relative">
            <input
              type="text"
              value={isEditingName ? nameInput : userProfile?.name || ""}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={!isEditingName || isUpdatingName}
              className={`w-full p-4 pr-12 rounded-xl border ${
                isEditingName
                  ? "border-green-500 bg-white"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              } outline-none transition-colors disabled:bg-gray-50`}
            />

            {/* Action Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isUpdatingName ? (
                <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              ) : isEditingName ? (
                <button
                  onClick={handleNameSave}
                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setNameInput(userProfile?.name || "");
                    setIsEditingName(true);
                  }}
                  className="p-2 text-gray-400 hover:text-green-600 active:scale-95 transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Field (Read-only) */}
        <div>
          <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">
            Номер телефона
          </label>
          <div className="relative">
            <input
              type="text"
              value={userProfile?.mobile || ""}
              readOnly
              className="w-full p-4 pl-12 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none"
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100 my-8 mx-6" />

      {/* 3. MENU ITEMS */}
      <div className="px-4 space-y-2">
        <MenuItem
          icon={<HelpCircle className="w-6 h-6 text-blue-500" />}
          title="Помощь и поддержка"
          subtitle="Сообщить о проблеме"
          onClick={() => setShowSupportSheet(true)}
        />
        <MenuItem
          icon={<Share2 className="w-6 h-6 text-purple-500" />}
          title="Поделиться"
          subtitle="Расскажите друзьям"
          onClick={handleShareApp}
        />
        <MenuItem
          icon={<LogOut className="w-6 h-6 text-red-500" />}
          title="Выйти"
          subtitle="Выход из аккаунта"
          isDestructive
          onClick={handleLogout}
        />
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">Версия v1.0.0 (Web)</p>
      </div>

      {/* --- DIALOGS --- */}
      {/* 1. Image Source Dialog */}
      <AnimatePresence>
        {showImageSourceDialog && (
          <DialogOverlay onDismiss={() => setShowImageSourceDialog(false)}>
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center">
              <h3 className="text-lg font-bold mb-6">Измените фото профиля</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 p-4 rounded-xl bg-blue-50 text-blue-700 flex flex-col items-center hover:bg-blue-100 transition-colors"
                >
                  <Camera className="mb-2 w-6 h-6" />
                  <span className="text-sm font-bold">Камера</span>
                </button>
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
                className="w-full mt-4 py-3 text-gray-400 font-medium text-sm hover:text-gray-600"
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
              onChange={handleImageSelect}
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </DialogOverlay>
        )}
      </AnimatePresence>

      {/* 2. Support Sheet */}
      <AnimatePresence>
        {showSupportSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowSupportSheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto pb-safe"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Служба поддержки</h2>
                <button
                  onClick={() => setShowSupportSheet(false)}
                  className="p-2 bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
                {["BUG", "FEATURE", "OTHER"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSupportType(type)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                      supportType === type
                        ? "bg-white text-black shadow-sm"
                        : "text-gray-500"
                    }`}
                  >
                    {type === "BUG"
                      ? "ОШИБКА"
                      : type === "FEATURE"
                        ? "ИДЕЯ"
                        : "ДРУГОЕ"}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  ОПИСАНИЕ ПРОБЛЕМЫ
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Подробно опишите, что случилось..."
                  className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 min-h-[120px] outline-none focus:border-green-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Upload */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  СКРИНШОТ (НЕОБЯЗАТЕЛЬНО)
                </label>
                <div
                  onClick={() => supportFileRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {problemImage ? (
                    <div className="flex items-center text-green-600 font-medium">
                      <Check className="w-5 h-5 mr-2" />
                      {problemImage.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs">Нажмите, чтобы загрузить</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={supportFileRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) setProblemImage(e.target.files[0]);
                  }}
                />
              </div>

              <button
                onClick={handleSubmitSupport}
                disabled={isSubmittingTicket}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-70 disabled:scale-100 flex justify-center"
              >
                {isSubmittingTicket ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Отправить запрос"
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function MenuItem({
  icon,
  title,
  subtitle,
  isDestructive = false,
  onClick,
}: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
    >
      <div
        className={`p-3 rounded-xl mr-4 transition-colors ${isDestructive ? "bg-red-50 group-hover:bg-red-100" : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h4
          className={`font-bold text-sm ${isDestructive ? "text-red-600" : "text-gray-900"}`}
        >
          {title}
        </h4>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </button>
  );
}

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
