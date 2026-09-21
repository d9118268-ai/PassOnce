"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/lib/supabase/client'
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  User,
  ArrowRight,
  ArrowLeft,
  BrainCircuit,
  Zap,
  Target,
  Award,
  Settings,
  Play,
  X,
  BookMarked,
  Bot,
  CheckSquare,
  Square,
  Sparkles,
  MessageCircle,
  Search,
  Send,
  Lock,
  AlertTriangle,
  Sun,
  Moon,
  Bell,
} from "lucide-react";
import { containsExplicitContent } from "@/lib/chat-filter";
import AiTutorTyping from "@/components/AiTutorTyping";
import PremiumStar from "@/components/PremiumStar";

type ChatUser = { id: string; username: string; displayName: string };


type ChatMessage = {
  id: number;
  from: "me" | "them";
  text: string;
};

const EXAM_SECTIONS = [
  {
    id: "jamb",
    name: "JAMB UTME",
    desc: "Unified Tertiary Matriculation Examination",
    subjects: [
      "Use of English", "Mathematics", "Physics", "Chemistry", "Biology",
      "Agricultural Science", "Economics", "Commerce", "Principles of Accounts",
      "Government", "Literature-in-English", "CRK", "IRS", "History",
      "Geography", "Home Economics", "Art", "Music", "Hausa", "Igbo", "Yoruba", "French", "Arabic"
    ]
  },
  {
    id: "waec",
    name: "WAEC SSCE",
    desc: "West African Senior School Certificate Examination",
    subjects: [
      "English Language", "General Mathematics", "Civic Education", "Data Processing",
      "Marketing", "Physics", "Chemistry", "Biology", "Further Mathematics",
      "Agricultural Science", "Financial Accounting", "Commerce", "Economics",
      "Government", "Literature-in-English", "CRS", "IRS", "Geography",
      "Hausa", "Igbo", "Yoruba", "French"
    ]
  },
  {
    id: "neco",
    name: "NECO SSCE",
    desc: "National Examinations Council (Senior Secondary)",
    subjects: [
      "English Language", "General Mathematics", "Civic Education", "Data Processing",
      "Physics", "Chemistry", "Biology", "Agricultural Science", "Financial Accounting",
      "Commerce", "Economics", "Government", "Literature-in-English", "CRS", "IRS",
      "Geography", "Office Practice", "Bookkeeping"
    ]
  },
  {
    id: "gce",
    name: "GCE O/L",
    desc: "General Certificate of Education (Private Candidates)",
    subjects: [
      "English Language", "Mathematics", "Civic Education", "Physics", "Chemistry",
      "Biology", "Agricultural Science", "Economics", "Commerce", "Financial Accounting",
      "Government", "Literature-in-English", "CRS", "IRS"
    ]
  },
  {
    id: "bece",
    name: "BECE (JSS3)",
    desc: "Basic Education Certificate Examination",
    subjects: [
      "Mathematics", "English Studies", "Basic Science & Technology", "Pre-Vocational Studies",
      "Cultural & Creative Arts", "National Value Education", "Business Studies",
      "Hausa", "Yoruba", "Igbo", "French"
    ]
  }
];

type MainView = "dashboard" | "practice";
type PracticeTab = "cbt" | "ai";
export type RecentAttemptRow = {
  id: string;
  exam: string;
  score: string;
  date: string;
  status: "Excellent" | "Good" | "Abandoned" | "Needs Work";
  totalQuestions: number;
  timeSpentSeconds: number;
  subjectBreakdown: Record<string, { correct: number; total: number }>;
};

export type DashboardProfile = {
  fullName: string;
  username: string;
  subscriptionStatus: "free" | "premium";
};

export type DashboardStats = {
  iqRate: number | null; // gamified composite score, null when there's no data yet — NOT a real IQ measurement
  speedPerMin: number | null; // correct answers per minute, averaged across recent attempts
  accuracyPct: number | null; // average score %, null when there's no data yet
};

type DashboardClientProps = {
  profile: DashboardProfile;
  stats: DashboardStats;
  recentAttempts: RecentAttemptRow[];
};

