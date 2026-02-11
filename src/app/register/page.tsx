"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Phone, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

import { useRegister, UserRole } from "@/services/user";

// --- Constants ---
const PRIVACY_POLICY_URL = "https://example.com/privacy"; // Replace with Constant.PRIVACY_POLICY
const TERMS_URL = "https://example.com/terms"; // Replace with Constant.TERMS

// --- Zod Validation Schema ---
// Matches your Kotlin logic: isValidMobile, isValidEmail, etc.
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z
    .string()
    .regex(
      /^\+7 \d{3} \d{3} \d{2}-\d{2}$/,
      "Invalid mobile format (+7 XXX XXX XX-XX)",
    ),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.VISITOR);
  const [showPassword, setShowPassword] = useState(false);

  // React Query Mutation
  const mutation = useRegister((data) => {
    // onRegisterSuccess logic equivalent
    router.push("/login"); // or navigate to dashboard directly
  });

  // Form Handling
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      mobile: "", // Initialize empty
      email: "",
      password: "",
    },
  });

  // Handle Submit
  const onSubmit = (data: RegisterFormValues) => {
    mutation.mutate({
      ...data,
      role: selectedRole,
    });
  };

  // Mobile Masking Logic (+7 XXX XXX XX-XX)
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Strip non-digits
    if (value.startsWith("7")) value = value.substring(1); // Remove leading 7 if typed

    // Limit length
    value = value.substring(0, 10);

    let formatted = "";
    if (value.length > 0) formatted += "+7";
    if (value.length > 0) formatted += " " + value.substring(0, 3);
    if (value.length >= 4) formatted += " " + value.substring(3, 6);
    if (value.length >= 7) formatted += " " + value.substring(6, 8);
    if (value.length >= 9) formatted += "-" + value.substring(8, 10);

    setValue("mobile", formatted, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
      {/* 1. Logo Area */}
      <div className="w-full h-[130px] flex items-center justify-center mb-6">
        <div className="relative w-[120px] h-[120px]">
          {/* Ensure you have /public/logo.png or svg */}
          <Image
            src="/logo.png"
            alt="App Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center">
        {/* 2. Role Toggler */}
        <RoleToggler selectedRole={selectedRole} onSelect={setSelectedRole} />

        <p className="mt-3 text-sm font-semibold text-green-600">
          Выберите роль для входа в систему
        </p>

        {/* 3. Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full mt-8 space-y-4"
        >
          {/* Name Field */}
          <InputField
            icon={<User className="h-5 w-5 text-gray-400" />}
            placeholder="Name"
            type="text"
            error={errors.name?.message}
            {...register("name")}
          />

          {/* Mobile Field (Custom Change Handler) */}
          <InputField
            icon={<Phone className="h-5 w-5 text-gray-400" />}
            placeholder="+7 XXX XXX XX-XX"
            type="tel"
            error={errors.mobile?.message}
            {...register("mobile")}
            onChange={handleMobileChange} // Override onChange for masking
          />

          {/* Email Field */}
          <InputField
            icon={<Mail className="h-5 w-5 text-gray-400" />}
            placeholder="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />

          {/* Password Field */}
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3 border rounded-xl text-gray-900 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 outline-none",
                  errors.password ? "border-red-500" : "border-gray-200",
                )}
                {...register("password")}
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
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 ml-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* 4. Disclaimer (Highlighted Text Logic) */}
          <p className="text-xs text-center text-gray-500 px-2 mt-4 leading-relaxed">
            By signing up, you agree to our{" "}
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-green-600 underline font-medium"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href={TERMS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-green-600 underline font-medium"
            >
              Terms of Use
            </a>
            .
          </p>

          {/* 5. Server Error Message */}
          {mutation.isError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
              {mutation.error?.message ||
                "Registration failed. Please try again."}
            </div>
          )}

          {/* 6. Register Button */}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center py-3.5 px-4 mt-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {mutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* 7. Navigate to Login */}
        <div className="mt-6">
          <Link
            href="/login"
            className="text-green-600 font-bold hover:underline py-2 px-4"
          >
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: ROLE TOGGLER ---
function RoleToggler({
  selectedRole,
  onSelect,
}: {
  selectedRole: UserRole;
  onSelect: (r: UserRole) => void;
}) {
  return (
    <div className="bg-gray-100 p-1 rounded-2xl flex relative w-full h-[50px]">
      <div className="absolute inset-0 p-1 flex">
        <motion.div
          className="w-1/2 bg-white rounded-xl shadow-sm"
          animate={{
            x: selectedRole === UserRole.VISITOR ? "0%" : "100%",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
      <button
        type="button"
        onClick={() => onSelect(UserRole.VISITOR)}
        className={clsx(
          "flex-1 z-10 text-sm font-bold transition-colors flex items-center justify-center",
          selectedRole === UserRole.VISITOR ? "text-gray-900" : "text-gray-500",
        )}
      >
        VISITOR
      </button>
      <button
        type="button"
        onClick={() => onSelect(UserRole.COLLECTOR)}
        className={clsx(
          "flex-1 z-10 text-sm font-bold transition-colors flex items-center justify-center",
          selectedRole === UserRole.COLLECTOR
            ? "text-gray-900"
            : "text-gray-500",
        )}
      >
        COLLECTOR
      </button>
    </div>
  );
}

// --- SUB-COMPONENT: REUSABLE INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  error?: string;
}

// Using forwardRef to work with react-hook-form
import React, { forwardRef } from "react";

const InputField = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
          <input
            ref={ref}
            className={clsx(
              "block w-full pl-10 pr-3 py-3 border rounded-xl text-gray-900 focus:ring-green-500 focus:border-green-500 transition-colors bg-gray-50 outline-none",
              error ? "border-red-500" : "border-gray-200",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
      </div>
    );
  },
);

InputField.displayName = "InputField";
