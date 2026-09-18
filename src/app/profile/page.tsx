import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient, { type ProfileInitialData } from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, username, phone, subscription_status, avatar_url, profile_theme, profile_effect, avatar_frame")
    .eq("id", user.id)
    .single();

  const initial: ProfileInitialData = {
    fullName: profileRow?.full_name || "",
    username: profileRow?.username || "",
    email: user.email || "",
    phone: profileRow?.phone || "",
    subscriptionStatus: (profileRow?.subscription_status as "free" | "premium") || "free",
    avatarUrl: profileRow?.avatar_url || "",
    profileTheme: profileRow?.profile_theme || "aurora",
    profileEffect: profileRow?.profile_effect || "sparkles",
    avatarFrame: profileRow?.avatar_frame || "rainbow",
  };

  return <ProfileClient initial={initial} />;
}