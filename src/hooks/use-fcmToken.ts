"use client";

import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { apiRequest } from "@/services/http/api-client";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

// ------------------------------------------------------------------
// 1. GET THIS FROM FIREBASE CONSOLE
// Project Settings > Cloud Messaging > Web configuration > Web Push certificates
// ------------------------------------------------------------------
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;
const COLLECTOR_TOPIC = process.env.NEXT_PUBLIC_COLLECTOR_FCM_TOPIC;
const VISITOR_TOPIC = process.env.NEXT_PUBLIC_VISITOR_FCM_TOPIC;

const useFcmToken = () => {
  const { data: session } = useSession();
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | "default">("default");

  useEffect(() => {
    const retrieveToken = async () => {
      try {
        // Ensure we are in the browser and Service Workers are supported
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          // 1. Request User Permission
          const permission = await Notification.requestPermission();
          setNotificationPermissionStatus(permission);

          if (permission === "granted") {
            const msg = await messaging();
            if (!msg) return;

            // 2. Get the FCM Token
            const currentToken = await getToken(msg, {
              vapidKey: VAPID_KEY,
            });

            if (currentToken) {
              console.log("🔥 FCM Token Generated:", currentToken);

              // 3. Save Token to Backend (Link to User)
              await saveTokenToBackend(currentToken);

              // 4. Subscribe to Topic (e.g., 'collector_jobs')
              // Only do this if the user is logged in (session exists)
              if (session?.user) {
                if (session?.user?.role === "COLLECTOR") {
                  await subscribeToTopic(currentToken, `${COLLECTOR_TOPIC}`);
                } else {
                  await subscribeToTopic(currentToken, `${VISITOR_TOPIC}`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("An error occurred while retrieving token:", error);
      }
    };

    retrieveToken();
  }, [session]); // Re-run if session changes (user logs in)

  // 5. Handle Foreground Messages (App is Open)
  useEffect(() => {
    const setupForegroundListener = async () => {
      try {
        const msg = await messaging();
        if (!msg) return;

        // onMessage receives the payload when the app is in focus
        onMessage(msg, (payload) => {
          console.log("Foreground Message received:", payload);

          // Display a Toast notification
          toast({
            title: payload.notification?.title || "Новое уведомление",
            description: payload.notification?.body,
            variant: "default", // You can use "success" if you have that variant
            duration: 5000,
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

// --- HELPER FUNCTIONS ---

/**
 * Sends the token to your Node.js backend to save it in the database (Prisma)
 */
async function saveTokenToBackend(token: string) {
  try {
    // Adjust this URL to match your API route structure
    await apiRequest({
      method: "POST",
      url: "/api/fcm/save-fcm", // This maps to your Next.js API route or Node backend
      data: { token },
    });
    console.log("✅ Token saved to backend");
  } catch (error) {
    console.error("❌ Failed to save token:", error);
  }
}

/**
 * Tells the backend to subscribe this token to a specific topic (e.g., 'collector_jobs')
 */
async function subscribeToTopic(token: string, topic: string) {
  try {
    await apiRequest({
      method: "POST",
      url: "/api/fcm/subscribe",
      data: {
        token: token,
        topic: topic,
      },
    });
    console.log(`✅ Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`❌ Failed to subscribe to ${topic}:`, error);
  }
}

export default useFcmToken;
