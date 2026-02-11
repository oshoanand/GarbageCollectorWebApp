"use client";

import React, { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PushNotificationManager from "@/components/providers/push-notification-manager";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from "@/components/Toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <PushNotificationManager />
          <Suspense>{children}</Suspense>
          <Toaster />
        </NotificationProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
