"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Phone,
  Loader2,
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { toast } from "sonner";
import Image from "next/image";

// Schema now validates mobile length (+7 XXX XXX XX-XX is 16 chars)
const schema = z.object({
  mobile: z.string().min(16, "Неверный формат номера телефона"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // We use standard React state for the mobile input to handle masking easier
  // while still using react-hook-form for submission handling
  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { mobile: "" },
  });

  const mobileValue = watch("mobile");

  // Masking Logic: +7 XXX XXX XX-XX
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

    setValue("mobile", formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Clean mobile for backend: +7 999 ... -> 999...
      const cleanMobile = data.mobile.replace(/\D/g, "").slice(-10);

      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: cleanMobile }), // Sending mobile now
        },
      );

      setIsSuccess(true);
      toast.success("Инструкции отправлены (если номер существует)");
    } catch (error) {
      toast.error("Что-то пошло не так!");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Запрос отправлен</h2>
        <p className="mt-2 text-gray-600 max-w-sm">
          Если этот номер зарегистрирован, мы отправили SMS или Email с
          инструкцией по сбросу пароля.
        </p>
        <Link
          href="/login"
          className="mt-8 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
        >
          Вернуться к входу
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      {/* Logo (Optional consistency) */}
      <div className="w-full h-[100px] flex items-center justify-center mb-6">
        <div className="relative w-[100px] h-[100px]">
          <Image
            src="/images/logo.svg"
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
      </div>

      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-gray-100">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Вернуться назад
        </Link>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Забыли пароль?
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Введите номер телефона, чтобы получить ссылку для сброса.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* MOBILE INPUT */}
          <div className="space-y-1">
            <div className="relative group">
              {/* Prefix Icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                <Phone
                  className={clsx(
                    "h-5 w-5 transition-colors",
                    isFocused || mobileValue?.length > 0
                      ? "text-green-600"
                      : "text-gray-400",
                  )}
                />
              </div>

              <input
                type="tel"
                placeholder="+7 XXX XXX XX-XX"
                value={mobileValue}
                onChange={handleMobileChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={clsx(
                  "block w-full pl-10 pr-10 py-3.5 border rounded-xl text-gray-900 transition-all bg-gray-50 outline-none",
                  errors.mobile
                    ? "border-red-500 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white",
                )}
              />

              {/* Success Check Icon */}
              {mobileValue?.length === 16 && !errors.mobile && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="h-5 w-5 text-green-600 fill-green-50" />
                </div>
              )}
            </div>

            {/* Error Message */}
            {errors.mobile && (
              <p className="text-xs text-red-500 ml-1 mt-1">
                {errors.mobile.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-70 flex items-center justify-center transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              "Сбросить пароль"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
