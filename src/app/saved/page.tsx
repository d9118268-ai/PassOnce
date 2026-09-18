import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Bookmark, Trash2 } from "lucide-react";

export default async function SavedQuestionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: questions } = await supabase
    .from("saved_questions")
    .select("id, exam_id, subject, prompt, options, correct_index, explanation, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0A0E1A]">
      <header className="bg-[#065F46] text-white border-b border-[#064E3B] px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/10"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="font-black text-sm uppercase">Saved Questions</h1>
            <p className="text-[11px] text-white/70">Your bookmarked practice questions</p>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-4">
        {!questions?.length ? (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center">
            <Bookmark className="w-8 h-8 text-[#10B981] mx-auto mb-3" />
            <p className="text-sm font-bold">No saved questions yet.</p>
            <p className="text-xs text-[#6B7280] mt-1">Bookmark a question during an exam and it will appear here.</p>
          </div>
        ) : questions.map((q) => (
          <article key={q.id} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase text-[#10B981]">{q.exam_id} · {q.subject}</span>
              <Bookmark className="w-4 h-4 fill-[#10B981] text-[#10B981]" />
            </div>
            <p className="text-sm font-bold leading-relaxed">{q.prompt}</p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              {(Array.isArray(q.options) ? q.options : []).map((option: string, i: number) => (
                <div key={i} className={`p-2.5 rounded-lg border ${i === q.correct_index ? "border-[#10B981] bg-[#10B981]/5 font-bold" : "border-[#E5E7EB]"}`}>
                  {String.fromCharCode(65 + i)}. {option}
                </div>
              ))}
            </div>
            {q.explanation && <p className="text-xs text-[#6B7280] border-t border-[#E5E7EB] pt-3"><span className="font-bold text-[#0A0E1A]">Explanation:</span> {q.explanation}</p>}
          </article>
        ))}
      </main>
    </div>
  );
}
