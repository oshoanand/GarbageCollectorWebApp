"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import VisitorChatDetailScreen from "@/components/screens/chat/VisitorChatDetailScreen";
import { Loader2 } from "lucide-react";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Extract the partnerId from the URL /chat/some-id
  const partnerId = params.partnerId as string;

  // 1. Handle Loading State
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-green-600 w-8 h-8" />
      </div>
    );
  }

  // 2. Handle Unauthenticated (Security Guard)
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  // 3. Render the Detail Screen
  return (
    <div className="fixed inset-0 bg-white z-[100]">
      <VisitorChatDetailScreen
        partnerId={partnerId}
        // In a real app, you might fetch the name from a store or API
        // For now, we use a placeholder or handle it inside the screen
        partnerName="Техническая поддержка"
        onBack={() => router.back()}
      />
    </div>
  );
}
