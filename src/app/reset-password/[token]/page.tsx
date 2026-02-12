"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import Link from "next/link";

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const router = useRouter();

  // --- STATE ---
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobileFocused, setIsMobileFocused] = useState(false);

  // --- HANDLERS ---

  // Exact Masking Logic from Login Page
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("7")) value = value.substring(1);
    value = value.substring(0, 10);

    let formatted = "";
    if (value.length > 0) formatted += "+7";
    if (value.length > 0) formatted += " " + value.substring(0, 3);
    if (value.length >= 4) formatted += " " + value.substring(3, 6);
    if (value.length >= 7) formatted += " " + value.substring(6, 8);
    if (value.length >= 9) formatted += "-" + value.substring(8, 10);

    setMobile(formatted);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    // 2. Prepare Data
    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);

    try {
      // API Call
      const res = await fetch(`/api/auth/reset-password/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token, // Token from URL
          mobile: cleanMobile, // Extra verification
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Ошибка сброса пароля");
      }

      toast.success("Пароль успешно изменен");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
      {/* 1. LOGO AREA */}
      <div className="w-full h-[130px] flex items-center justify-center mb-6">
        <div className="relative w-[120px] h-[120px]">
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Новый пароль</h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Введите номер телефона для подтверждения и придумайте новый пароль
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* --- 1. MOBILE NUMBER FIELD --- */}
          <div className="space-y-1">
            <div className="relative group">
              {/* Icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                <Phone
                  className={clsx(
                    "h-5 w-5 transition-colors",
                    isMobileFocused || mobile.length > 0
                      ? "text-green-600"
                      : "text-gray-400",
                  )}
                />
              </div>

              {/* Input */}
              <input
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                onFocus={() => setIsMobileFocused(true)}
                onBlur={() => setIsMobileFocused(false)}
                placeholder="+7 XXX XXX XX-XX"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3.5 border rounded-xl text-gray-900 transition-all bg-gray-50 outline-none",
                  error && mobile.length < 16
                    ? "border-red-500 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white",
                )}
              />

              {/* Success Checkmark */}
              {mobile.length === 16 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="h-5 w-5 text-green-600 fill-green-50" />
                </div>
              )}
            </div>
          </div>

          {/* --- 2. NEW PASSWORD FIELD --- */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Новый пароль"
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
          </div>

          {/* --- 3. CONFIRM PASSWORD FIELD --- */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтвердите пароль"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3.5 border rounded-xl text-gray-900 transition-all bg-gray-50 outline-none",
                  error && password !== confirmPassword
                    ? "border-red-500 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white",
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-green-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Error Message Display */}
            <div className="flex justify-between items-start pt-1 px-1 min-h-[24px]">
              {error ? (
                <div className="flex items-center text-red-500 text-xs mt-0.5 animate-in slide-in-from-left-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span>{error}</span>
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Сохранить пароль"
            )}
          </button>

          {/* BACK LINK */}
          <div className="text-center mt-4">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Вернуться ко входу
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
