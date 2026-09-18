"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import PremiumStar from "@/components/PremiumStar";
import PremiumAvatarFrame from "@/components/PremiumAvatarFrame";
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  User,
  LogOut,
  Camera,
  Shield,
  KeyRound,
  CheckCircle2,
  X,
} from "lucide-react";

export type ProfileInitialData = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  subscriptionStatus: "free" | "premium";
  avatarUrl: string;
  profileTheme: string;
  profileEffect: string;
  avatarFrame: string;
};

export default function ProfileClient({ initial }: { initial: ProfileInitialData }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const [fullName, setFullName] = useState(initial.fullName);
  const [username, setUsername] = useState(initial.username);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [profileTheme, setProfileTheme] = useState(initial.profileTheme);
  const [profileEffect, setProfileEffect] = useState(initial.profileEffect);
  const [avatarFrame, setAvatarFrame] = useState(initial.avatarFrame);
  const [styleSaved, setStyleSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    const supabase = createClient();

    // Update the profiles row (full_name, username, phone).
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error: profileErr } = await supabase
      .from("profiles")
.update({ full_name: fullName, username, phone, avatar_url: avatarUrl, profile_theme: profileTheme, profile_effect: profileEffect, avatar_frame: avatarFrame })
      .eq("id", userData.user.id);

    if (profileErr) {
      setProfileError(
        profileErr.message.includes("duplicate key") || profileErr.message.includes("profiles_username")
          ? "That username is already taken — try another."
          : profileErr.message
      );
      return;
    }

    // Email changes go through Supabase Auth directly (triggers a
    // confirmation email if "Confirm email" is enabled).
    if (email !== initial.email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email });
      if (emailErr) {
        setProfileError(emailErr.message);
        return;
      }
    }

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Avatar must be 5MB or smaller.");
      return;
    }
    setAvatarUploading(true);
    setProfileError("");
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setAvatarUploading(false); return; }
    const path = `${userData.user.id}/avatar-${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setProfileError(uploadError.message);
      setAvatarUploading(false);
      return;
    }
    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicData.publicUrl);
    await supabase.from("profiles").update({ avatar_url: publicData.publicUrl }).eq("id", userData.user.id);
    setAvatarUploading(false);
  };

  const saveStyle = async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from("profiles").update({
      profile_theme: profileTheme, profile_effect: profileEffect, avatar_frame: avatarFrame,
    }).eq("id", userData.user.id);
    if (!error) {
      setStyleSaved(true);
      setTimeout(() => setStyleSaved(false), 2500);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    const supabase = createClient();

    // Supabase's updateUser() doesn't ask for the current password itself,
    // so we re-verify it first by signing in again with the value the user
    // just typed — cheap way to confirm they actually know it.
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: initial.email,
      password: currentPassword,
    });
    if (verifyErr) {
      setPasswordError("Current password is incorrect.");
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updateErr) {
      setPasswordError(updateErr.message);
      return;
    }

    setPasswordSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0A0E1A] font-sans flex flex-col">

      {/* Top Icon Nav — matches dashboard, replaces the old sidebar */}
<header className="bg-[#065F46] border-b border-[#064E3B] shadow-md px-3 sm:px-6 py-2 sticky top-0 z-30">        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white border border-white/40 flex items-center justify-center overflow-hidden shadow-sm">
              <Image src="/header-logo.png" alt="PassOnce logo" width={26} height={26} className="object-contain" />
            </div>
            <span className="font-extrabold text-sm tracking-tight hidden sm:inline text-white">PassOnce</span>
          </div>

          <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
            <TopNavIcon icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" onClick={() => router.push("/dashboard")} />
            <TopNavIcon icon={<BookOpen className="w-4 h-4" />} label="Practice" onClick={() => router.push("/dashboard")} />
            <TopNavIcon icon={<BarChart2 className="w-4 h-4" />} label="Performance" onClick={() => router.push("/analytics")} />
            <TopNavIcon icon={<User className="w-4 h-4" />} label="Profile" active onClick={() => {}} />
          </nav>

          <button
            onClick={handleSignOut}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition shrink-0"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-3xl mx-auto w-full space-y-8">

          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-black text-[#0A0E1A]">Profile & Settings</h1>
            <p className="text-sm text-[#6B7280] mt-1">Manage your account details and security.</p>
          </div>

          {/* Avatar + Account Badge */}
          <div
            className={`relative overflow-hidden border rounded-2xl shadow-sm ${initial.subscriptionStatus === "premium" ? "po-premium-profile border-transparent" : "bg-white border-[#E5E7EB]"}`}
          >
            {initial.subscriptionStatus === "premium" && (
              <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 via-purple-500 to-pink-500 opacity-90" />
                <div className="po-premium-wave absolute -left-20 -top-16 w-72 h-72 rounded-full bg-white/25 blur-3xl" />
                <div className="po-premium-wave po-premium-wave-2 absolute -right-20 -top-20 w-80 h-80 rounded-full bg-fuchsia-300/25 blur-3xl" />
                <div className="po-premium-shine absolute inset-0 opacity-25 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,.7)_45%,transparent_55%)] bg-[length:220%_100%]" />
                <span className="po-premium-star po-p1">✦</span>
                <span className="po-premium-star po-p2">✧</span>
                <span className="po-premium-star po-p3">✦</span>
                <span className="po-premium-star po-p4">✧</span>
                <div className="absolute right-5 top-4 rounded-full bg-black/20 border border-white/30 px-3 py-1 text-[9px] font-black tracking-[0.18em] text-white uppercase backdrop-blur-sm">
                  Show off your style
                </div>
              </div>
            )}

            <div className={`relative z-10 p-6 flex items-center gap-5 min-h-[210px] ${initial.subscriptionStatus === "premium" ? "pt-24" : ""}`}>
              <div className="relative shrink-0">
                {initial.subscriptionStatus === "premium" ? (
                  <PremiumAvatarFrame size={88}>
                    <div className="w-full h-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-xl font-black">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        fullName.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "U"
                      )}
                    </div>
                  </PremiumAvatarFrame>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-xl font-black">
                    {fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase())
                      .join("") || "U"}
                  </div>
                )}

                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0A0E1A] text-white rounded-full flex items-center justify-center hover:bg-[#10B981] transition shadow-md z-10"
                  aria-label="Change avatar"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className={`font-bold truncate flex items-center gap-2 ${initial.subscriptionStatus === "premium" ? "text-white drop-shadow-sm" : "text-[#0A0E1A]"}`}>
                  {fullName || "Unnamed User"}
                  {initial.subscriptionStatus === "premium" && <PremiumStar size={28} />}
                </h2>
                <p className={`text-xs font-semibold truncate ${initial.subscriptionStatus === "premium" ? "text-white/90" : "text-[#10B981]"}`}>
                  @{username || "username"}
                </p>
                <p className={`text-xs truncate ${initial.subscriptionStatus === "premium" ? "text-white/75" : "text-[#6B7280]"}`}>
                  {email}
                </p>
              </div>

              <span
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${initial.subscriptionStatus === "premium"
                  ? "bg-white/20 border-white/35 text-white shadow-sm backdrop-blur-sm"
                  : "bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]"}`}
              >
                <Shield className="w-3 h-3" /> {initial.subscriptionStatus === "premium" ? "Premium" : "Free Plan"}
              </span>
            </div>

            {initial.subscriptionStatus === "premium" && (
              <div className="relative z-10 px-6 pb-4 -mt-1">
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <p className="mt-3 text-[10px] font-bold tracking-wider uppercase text-white/75">
                  Add an animated avatar, profile theme, banner image, and more.
                </p>
              </div>
            )}

            <style jsx>{`
              .po-premium-profile {
                box-shadow:
                  0 0 0 1px rgba(16,185,129,.18),
                  0 18px 45px rgba(76,29,149,.12);
              }

              .po-premium-profile::after {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: 1rem;
                padding: 1px;
                background: linear-gradient(120deg, rgba(16,185,129,.9), rgba(59,130,246,.8), rgba(236,72,153,.85), rgba(245,158,11,.8));
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                pointer-events: none;
                animation: po-premium-border 5s linear infinite;
              }

              .po-premium-shine {
                animation: po-premium-shine 5s linear infinite;
              }

              .po-premium-wave {
                animation: po-premium-float 6s ease-in-out infinite;
              }

              .po-premium-wave-2 {
                animation-delay: -2.5s;
                animation-duration: 7s;
              }

              .po-premium-star {
                position: absolute;
                color: white;
                font-size: 16px;
                line-height: 1;
                text-shadow: 0 0 10px rgba(255,255,255,.9);
                animation: po-premium-sparkle 2.5s ease-in-out infinite;
              }

              .po-p1 { left: 16%; top: 28%; }
              .po-p2 { left: 38%; top: 54%; animation-delay: .6s; }
              .po-p3 { right: 31%; top: 24%; animation-delay: 1.2s; }
              .po-p4 { right: 12%; top: 62%; animation-delay: 1.8s; }

              @keyframes po-premium-float {
                0%, 100% { transform: translate3d(0,0,0) scale(1); }
                50% { transform: translate3d(28px,8px,0) scale(1.08); }
              }

              @keyframes po-premium-sparkle {
                0%, 100% { opacity: .25; transform: scale(.55) rotate(0deg); }
                50% { opacity: 1; transform: scale(1.25) rotate(90deg); }
              }

              @keyframes po-premium-shine {
                0% { background-position: 120% 0; }
                100% { background-position: -120% 0; }
              }

              @keyframes po-premium-border {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
              }
            `}</style>
          </div>


          <form
            onSubmit={handleSaveProfile}
            className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-bold text-[#0A0E1A] uppercase">Account Details</h3>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
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
                      className="w-full border border-[#E5E7EB] rounded-lg p-2.5 pl-6 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              {profileError && (
                <span className="text-xs font-bold text-red-600">{profileError}</span>
              )}
              {profileSaved && (
                <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Saved
                </span>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#10B981] text-[#FFFFFF] rounded-lg font-bold text-xs uppercase hover:bg-[#0A0E1A] transition shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>

          {initial.subscriptionStatus === "premium" && (
            <section className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB]">
                <h3 className="text-sm font-bold text-[#0A0E1A] uppercase">Premium Style</h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Choose the look used on your premium profile.</p>
              </div>
              <div className="p-6 grid sm:grid-cols-3 gap-4 text-xs">
                <label className="font-semibold text-[#6B7280]">Theme
                  <select value={profileTheme} onChange={(e) => setProfileTheme(e.target.value)} className="mt-1 w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A]">
                    <option value="aurora">Aurora</option><option value="galaxy">Galaxy</option><option value="neon">Neon</option><option value="emerald">Emerald</option>
                  </select>
                </label>
                <label className="font-semibold text-[#6B7280]">Effect
                  <select value={profileEffect} onChange={(e) => setProfileEffect(e.target.value)} className="mt-1 w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A]">
                    <option value="sparkles">Sparkles</option><option value="shine">Moving Shine</option><option value="none">Clean</option>
                  </select>
                </label>
                <label className="font-semibold text-[#6B7280]">Avatar Frame
                  <select value={avatarFrame} onChange={(e) => setAvatarFrame(e.target.value)} className="mt-1 w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A]">
                    <option value="rainbow">Rainbow</option><option value="glow">Glow</option><option value="minimal">Minimal</option>
                  </select>
                </label>
              </div>
              <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex justify-end items-center gap-3">
                {styleSaved && <span className="text-xs font-bold text-[#10B981]">Style saved</span>}
                <button type="button" onClick={saveStyle} className="px-5 py-2.5 bg-[#0A0E1A] text-white rounded-lg font-bold text-xs uppercase hover:bg-[#10B981] transition">Save Style</button>
              </div>
            </section>
          )}

          {/* Change Password Form */}
          <form
            onSubmit={handleChangePassword}
            className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#10B981]" />
              <h3 className="text-sm font-bold text-[#0A0E1A] uppercase">Change Password</h3>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#6B7280] font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-[#6B7280] font-medium mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-[#E5E7EB] rounded-lg p-2.5 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              {passwordError && (
                <p className="text-xs font-semibold text-red-600">{passwordError}</p>
              )}
            </div>

            <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              {passwordSaved && (
                <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Password updated
                </span>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0A0E1A] text-[#FFFFFF] rounded-lg font-bold text-xs uppercase hover:bg-[#10B981] transition shadow-sm"
              >
                Update Password
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="border border-red-200 rounded-2xl p-6 bg-red-50/40 space-y-3">
            <h3 className="text-sm font-bold text-red-600 uppercase">Danger Zone</h3>
            <p className="text-xs text-[#6B7280]">
              Deleting your account permanently removes your practice history, scores, and saved settings.
            </p>
            <button
              type="button"
              className="px-5 py-2.5 border border-red-300 text-red-600 rounded-lg font-bold text-xs uppercase hover:bg-red-600 hover:text-[#FFFFFF] hover:border-red-600 transition"
            >
              Delete Account
            </button>
          </div>

        </div>
      </main>

    </div>
  );
}

function TopNavIcon({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition ${
        active ? "bg-white/15 text-white" : "text-white/80 hover:text-white hover:bg-white/10"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}