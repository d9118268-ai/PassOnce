"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut,
  Calculator as CalculatorIcon,
  Bookmark,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
} from "lucide-react";

// ---------- Types ----------

type Mode = "Practice" | "Study" | "Mock";
type Difficulty = "Easy" | "Normal" | "Hard" | "Mindbender";

type Question = {
  id: number;
  subject: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type ExamClientProps = {
  userId: string;
  displayName: string;
  isPremium: boolean;
  examId: string;
  subjects: string[];
  mode: Mode;
  difficulty: Difficulty;
  durationMins: number;
  questionCount: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};

// ---------- Helpers ----------

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDummyQuestions(
  subjects: string[],
  count: number,
  difficulty: Difficulty,
  shuffleQuestions: boolean,
  shuffleOptions: boolean
): Question[] {
  const base: Question[] = Array.from({ length: count }, (_, i) => {
    const subject = subjects[i % subjects.length] || "General";
    const correctIndex = i % 4;
    const optionLabels = ["Option A", "Option B", "Option C", "Option D"];
    return {
      id: i,
      subject,
      prompt: `[${difficulty}] Sample ${subject} question #${i + 1} — placeholder prompt text until the real question bank is connected.`,
      options: shuffleOptions ? seededShuffle(optionLabels, i + 7) : optionLabels,
      correctIndex: shuffleOptions ? seededShuffle(optionLabels, i + 7).indexOf(optionLabels[correctIndex]) : correctIndex,
      explanation: `Placeholder explanation: the correct choice for question #${i + 1} would be justified here once real content is wired in.`,
    };
  });
  return shuffleQuestions ? seededShuffle(base, 42) : base;
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "U";
}

// Simple ring gauge — decorative, matches the reference's circular summary look
function RingGauge({ pct, label, sublabel }: { pct: number; label: string; sublabel: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="#10B981" strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={c - (clamped / 100) * c}
          strokeLinecap="round" transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0A0E1A">
          {Math.round(clamped)}%
        </text>
      </svg>
      <p className="text-xs font-bold text-[#0A0E1A] uppercase">{label}</p>
      <p className="text-[11px] text-[#6B7280] font-semibold">{sublabel}</p>
    </div>
  );
}

export default function ExamClient({
  userId,
  displayName,
  isPremium,
  examId,
  subjects,
  mode,
  difficulty,
  durationMins,
  questionCount,
  shuffleQuestions,
  shuffleOptions,
}: ExamClientProps) {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  const [currentSubject, setCurrentSubject] = useState<string>("");
  const [localIndex, setLocalIndex] = useState(0);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeSpent, setTimeSpent] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(durationMins * 60);

  const [submitted, setSubmitted] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const submittedRef = useRef(false);

  // Toolbar modals
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReportError, setShowReportError] = useState(false);

  // Load questions — everyone calls the same route. The server decides
  // fresh (premium) vs cached (free) based on real subscription_status;
  // buildDummyQuestions here is only a last-resort network failure fallback.
  useEffect(() => {
    let cancelled = false;
    async function loadQuestions() {
      setLoadingQuestions(true);

      try {
        const res = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId, subjects, difficulty, count: questionCount }),
        });
        if (!res.ok) throw new Error("Generation request failed");
        const data = await res.json();
        if (!Array.isArray(data.questions) || data.questions.length === 0) throw new Error("No questions");

        let generated: Question[] = data.questions.map((q: any, idx: number) => {
          const options: string[] = Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"];
          const shuffledOptions = shuffleOptions ? seededShuffle(options, idx + 7) : options;
          const correctIndex = shuffleOptions ? shuffledOptions.indexOf(options[q.correctIndex] ?? options[0]) : q.correctIndex ?? 0;
          return {
            id: idx,
            subject: q.subject || subjects[idx % subjects.length],
            prompt: q.prompt || `Untitled question #${idx + 1}`,
            options: shuffledOptions,
            correctIndex,
            explanation: q.explanation || "",
          };
        });
        if (shuffleQuestions) generated = seededShuffle(generated, 42);

        if (!cancelled) {
          setQuestions(generated);
          setCurrentSubject(generated[0]?.subject || "");
          setUsedFallback(false);
        }
      } catch {
        if (!cancelled) {
          const q = buildDummyQuestions(subjects, questionCount, difficulty, shuffleQuestions, shuffleOptions);
          setQuestions(q);
          setCurrentSubject(q[0]?.subject || "");
          setUsedFallback(true);
        }
      } finally {
        if (!cancelled) setLoadingQuestions(false);
      }
    }
    loadQuestions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, questionCount, difficulty, shuffleQuestions, shuffleOptions, subjects.join(","), isPremium]);

  const subjectList = useMemo(
    () => Array.from(new Set((questions || []).map((q) => q.subject))),
    [questions]
  );
  const subjectQuestions = useMemo(
    () => (questions || []).filter((q) => q.subject === currentSubject),
    [questions, currentSubject]
  );
  const current = subjectQuestions[localIndex] || null;

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = (questions?.length ?? 0) - answeredCount;
  const flaggedCount = flagged.size;

  // Persist to Supabase + reveal review mode
  const finalizeSubmit = useCallback(
    async (status: "completed" | "abandoned") => {
      if (!questions || submittedRef.current) return;
      submittedRef.current = true;
      setSaving(true);

      let correct = 0;
      const subjectTally: Record<string, { correct: number; total: number }> = {};
      questions.forEach((q) => {
        if (!subjectTally[q.subject]) subjectTally[q.subject] = { correct: 0, total: 0 };
        subjectTally[q.subject].total += 1;
        if (answers[q.id] === q.correctIndex) {
          correct++;
          subjectTally[q.subject].correct += 1;
        }
      });
      const secondsSpent = durationMins * 60 - secondsLeft;

      try {
        const supabase = createClient();
        await supabase.from("attempts").insert({
          user_id: userId,
          exam_id: examId,
          subjects,
          mode,
          difficulty,
          score: correct,
          total_questions: questions.length,
          unanswered: unansweredCount,
          time_spent_seconds: secondsSpent,
          subject_breakdown: subjectTally,
          status,
        });
      } catch {
        // Non-fatal — the review still shows locally even if the save failed.
      }

      setSaving(false);
      setSubmitted(true);
      if (status === "completed") {
        setShowResultModal(true);
      } else {
        router.push("/dashboard");
      }
    },
    [questions, answers, durationMins, secondsLeft, userId, examId, subjects, mode, difficulty, unansweredCount, router]
  );

  const handleSubmit = useCallback(() => finalizeSubmit("completed"), [finalizeSubmit]);
  const handleAbandon = useCallback(() => finalizeSubmit("abandoned"), [finalizeSubmit]);

  // Countdown + per-question time tracking (one shared 1s tick)
  useEffect(() => {
    if (submitted || loadingQuestions || !questions || !current) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const t = setTimeout(() => {
      setSecondsLeft((s) => s - 1);
      setTimeSpent((prev) => ({ ...prev, [current.id]: (prev[current.id] || 0) + 1 }));
    }, 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, submitted, loadingQuestions, questions, current, handleSubmit]);

  // Anti-cheat: auto-submit the moment the tab/app loses visibility.
  // Works identically inside a wrapped Android WebView or an Electron/Tauri
  // desktop shell, since both implement the same Page Visibility API.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden && !submittedRef.current && questions) {
        handleSubmit();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [questions, handleSubmit]);

  const selectAnswer = (optionIndex: number) => {
    if (!current || submitted) return;
    setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
  };

  const toggleFlag = () => {
    if (!current) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(current.id)) next.delete(current.id);
      else next.add(current.id);
      return next;
    });
  };

  const goToSubject = (subject: string) => {
    setCurrentSubject(subject);
    setLocalIndex(0);
  };

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < subjectQuestions.length) setLocalIndex(idx);
  };

  const timeLow = secondsLeft <= 300;
  const selectedOption = current ? answers[current.id] : undefined;
  const revealFeedback = submitted || (mode !== "Mock" && selectedOption !== undefined);
  const isCorrectSelected = current !== null && selectedOption === current.correctIndex;

  if (loadingQuestions || !questions || !current) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#10B981] rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#0A0E1A]">Your questions will be ready in seconds…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0A0E1A] font-sans flex flex-col">

      {/* Top Toolbar */}
      <header className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-40">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <ToolbarButton icon={<LogOut className="w-4 h-4" />} label="Log Out" onClick={() => (submitted ? router.push("/dashboard") : setShowExitConfirm(true))} />
          <ToolbarButton icon={<CalculatorIcon className="w-4 h-4" />} label="Calculator" onClick={() => setShowCalculator(true)} />
          <ToolbarButton
            icon={<Bookmark className={`w-4 h-4 ${flagged.has(current.id) ? "fill-[#10B981] text-[#10B981]" : ""}`} />}
            label="Bookmark"
            onClick={toggleFlag}
            active={flagged.has(current.id)}
          />
          <ToolbarButton icon={<AlertTriangle className="w-4 h-4" />} label="Report Error" onClick={() => setShowReportError(true)} />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="w-6 h-6 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-[10px] font-black">
              {initials(displayName)}
            </div>
            <span className="text-xs font-bold text-[#0A0E1A] hidden sm:inline">{displayName.toUpperCase()}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-sm ${timeLow ? "bg-red-50 text-red-600" : "bg-[#10B981]/10 text-[#10B981]"}`}>
            <Clock className="w-4 h-4" />
            {formatTime(secondsLeft)}
          </div>
        </div>
      </header>

      {/* Subject Tabs */}
      {subjectList.length > 1 && (
        <div className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-3 sm:px-6 flex items-center gap-1 overflow-x-auto">
          {subjectList.map((s) => (
            <button
              key={s}
              onClick={() => goToSubject(s)}
              className={`shrink-0 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                s === currentSubject ? "border-[#10B981] text-[#0A0E1A]" : "border-transparent text-[#6B7280] hover:text-[#0A0E1A]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {usedFallback && (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" /> Showing offline placeholder questions right now.
          </div>
        </div>
      )}
      {!isPremium && !usedFallback && (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center justify-between gap-3 bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B7280]">
            <span>Free plan — you'll see this same question set every attempt.</span>
            <a href="/subscribe" className="text-[#10B981] font-bold underline shrink-0">Upgrade for fresh questions</a>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl w-full mx-auto p-3 sm:p-6 gap-6">

        {/* Palette */}
        <div className="lg:w-72 shrink-0 lg:order-1">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-black text-[#0A0E1A] uppercase">
              Attempt: {subjectQuestions.filter((q) => answers[q.id] !== undefined).length}/{subjectQuestions.length}
            </p>
            <div className="grid grid-cols-5 gap-1.5 max-h-[420px] overflow-y-auto pr-1">
              {subjectQuestions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === localIndex;
                const secs = timeSpent[q.id] || 0;
                return (
                  <button
                    key={q.id}
                    onClick={() => goTo(idx)}
                    className={`rounded-lg py-1.5 text-[11px] font-bold flex flex-col items-center justify-center transition ${
                      isAnswered ? "bg-[#10B981]/15 text-[#0A0E1A]" : "bg-amber-50 text-[#0A0E1A]"
                    } ${isCurrent ? "ring-2 ring-[#0A0E1A]" : ""}`}
                  >
                    <span>{idx + 1}</span>
                    <span className={`text-[9px] font-semibold ${isAnswered ? "text-[#10B981]" : "text-amber-600"}`}>{secs}s</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Question Panel */}
        <div className="flex-1 flex flex-col gap-4 lg:order-2">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280]">Question: {localIndex + 1}/{subjectQuestions.length}</span>
            </div>

            <p className="text-base font-semibold text-[#0A0E1A] leading-relaxed">{current.prompt}</p>

            <div className="space-y-3">
              {current.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectOption = idx === current.correctIndex;
                let cls = "border-[#E5E7EB] hover:border-[#10B981] text-[#0A0E1A]";
                if (isSelected && !revealFeedback) cls = "border-[#10B981] bg-[#10B981]/10 text-[#0A0E1A] font-bold";
                if (revealFeedback && isSelected && isCorrectOption) cls = "border-[#10B981] bg-[#10B981]/10 text-[#0A0E1A] font-bold";
                if (revealFeedback && isSelected && !isCorrectOption) cls = "border-red-400 bg-red-50 text-[#0A0E1A] font-bold";
                if (revealFeedback && !isSelected && isCorrectOption) cls = "border-[#10B981]/50 bg-[#10B981]/5 text-[#0A0E1A]";

                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    disabled={submitted}
                    className={`w-full text-left p-3.5 border rounded-xl flex items-center justify-between gap-3 text-sm transition ${cls} disabled:cursor-default`}
                  >
                    <span><b className="mr-2">{String.fromCharCode(65 + idx)}</b>{opt}</span>
                    {revealFeedback && isSelected && (isCorrectOption ? <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />)}
                    {revealFeedback && !isSelected && isCorrectOption && <CheckCircle2 className="w-4 h-4 text-[#10B981]/60 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {revealFeedback && selectedOption !== undefined && (
              <div className="pt-2 border-t border-[#E5E7EB]">
                {isPremium ? (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${isCorrectSelected ? "bg-[#10B981]/5 border-[#10B981]/30" : "bg-amber-50 border-amber-200"}`}>
                    <p className="font-bold uppercase mb-1">Explanation</p>
                    <p className="text-[#6B7280] mb-2">Topic: <span className="text-[#0A0E1A] font-semibold">{current.subject}</span> · Difficulty: <span className="text-[#0A0E1A] font-semibold">{difficulty}</span></p>
                    {current.explanation}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 font-semibold text-[#6B7280]"><Lock className="w-4 h-4" /> Explanations are a premium feature.</span>
                    <a href="/subscribe" className="text-[#10B981] font-bold underline shrink-0">Upgrade</a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => goTo(localIndex - 1)}
              disabled={localIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#6B7280] hover:text-[#0A0E1A] hover:border-[#10B981] transition disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {submitted ? (
              <button onClick={() => setShowResultModal(true)} className="px-6 py-2.5 bg-[#0A0E1A] text-[#FFFFFF] rounded-lg font-bold text-xs uppercase hover:bg-[#10B981] transition">
                Result
              </button>
            ) : (
              <button onClick={() => setShowSubmitConfirm(true)} className="px-6 py-2.5 bg-red-600 text-[#FFFFFF] rounded-lg font-bold text-xs uppercase hover:bg-red-700 transition">
                Submit
              </button>
            )}

            <button
              onClick={() => goTo(localIndex + 1)}
              disabled={localIndex === subjectQuestions.length - 1}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#10B981] text-[#FFFFFF] rounded-lg text-xs font-bold hover:bg-[#0A0E1A] transition disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation */}
      {showExitConfirm && (
        <Modal onClose={() => setShowExitConfirm(false)}>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /><h3 className="font-bold text-sm uppercase">Log Out of Exam?</h3>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">Your progress will be saved as abandoned. This can't be resumed.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowExitConfirm(false)} className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#6B7280]">Stay</button>
            <button onClick={() => (submitted ? router.push("/dashboard") : handleAbandon())} className="px-4 py-2 bg-red-600 text-[#FFFFFF] rounded-lg text-xs font-bold hover:bg-red-700">Log Out</button>
          </div>
        </Modal>
      )}

      {/* Submit Confirmation */}
      {showSubmitConfirm && (
        <Modal onClose={() => setShowSubmitConfirm(false)}>
          <h3 className="font-bold text-sm uppercase text-[#0A0E1A]">Submit Exam?</h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Stat label="Answered" value={answeredCount} />
            <Stat label="Unanswered" value={unansweredCount} />
            <Stat label="Flagged" value={flaggedCount} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowSubmitConfirm(false)} className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#6B7280]">Keep Going</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-[#10B981] text-[#FFFFFF] rounded-lg text-xs font-bold hover:bg-[#0A0E1A] disabled:opacity-60">
              {saving ? "Saving…" : "Submit Now"}
            </button>
          </div>
        </Modal>
      )}

      {/* Result Modal */}
      {showResultModal && (() => {
        const correct = questions.filter((q) => answers[q.id] === q.correctIndex).length;
        const scorePct = Math.round((correct / questions.length) * 100);
        const secondsUsed = durationMins * 60 - secondsLeft;
        const timePct = Math.round((secondsUsed / (durationMins * 60)) * 100);
        const speed = secondsUsed > 0 ? Math.round((correct / (secondsUsed / 60)) * 10) / 10 : 0;
        return (
          <div className="fixed inset-0 bg-[#0A0E1A]/60 flex items-center justify-center p-4 z-50">
            <div className="bg-[#FFFFFF] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="font-black text-sm uppercase">{examId.toUpperCase()} Result</h3>
                <button onClick={() => setShowResultModal(false)} className="text-[#6B7280] hover:text-[#0A0E1A]"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 grid grid-cols-3 gap-2">
                <RingGauge pct={scorePct} label="Score" sublabel={`${correct}/${questions.length}`} />
                <RingGauge pct={timePct} label="Time Used" sublabel={formatTime(secondsUsed)} />
                <RingGauge pct={Math.min(speed * 10, 100)} label="Speed" sublabel={`${speed}/min`} />
              </div>
              <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex justify-end gap-3">
                <button onClick={() => setShowResultModal(false)} className="px-5 py-2.5 border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#6B7280]">Review Answers</button>
                <button onClick={() => router.push("/dashboard")} className="px-5 py-2.5 bg-[#0A0E1A] text-[#FFFFFF] rounded-lg text-xs font-bold hover:bg-[#10B981] transition">Back to Dashboard</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Calculator */}
      {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} />}

      {/* Report Error */}
      {showReportError && <ReportErrorModal onClose={() => setShowReportError(false)} question={current.prompt} />}

    </div>
  );
}

// ---------- Small shared components ----------

function ToolbarButton({ icon, label, onClick, locked, active }: { icon: React.ReactNode; label: string; onClick: () => void; locked?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition ${
        active ? "bg-[#10B981]/10 text-[#10B981]" : "text-[#6B7280] hover:text-[#0A0E1A] hover:bg-[#F9FAFB]"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
      {locked && <Lock className="w-3 h-3 text-amber-500" />}
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#0A0E1A]/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-[#FFFFFF] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
      <p className="font-black text-lg text-[#0A0E1A]">{value}</p>
      <p className="text-[10px] font-bold text-[#6B7280] uppercase">{label}</p>
    </div>
  );
}

function CalculatorModal({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const inputDigit = (d: string) => {
    if (waiting) {
      setDisplay(d);
      setWaiting(false);
    } else {
      setDisplay(display === "0" ? d : display + d);
    }
  };
  const inputDot = () => {
    if (waiting) { setDisplay("0."); setWaiting(false); return; }
    if (!display.includes(".")) setDisplay(display + ".");
  };
  const compute = (a: number, b: number, operator: string) => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default: return b;
    }
  };
  const chooseOp = (operator: string) => {
    const value = parseFloat(display);
    if (prev !== null && op && !waiting) {
      setDisplay(String(compute(prev, value, op)));
      setPrev(compute(prev, value, op));
    } else {
      setPrev(value);
    }
    setOp(operator);
    setWaiting(true);
  };
  const equals = () => {
    if (prev === null || !op) return;
    setDisplay(String(compute(prev, parseFloat(display), op)));
    setPrev(null);
    setOp(null);
    setWaiting(true);
  };
  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setWaiting(false); };

  const btn = "py-3 rounded-lg font-bold text-sm transition";
  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Calculator</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-[#6B7280]" /></button>
      </div>
      <div className="bg-[#0A0E1A] text-white text-right text-2xl font-mono p-4 rounded-lg truncate">{display}</div>
      <div className="grid grid-cols-4 gap-2">
        <button onClick={clear} className={`${btn} bg-red-50 text-red-600 col-span-2`}>C</button>
        <button onClick={() => chooseOp("÷")} className={`${btn} bg-[#F9FAFB] text-[#0A0E1A]`}>÷</button>
        <button onClick={() => chooseOp("×")} className={`${btn} bg-[#F9FAFB] text-[#0A0E1A]`}>×</button>
        {["7","8","9"].map((d) => <button key={d} onClick={() => inputDigit(d)} className={`${btn} bg-white border border-[#E5E7EB]`}>{d}</button>)}
        <button onClick={() => chooseOp("-")} className={`${btn} bg-[#F9FAFB] text-[#0A0E1A]`}>−</button>
        {["4","5","6"].map((d) => <button key={d} onClick={() => inputDigit(d)} className={`${btn} bg-white border border-[#E5E7EB]`}>{d}</button>)}
        <button onClick={() => chooseOp("+")} className={`${btn} bg-[#F9FAFB] text-[#0A0E1A]`}>+</button>
        {["1","2","3"].map((d) => <button key={d} onClick={() => inputDigit(d)} className={`${btn} bg-white border border-[#E5E7EB]`}>{d}</button>)}
        <button onClick={equals} className={`${btn} bg-[#10B981] text-white row-span-2`}>=</button>
        <button onClick={() => inputDigit("0")} className={`${btn} bg-white border border-[#E5E7EB] col-span-2`}>0</button>
        <button onClick={inputDot} className={`${btn} bg-white border border-[#E5E7EB]`}>.</button>
      </div>
    </Modal>
  );
}


function ReportErrorModal({ onClose, question }: { onClose: () => void; question: string }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const submitReport = () => {
    // TODO: send to a real endpoint/table — currently local-only confirmation.
    setSent(true);
  };

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">Report an Issue</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-[#6B7280]" /></button>
      </div>
      {sent ? (
        <p className="text-sm text-[#10B981] font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Thanks — your report was noted.</p>
      ) : (
        <>
          <p className="text-xs text-[#6B7280] line-clamp-2">Re: "{question}"</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's wrong with this question?"
            rows={4}
            className="w-full border border-[#E5E7EB] rounded-lg p-3 text-sm focus:outline-none focus:border-[#10B981]"
          />
          <button onClick={submitReport} disabled={!text.trim()} className="w-full bg-[#10B981] text-white font-bold text-xs uppercase py-2.5 rounded-lg disabled:opacity-50">
            Submit Report
          </button>
        </>
      )}
    </Modal>
  );
}