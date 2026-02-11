"use client";

import { useRouter } from "next/navigation";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleFinish = () => {
    // 1. Mark onboarding as complete (ViewModel logic)
    localStorage.setItem("onboarding_complete", "true");

    // 2. Navigate to Login & Clear Backstack
    // router.replace() acts like popUpTo(inclusive=true)
    router.replace("/login");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-2xl font-bold mb-4">Welcome to EcoCollect</h1>
      <button
        onClick={handleFinish}
        className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold"
      >
        Get Started
      </button>
    </div>
  );
}
