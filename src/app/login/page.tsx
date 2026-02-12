"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";

// --- TYPES ---
type UserRole = "VISITOR" | "COLLECTOR";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // State
  const [role, setRole] = useState<UserRole>("VISITOR");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role || "VISITOR";
      if (userRole === "COLLECTOR") {
        router.replace("/collector");
      } else {
        router.replace("/visitor");
      }
    }
  }, [status, session, router]);

  // Show error from URL if present (e.g. NextAuth redirect)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError("Authentication failed. Please check your credentials.");
    }
  }, [searchParams]);

  // --- HANDLERS ---

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Masking Logic: +7 XXX XXX XX-XX
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("7")) value = value.substring(1);

    // Limit to 10 digits (excluding +7)
    value = value.substring(0, 10);

    let formatted = "";
    if (value.length > 0) formatted += "+7";
    if (value.length > 0) formatted += " " + value.substring(0, 3);
    if (value.length >= 4) formatted += " " + value.substring(3, 6);
    if (value.length >= 7) formatted += " " + value.substring(6, 8);
    if (value.length >= 9) formatted += "-" + value.substring(8, 10);

    setMobile(formatted);
    if (error) setError(""); // Clear error on typing
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Validation
    if (mobile.length < 16) {
      setError("Неверный формат номера телефона"); // "Invalid mobile format"
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать не менее 8 символов"); // "Password min length"
      setLoading(false);
      return;
    }

    // SANITIZATION STEP:
    // 1. .replace(/\D/g, "") -> Removes everything except numbers (result: 79990000000)
    // 2. .slice(-10)         -> Takes the last 10 digits (result: 9990000000)
    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

    // NextAuth SignIn
    try {
      const result = await signIn("credentials", {
        mobile: cleanMobile,
        password,
        role,
        redirect: false,
      });

      if (result?.error) {
        setError("Неверный номер или пароль"); // "Invalid credentials"
        toast.error("Ошибка входа");
        setLoading(false);
      } else {
        // Success: The useEffect above will handle the redirect
        toast.success("Вход выполнен успешно");
      }
    } catch (err) {
      setError("Произошла ошибка сети");
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    signIn(provider, {
      callbackUrl: role === "COLLECTOR" ? "/collector" : "/visitor",
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
      {/* 1. LOGO AREA */}
      <div className="w-full h-[130px] flex items-center justify-center mb-6">
        <div className="relative w-[120px] h-[120px]">
          {/* Ensure you have /public/logo.png */}
          <Image
            src="/images/logo.svg"
            alt="Logo"
            fill
            className="object-contain"
            priority={true}
          />
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center">
        {/* 2. ROLE TOGGLER */}
        <RoleToggler selectedRole={role} onSelect={setRole} />

        <p className="mt-3 text-sm font-semibold text-green-600">
          Выберите роль для входа в систему
        </p>

        <form onSubmit={handleLogin} className="w-full mt-8 space-y-5">
          {/* 3. MOBILE INPUT */}
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                placeholder="+7 XXX XXX XX-XX"
                className={clsx(
                  "block w-full pl-10 pr-3 py-3 border rounded-xl text-gray-900 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 outline-none",
                  error && mobile.length < 16
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200",
                )}
              />
            </div>
          </div>

          {/* 4. PASSWORD INPUT */}
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3 border rounded-xl text-gray-900 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 outline-none",
                  error && password.length < 6
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Error & Forgot Password Row */}
            <div className="flex justify-between items-start pt-1 px-1">
              {error ? (
                <div className="flex items-center text-red-500 text-xs mt-0.5">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span>{error}</span>
                </div>
              ) : (
                <div />
              )}

              <Link
                href="/reset-password"
                className="text-xs font-bold text-green-600 hover:text-green-700"
              >
                Забыли пароль?
              </Link>
            </div>
          </div>

          {/* 5. LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Войти" // "Sign In"
            )}
          </button>
        </form>

        {/* 6. SOCIAL DIVIDER */}
        <div className="relative w-full my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-400">Or login with</span>
          </div>
        </div>

        {/* 7. SOCIAL BUTTONS */}
        <div className="flex gap-4 justify-center w-full">
          <SocialButton
            label="Yandex"
            color="text-red-600"
            onClick={() => handleSocialLogin("yandex")}
          />
          <SocialButton
            label="VK"
            color="text-blue-600"
            onClick={() => handleSocialLogin("vk")}
          />
        </div>

        {/* 8. REGISTER LINK */}
        <div className="mt-8 flex items-center gap-1 text-sm">
          <span className="text-gray-600">У вас нет аккаунта?</span>
          <Link
            href="/register"
            className="font-bold text-green-600 hover:underline"
          >
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTS ---

function RoleToggler({
  selectedRole,
  onSelect,
}: {
  selectedRole: UserRole;
  onSelect: (r: UserRole) => void;
}) {
  return (
    <div className="bg-gray-100 p-1 rounded-2xl flex relative w-full h-[48px]">
      {/* The sliding white background */}
      <div className="absolute inset-0 p-1 flex">
        <motion.div
          className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-100"
          initial={false}
          animate={{
            x: selectedRole === "VISITOR" ? "0%" : "100%",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>

      {/* Buttons */}
      <button
        type="button"
        onClick={() => onSelect("VISITOR")}
        className={clsx(
          "flex-1 z-10 text-xs font-bold transition-colors flex items-center justify-center uppercase tracking-wide",
          selectedRole === "VISITOR" ? "text-gray-900" : "text-gray-400",
        )}
      >
        VISITOR
      </button>
      <button
        type="button"
        onClick={() => onSelect("COLLECTOR")}
        className={clsx(
          "flex-1 z-10 text-xs font-bold transition-colors flex items-center justify-center uppercase tracking-wide",
          selectedRole === "COLLECTOR" ? "text-gray-900" : "text-gray-400",
        )}
      >
        COLLECTOR
      </button>
    </div>
  );
}

function SocialButton({ label, color, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
    >
      <div className="w-[50px] h-[50px] bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-gray-300 transition-colors">
        {/* Replace text with actual SVG icons in a real project */}
        <span className={`font-black text-lg ${color}`}>{label[0]}</span>
      </div>
      <span className="text-[10px] text-gray-400 font-bold uppercase">
        {label}
      </span>
    </button>
  );
}
