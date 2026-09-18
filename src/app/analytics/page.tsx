import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Award } from "lucide-react";

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

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: attempts } = await supabase
    .from("attempts")
    .select("id, exam_id, score, total_questions, unanswered, time_spent_seconds, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const recent = attempts || [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0A0E1A] font-sans flex flex-col">
      <header className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:text-[#0A0E1A] hover:bg-[#E5E7EB]/50 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-extrabold text-lg tracking-tight text-[#0A0E1A]">Recent Results</h1>
        </div>
        <Link href="/dashboard" className="bg-[#0A0E1A] text-[#FFFFFF] px-5 py-2 rounded-lg font-bold text-xs uppercase hover:bg-[#10B981] transition shadow-sm">
          <span className="hidden sm:inline">Return to </span>Dashboard
        </Link>
      </header>

      <main className="max-w-3xl w-full mx-auto p-6 md:p-8 space-y-4 flex-1">
        {recent.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-10 text-center text-sm text-[#6B7280]">
            No results yet — finish a practice exam to see it here.
          </div>
        ) : (
          recent.map((a) => {
            const pct = Math.round((a.score / Math.max(a.total_questions, 1)) * 100);
            return (
              <div key={a.id} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#0A0E1A] truncate">{EXAM_NAMES[a.exam_id] || a.exam_id.toUpperCase()}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      a.status === "abandoned" ? "bg-red-50 text-red-600" : pct >= 70 ? "bg-[#10B981]/10 text-[#10B981]" : "bg-amber-50 text-amber-600"
                    }`}>
                      {a.status === "abandoned" ? "Abandoned" : `${pct}%`}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">{timeAgoLabel(a.created_at)}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-[#6B7280]">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> {a.score} correct</span>
                    <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /> {a.total_questions - a.score - (a.unanswered || 0)} wrong</span>
                    <span className="flex items-center gap-1"><MinusCircle className="w-3.5 h-3.5 text-[#6B7280]" /> {a.unanswered || 0} skipped</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}