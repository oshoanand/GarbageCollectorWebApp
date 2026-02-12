"use client";

import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { apiRequest } from "@/services/http/api-client";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

// Project Settings > Cloud Messaging > Web configuration
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;

const useFcmToken = () => {
  const { data: session } = useSession();
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | "default">("default");

  useEffect(() => {
    const retrieveToken = async () => {
      try {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          // 1. Check/Request Permission
          const permission = await Notification.requestPermission();
          setNotificationPermissionStatus(permission);

          if (permission === "granted") {
            const msg = await messaging();
            if (!msg) return;

            // 2. Get Token
            const currentToken = await getToken(msg, {
              vapidKey: VAPID_KEY,
            });

            if (currentToken) {
              // console.log("🔥 FCM Token Generated:", currentToken);

              // 3. Send to Backend
              // We only do this if the user is logged in
              if (session?.user) {
                await syncTokenWithBackend(currentToken, session?.user?.mobile);
              }
            }
          }
        }
      } catch (error) {
        console.error("An error occurred while retrieving token:", error);
      }
    };

    retrieveToken();
  }, [session]); // Re-run when session loads

  // 4. Foreground Listener (Unchanged)
  useEffect(() => {
    const setupForegroundListener = async () => {
      try {
        const msg = await messaging();
        if (!msg) return;

        onMessage(msg, (payload) => {
          console.log("Foreground Message:", payload);
          toast({
            title: payload.notification?.title || "Новое уведомление",
            description: payload.notification?.body,
            variant: "success",
          });
        });
      } catch (error) {
        console.error("Error setting up foreground listener:", error);
      }
    };
    setupForegroundListener();
  }, []);

  return { notificationPermissionStatus };
};

/**
 * Sends token to backend. Backend handles DB save AND Topic Subscriptions.
 */
async function syncTokenWithBackend(token: string, mobile: string) {
  try {
    await apiRequest({
      method: "POST",
      url: "/api/fcm/save-fcm",
      data: { token, mobile },
    });
    console.log("✅ Token synced with backend");
  } catch (error) {
    console.error("❌ Failed to sync token:", error);
  }
}

export default useFcmToken;
