"use client";

import { useRouter } from "next/navigation";
import OnboardingScreen from "@/components/OnboardingScreen"; // Ensure path matches where you saved the component

export default function OnboardingPage() {
  const router = useRouter();

  const handleFinish = () => {
    // 1. Set the specific key your RootDispatcher looks for
    localStorage.setItem("onboarding_complete", "true");

    // 2. Redirect to login (Dispatcher handles the rest)
    router.replace("/login");
  };

  return <OnboardingScreen onFinish={handleFinish} />;
}
