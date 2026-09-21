import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

// AI Tutor is open to EVERYONE. Free users get 1 message per day — after
// that they hit the limit and get an upgrade prompt. Premium users are
// "unlimited" in practice but still capped per day as an abuse guardrail
// so a single account can't burn through your Groq credits.
const FREE_DAILY_LIMIT = 1;
const PREMIUM_DAILY_CAP = 500;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured." }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();
  const isPremium = profile?.subscription_status === "premium";

  let body: { question?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message is too long (max 2000 characters)." }, { status: 400 });
  }

  // Per-user daily usage — server-side, free tier gets exactly 1 message.
  const today = new Date().toISOString().slice(0, 10);
  const cap = isPremium ? PREMIUM_DAILY_CAP : FREE_DAILY_LIMIT;
  const { data: usage } = await supabase
    .from("ai_tutor_usage")
    .select("messages_used, reset_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const used = usage && usage.reset_at === today ? usage.messages_used : 0;

  if (used >= cap) {
    return NextResponse.json(
      {
        error: isPremium
          ? "Daily AI cap reached — come back tomorrow."
          : "You've used your free AI message for today. Upgrade to chat without limits.",
        limitReached: true,
        isPremium,
      },
      { status: 429 }
    );
  }

  const questionContext =
    typeof body.question === "string" && body.question.length > 0
      ? body.question.slice(0, 500)
      : "general study topic";

  const systemPrompt = `You are a friendly, encouraging exam tutor for student using PassOnce.
The student is currently looking at this practice question: "${questionContext.replace(/"/g, "'")}"
Answer their question clearly and briefly (2-4 sentences), guiding their understanding rather than just stating facts. Use simple language.`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `AI service error (${res.status})` }, { status: 502 });
    }
    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content || "I couldn't come up with an answer just now — try rephrasing?";

    // Record usage from the server only (admin key bypasses RLS writes).
    const admin = createAdminClient();
    await admin.from("ai_tutor_usage").upsert({
      user_id: user.id,
      messages_used: used + 1,
      reset_at: today,
    });

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Failed to reach the AI service." }, { status: 502 });
  }
}