export default function DashboardClient({ profile, stats, recentAttempts }: DashboardClientProps) {
  const router = useRouter();
  const isPremium = profile.subscriptionStatus === "premium";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Which panel the main content area shows
  const [mainView, setMainView] = useState<MainView>("dashboard");
  const [practiceTab, setPracticeTab] = useState<PracticeTab>("cbt");
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<RecentAttemptRow | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Reading localStorage must happen after mount (it doesn't exist during
    // SSR), so this synchronous setState-on-mount is intentional — doing it
    // any other way risks a hydration mismatch instead.
    const stored = localStorage.getItem("passonce-theme");
    const isDark = stored === "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("passonce-theme", next ? "dark" : "light");
  };
  const [tutorMessages, setTutorMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorLimitReached, setTutorLimitReached] = useState(false);

  const sendTutorMessage = async () => {
    if (!tutorInput.trim() || tutorLoading) return;
    const userMsg = { role: "user" as const, content: tutorInput.trim() };
    setTutorMessages((m) => [...m, userMsg]);
    setTutorInput("");
    setTutorLoading(true);
    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();
      if (res.status === 429 || data.limitReached) {
        setTutorLimitReached(true);
        setTutorMessages((m) => [...m, { role: "assistant", content: data.error || "Your free AI Tutor limit has been reached for today." }]);
      } else if (!res.ok) {
        setTutorMessages((m) => [...m, { role: "assistant", content: data.error || "Sorry, I couldn't get an answer just now." }]);
      } else {
        setTutorMessages((m) => [...m, { role: "assistant", content: data.reply || "Sorry, I couldn't get an answer just now." }]);
      }
    } catch {
      setTutorMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't get an answer just now." }]);
    } finally {
      setTutorLoading(false);
    }
  };

  const FREE_DAILY_MESSAGE_LIMIT = 2;
  const [messagesSentToday, setMessagesSentToday] = useState(0);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{id:string;title:string;body:string;read:boolean;created_at:string}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasResumeDraft, setHasResumeDraft] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      setCurrentUserId(user.id);
      const [{ data: users }, { data: notes }] = await Promise.all([
        supabase.from("profiles").select("id, username, full_name").neq("id", user.id).order("username").limit(50),
        supabase.from("notifications").select("id, title, body, read, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ]);
      if (mounted) {
        setChatUsers((users || []).map((u) => ({ id: u.id, username: u.username || "", displayName: u.full_name || u.username || "Student" })));
        setNotifications(notes || []);
      }
    })();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage read, see comment above
    setHasResumeDraft(Boolean(localStorage.getItem("passonce-exam-draft")));
    return () => { mounted = false; };
  }, []);

  // Chat panel — messages live only in memory (per the no-local-storage /
  // ephemeral-chat policy): nothing here is written to localStorage or a
  // backend, so a refresh or leaving the app clears everything.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [activeChatUsername, setActiveChatUsername] = useState<string | null>(null);
  const [chatThreads, setChatThreads] = useState<Record<string, ChatMessage[]>>({});
  const [messageDraft, setMessageDraft] = useState("");

  useEffect(() => {
    if (!activeChatUsername || !currentUserId) return;
    const other = chatUsers.find((u) => u.username === activeChatUsername);
    if (!other) return;
    const supabase = createClient();
    const channelName = ["passonce-chat", ...[currentUserId, other.id].sort()].join(":");
    const channel = supabase.channel(channelName);
    channel.on("broadcast", { event: "message" }, ({ payload }) => {
      if (payload.senderId === currentUserId) return;
      const incoming: ChatMessage = { id: Date.now(), from: "them", text: String(payload.text || "") };
      setChatThreads((prev) => ({ ...prev, [activeChatUsername]: [...(prev[activeChatUsername] || []), incoming] }));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChatUsername, currentUserId, chatUsers]);

  const [blockedNotice, setBlockedNotice] = useState(false);
  const messageLimitReached = !isPremium && messagesSentToday >= FREE_DAILY_MESSAGE_LIMIT;
  const [limitReachedNotice, setLimitReachedNotice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChatUser = chatUsers.find((u) => u.username === activeChatUsername) || null;
  const activeThread = activeChatUsername ? chatThreads[activeChatUsername] || [] : [];

  const filteredDirectory = chatSearch.trim()
    ? chatUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(chatSearch.trim().toLowerCase()) ||
          u.displayName.toLowerCase().includes(chatSearch.trim().toLowerCase())
      )
    : chatUsers;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread.length, chatOpen]);

  const openChatWith = (username: string) => {
    setActiveChatUsername(username);
    setBlockedNotice(false);
    setLimitReachedNotice(false);
  };

  const closeChatPanel = () => {
    setChatOpen(false);
    setActiveChatUsername(null);
    setChatSearch("");
    setBlockedNotice(false);
    setLimitReachedNotice(false);
  };

  const sendMessage = async () => {
    const text = messageDraft.trim();
    if (!text || !activeChatUsername) return;

    // Free tier: capped at FREE_DAILY_MESSAGE_LIMIT messages.
    // NOTE: this counter lives in React state only, so it really resets
    // per session rather than per calendar day right now — true daily
    // enforcement needs a per-user counter in Supabase (Phase 2).
    if (!isPremium && messagesSentToday >= FREE_DAILY_MESSAGE_LIMIT) {
      setLimitReachedNotice(true);
      return;
    }

    if (containsExplicitContent(text)) {
      setBlockedNotice(true);
      return;
    }

    setBlockedNotice(false);
    setLimitReachedNotice(false);
    const newMessage: ChatMessage = { id: Date.now(), from: "me", text };
    setChatThreads((prev) => ({
      ...prev,
      [activeChatUsername]: [...(prev[activeChatUsername] || []), newMessage],
    }));
    setMessageDraft("");
    if (!isPremium) setMessagesSentToday((n) => n + 1);

    if (!currentUserId || !activeChatUser) return;
    const supabase = createClient();
    const channelName = ["passonce-chat", ...[currentUserId, activeChatUser.id].sort()].join(":");
    const channel = supabase.channel(channelName);
    await channel.subscribe();
    await channel.send({ type: "broadcast", event: "message", payload: { senderId: currentUserId, text } });
    supabase.removeChannel(channel);
  };

  // Exam / subject selection state (from the CBT setup screen)
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [examMode, setExamMode] = useState<"Practice" | "Study" | "Mock">("Practice");
  const [difficulty, setDifficulty] = useState<"Easy" | "Normal" | "Hard" | "Mindbender">("Normal");
  const [durationMins, setDurationMins] = useState(60);
  const [questionCount, setQuestionCount] = useState(40);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showFreeWarning, setShowFreeWarning] = useState(false);

  // Premium status is declared once, near the top of the component
  // (used by both the chat and exam-setup gating below).
  const FREE_DIFFICULTY: typeof difficulty = "Normal";
  const FREE_DURATION = 60;
  const FREE_QUESTION_COUNT = 40;

  const activeExam = EXAM_SECTIONS.find((e) => e.id === activeExamId);

  const resumeExam = () => {
    try {
      const draft = JSON.parse(localStorage.getItem("passonce-exam-draft") || "null");
      if (!draft?.examId) return;
      const params = new URLSearchParams({
        exam: draft.examId,
        subjects: (draft.subjects || []).join(","),
        mode: draft.mode || "Practice",
        diff: draft.difficulty || "Normal",
        time: String(draft.durationMins || 60),
        q: String(draft.questionCount || 40),
        sq: String(draft.shuffleQuestions !== false),
        so: String(draft.shuffleOptions !== false),
      });
      window.location.href = `/exam?${params.toString()}`;
    } catch {
      localStorage.removeItem("passonce-exam-draft");
      setHasResumeDraft(false);
    }
  };

  const goToPractice = () => {
    setMainView("practice");
    setPracticeTab("cbt");
  };

  const openExamModal = (examId: string) => {
    const exam = EXAM_SECTIONS.find((e) => e.id === examId);
    setActiveExamId(examId);
    if (exam && exam.subjects.length > 0) {
      setSelectedSubjects(
        isPremium ? [exam.subjects[0], exam.subjects[1] || exam.subjects[0]] : [exam.subjects[0]]
      );
    }
    if (!isPremium) {
      setDifficulty(FREE_DIFFICULTY);
      setDurationMins(FREE_DURATION);
      setQuestionCount(FREE_QUESTION_COUNT);
    }
  };

  const toggleSubject = (subject: string) => {
    if (!isPremium) {
      // Free tier: single subject only — picking a new one replaces the old pick.
      setSelectedSubjects([subject]);
      return;
    }
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleStartExam = () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject.");
      return;
    }
    setShowFreeWarning(false);
    const subjectsParam = encodeURIComponent(selectedSubjects.join(","));
    window.location.href = `/exam?exam=${activeExamId}&subjects=${subjectsParam}&mode=${examMode}&diff=${difficulty}&time=${durationMins}&q=${questionCount}&sq=${shuffleQuestions}&so=${shuffleOptions}`;
  };

  const handleStartExamClick = () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject.");
      return;
    }
    if (isPremium) {
      handleStartExam();
    } else {
      setShowFreeWarning(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0A0E1A] font-sans flex flex-col">

      {/* Top Icon Nav — replaces the old sidebar; works the same on every screen size */}
<header className="bg-[#065F46] border-b border-[#064E3B] shadow-md px-3 sm:px-6 py-2 sticky top-0 z-30">        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
<div className="w-9 h-9 rounded-full bg-white border border-white/40 flex items-center justify-center overflow-hidden shadow-sm">
  <Image src="/header-logo.png" alt="PassOnce logo" width={26} height={26} className="object-contain" />
</div>
<span className="font-extrabold text-sm tracking-tight hidden sm:inline text-white">PassOnce</span>
          </div>

          <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
            <TopNavIcon icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active={mainView === "dashboard"} onClick={() => setMainView("dashboard")} />
            <TopNavIcon icon={<BookOpen className="w-4 h-4" />} label="Practice" active={mainView === "practice" && practiceTab === "cbt"} onClick={goToPractice} />
            <TopNavIcon icon={<Bot className="w-4 h-4" />} label="AI Tutor" active={mainView === "practice" && practiceTab === "ai"} onClick={() => { setMainView("practice"); setPracticeTab("ai"); }} />
            <TopNavIcon icon={<BarChart2 className="w-4 h-4" />} label="Performance" onClick={() => router.push("/analytics")} />
            <TopNavIcon icon={<MessageCircle className="w-4 h-4" />} label="Messages" onClick={() => setChatOpen(true)} />
            <TopNavIcon icon={<BookMarked className="w-4 h-4" />} label="Dictionary" onClick={() => setShowDictionary(true)} />
            <TopNavIcon icon={<User className="w-4 h-4" />} label="Profile" onClick={() => router.push("/profile")} />
          </nav>

          <div className="flex items-center gap-1 shrink-0 relative">
            <button onClick={() => setShowNotifications((s) => !s)} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition relative" aria-label="Notifications">
              <Bell className="w-4 h-4" />
              {notifications.some((n) => !n.read) && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400" />}
            </button>
            {showNotifications && (
              <div className="absolute right-12 top-full mt-2 w-72 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-xs font-black uppercase">Notifications</span>
                  <button onClick={async () => {
                    const supabase = createClient();
                    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
                    if (unread.length) await supabase.from("notifications").update({ read: true }).in("id", unread);
                    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
                  }} className="text-[10px] font-bold text-[#10B981]">Mark read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? <p className="p-6 text-xs text-[#6B7280] text-center">No notifications yet.</p> :
                    notifications.map((n) => <div key={n.id} className="px-4 py-3 border-b border-[#E5E7EB] last:border-0">
                      <p className="text-xs font-bold text-[#0A0E1A]">{n.title}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">{n.body}</p>
                    </div>)}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 relative">
            <button
              onClick={() => setShowSettingsMenu((s) => !s)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            {showSettingsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#0A0E1A] hover:bg-[#F9FAFB] transition"
                  >
                    <span className="flex items-center gap-2">{darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />} {darkMode ? "Dark" : "Light"} Mode</span>
                    <span className={`w-8 h-4.5 rounded-full p-0.5 transition ${darkMode ? "bg-[#10B981]" : "bg-[#E5E7EB]"}`}>
                      <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${darkMode ? "translate-x-3.5" : ""}`} />
                    </span>
                  </button>
                  <button
                    onClick={() => router.push("/profile")}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#0A0E1A] hover:bg-[#F9FAFB] transition border-t border-[#E5E7EB]"
                  >
                    Account Settings
                  </button>
                  <button
                    onClick={() => router.push("/saved")}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#0A0E1A] hover:bg-[#F9FAFB] transition border-t border-[#E5E7EB]"
                  >
                    Saved Questions
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition border-t border-[#E5E7EB]"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">


        {/* ---------------- DASHBOARD VIEW ---------------- */}
        {mainView === "dashboard" && (
          <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">

            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#0A0E1A] flex items-center gap-2">
                  <span>Welcome back, {profile.fullName.split(" ")[0] || profile.username}!</span>
                  {isPremium && <PremiumStar size={22} />}
                </h1>
                <p className="text-sm text-[#6B7280] mt-1">Ready to crush your next examination?</p>
              </div>
              <button
                onClick={goToPractice}
                className="bg-[#10B981] text-[#FFFFFF] px-5 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0A0E1A] transition shadow-sm"
              >
                Start New Practice <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {hasResumeDraft && (
              <div className="flex items-center justify-between gap-4 bg-white border border-[#10B981]/30 rounded-2xl p-4 shadow-sm">
                <div>
                  <p className="text-sm font-black text-[#0A0E1A]">You have an unfinished exam</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Your answers, timer, bookmarks, and position were saved.</p>
                </div>
                <button onClick={resumeExam} className="shrink-0 px-4 py-2.5 bg-[#10B981] text-white rounded-lg text-xs font-bold hover:bg-[#0A0E1A] transition">Resume</button>
              </div>
            )}

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-[#10B981]/10 rounded-xl text-[#10B981]">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280] uppercase">IQ Rate</p>
                  <h3 className="text-2xl font-black text-[#0A0E1A] mt-1">
                    {stats.iqRate === null ? "—" : stats.iqRate}
                  </h3>
                </div>
              </div>
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280] uppercase">Speed</p>
                  <h3 className="text-2xl font-black text-[#0A0E1A] mt-1">
                    {stats.speedPerMin === null ? "—" : `${stats.speedPerMin}/min`}
                  </h3>
                </div>
              </div>
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6B7280] uppercase">Accuracy</p>
                  <h3 className="text-2xl font-black text-[#0A0E1A] mt-1">
                    {stats.accuracyPct === null ? "—" : `${stats.accuracyPct}%`}
                  </h3>
                </div>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
                <h2 className="text-base font-bold text-[#0A0E1A] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#10B981]" /> Recent Sessions
                </h2>
                <Link href="/analytics" className="text-xs font-bold text-[#10B981] hover:text-[#0A0E1A] transition">
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] text-xs uppercase text-[#6B7280] font-bold border-b border-[#E5E7EB]">
                      <th className="px-6 py-3">Examination</th>
                      <th className="px-6 py-3">Score</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-xs font-semibold text-[#6B7280]">
                          No practice sessions yet — start one above to see it here.
                        </td>
                      </tr>
                    ) : (
                      recentAttempts.map((session) => (
                        <tr
                          key={session.id}
                          onClick={() => setSelectedAttempt(session)}
                          className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition cursor-pointer"
                        >
                          <td className="px-6 py-4 font-bold text-[#0A0E1A]">{session.exam}</td>
                          <td className="px-6 py-4 font-medium text-[#6B7280]">{session.score}</td>
                          <td className="px-6 py-4 text-[#6B7280] text-xs">{session.date}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              session.status === "Excellent" ? "bg-[#10B981]/10 text-[#10B981]" :
                              session.status === "Good" ? "bg-blue-50 text-blue-600" :
                              "bg-red-50 text-red-600"
                            }`}>
                              {session.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ---------------- PRACTICE / EXAM-SELECTION VIEW ---------------- */}
        {mainView === "practice" && (
          <div className="max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">

            {/* Sub-header: back button on the left, CBT/AI tabs centered */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[#E5E7EB] pb-4">
              <button
                onClick={() => setMainView("dashboard")}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0A0E1A] hover:bg-[#E5E7EB]/50 transition shrink-0"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <nav className="flex items-center justify-center gap-4 sm:gap-6 text-sm font-semibold">
                <button
                  onClick={() => setPracticeTab("cbt")}
                  className={practiceTab === "cbt" ? "text-[#0A0E1A] font-bold border-b-2 border-[#10B981] pb-1" : "text-[#6B7280] hover:text-[#0A0E1A]"}
                >
                  CBT
                </button>
              </nav>

              <span className="shrink-0" />
            </div>

            {practiceTab === "cbt" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black text-[#0A0E1A] uppercase tracking-wide">Select Exam Category</h1>
                  <p className="text-sm font-normal text-[#6B7280] mt-1">
                    Choose an examination body to select subjects and start your practice test.
                  </p>
                </div>

                {/* Exam Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {EXAM_SECTIONS.map((exam) => (
                    <div
                      key={exam.id}
                      onClick={() => openExamModal(exam.id)}
                      className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-6 hover:border-[#10B981] hover:border-t-4 cursor-pointer transition flex flex-col justify-between space-y-6 group shadow-sm hover:shadow-md"
                    >
                      <div className="space-y-3">
                        <span className="inline-block text-xs font-bold bg-[#10B981]/10 text-[#10B981] px-2.5 py-1 rounded-md uppercase">
                          {exam.id.toUpperCase()}
                        </span>
                        <h2 className="text-xl font-bold text-[#0A0E1A]">{exam.name}</h2>
                        <p className="text-xs font-normal text-[#6B7280] leading-relaxed">{exam.desc}</p>
                      </div>

                      <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6B7280]">{exam.subjects.length} Subjects Available</span>
                        <button className="bg-[#10B981] text-[#FFFFFF] font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#0A0E1A] transition">
                          Select <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {practiceTab === "ai" && (
              <div className="max-w-2xl mx-auto border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 bg-[#FFFFFF] shadow-sm space-y-5">
                <div className="text-center space-y-1.5">
                  <Sparkles className="w-8 h-8 text-[#10B981] mx-auto" />
                  <h2 className="text-xl font-bold text-[#0A0E1A] uppercase">PassOnce AI Interactive Tutor</h2>
                  <p className="text-xs text-[#6B7280]">Ask about any topic, subject, or concept — no timed exam constraints.</p>
                </div>

                <>
                  {!isPremium && (
                    <div className="flex items-center justify-between gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-xs">
                      <span className="font-semibold text-[#6B7280]">Free plan: 1 AI Tutor message per day.</span>
                      <Link href="/subscribe" className="text-[#10B981] font-bold underline">Upgrade</Link>
                    </div>
                  )}
                  <div className="max-h-80 overflow-y-auto space-y-2 border border-[#E5E7EB] rounded-xl p-4 bg-[#F9FAFB]">
                    {tutorMessages.length === 0 && (
                      <p className="text-xs text-[#6B7280] text-center py-6">Ask your first question to get started.</p>
                    )}
                    {tutorMessages.map((m, i) => (
                      <div key={i} className={`max-w-[85%] px-3.5 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-[#10B981] text-white ml-auto" : "bg-[#FFFFFF] border border-[#E5E7EB]"}`}>
                        {m.content}
                      </div>
                    ))}
                    {tutorLoading && <AiTutorTyping />}
                  </div>
                  {tutorLimitReached && (
                    <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs">
                      <span className="font-semibold text-amber-800">You&apos;ve used your free AI message for today.</span>
                      <Link href="/subscribe" className="shrink-0 px-4 py-2 bg-red-600 text-white rounded-lg font-bold uppercase hover:bg-red-700 transition">Upgrade</Link>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input value={tutorInput} onChange={(e) => setTutorInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendTutorMessage()} placeholder="Ask a question…" className="flex-1 border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#10B981]" disabled={tutorLimitReached} />
                    <button onClick={sendTutorMessage} disabled={tutorLimitReached || tutorLoading} className="w-11 h-11 shrink-0 flex items-center justify-center bg-[#10B981] text-white rounded-lg hover:bg-[#0A0E1A] transition disabled:opacity-40" aria-label="Send">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Messages Panel — ephemeral, in-memory only, closes and clears when the panel/app closes */}
      {chatOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[#0A0E1A]/50" onClick={closeChatPanel} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#FFFFFF] shadow-2xl flex flex-col">

            {/* Panel Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#E5E7EB] shrink-0">
              <div className="flex items-center gap-2">
                {activeChatUser ? (
                  <button
                    onClick={() => setActiveChatUsername(null)}
                    className="p-1.5 -ml-1.5 rounded-lg text-[#6B7280] hover:text-[#0A0E1A] hover:bg-[#E5E7EB]/50 transition"
                    aria-label="Back to search"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <MessageCircle className="w-5 h-5 text-[#10B981]" />
                )}
                <span className="font-bold text-sm text-[#0A0E1A]">
                  {activeChatUser ? activeChatUser.displayName : "Messages"}
                </span>
              </div>
              <button
                onClick={closeChatPanel}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0A0E1A] hover:bg-[#E5E7EB]/50 transition"
                aria-label="Close messages"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ephemeral notice */}
            <div className="px-5 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                Live chat via Supabase Realtime — messages are ephemeral and not stored.
              </p>
            </div>

            {!activeChatUser ? (
              <>
                {/* Username Search */}
                <div className="p-4 border-b border-[#E5E7EB] shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Search for a username…"
                      className="w-full border border-[#E5E7EB] rounded-lg py-2.5 pl-9 pr-3 text-sm text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                    />
                  </div>
                </div>

                {/* Directory Results */}
                <div className="flex-1 overflow-y-auto">
                  {filteredDirectory.length === 0 ? (
                    <p className="text-xs text-[#6B7280] text-center py-10">No users found.</p>
                  ) : (
                    filteredDirectory.map((u) => (
                      <button
                        key={u.username}
                        onClick={() => openChatWith(u.username)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F9FAFB] transition text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-xs font-black shrink-0">
                          {u.displayName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#0A0E1A] truncate">{u.displayName}</p>
                          <p className="text-xs text-[#6B7280] truncate">@{u.username}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeThread.length === 0 && (
                    <p className="text-xs text-[#6B7280] text-center py-10">
                      Say hi to @{activeChatUser.username} — nothing you send here is stored.
                    </p>
                  )}
                  {activeThread.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                        msg.from === "me"
                          ? "bg-[#10B981] text-[#FFFFFF] ml-auto rounded-br-sm"
                          : "bg-[#F9FAFB] border border-[#E5E7EB] text-[#0A0E1A] rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="p-4 border-t border-[#E5E7EB] shrink-0 space-y-2">
                  {!isPremium && (
                    <p className="text-[10px] font-semibold text-[#6B7280] uppercase">
                      Free plan: {Math.max(FREE_DAILY_MESSAGE_LIMIT - messagesSentToday, 0)} of {FREE_DAILY_MESSAGE_LIMIT} messages left today
                    </p>
                  )}
                  {blockedNotice && (
                    <p className="text-[11px] font-semibold text-red-600">
                      Message blocked — that language isn&apos;t allowed here.
                    </p>
                  )}
                  {limitReachedNotice && (
                    <p className="text-[11px] font-semibold text-amber-600">
                      Daily message limit reached.{" "}
                      <a href="/subscribe" className="underline">Upgrade for ₦500/year</a> to message without limits.
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageDraft}
                      onChange={(e) => {
                        setMessageDraft(e.target.value);
                        if (blockedNotice) setBlockedNotice(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage();
                      }}
                      disabled={messageLimitReached}
                      placeholder={messageLimitReached ? "Daily limit reached" : "Type a message…"}
                      className="flex-1 border border-[#E5E7EB] rounded-lg py-2.5 px-3.5 text-sm text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981] disabled:bg-[#F9FAFB] disabled:text-[#6B7280]"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageDraft.trim() || messageLimitReached}
                      className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#10B981] text-[#FFFFFF] rounded-lg hover:bg-[#0A0E1A] transition disabled:opacity-40 disabled:pointer-events-none"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Free-Tier Warning Modal — shown when a non-premium user presses Start */}
      {showFreeWarning && (
        <div className="fixed inset-0 bg-[#0A0E1A]/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-[#FFFFFF] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-black text-sm uppercase">Warning</h3>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              You&apos;ll continue seeing the same practice questions as before. Subscribing for{" "}
              <span className="font-bold text-[#0A0E1A]">₦500</span> unlocks more — different questions every
              time, detailed explanations, and your own choice of time limit, question count, and difficulty.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                onClick={handleStartExam}
                className="px-5 py-2.5 bg-[#10B981] text-[#FFFFFF] rounded-lg font-bold text-xs uppercase hover:bg-emerald-600 transition"
              >
                Continue
              </button>
              <button
                onClick={() => (window.location.href = "/subscribe")}
                className="relative overflow-hidden px-5 py-2.5 bg-red-600 text-[#FFFFFF] rounded-lg font-bold text-xs uppercase hover:bg-red-700 transition shadow-[0_0_18px_rgba(220,38,38,0.45)]"
              >
                <span className="relative z-10">Subscribe</span>
                <span className="shine-sweep" />
              </button>
            </div>
          </div>
          <style jsx>{`
            .shine-sweep {
              position: absolute;
              top: 0;
              left: -75%;
              width: 50%;
              height: 100%;
              background: linear-gradient(
                120deg,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.75) 50%,
                rgba(255, 255, 255, 0) 100%
              );
              transform: skewX(-20deg);
              animation: shine-sweep 2.2s ease-in-out infinite;
            }
            @keyframes shine-sweep {
              0% {
                left: -75%;
              }
              60% {
                left: 130%;
              }
              100% {
                left: 130%;
              }
            }
          `}</style>
        </div>
      )}

      {/* Subject Selection Modal (shared across views, opened from the exam cards above) */}
      {activeExam && (
        <div className="fixed inset-0 bg-[#0A0E1A]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] flex flex-col shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <span className="text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-md uppercase">
                  {activeExam.id.toUpperCase()} Configuration
                </span>
                <h2 className="text-xl font-bold text-[#0A0E1A] mt-1.5">{activeExam.name} - Select Subjects</h2>
              </div>
              <button
                onClick={() => setActiveExamId(null)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0A0E1A] hover:bg-[#E5E7EB]/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A0E1A] uppercase">Available Subjects ({selectedSubjects.length} Selected):</span>
                  {!isPremium && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase">
                      <Lock className="w-3 h-3" /> Free plan: 1 subject
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeExam.subjects.map((sub) => {
                    const isSelected = selectedSubjects.includes(sub);
                    return (
                      <div
                        key={sub}
                        onClick={() => toggleSubject(sub)}
                        className={`p-3 border rounded-xl cursor-pointer flex items-center gap-2.5 text-xs font-medium transition ${
                          isSelected
                            ? "bg-[#10B981]/10 border-[#10B981] text-[#0A0E1A] font-bold"
                            : "bg-[#FFFFFF] border-[#E5E7EB] text-[#6B7280] hover:border-[#10B981] hover:text-[#0A0E1A]"
                        }`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-[#10B981]" /> : <Square className="w-4 h-4 text-[#6B7280]" />}
                        <span className="truncate">{sub}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exam Options Box */}
              <div className="border border-[#E5E7EB] rounded-xl p-4 space-y-4 bg-[#FFFFFF]">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                  <span className="text-xs font-bold text-[#0A0E1A] uppercase">
                    Exam Parameters
                  </span>
                  {!isPremium && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase">
                      <Lock className="w-3 h-3" /> Fixed on free plan
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[#6B7280] font-medium block mb-1">Select Mode</label>
                    <select
                      value={examMode}
                      onChange={(e) => setExamMode(e.target.value as "Practice" | "Study" | "Mock")}
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-2 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981]"
                    >
                      <option value="Practice">Practice (Instant Marks)</option>
                      <option value="Study">Study (Explanations Enabled)</option>
                      <option value="Mock">Mock (Strict Timed Test)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[#6B7280] font-medium block mb-1 flex items-center gap-1">
                      Difficulty Level {!isPremium && <Lock className="w-3 h-3 text-amber-600" />}
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as "Easy" | "Normal" | "Hard" | "Mindbender")}
                      disabled={!isPremium}
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-2 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Normal">Normal</option>
                      <option value="Hard">Hard</option>
                      <option value="Mindbender">Mindbender</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[#6B7280] font-medium block mb-1 flex items-center gap-1">
                        Questions {!isPremium && <Lock className="w-3 h-3 text-amber-600" />}
                      </label>
                      <input
                        type="number"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        disabled={!isPremium}
                        className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-2 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-[#6B7280] font-medium block mb-1 flex items-center gap-1">
                        Time (Mins) {!isPremium && <Lock className="w-3 h-3 text-amber-600" />}
                      </label>
                      <input
                        type="number"
                        value={durationMins}
                        onChange={(e) => setDurationMins(Number(e.target.value))}
                        disabled={!isPremium}
                        className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-2 text-[#0A0E1A] font-medium focus:outline-none focus:border-[#10B981] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 text-xs font-medium pt-3 border-t border-[#E5E7EB]">
                  <label className="flex items-center gap-2 cursor-pointer text-[#6B7280] hover:text-[#0A0E1A]">
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="accent-[#10B981] w-4 h-4 rounded"
                    />
                    <span>Shuffle Questions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[#6B7280] hover:text-[#0A0E1A]">
                    <input
                      type="checkbox"
                      checked={shuffleOptions}
                      onChange={(e) => setShuffleOptions(e.target.checked)}
                      className="accent-[#10B981] w-4 h-4 rounded"
                    />
                    <span>Shuffle Options</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3">
              <button
                onClick={() => setActiveExamId(null)}
                className="px-5 py-2.5 border border-[#E5E7EB] rounded-lg text-[#6B7280] font-bold text-xs uppercase hover:text-[#0A0E1A] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExamClick}
                className="px-6 py-2.5 bg-[#10B981] text-[#FFFFFF] rounded-lg font-bold text-xs uppercase flex items-center gap-2 hover:bg-[#0A0E1A] transition shadow-sm"
              >
                Start Practice Exam <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>

          </div>
        </div>
      )}

      {showDictionary && <DictionaryModal onClose={() => setShowDictionary(false)} />}
      {selectedAttempt && <AttemptDetailModal attempt={selectedAttempt} onClose={() => setSelectedAttempt(null)} />}

    </div>
  );
}

function TopNavIcon({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition ${
        active ? "bg-white/15 text-white" : "text-white/80 hover:text-white hover:bg-white/10"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function ModalShell({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-[#0A0E1A]/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`bg-[#FFFFFF] rounded-2xl p-6 w-full space-y-4 shadow-2xl ${wide ? "max-w-lg" : "max-w-sm"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function DictionaryModal({ onClose }: { onClose: () => void }) {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ partOfSpeech: string; definition: string; example?: string } | null>(null);

  const search = async () => {
    if (!word.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() }),
      });
      if (!res.ok) throw new Error("lookup failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Couldn't find a definition for that word.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase flex items-center gap-2"><BookMarked className="w-4 h-4 text-[#10B981]" /> Dictionary</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-[#6B7280]" /></button>
      </div>
      <div className="flex gap-2">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Type a word…"
          className="flex-1 border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#10B981]"
        />
        <button onClick={search} className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#10B981] text-white rounded-lg"><Search className="w-4 h-4" /></button>
      </div>
      {loading && <p className="text-xs text-[#6B7280]">Searching…</p>}
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
      {result && (
        <div className="text-sm space-y-1">
          <p className="text-xs font-bold text-[#10B981] uppercase">{result.partOfSpeech}</p>
          <p className="text-[#0A0E1A]">{result.definition}</p>
          {result.example && <p className="text-xs text-[#6B7280] italic">&quot;{result.example}&quot;</p>}
        </div>
      )}
    </ModalShell>
  );
}

const SUBJECT_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"];

function AttemptDetailModal({ attempt, onClose }: { attempt: RecentAttemptRow; onClose: () => void }) {
  const [format, setFormat] = useState<"pie" | "trend" | "slip">("pie");
  const subjects = Object.entries(attempt.subjectBreakdown || {});
  const totalTimeLabel = attempt.timeSpentSeconds
    ? attempt.timeSpentSeconds >= 60
      ? `${Math.floor(attempt.timeSpentSeconds / 60)}m ${attempt.timeSpentSeconds % 60}s`
      : `${attempt.timeSpentSeconds}s`
    : "—";

  // Pie chart: each subject's share of total correct answers
  const totalCorrect = subjects.reduce((sum, [, v]) => sum + v.correct, 0) || 1;
  let cumulativeAngle = 0;
  const pieSlices = subjects.map(([name, v], i) => {
    const fraction = v.correct / totalCorrect;
    const startAngle = cumulativeAngle;
    cumulativeAngle += fraction * 360;
    return { name, fraction, startAngle, endAngle: cumulativeAngle, color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] };
  });

  function arcPath(startAngle: number, endAngle: number, r = 45, cx = 50, cy = 50) {
    const toXY = (angle: number) => {
      const rad = ((angle - 90) * Math.PI) / 180;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };
    const [x1, y1] = toXY(startAngle);
    const [x2, y2] = toXY(endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase">{attempt.exam} — {attempt.date}</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-[#6B7280]" /></button>
      </div>

      <div className="flex items-center gap-2">
        {(["pie", "trend", "slip"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
              format === f ? "bg-[#0A0E1A] text-white" : "bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]"
            }`}
          >
            {f === "pie" ? "Pie Chart" : f === "trend" ? "Trend" : "Slip"}
          </button>
        ))}
      </div>

      {subjects.length === 0 ? (
        <p className="text-xs text-[#6B7280] py-6 text-center">No subject-level detail was recorded for this attempt.</p>
      ) : format === "pie" ? (
        <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
          <svg width="160" height="160" viewBox="0 0 100 100">
            {pieSlices.map((s) => (
              <path key={s.name} d={arcPath(s.startAngle, s.endAngle)} fill={s.color} stroke="#FFFFFF" strokeWidth="1">
                <title>{`${s.name}: ${Math.round(s.fraction * 100)}%`}</title>
              </path>
            ))}
          </svg>
          <div className="space-y-1.5 text-xs">
            {pieSlices.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="font-semibold text-[#0A0E1A]">{s.name}</span>
                <span className="text-[#6B7280]">{attempt.subjectBreakdown[s.name].correct}/{attempt.subjectBreakdown[s.name].total}</span>
              </div>
            ))}
          </div>
        </div>
      ) : format === "trend" ? (
        <div className="py-4">
          <svg width="100%" height="160" viewBox={`0 0 ${Math.max(subjects.length * 90, 300)} 160`} preserveAspectRatio="none">
            <line x1="0" y1="80" x2={Math.max(subjects.length * 90, 300)} y2="80" stroke="#E5E7EB" strokeWidth="1" />
            {subjects.map(([name, v], i) => {
              const pct = Math.round((v.correct / Math.max(v.total, 1)) * 100);
              const x = i * 90 + 45;
              const y = 140 - pct * 1.2;
              const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
              return (
                <g key={name}>
                  {i > 0 && (() => {
                    const [, prevV] = subjects[i - 1];
                    const prevPct = Math.round((prevV.correct / Math.max(prevV.total, 1)) * 100);
                    return <line x1={x - 90} y1={140 - prevPct * 1.2} x2={x} y2={y} stroke={color} strokeWidth="2" />;
                  })()}
                  <circle cx={x} cy={y} r="5" fill={color}>
                    <title>{`${name}: ${v.correct}/${v.total} correct`}</title>
                  </circle>
                  <text x={x} y="155" textAnchor="middle" fontSize="10" fill="#6B7280">{name.length > 10 ? name.slice(0, 9) + "…" : name}</text>
                </g>
              );
            })}
          </svg>
          <p className="text-[10px] text-[#6B7280] text-center mt-1">Hover a point for subject, score, and detail.</p>
        </div>
      ) : (
        <div className="border border-[#E5E7EB] rounded-xl p-5 space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
            <span className="font-black uppercase">{attempt.exam} Result Slip</span>
            <span className="text-xs text-[#6B7280]">{attempt.date}</span>
          </div>
          <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Score</span><span className="font-bold">{attempt.score}</span></div>
          <div className="flex justify-between text-xs"><span className="text-[#6B7280]">Time Used</span><span className="font-bold">{totalTimeLabel}</span></div>
          {subjects.map(([name, v]) => (
            <div key={name} className="flex justify-between text-xs">
              <span className="text-[#6B7280]">{name}</span>
              <span className="font-bold">{v.correct}/{v.total}</span>
            </div>
          ))}
          <button onClick={() => window.print()} className="w-full mt-2 border border-[#E5E7EB] rounded-lg py-2 text-xs font-bold text-[#6B7280] hover:text-[#0A0E1A]">
            Print
          </button>
        </div>
      )}
    </ModalShell>
  );
}