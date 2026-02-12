"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SocialLoginButtonsProps {
  userRole: "VISITOR" | "COLLECTOR";
}

export default function SocialLoginButtons({
  userRole,
}: SocialLoginButtonsProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Determine where to send the user after login
  // 1. Check URL for ?callbackUrl=...
  // 2. Default to role-based dashboard
  const callbackUrl =
    searchParams.get("callbackUrl") ||
    (userRole === "COLLECTOR" ? "/collector/jobs" : "/visitor/my-jobs");

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error("Social login error:", error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full">
      {/* Divider */}
      <div className="relative w-full my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-400">Или войдите через</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 justify-center w-full">
        <SocialButton
          providerId="yandex"
          label="Yandex"
          color="text-red-600"
          loading={isLoading === "yandex"}
          onClick={() => handleSocialLogin("yandex")}
        />
        <SocialButton
          providerId="vk"
          label="VK"
          color="text-blue-600"
          loading={isLoading === "vk"}
          onClick={() => handleSocialLogin("vk")}
        />
      </div>
    </div>
  );
}

// --- SUB COMPONENT ---
interface SocialButtonProps {
  providerId: string;
  label: string;
  color: string;
  loading: boolean;
  onClick: () => void;
}

function SocialButton({ label, color, loading, onClick }: SocialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex flex-col items-center gap-1 group active:scale-95 transition-transform disabled:opacity-70 disabled:active:scale-100"
    >
      <div className="w-[50px] h-[50px] bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-gray-300 transition-colors relative">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        ) : (
          /* You can replace this span with an <svg> or <Image> icon */
          <span className={`font-black text-lg ${color}`}>{label[0]}</span>
        )}
      </div>
      <span className="text-[10px] text-gray-400 font-bold uppercase">
        {label}
      </span>
    </button>
  );
}
