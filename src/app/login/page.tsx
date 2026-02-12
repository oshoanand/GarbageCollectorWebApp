"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner"; // Ensure you have this installed or use your own toast hook

// --- CUSTOM COMPONENTS ---
// Make sure these exist at the paths below
import RoleToggler from "@/components/auth/RoleToggler";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";

type UserRole = "VISITOR" | "COLLECTOR";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // --- STATE ---
  const [role, setRole] = useState<UserRole>("VISITOR");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false); // Track focus state for phone input

  // --- EFFECTS ---

  // 1. Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role || "VISITOR";
      const target = userRole === "COLLECTOR" ? "/collector" : "/visitor";
      router.replace(target);
    }
  }, [status, session, router]);

  // 2. Show error from URL if present (e.g. NextAuth redirect)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError("Ошибка аутентификации. Проверьте данные.");
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
      setError("Неверный формат номера телефона");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать не менее 6 символов");
      setLoading(false);
      return;
    }

    // SANITIZATION: +7 999 000-00-00 -> 9990000000
    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

    try {
      const result = await signIn("credentials", {
        mobile: cleanMobile,
        password,
        role,
        redirect: false,
      });

      if (result?.error) {
        setError("Неверный номер или пароль");
        toast.error("Ошибка входа");
        setLoading(false);
      } else {
        toast.success("Вход выполнен успешно");
        // Redirect handled by useEffect or explicit push
        const target = role === "COLLECTOR" ? "/collector" : "/visitor";
        router.push(target);
      }
    } catch (err) {
      console.error(err);
      setError("Произошла ошибка сети");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
      {/* 1. LOGO AREA */}
      <div className="w-full h-[130px] flex items-center justify-center mb-6">
        <div className="relative w-[120px] h-[120px]">
          {/* Ensure /public/images/logo.svg exists */}
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

        <p className="mt-4 mb-6 text-sm font-medium text-gray-500 text-center">
          Войдите как{" "}
          <span className="font-bold text-green-600">
            {role === "VISITOR" ? "Заказчик" : "Исполнитель"}
          </span>
        </p>

        {/* 3. LOGIN FORM */}
        <form onSubmit={handleLogin} className="w-full space-y-5">
          {/* MOBILE INPUT */}
          <div className="space-y-1">
            <div className="relative group">
              {/* Prefix Icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                <Phone
                  className={clsx(
                    "h-5 w-5 transition-colors",
                    isFocused || mobile.length > 0
                      ? "text-green-600"
                      : "text-gray-400",
                  )}
                />
              </div>

              <input
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="+7 XXX XXX XX-XX"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3.5 border rounded-xl text-gray-900 transition-all bg-gray-50 outline-none",
                  // Dynamic Border Color
                  error && mobile.length < 16
                    ? "border-red-500 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white",
                )}
              />

              {/* Success Check Icon */}
              {mobile.length === 16 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="h-5 w-5 text-green-600 fill-green-50" />
                </div>
              )}
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3.5 border rounded-xl text-gray-900 transition-all bg-gray-50 outline-none",
                  error && password.length < 6
                    ? "border-red-500 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-green-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Error Message & Forgot Password */}
            <div className="flex justify-between items-start pt-1 px-1 min-h-[24px]">
              {error ? (
                <div className="flex items-center text-red-500 text-xs mt-0.5 animate-in slide-in-from-left-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span>{error}</span>
                </div>
              ) : (
                <div />
              )}

              <Link
                href="/reset-password"
                className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
              >
                Забыли пароль?
              </Link>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти"}
          </button>
        </form>

        {/* 4. SOCIAL LOGIN BUTTONS */}
        <SocialLoginButtons userRole={role} />

        {/* 5. REGISTER LINK */}
        <div className="mt-8 flex items-center gap-1 text-sm">
          <span className="text-gray-500">Нет аккаунта?</span>
          <Link
            href="/register"
            className="font-bold text-green-600 hover:text-green-700 hover:underline transition-all"
          >
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
