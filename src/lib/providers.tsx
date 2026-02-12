"use client";

import React, { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/Toaster";

// --- PWA COMPONENTS ---
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister"; // <--- Import 1
import InstallPwaDrawer from "@/components/pwa/InstallPwaDrawer";
import FcmProvider from "@/components/providers/fcm-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {/* 1. Register Service Worker (Required for PWA Install) */}
        <ServiceWorkerRegister />

        {/* 2. Initialize FCM (Push Notifications) */}
        <FcmProvider />

        {/* 3. Show Install Prompt (If applicable) */}
        <InstallPwaDrawer />

        <Suspense>{children}</Suspense>
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
