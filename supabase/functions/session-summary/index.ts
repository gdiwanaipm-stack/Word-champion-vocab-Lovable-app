import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PracticedWord {
  word: string;
  correct: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      score,
      totalAttempts,
      words,
      difficulty,
      gradeLevel,
    }: {
      score: number;
      totalAttempts: number;
      words: PracticedWord[];
      difficulty: string;
      gradeLevel: string;
    } = body;

    if (
      typeof score !== "number" ||
      typeof totalAttempts !== "number" ||
      !Array.isArray(words) ||
      words.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid session data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const accuracyPct = Math.round((score / Math.max(totalAttempts, 1)) * 100);
    const correctWords = words.filter((w) => w.correct).map((w) => w.word);
    const missedWords = words.filter((w) => !w.correct).map((w) => w.word);

    const sessionContext = [
      `Grade level: ${gradeLevel}`,
      `Difficulty: ${difficulty}`,
      `Words practiced: ${words.map((w) => w.word).join(", ")}`,
      `Score: ${score}/${totalAttempts} (${accuracyPct}%)`,
      correctWords.length > 0 ? `Got right: ${correctWords.join(", ")}` : "",
      missedWords.length > 0 ? `Needs review: ${missedWords.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an enthusiastic, warm vocabulary coach for elementary and middle school kids in a soccer-themed vocabulary app. After each practice session, give a short, personalized pep talk.

Rules:
- 2-3 sentences max, upbeat and energetic
- Reference specific words they practiced when relevant
- Use light soccer metaphors naturally (e.g., "great kick", "scored", "champion")
- If accuracy < 50%: focus on encouragement and growth mindset
- If accuracy 50-79%: acknowledge effort, highlight what they got right
- If accuracy >= 80%: celebrate enthusiastically
- End with one specific action tip or encouragement for next session
- Never be condescending or mention exact scores/percentages`,
          },
          {
            role: "user",
            content: `Generate a session summary pep talk.\n\n${sessionContext}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("No summary generated");
    }

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating session summary:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate summary" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
