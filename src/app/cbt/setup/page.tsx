
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckSquare,
  Square,
  Play,
  Clock,
  Settings2,
  BookOpen,
} from "lucide-react";

const SUBJECTS = [
  "English Language",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature-in-English",
  "Financial Accounting",
  "Commerce",
  "Agricultural Science",
  "Geography",
];

const EXAMS = ["JAMB UTME", "WAEC SSCE", "NECO SSCE", "GCE O/L"];

export default function CBTSetup() {
  const [selectedExam, setSelectedExam] = useState("JAMB UTME");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    "English Language",
  ]);
  const [questionCounts, setQuestionCounts] = useState<
    Record<string, number>
  >({
    "English Language": 40,
  });
  const [duration, setDuration] = useState("120");

  const totalQuestions = useMemo(() => {
    return selectedSubjects.reduce(
      (total, subject) => total + (questionCounts[subject] || 0),
      0
    );
  }, [selectedSubjects, questionCounts]);

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects((previous) =>
        previous.filter((item) => item !== subject)
      );

      setQuestionCounts((previous) => {
        const next = { ...previous };
        delete next[subject];
        return next;
      });

      return;
    }

    if (selectedExam === "JAMB UTME" && selectedSubjects.length >= 4) {
      alert("JAMB allows a maximum of 4 subjects.");
      return;
    }

    setSelectedSubjects((previous) => [...previous, subject]);

    setQuestionCounts((previous) => ({
      ...previous,
      [subject]: 20,
    }));
  };

  const updateQuestionCount = (subject: string, value: string) => {
    const parsedValue = Number(value);

    if (value === "") {
      setQuestionCounts((previous) => ({
        ...previous,
        [subject]: 0,
      }));
      return;
    }

    const safeValue = Math.max(
      1,
      Math.min(100, Math.floor(parsedValue || 1))
    );

    setQuestionCounts((previous) => ({
      ...previous,
      [subject]: safeValue,
    }));
  };

  const handleStart = () => {
    if (selectedSubjects.length === 0) {
      alert("Select at least one subject.");
      return;
    }

    const invalidSubject = selectedSubjects.find(
      (subject) => !questionCounts[subject] || questionCounts[subject] < 1
    );

    if (invalidSubject) {
      alert(`Enter the number of questions for ${invalidSubject}.`);
      return;
    }

    if (totalQuestions < 1) {
      alert("Your total number of questions must be at least 1.");
      return;
    }

    const params = new URLSearchParams({
      exam: selectedExam,
      time: duration,
      subjects: selectedSubjects.join(","),
      counts: JSON.stringify(questionCounts),
      q: String(totalQuestions),
    });

    window.location.href = `/exam?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0A0E1A] font-sans flex flex-col">
      <header className="sticky top-0 z-50 flex items-center gap-4 border-b border-[#E5E7EB] bg-white px-4 py-4 sm:px-8">
        <Link
          href="/dashboard"
          className="rounded-lg border border-[#E5E7EB] p-2 text-[#6B7280] transition hover:border-[#10B981] hover:text-[#0A0E1A]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <p className="text-lg font-extrab800 font-extrabold tracking-tight">
            Exam Configuration
          </p>
          <p className="text-xs font-medium text-[#6B7280]">
            Choose your subjects and question count
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-4 sm:p-8">
        {/* Examination */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
            <Settings2 className="h-5 w-5 text-[#10B981]" />
            <h2 className="text-base font-bold uppercase tracking-wide sm:text-lg">
              1. Select Examination
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {EXAMS.map((exam) => (
              <button
                key={exam}
                type="button"
                onClick={() => setSelectedExam(exam)}
                className={`rounded-xl border p-3 text-xs font-bold transition ${
                  selectedExam === exam
                    ? "border-[#10B981] bg-[#10B981]/10 text-[#0A0E1A]"
                    : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#10B981]"
                }`}
              >
                {exam}
              </button>
            ))}
          </div>
        </section>

        {/* Subjects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h2 className="text-base font-bold uppercase tracking-wide sm:text-lg">
              2. Select Subjects
            </h2>

            <span className="text-xs font-medium text-[#6B7280]">
              Selected:{" "}
              <strong className="text-[#0A0E1A]">
                {selectedSubjects.length}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SUBJECTS.map((subject) => {
              const isSelected = selectedSubjects.includes(subject);

              return (
                <div
                  key={subject}
                  className={`rounded-xl border transition ${
                    isSelected
                      ? "border-[#10B981] bg-[#10B981]/5"
                      : "border-[#E5E7EB] bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    className="flex w-full items-center gap-2.5 p-3 text-left"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 shrink-0 text-[#10B981]" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-[#6B7280]" />
                    )}

                    <span
                      className={`truncate text-xs ${
                        isSelected
                          ? "font-bold text-[#0A0E1A]"
                          : "font-medium text-[#6B7280]"
                      }`}
                    >
                      {subject}
                    </span>
                  </button>

                  {isSelected && (
                    <div className="border-t border-[#10B981]/20 px-3 pb-3 pt-2">
                      <label className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                        <BookOpen className="h-3.5 w-3.5 text-[#10B981]" />
                        Number of Questions
                      </label>

                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={questionCounts[subject] || ""}
                        onChange={(event) =>
                          updateQuestionCount(subject, event.target.value)
                        }
                        className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-bold text-[#0A0E1A] outline-none transition focus:border-[#10B981]"
                      />

                      <p className="mt-1 text-[10px] font-medium text-[#6B7280]">
                        Choose between 1 and 100 questions.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Summary */}
        <section className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase text-[#6B7280]">
              Total Questions
            </span>

            <span className="text-xl font-black text-[#0A0E1A]">
              {totalQuestions}
            </span>
          </div>
        </section>

        {/* Duration and start */}
        <section className="flex flex-col gap-5 border-t border-[#E5E7EB] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#10B981]" />

            <label
              htmlFor="duration"
              className="text-xs font-bold uppercase text-[#6B7280]"
            >
              Duration
            </label>

            <select
              id="duration"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="rounded-lg border border-[#E5E7EB] bg-white p-2 text-sm font-bold text-[#0A0E1A] outline-none focus:border-[#10B981]"
            >
              <option value="30">30 Minutes</option>
              <option value="60">1 Hour</option>
              <option value="120">2 Hours</option>
              <option value="180">3 Hours</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] px-8 py-3.5 text-sm font-bold uppercase text-white shadow-sm transition hover:bg-[#0A0E1A] sm:w-auto"
          >
            Start Exam
            <Play className="h-4 w-4 fill-current" />
          </button>
        </section>
      </main>
    </div>
  );
}