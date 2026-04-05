import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

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

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const client = new Anthropic({ apiKey });

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

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system: `You are an enthusiastic, warm vocabulary coach for elementary and middle school kids in a soccer-themed vocabulary app. After each practice session, give a short, personalized pep talk.

Rules:
- 2-3 sentences max, upbeat and energetic
- Reference specific words they practiced when relevant
- Use light soccer metaphors naturally (e.g., "great kick", "scored", "champion")
- If accuracy < 50%: focus on encouragement and growth mindset
- If accuracy 50-79%: acknowledge effort, highlight what they got right
- If accuracy >= 80%: celebrate enthusiastically
- End with one specific action tip or encouragement for next session
- Never be condescending or mention exact scores/percentages`,
      messages: [
        {
          role: "user",
          content: `Generate a session summary pep talk.\n\n${sessionContext}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No summary generated");
    }

    return new Response(
      JSON.stringify({ summary: textBlock.text.trim() }),
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
