import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_WORD_LENGTH = 100;
const MAX_MEANING_LENGTH = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { word, meaning } = body;
    
    // Input validation
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

    if (trimmedWord.length === 0 || trimmedWord.length > MAX_WORD_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Word must be between 1 and ${MAX_WORD_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedMeaning.length === 0 || trimmedMeaning.length > MAX_MEANING_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Meaning must be between 1 and ${MAX_MEANING_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a friendly, warm elementary vocabulary tutor for 2nd-5th graders.

Tone: Warm, positive, patient, kid-friendly. Use simple language.

When giving hints:
- Keep it SHORT: 1 sentence only
- Make it ACTIONABLE: tell them what to think about or try
- Example: "Think about what you do when you're really excited about something!"
- NO fluff or extra encouragement - just the helpful clue
- Never reveal the answer directly

Your goal is to nudge them in the right direction quickly.`
          },
          {
            role: "user",
            content: `Give an encouraging hint for the word "${trimmedWord}". The meaning is: "${trimmedMeaning}". Help the student without giving away the full answer. Keep it simple and fun!`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate hint");
    }

    const data = await response.json();
    const hint = data.choices?.[0]?.message?.content;

    if (!hint) {
      throw new Error("No hint generated");
    }

    return new Response(
      JSON.stringify({ hint }),
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