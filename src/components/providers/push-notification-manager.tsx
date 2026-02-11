"use client";

import { useEffect } from "react";

// 1. Get the VAPID Public Key from env
const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export default function PushNotificationManager() {
  useEffect(() => {
    async function registerAndSubscribe() {
      // Guard clauses: Check if browser supports workers and push
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Push notifications are not supported in this browser.");
        return;
      }

      // Guard clause: Check if public key is available
      if (!PUBLIC_KEY) {
        console.error("VAPID Public Key is missing in environment variables.");
        return;
      }

      try {
        // A. Register the Service Worker
        const register = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Wait for the service worker to be active
        await navigator.serviceWorker.ready;

        // B. Check existing subscription
        let subscription = await register.pushManager.getSubscription();

        // CASE 1: No subscription exists -> Ask permission & Create one
        if (!subscription) {
          const permission = await Notification.requestPermission();

          if (permission === "granted") {
            subscription = await register.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
            });

            // Send new subscription to DB
            await sendSubscriptionToBackend(subscription);
          }
        }
        // CASE 2: Subscription ALREADY exists -> Sync with DB
        else {
          console.log("🔄 Found existing background subscription. Syncing...");
          await sendSubscriptionToBackend(subscription);
        }
      } catch (error) {
        console.error("Service Worker/Push Error:", error);
      }
    }

    registerAndSubscribe();
  }, []);

  // C. The function that POSTs to your Node.js API
  async function sendSubscriptionToBackend(subscription: PushSubscription) {
    try {
      // The browser's subscription object has a built-in toJSON() method.
      // JSON.stringify(subscription) automatically formats it correctly.

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800"}/api/admin/subscribe`,
        {
          method: "POST",
          body: JSON.stringify(subscription),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        console.log(
          "✅ Admin subscribed to background notifications (Synced with Server)",
        );
      } else {
        console.error(
          "❌ Failed to save subscription on server:",
          await response.text(),
        );
      }
    } catch (err) {
      console.error("API Connection Error:", err);
    }
  }

  return null; // Invisible component
}

// --- UTILITY: Convert VAPID key to UInt8Array ---
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
