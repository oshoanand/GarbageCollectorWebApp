"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      setIsSuccess(true);
      toast.success(
        "Ссылка для сброса пароля отправлена! Проверьте свой почтовый ящик /папку со спамом",
      );
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
        <h2 className="text-2xl font-bold text-gray-900">Check your mail</h2>
        <p className="mt-2 text-gray-600 max-w-sm">
          Ссылка для сброса пароля отправлена! Проверьте свой почтовый ящик
          /папку со спамом
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
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-gray-100">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Forgot password?
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-8">
          <div className="space-y-1">
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-green-600" />
              <input
                {...register("email")}
                placeholder="Enter your email"
                className={clsx(
                  "block w-full pl-10 pr-3 py-3 border rounded-xl outline-none focus:border-green-500",
                  errors.email ? "border-red-500" : "border-gray-200",
                )}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 ml-1">
                {errors.email.message as string}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-70 flex justify-center"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
