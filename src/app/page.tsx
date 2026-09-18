"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName, phone },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.includes("duplicate key") || signUpError.message.includes("profiles_username")
          ? "That username is already taken — try another."
          : signUpError.message
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0A0E1A] font-sans flex flex-col justify-between">

      {/* Header Bar */}
      <header className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 relative">
            <Image src="/header-logo.png" alt="PassOnce logo" fill className="object-contain" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0A0E1A] truncate">
            PassOnce <span className="hidden sm:inline text-xs text-[#6B7280] font-normal">by NovaLabs</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <a href="#exams" className="text-[#6B7280] hover:text-[#0A0E1A] transition">
            Supported Exams
          </a>
          <a href="#downloads" className="text-[#6B7280] hover:text-[#0A0E1A] transition">
            Downloads
          </a>
        </nav>

        <Link
          href="/dashboard"
          className="bg-[#10B981] text-[#FFFFFF] font-bold text-xs px-3.5 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#0A0E1A] transition shrink-0"
        >
          Get Started <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero & Registration Section */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-12 flex-1 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">

        {/* Left Column - Value Proposition */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 border border-[#E5E7EB] bg-[#10B981]/10 px-3 py-1 rounded-full text-xs font-semibold text-[#10B981]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Standardized CBT Practice Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0A0E1A] tracking-tight leading-tight">
            Pass JAMB, WAEC & NECO
            <br className="hidden xs:block" />{" "}
            <span className="text-[#10B981]">In One Sitting.</span>
          </h1>

          <p className="text-sm text-[#6B7280] max-w-xl leading-relaxed">
            Simulate real computer-based testing environments with built-in scientific tools, verified solutions, and real-time performance analytics.
          </p>

          {/* Solution Preview Box */}
          <div className="border border-[#E5E7EB] rounded-xl p-5 bg-[#FFFFFF] shadow-sm space-y-3 max-w-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#0A0E1A]">Physics & Math Formula Engine</span>
              <span className="text-[#10B981] font-semibold bg-[#10B981]/10 px-2 py-0.5 rounded shrink-0">
                Verified Solution
              </span>
            </div>
            <p className="text-xs text-[#6B7280] break-words">
              Sample Solution: <span className="font-mono text-[#0A0E1A]">x = (-b ± √(b² - 4ac)) / 2a</span>
            </p>
          </div>
        </div>

        {/* Right Column - Inline Registration Form */}
        <div className="lg:col-span-5">
          <div className="border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 md:p-8 bg-[#FFFFFF] shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0A0E1A]">Create Account</h2>
                <Shield className="w-4 h-4 text-[#10B981]" />
              </div>
              <p className="text-xs text-[#6B7280]">
                Start practicing instantly.{" "}
                <Link href="/login" className="text-[#10B981] font-semibold hover:underline">
                  Already have an account? Sign in
                </Link>
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6B7280] font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-[#6B7280] font-medium mb-1">Username</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    placeholder="johndoe"
                    pattern="[a-z0-9_]{3,20}"
                    title="3-20 characters: lowercase letters, numbers, and underscores only"
                    className="w-full border border-[#E5E7EB] rounded-lg p-2.5 pl-6 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <p className="text-[10px] text-[#6B7280] mt-1">
                  Others will find and message you by this — not your display name.
                </p>
              </div>

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
                <label className="block text-[#6B7280] font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
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
                className="w-full bg-[#10B981] text-[#FFFFFF] font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#0A0E1A] transition pt-3 disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Register & Start Practice"} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-[#FFFFFF] px-4 sm:px-8 py-8 text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 md:col-span-1 space-y-2">
            <span className="font-extrabold text-sm text-[#0A0E1A]">NOVA LAB</span>
            <p className="text-[#6B7280]">
              Empowering African education with cutting-edge software and test preparation platforms.
            </p>
            <p className="text-[#6B7280] pt-2">© 2026 NovaLabs. All rights reserved.</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#0A0E1A] uppercase">Exam Practice</h3>
            <ul className="space-y-1.5 text-[#6B7280]">
              <li><Link href="/dashboard" className="hover:text-[#0A0E1A]">WAEC Exam Practice</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#0A0E1A]">JAMB UTME CBT</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#0A0E1A]">NECO SSCE Practice</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#0A0E1A]">BECE / JSCE Prep</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#0A0E1A]">GCE & Post-UTME</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#0A0E1A] uppercase">Downloads</h3>
            <ul className="space-y-1.5 text-[#6B7280]">
              <li><a href="#" className="hover:text-[#0A0E1A]">PassOnce Web App</a></li>
              <li><a href="#" className="hover:text-[#0A0E1A]">Android App (.APK)</a></li>
              <li><a href="#" className="hover:text-[#0A0E1A]">Windows App (.EXE)</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#0A0E1A] uppercase">Company</h3>
            <ul className="space-y-1.5 text-[#6B7280]">
              <li><a href="#" className="hover:text-[#0A0E1A]">About NovaLabs</a></li>
              <li><a href="#" className="hover:text-[#0A0E1A]">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#0A0E1A]">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#0A0E1A]">Support</a></li>
            </ul>
          </div>
        </div>
      </footer>

    </div>
  );
}