"use client";
import useFcmToken from "@/hooks/use-fcmToken";

export default function FcmInit() {
  useFcmToken();
  return null; // Render nothing, just run logic
}
