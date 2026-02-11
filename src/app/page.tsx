"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function RootDispatcher() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);

  useEffect(() => {
    // 1. Check Onboarding State (simulating DataStore preference)
    const hasSeenOnboarding = localStorage.getItem("onboarding_complete");

    if (!hasSeenOnboarding) {
      // Logic: if startDest == Onboarding
      router.replace("/onboarding");
      return;
    }

    setIsOnboardingChecked(true);
  }, [router]);

  useEffect(() => {
    // Wait for onboarding check and auth check
    if (!isOnboardingChecked || status === "loading") return;

    if (status === "unauthenticated") {
      // Logic: if startDest == Login
      router.replace("/login");
    } else if (status === "authenticated" && session?.user) {
      // Logic: Determine Target Screen based on Role
      // (This matches your onLoginSuccess logic)
      const role = (session.user as any).role; // Ensure your auth.ts returns role

      if (role === "COLLECTOR") {
        router.replace("/collector");
      } else {
        router.replace("/visitor");
      }
    }
  }, [status, session, isOnboardingChecked, router]);

  // Loading State (Equivalent to Box { CircularProgressIndicator })
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-green-600" />
    </div>
  );
}
