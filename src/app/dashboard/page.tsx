import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient, {
  type DashboardProfile,
  type DashboardStats,
  type RecentAttemptRow,
} from "./DashboardClient";

function timeAgoLabel(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? "1 month ago" : `${months} months ago`;
}

const EXAM_NAMES: Record<string, string> = {
  jamb: "JAMB UTME",
  waec: "WAEC SSCE",
  neco: "NECO SSCE",
  gce: "GCE O/L",
  bece: "BECE (JSS3)",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this route, but double-check in case this
  // page is ever reached directly (e.g. during local testing).
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, username, subscription_status")
    .eq("id", user.id)
    .single();

  const profile: DashboardProfile = {
    fullName: profileRow?.full_name || "Student",
    username: profileRow?.username || "student",
    subscriptionStatus: (profileRow?.subscription_status as "free" | "premium") || "free",
  };

  const { data: attempts } = await supabase
    .from("attempts")
    .select("id, exam_id, score, total_questions, time_spent_seconds, subject_breakdown, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const allAttempts = attempts || [];

  const completed = allAttempts.filter((a) => a.status === "completed");

  let stats: DashboardStats;
  if (completed.length === 0) {
    stats = { iqRate: null, speedPerMin: null, accuracyPct: null };
  } else {
    const accuracyPct = Math.round(
      completed.reduce((sum, a) => sum + (a.score / Math.max(a.total_questions, 1)) * 100, 0) / completed.length
    );
    const speedPerMin =
      Math.round(
        (completed.reduce((sum, a) => {
          const mins = (a.time_spent_seconds || 1) / 60;
          return sum + a.score / Math.max(mins, 0.1);
        }, 0) /
          completed.length) *
          10
      ) / 10;

    // Gamified composite for engagement — NOT a real IQ measurement, just a
    // fun blended number that moves with accuracy and speed together.
    const iqRate = Math.round(Math.min(160, Math.max(70, 100 + (accuracyPct - 50) * 0.5 + speedPerMin * 1.5)));

    stats = { iqRate, speedPerMin, accuracyPct };
  }

  const recentAttempts: RecentAttemptRow[] = allAttempts.map((a) => ({
    id: a.id,
    exam: EXAM_NAMES[a.exam_id] || a.exam_id.toUpperCase(),
    score: `${a.score}/${a.total_questions}`,
    date: timeAgoLabel(a.created_at),
    totalQuestions: a.total_questions,
    timeSpentSeconds: a.time_spent_seconds || 0,
    subjectBreakdown: a.subject_breakdown || {},
    status:
      a.status === "abandoned"
        ? "Abandoned"
        : a.score / Math.max(a.total_questions, 1) >= 0.7
        ? "Excellent"
        : a.score / Math.max(a.total_questions, 1) >= 0.5
        ? "Good"
        : "Needs Work",
  }));

  return <DashboardClient profile={profile} stats={stats} recentAttempts={recentAttempts} />;
}