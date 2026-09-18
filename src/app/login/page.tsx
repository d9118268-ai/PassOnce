"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : signInError.message
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0A0E1A] font-sans flex flex-col justify-between">
      <header className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 relative">
            <Image src="/header-logo.png" alt="PassOnce logo" fill className="object-contain" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0A0E1A]">PassOnce</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-bold text-[#6B7280] hover:text-[#0A0E1A] transition"
        >
          Need an account? Register
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 bg-[#FFFFFF] shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-[#0A0E1A]">Welcome back</h1>
              <Shield className="w-4 h-4 text-[#10B981]" />
            </div>
            <p className="text-xs text-[#6B7280]">Sign in to continue your practice.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#6B7280] font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
              />
            </div>

            <div>
              <label className="block text-[#6B7280] font-medium mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] text-[#FFFFFF] font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#0A0E1A] transition disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}