"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";

const PREMIUM_PERKS = [
  "Fresh, uniquely generated questions every single attempt — never the same set twice",
  "Detailed, step-by-step explanations for every question",
  "Full control over difficulty, question count, and time limit",
  "Practice multiple subjects together in one session",
  "AI Weakness Analysis after every exam",
  "Unlimited AI Tutor chat",
  "Unlimited messages in the chat feature",
];

export default function SubscribePage() {
  const handleProceedToPayment = () => {
    // TODO: wire to Paystack / Flutterwave for a one-time annual charge.
    // This is a one-time payment (not a recurring subscription) since JAMB/WAEC/
    // NECO/GCE/BECE each run on an annual cycle — pay once per exam year.
    alert("Payment gateway not connected yet — this is a placeholder.");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0A0E1A] font-sans flex flex-col">
      <header className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-4 sm:px-6 py-4 flex items-center gap-4 sticky top-0 z-50">
        <Link href="/dashboard" className="p-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:text-[#0A0E1A] hover:bg-[#E5E7EB]/50 transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="font-extrabold text-sm tracking-tight">PassOnce Premium</span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10 space-y-8">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-full text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" /> One-Time Annual Unlock
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0A0E1A]">Unlock full access for ₦500/year</h1>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            Priced in your local currency. One payment covers you for the full exam year —
            no recurring charges, no auto-renewal.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-black text-[#0A0E1A]">₦500</span>
            <span className="text-sm font-bold text-[#6B7280]">/ year, one time</span>
          </div>

          <ul className="space-y-3">
            {PREMIUM_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm text-[#0A0E1A]">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleProceedToPayment}
            className="w-full bg-red-600 text-[#FFFFFF] font-bold text-sm py-3.5 rounded-xl hover:bg-red-700 transition shadow-[0_0_20px_rgba(220,38,38,0.35)]"
          >
            Proceed to Payment
          </button>

          <p className="flex items-center justify-center gap-1.5 text-[10px] text-[#6B7280] font-semibold uppercase">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure one-time payment · No auto-renewal
          </p>
        </div>

        <p className="text-center text-xs text-[#6B7280]">
          Free accounts keep full CBT practice access with one locked subject, fixed settings, and repeating
          questions until upgraded.
        </p>
      </main>
    </div>
  );
}