import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";
const MAX_QUESTIONS_PER_REQUEST = 60; // guardrail against runaway generations/costs

type Difficulty = "Easy" | "Normal" | "Hard" | "Mindbender";

type GenerateRequestBody = {
  examId?: string;
  subjects?: string[];
  difficulty?: Difficulty;
  count?: number;
};

type RawGeneratedQuestion = {
  subject?: string;
  prompt?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
};

// What each subject actually covers — fed to the model as context so it
// can't confuse e.g. "Pre-Vocational Studies" with plain Mathematics.
// This is the direct fix for subject-mismatched questions; a live web
// search was considered but adds latency/cost/a new API dependency for a
// problem this solves more reliably and instantly.
const SUBJECT_SYLLABUS_HINTS: Record<string, string> = {
  "use of english": "English grammar, comprehension, lexis/structure, oral forms, essay/letter writing — NOT literature texts.",
  "english language": "Grammar, comprehension passages, summary writing, lexis and structure, essay and letter writing.",
  "english studies": "Basic grammar, comprehension, vocabulary and simple composition at junior secondary level.",
  "mathematics": "Number and numeration, algebra, geometry, mensuration, trigonometry, statistics — general mathematics.",
  "general mathematics": "Number and numeration, algebra, geometry, mensuration, trigonometry, statistics.",
  "further mathematics": "Advanced algebra, calculus, vectors, matrices, complex numbers, mechanics — beyond ordinary-level maths.",
  "physics": "Mechanics, waves, electricity and magnetism, heat, optics, modern physics.",
  "chemistry": "Atomic structure, chemical bonding, acids/bases/salts, organic chemistry, electrochemistry, periodic table.",
  "biology": "Cell biology, genetics, ecology, human/plant physiology, evolution, classification of living things.",
  "agricultural science": "Crop and animal production, soil science, farm management, agricultural economics, pests and diseases.",
  "economics": "Demand and supply, market structures, national income, money and banking, international trade, economic development.",
  "commerce": "Trade, business documents, forms of business organization, insurance, banking, transport and communication in business.",
  "principles of accounts": "Double-entry bookkeeping, ledgers, trial balance, financial statements, depreciation, partnership accounts.",
  "financial accounting": "Double-entry bookkeeping, ledgers, trial balance, financial statements, depreciation, partnership and company accounts.",
  "bookkeeping": "Basic double-entry records, ledgers, cash books, trial balance — introductory accounting.",
  "government": "Political theory, systems of government, Nigerian constitution and government, international relations, political parties.",
  "civic education": "Citizenship, rights and duties, rule of law, democracy, national values, human rights.",
  "literature-in-english": "Prose, drama, and poetry set texts — literary devices, themes, characterization, African and non-African literature.",
  "history": "Pre-colonial and colonial Nigerian/African history, nationalism, independence movements, world history topics.",
  "geography": "Physical geography (landforms, climate), human geography (population, settlement), map reading, regional geography.",
  "home economics": "Food and nutrition, clothing and textiles, home management, child development, consumer education.",
  "art": "Drawing, painting, sculpture, art history, design principles, Nigerian traditional and contemporary art.",
  "music": "Music theory, notation, Nigerian and Western musical instruments, history of music, aural skills.",
  "data processing": "Computer fundamentals, hardware/software, spreadsheets, databases, number systems, basic programming concepts.",
  "marketing": "Marketing mix, market segmentation, advertising, consumer behaviour, distribution channels.",
  "office practice": "Office procedures, filing, correspondence, reception duties, use of office equipment.",
  "basic science & technology": "Introductory science and technology concepts for junior secondary — simple machines, basic biology/physics/chemistry, drawing.",
  "pre-vocational studies": "BECE subject integrating Agricultural Science, Home Economics, and Physical and Health Education (PHE) — competency-based and entrepreneurship-focused. Questions must come ONLY from these three areas — NOT mathematics, NOT pure science, NOT any other subject.",
  "cultural & creative arts": "Nigerian culture, traditional and modern art, drama, music and dance appreciation — creative/cultural topics, not academic science or maths.",
  "national value education": "Civic values, social studies, security education, and citizenship topics for junior secondary students.",
  "business studies": "Introductory commerce, bookkeeping basics, office practice, and entrepreneurship concepts for junior secondary students.",
  "crk": "Christian Religious Knowledge — Bible content, Christian doctrine, church history, moral/ethical teachings.",
  "crs": "Christian Religious Studies — Bible content, Christian doctrine, church history, moral/ethical teachings.",
  "irs": "Islamic Religious Studies — Quranic content, Hadith, Islamic history, jurisprudence, moral teachings.",
  "hausa": "Hausa language grammar, comprehension, and literature — written in Hausa.",
  "igbo": "Igbo language grammar, comprehension, and literature — written in Igbo.",
  "yoruba": "Yoruba language grammar, comprehension, and literature — written in Yoruba.",
  "french": "French language grammar, comprehension, and vocabulary.",
  "arabic": "Arabic language grammar, comprehension, and vocabulary.",
};

