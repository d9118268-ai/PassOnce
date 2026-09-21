
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

  const isPremium = profileRow?.subscription_status === "premium";
  const displayName =
    profileRow?.full_name || profileRow?.username || "Student";

  const subjects = decodeURIComponent(params.subjects || params.subs || "")
    .split(",")
    .filter(Boolean);

  let questionCounts: Record<string, number> = {};

  try {
    questionCounts = params.counts
      ? JSON.parse(params.counts)
      : {};
  } catch {
    questionCounts = {};
  }

  const questionCount =
    Number(params.q) ||
    subjects.reduce(
      (total, subject) => total + (questionCounts[subject] || 0),
      0
    ) ||
    40;

  return (
    <ExamClient
      userId={user.id}
      displayName={displayName}
      isPremium={isPremium}
      examId={params.exam || "jamb"}
      subjects={subjects.length ? subjects : ["General"]}
      questionCounts={questionCounts}
      mode={
        (params.mode as "Practice" | "Study" | "Mock") || "Practice"
      }
      difficulty={
        (params.diff as "Easy" | "Normal" | "Hard" | "Mindbender") ||
        "Normal"
      }
      durationMins={Number(params.time) || 60}
      questionCount={questionCount}
      shuffleQuestions={params.sq !== "false"}
      shuffleOptions={params.so !== "false"}
    />
  );
}