
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MinusCircle,
  Target,
  XCircle,
} from "lucide-react";

const EXAM_NAMES: Record<string, string> = {
  jamb: "JAMB UTME",
  waec: "WAEC SSCE",
  neco: "NECO SSCE",
  gce: "GCE O/L",
  bece: "BECE (JSS3)",
};

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

function formatTime(seconds: number | null): string {
  if (!seconds || seconds < 1) return "Not recorded";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function getStatusLabel(status: string, percentage: number): string {
  if (status === "abandoned") return "Abandoned";
  if (status === "cheated") return "Switch detected";
  if (percentage >= 70) return "Completed";
  return "Needs review";
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: attempts, error } = await supabase
    .from("attempts")
    .select(
      "id, exam_id, score, total_questions, unanswered, time_spent_seconds, status, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Records query error:", error);
  }

  const recent = attempts || [];

  return (
    <div className="min-h-screen bg-white text-[#064E3B]">
      <header className="sticky top-0 z-50 border-b border-[#D1FAE5] bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D1FAE5] text-[#064E3B] transition hover:bg-[#ECFDF5]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-[#064E3B]">
                Records
              </h1>
              <p className="text-xs text-[#047857]">
                Review your examination performance
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#064E3B] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#047857]"
          >
            <span className="hidden sm:inline">Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 md:py-8">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#064E3B]">
            Your Records
          </h2>
          <p className="mt-1 text-sm text-[#047857]">
            Select a record to review its examination details.
          </p>
        </section>

        {recent.length === 0 ? (
          <section className="rounded-2xl border border-[#D1FAE5] bg-white p-10 text-center">
            <Target className="mx-auto h-8 w-8 text-[#10B981]" />
            <h3 className="mt-4 text-base font-bold text-[#064E3B]">
              No records yet
            </h3>
            <p className="mt-2 text-sm text-[#047857]">
              Complete a practice examination to see your performance here.
            </p>

            <Link
              href="/dashboard"
              className="mt-5 inline-flex rounded-lg bg-[#10B981] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064E3B]"
            >
              Start Practice
            </Link>
          </section>
        ) : (
          <div className="space-y-3">
            {recent.map((attempt) => {
              const totalQuestions = Math.max(
                Number(attempt.total_questions) || 0,
                1
              );

              const score = Number(attempt.score) || 0;
              const unanswered = Number(attempt.unanswered) || 0;
              const wrong = Math.max(
                totalQuestions - score - unanswered,
                0
              );

              const percentage = Math.round(
                (score / totalQuestions) * 100
              );

              const statusLabel = getStatusLabel(
                attempt.status,
                percentage
              );

              return (
                <details
                  key={attempt.id}
                  className="group overflow-hidden rounded-2xl border border-[#D1FAE5] bg-white transition hover:border-[#10B981]"
                >
                  <summary className="cursor-pointer list-none px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#047857]">
                        <Target className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-extrabold text-[#064E3B] sm:text-base">
                            {EXAM_NAMES[attempt.exam_id] ||
                              String(attempt.exam_id).toUpperCase()}
                          </h3>

                          <span className="rounded-full bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#047857]">
                            {statusLabel}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#047857]">
                          {timeAgoLabel(attempt.created_at)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xl font-extrabold text-[#064E3B]">
                          {percentage}%
                        </p>
                        <p className="text-[10px] font-semibold text-[#047857]">
                          {score}/{totalQuestions}
                        </p>
                      </div>
                    </div>
                  </summary>

                  <div className="border-t border-[#D1FAE5] bg-[#F0FDF4] px-4 py-5 sm:px-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-[#D1FAE5] bg-white p-4">
                        <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                        <p className="mt-3 text-xs font-semibold text-[#047857]">
                          Correct answers
                        </p>
                        <p className="mt-1 text-xl font-extrabold text-[#064E3B]">
                          {score}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D1FAE5] bg-white p-4">
                        <XCircle className="h-4 w-4 text-[#047857]" />
                        <p className="mt-3 text-xs font-semibold text-[#047857]">
                          Wrong answers
                        </p>
                        <p className="mt-1 text-xl font-extrabold text-[#064E3B]">
                          {wrong}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D1FAE5] bg-white p-4">
                        <MinusCircle className="h-4 w-4 text-[#047857]" />
                        <p className="mt-3 text-xs font-semibold text-[#047857]">
                          Skipped
                        </p>
                        <p className="mt-1 text-xl font-extrabold text-[#064E3B]">
                          {unanswered}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#D1FAE5] bg-white p-4">
                        <Clock3 className="h-4 w-4 text-[#047857]" />
                        <p className="mt-3 text-xs font-semibold text-[#047857]">
                          Time spent
                        </p>
                        <p className="mt-1 text-base font-extrabold text-[#064E3B]">
                          {formatTime(attempt.time_spent_seconds)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-[#064E3B]">
                          Examination status
                        </p>
                        <p className="mt-1 text-xs text-[#047857]">
                          {attempt.status}
                        </p>
                      </div>

                      <Link
                        href={`/analytics/${attempt.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#064E3B] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#047857]"
                      >
                        View Full Record
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}