"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import dynamic from "next/dynamic";

const VoiceChat = dynamic(() => import("./voice-chat"), { ssr: false });

export default function VoiceButton() {
  const [open, setOpen] = useState(false);
  const { subscription, hasActiveSubscription } = useAuth();

  // Only show for paid clients or direct QR clients
  const isPaid = subscription && Number(subscription.amount_paid) > 0;
  const isDirect = subscription?.plan_slug === "direct-client";

  if (!hasActiveSubscription || (!isPaid && !isDirect)) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-40 right-4 z-40 w-14 h-14 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transition-all hover:scale-110"
        aria-label="Hablar con Pablo"
      >
        <Phone className="h-6 w-6 text-black" />
      </button>

      {open && <VoiceChat onClose={() => setOpen(false)} />}
    </>
  );
}
