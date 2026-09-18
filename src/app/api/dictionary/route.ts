import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

// Everyone gets the dictionary; free users get a small daily allowance,
// premium gets a generous one. Writes go through the admin client so the
// counters can't be bumped from the browser.
const FREE_DAILY_LOOKUPS = 5;
const PREMIUM_DAILY_LOOKUPS = 100;

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

  let body: { word?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const word = body.word?.trim();
  if (!word || typeof word !== "string" || word.length > 60) {
    return NextResponse.json({ error: "word is required." }, { status: 400 });
  }

  // Daily usage (server-side)
  const today = new Date().toISOString().slice(0, 10);
  const cap = isPremium ? PREMIUM_DAILY_LOOKUPS : FREE_DAILY_LOOKUPS;
  const { data: usage } = await supabase
    .from("dictionary_usage")
    .select("lookups_used, reset_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const used = usage && usage.reset_at === today ? usage.lookups_used : 0;

  if (used >= cap) {
    return NextResponse.json(
      {
        error: isPremium
          ? "Daily dictionary cap reached — try again tomorrow."
          : "You've used today's free dictionary lookups. Upgrade for more.",
        limitReached: true,
        isPremium,
      },
      { status: 429 }
    );
  }

  const systemPrompt = `You are a dictionary for Nigerian secondary-school students using PassOnce.
Given a word, respond with ONLY a JSON object (no markdown, no commentary) of this exact shape:
{"partOfSpeech": string, "definition": string, "example": string}
- "partOfSpeech": e.g. noun, verb, adjective.
- "definition": 1-2 simple sentences a secondary-school student understands.
- "example": one short everyday example sentence using the word.`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Define this word: ${word}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 220,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Dictionary service error (${res.status})` }, { status: 502 });
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return NextResponse.json({ error: "No definition returned." }, { status: 502 });

    const parsed = JSON.parse(raw);

    // Record usage from the server only (admin key bypasses RLS writes).
    const admin = createAdminClient();
    await admin.from("dictionary_usage").upsert({
      user_id: user.id,
      lookups_used: used + 1,
      reset_at: today,
    });

    return NextResponse.json({
      partOfSpeech: parsed.partOfSpeech || "",
      definition: parsed.definition || "",
      example: parsed.example || "",
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach the dictionary service." }, { status: 502 });
  }
}