"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
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
      .update({ full_name: fullName, username, phone })
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
      <header className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-3 sm:px-6 py-2 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 relative">
              <Image src="/header-logo.png" alt="PassOnce logo" fill className="object-contain" />
            </div>
            <span className="font-extrabold text-sm tracking-tight hidden sm:inline">PassOnce</span>
          </div>

          <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
            <TopNavIcon icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" onClick={() => router.push("/dashboard")} />
            <TopNavIcon icon={<BookOpen className="w-4 h-4" />} label="Practice" onClick={() => router.push("/dashboard")} />
            <TopNavIcon icon={<BarChart2 className="w-4 h-4" />} label="Performance" onClick={() => router.push("/analytics")} />
            <TopNavIcon icon={<User className="w-4 h-4" />} label="Profile" active onClick={() => {}} />
          </nav>

          <button
            onClick={handleSignOut}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6B7280] hover:text-red-600 hover:bg-red-50 transition shrink-0"
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
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 flex items-center gap-5 shadow-sm">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-xl font-black">
                {fullName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0]?.toUpperCase())
                  .join("") || "U"}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0A0E1A] text-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#10B981] transition"
                aria-label="Change avatar"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-[#0A0E1A] truncate">{fullName || "Unnamed User"}</h2>
              <p className="text-xs text-[#10B981] font-semibold truncate">@{username || "username"}</p>
              <p className="text-xs text-[#6B7280] truncate">{email}</p>
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                initial.subscriptionStatus === "premium"
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                  : "bg-[#F9FAFB] border-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              <Shield className="w-3 h-3" /> {initial.subscriptionStatus === "premium" ? "Premium" : "Free Plan"}
            </span>
          </div>

          {/* Account Details Form */}
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
        active ? "bg-[#10B981]/10 text-[#10B981]" : "text-[#6B7280] hover:text-[#0A0E1A] hover:bg-[#F9FAFB]"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}