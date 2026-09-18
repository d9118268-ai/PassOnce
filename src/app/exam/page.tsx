import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExamClient from "./ExamClient";

export default async function ExamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, username, subscription_status")
    .eq("id", user.id)
    .single();

  // Real value from the database — never trust the old ?premium=true/false
  // URL param, since anyone could type that into the address bar.
  const isPremium = profileRow?.subscription_status === "premium";
  const displayName = profileRow?.full_name || profileRow?.username || "Student";

  const subjects = decodeURIComponent(params.subjects || "")
    .split(",")
    .filter(Boolean);

  return (
    <ExamClient
      userId={user.id}
      displayName={displayName}
      isPremium={isPremium}
      examId={params.exam || "jamb"}
      subjects={subjects.length ? subjects : ["General"]}
      mode={(params.mode as "Practice" | "Study" | "Mock") || "Practice"}
      difficulty={(params.diff as "Easy" | "Normal" | "Hard" | "Mindbender") || "Normal"}
      durationMins={Number(params.time) || 60}
      questionCount={Number(params.q) || 40}
      shuffleQuestions={params.sq !== "false"}
      shuffleOptions={params.so !== "false"}
    />
  );
}