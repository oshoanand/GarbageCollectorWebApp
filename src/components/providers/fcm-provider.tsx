"use client";

import useFcmToken from "@/hooks/use-fcmToken";

export default function FcmProvider() {
  // This hook handles permission requests, token syncing, and foreground listeners
  useFcmToken();

  // This component renders nothing, it just runs the logic
  return null;
}
