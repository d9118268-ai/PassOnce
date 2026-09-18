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
    .select("full_name, username, phone, subscription_status")
    .eq("id", user.id)
    .single();

  const initial: ProfileInitialData = {
    fullName: profileRow?.full_name || "",
    username: profileRow?.username || "",
    email: user.email || "",
    phone: profileRow?.phone || "",
    subscriptionStatus: (profileRow?.subscription_status as "free" | "premium") || "free",
  };

  return <ProfileClient initial={initial} />;
}