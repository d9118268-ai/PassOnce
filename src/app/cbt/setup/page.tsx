"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckSquare, Square, Play, Clock, Settings2 } from "lucide-react";

const SUBJECTS = [
  "English Language", "Mathematics", "Physics", "Chemistry", "Biology",
  "Economics", "Government", "Literature-in-English", "Financial Accounting",
  "Commerce", "Agricultural Science", "Geography"
];

export default function CBTSetup() {
  const [selectedExam, setSelectedExam] = useState("JAMB UTME");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["English Language"]);
  const [duration, setDuration] = useState("120");

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    } else {
      if (selectedExam === "JAMB UTME" && selectedSubjects.length >= 4) {
        alert("JAMB allows a maximum of 4 subjects.");
        return;
      }
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleStart = () => {
    if (selectedSubjects.length === 0) return alert("Select at least one subject.");
    // Passing configuration via URL to avoid local storage
    const params = new URLSearchParams({
      exam: selectedExam,
      time: duration,
      subs: selectedSubjects.join(",")
    });
    window.location.href = `/exam?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0A0E1A] font-sans flex flex-col">
      <header className="bg-[#FFFFFF] border-b border-[#E5E7EB] px-8 py-4 flex items-center gap-4 sticky top-0 z-50">
        <Link href="/dashboard" className="p-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:text-[#0A0E1A] transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="font-extrabold text-xl tracking-tight text-[#0A0E1A]">Exam Configuration</span>
      </header>

      <main className="max-w-4xl w-full mx-auto p-8 space-y-8 flex-1">
        
        {/* Step 1: Exam Type */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#0A0E1A] border-b border-[#E5E7EB] pb-2">
            <Settings2 className="w-5 h-5 text-[#10B981]" />
            <h2 className="text-lg font-bold uppercase tracking-wide">1. Select Examination</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["JAMB UTME", "WAEC SSCE", "NECO SSCE", "GCE O/L"].map((exam) => (
              <button
                key={exam}
                onClick={() => setSelectedExam(exam)}
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedExam === exam 
                    ? "border-[#10B981] bg-[#10B981]/10 text-[#0A0E1A]" 
                    : "border-[#E5E7EB] bg-[#FFFFFF] text-[#6B7280] hover:border-[#10B981] hover:text-[#0A0E1A]"
                }`}
              >
                {exam}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Subjects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
            <h2 className="text-lg font-bold uppercase tracking-wide text-[#0A0E1A]">2. Select Subjects</h2>
            <span className="text-xs font-medium text-[#6B7280]">
              Selected: <span className="font-bold text-[#0A0E1A]">{selectedSubjects.length}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SUBJECTS.map((sub) => {
              const isSelected = selectedSubjects.includes(sub);
              return (
                <div 
                  key={sub}
                  onClick={() => toggleSubject(sub)}
                  className={`p-3 border rounded-xl cursor-pointer flex items-center gap-2.5 text-xs transition ${
                    isSelected 
                      ? "bg-[#10B981]/10 border-[#10B981] text-[#0A0E1A] font-bold" 
                      : "bg-[#FFFFFF] border-[#E5E7EB] text-[#6B7280] font-medium hover:border-[#10B981] hover:text-[#0A0E1A]"
                  }`}
                >
                  {isSelected ? <CheckSquare className="w-4 h-4 text-[#10B981]" /> : <Square className="w-4 h-4 text-[#6B7280]" />}
                  <span className="truncate">{sub}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Timer & Start */}
        <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Clock className="w-5 h-5 text-[#10B981]" />
              <span className="text-sm font-bold uppercase">Duration:</span>
            </div>
            <select 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              className="border border-[#E5E7EB] bg-[#FFFFFF] rounded-lg p-2 text-sm font-bold text-[#0A0E1A] focus:outline-none focus:border-[#10B981]"
            >
              <option value="60">1 Hour</option>
              <option value="120">2 Hours</option>
              <option value="180">3 Hours</option>
            </select>
          </div>

          <button 
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#10B981] text-[#FFFFFF] rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-[#0A0E1A] transition shadow-sm"
          >
            Launch Engine <Play className="w-4 h-4 fill-current" />
          </button>
        </div>

      </main>
    </div>
  );
}