function syllabusHintsFor(subjects: string[]): string {
  return subjects
    .map((s) => {
      const hint = SUBJECT_SYLLABUS_HINTS[s.toLowerCase()];
      return hint ? `- ${s}: ${hint}` : `- ${s}: use standard Nigerian secondary-school syllabus content for this subject.`;
    })
    .join("\n");
}

function cacheKeyFor(examId: string, subjects: string[], difficulty: string, count: number) {
  return `${examId}|${[...subjects].sort().join(",")}|${difficulty}|${count}`.toLowerCase();
}

async function callGroq(examId: string, subjects: string[], difficulty: Difficulty, count: number, apiKey: string) {
  const systemPrompt = `You are a question-bank generator for PassOnce, a Nigerian CBT exam-prep platform.
Generate multiple-choice questions strictly aligned with the ${examId.toUpperCase()} exam syllabus.

Each subject covers specific, distinct content — do not drift into another subject's material:
${syllabusHintsFor(subjects)}

Respond ONLY with a JSON object of this exact shape, and nothing else — no markdown, no commentary:
{"questions": [{"subject": string, "prompt": string, "options": [string, string, string, string], "correctIndex": number, "explanation": string}]}
Rules:
- Exactly 4 options per question, "correctIndex" is 0-based and must point at the correct option.
- "explanation" is a short (1-2 sentence) reason the correct option is right.
- Spread the questions evenly across the given subjects.
- Every question's "subject" field and content MUST match the topic description given for that subject above — never substitute a different subject's content (e.g. never give Mathematics questions for a non-Mathematics subject).
- Do not repeat the same question twice.
- Vary phrasing, numbers, and example scenarios rather than defaulting to the most common textbook wording.`;

  const userPrompt = `Generate exactly ${count} ${difficulty} difficulty questions for these subjects: ${subjects.join(", ")}. Session seed: ${Math.random().toString(36).slice(2)} — use this only to encourage varied wording, not as visible content.`;

  const groqRes = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    }),
  });

  if (!groqRes.ok) {
    throw new Error(`Groq API error (${groqRes.status}): ${await groqRes.text()}`);
  }

  const data = await groqRes.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Groq.");

  const parsed: { questions?: RawGeneratedQuestion[] } = JSON.parse(raw);

  const questions = (parsed.questions || [])
    .filter(
      (q): q is Required<RawGeneratedQuestion> =>
        !!q && typeof q.prompt === "string" && Array.isArray(q.options) && q.options.length === 4 &&
        typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex <= 3
    )
    .map((q, idx) => ({
      id: idx,
      subject: q.subject || subjects[idx % subjects.length],
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation || "",
    }));

  if (questions.length === 0) throw new Error("No valid questions were generated.");
  return questions;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured on the server." }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();
  const isPremium = profile?.subscription_status === "premium";

  let body: GenerateRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const examId = body.examId?.toLowerCase() || "jamb";
  const subjects = Array.isArray(body.subjects) && body.subjects.length ? body.subjects : ["General"];
  const difficulty: Difficulty = body.difficulty || "Normal";
  const count = Math.min(Math.max(Number(body.count) || 0, 1), MAX_QUESTIONS_PER_REQUEST);

  try {
    // Premium: always a fresh Groq generation, never cached.
    if (isPremium) {
      const questions = await callGroq(examId, subjects, difficulty, count, apiKey);
      return NextResponse.json({ questions });
    }

    // Free: same question set every time, shared across ALL free users with
    // this exact combo — generated via Groq once, then served from cache.
    const admin = createAdminClient();
    const key = cacheKeyFor(examId, subjects, difficulty, count);

    const { data: cached } = await admin
      .from("question_cache")
      .select("questions")
      .eq("cache_key", key)
      .maybeSingle();

    if (cached?.questions) {
      return NextResponse.json({ questions: cached.questions });
    }

    const questions = await callGroq(examId, subjects, difficulty, count, apiKey);
    await admin.from("question_cache").upsert({ cache_key: key, questions });
    return NextResponse.json({ questions });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to reach Groq." }, { status: 502 });
  }
}