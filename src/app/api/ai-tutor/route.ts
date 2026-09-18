import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

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
  if (profile?.subscription_status !== "premium") {
    return NextResponse.json({ error: "AI Tutor is a premium feature." }, { status: 403 });
  }

  const { question, message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const systemPrompt = `You are a friendly, encouraging exam tutor for a Nigerian secondary-school student using PassOnce.
The student is currently looking at this practice question: "${question || "unknown"}"
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
      return NextResponse.json({ error: `Groq error (${res.status})` }, { status: 502 });
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "I couldn't come up with an answer just now — try rephrasing?";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Failed to reach Groq." }, { status: 502 });
  }
}