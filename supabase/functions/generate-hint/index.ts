import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_WORD_LENGTH = 100;
const MAX_MEANING_LENGTH = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { word, meaning } = body;

    if (!word || typeof word !== "string") {
      return new Response(
        JSON.stringify({ error: "Word is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!meaning || typeof meaning !== "string") {
      return new Response(
        JSON.stringify({ error: "Meaning is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedWord = word.trim();
    const trimmedMeaning = meaning.trim();

    if (!trimmedWord || trimmedWord.length > MAX_WORD_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Word must be between 1 and ${MAX_WORD_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!trimmedMeaning || trimmedMeaning.length > MAX_MEANING_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Meaning must be between 1 and ${MAX_MEANING_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const client = new Anthropic({ apiKey });

    // Use Haiku for fast, cost-effective hint generation
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 150,
      system: `You are a friendly vocabulary tutor for 2nd-5th graders. Generate a single short hint (1 sentence only) that nudges students toward the word's meaning without revealing it directly.

Rules:
- ONE sentence only, no more
- Kid-friendly language (ages 7-11)
- Use: a related situation, a synonym clue, or contrast with an opposite
- Do NOT state the definition verbatim
- Do NOT use the word itself in the hint
- Make it feel like a fun clue, not a lecture`,
      messages: [
        {
          role: "user",
          content: `Word: "${trimmedWord}"\nMeaning: "${trimmedMeaning}"\n\nGive a one-sentence hint.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text" || !textBlock.text.trim()) {
      throw new Error("No hint generated");
    }

    return new Response(
      JSON.stringify({ hint: textBlock.text.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating hint:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate hint" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
