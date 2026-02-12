"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import * as z from "zod";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { signIn } from "next-auth/react"; // Used for auto-login after register if needed

// --- CUSTOM COMPONENTS ---
import RoleToggler from "@/components/auth/RoleToggler";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";

// --- TYPES & SCHEMA ---
type UserRole = "VISITOR" | "COLLECTOR";

const registerSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 буквы"),
  mobile: z
    .string()
    .min(16, "Введите корректный номер телефона") // Length of "+7 999 000-00-00"
    .regex(/^\+7 \d{3} \d{3} \d{2}-\d{2}$/, "Неверный формат номера"),
  email: z.string().email("Введите корректный Email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- STATE ---
  const [selectedRole, setSelectedRole] = useState<UserRole>("VISITOR");
  const [showPassword, setShowPassword] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- FORM HOOK ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      password: "",
    },
    mode: "onChange", // Validate as user types
  });

  // Watch mobile value for checkmark logic
  const mobileValue = watch("mobile");

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role || "VISITOR";
      const target = userRole === "COLLECTOR" ? "/collector" : "/visitor";
      router.replace(target);
    }
  }, [status, session, router]);

  // Show error from URL if present (e.g. NextAuth redirect)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError("Ошибка аутентификации. Проверьте данные.");
    }
  }, [searchParams]);

  // --- HANDLERS ---

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

    // Update React Hook Form value manually
    setValue("mobile", formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);

    // Clean mobile for backend: +7 999 000-00-00 -> 9990000000
    const cleanMobile = data.mobile.replace(/\D/g, "").slice(-10);

    try {
      // REPLACE WITH YOUR ACTUAL API CALL
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          mobile: cleanMobile,
          email: data.email,
          password: data.password,
          role: selectedRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Ошибка регистрации");
      }

      toast.success("Регистрация успешна! Входим...");

      // Auto-login after successful registration
      await signIn("credentials", {
        mobile: cleanMobile,
        password: data.password,
        role: selectedRole,
        callbackUrl: selectedRole === "COLLECTOR" ? "/collector" : "/visitor",
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Произошла ошибка при регистрации");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
      {/* 1. LOGO AREA */}
      <div className="w-full h-[100px] flex items-center justify-center mb-4">
        <div className="relative w-[100px] h-[100px]">
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
        <RoleToggler selectedRole={selectedRole} onSelect={setSelectedRole} />

        <p className="mt-4 mb-6 text-sm font-medium text-gray-500 text-center">
          Регистрация как{" "}
          <span className="font-bold text-green-600">
            {selectedRole === "VISITOR" ? "Заказчик" : "Исполнитель"}
          </span>
        </p>

        {/* 3. FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          {/* NAME INPUT */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Ваше имя"
                className={clsx(
                  "block w-full pl-10 pr-3 py-3.5 border rounded-xl text-gray-900 transition-all bg-gray-50 outline-none",
                  errors.name
                    ? "border-red-500 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white",
                )}
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 ml-1 mt-0.5 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.name.message}
              </p>
            )}
          </div>

          {/* MOBILE INPUT (Custom Masking) */}
          <div className="space-y-1">
            <div className="relative group">
              {/* Prefix Icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                <Phone
                  className={clsx(
                    "h-5 w-5 transition-colors",
                    isPhoneFocused || mobileValue?.length > 0
                      ? "text-green-600"
                      : "text-gray-400",
                  )}
                />
              </div>

              <input
                type="tel"
                placeholder="+7 XXX XXX XX-XX"
                {...register("mobile")} // Connect to form
                onChange={handleMobileChange} // Override onChange for masking
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setIsPhoneFocused(false)}
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
            {errors.mobile && (
              <p className="text-xs text-red-500 ml-1 mt-0.5 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.mobile.message}
              </p>
            )}
          </div>

          {/* EMAIL INPUT */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type="email"
                placeholder="Email адрес"
                className={clsx(
                  "block w-full pl-10 pr-3 py-3.5 border rounded-xl text-gray-900 transition-all bg-gray-50 outline-none",
                  errors.email
                    ? "border-red-500 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white",
                )}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 ml-1 mt-0.5 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.email.message}
              </p>
            )}
          </div>

          {/* PASSWORD INPUT */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Пароль"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3.5 border rounded-xl text-gray-900 transition-all bg-gray-50 outline-none",
                  errors.password
                    ? "border-red-500 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white",
                )}
                {...register("password")}
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
            {errors.password && (
              <p className="text-xs text-red-500 ml-1 mt-0.5 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />{" "}
                {errors.password.message}
              </p>
            )}
          </div>

          {/* PRIVACY POLICY */}
          <p className="text-xs text-center text-gray-500 px-2 mt-4 leading-relaxed">
            Регистрируясь, вы соглашаетесь с{" "}
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://klinciti.ru/terms-of-use.html"
              className="text-green-600 underline font-medium hover:text-green-700"
            >
              Условиями использования
            </Link>{" "}
            и{" "}
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://klinciti.ru/privacy-policy.html"
              className="text-green-600 underline font-medium hover:text-green-700"
            >
              Политикой конфиденциальности
            </Link>
            .
          </p>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Зарегистрироваться"
            )}
          </button>
        </form>

        {/* 4. SOCIAL BUTTONS */}
        <SocialLoginButtons userRole={selectedRole} />

        {/* 5. LOGIN LINK */}
        <div className="mt-8 flex items-center gap-1 text-sm">
          <span className="text-gray-500">Уже есть аккаунт?</span>
          <Link
            href="/login"
            className="font-bold text-green-600 hover:text-green-700 hover:underline transition-all"
          >
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
