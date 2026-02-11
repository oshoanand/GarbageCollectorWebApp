"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to call API
    setTimeout(() => {
      // Success
      toast.success("Instructions sent to email");
      // Pop back stack
      router.back();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <button onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="w-6 h-6 text-gray-700" />
      </button>

      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-xl"
          placeholder="Enter your email"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-3 rounded-xl font-bold"
        >
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
