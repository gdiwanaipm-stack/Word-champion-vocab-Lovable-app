import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word, meaning } = await req.json();
    
    if (!word || !meaning) {
      return new Response(
        JSON.stringify({ error: "Word and meaning are required" }),
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
- Start with encouragement like "Great thinking!" or "You're doing awesome!"
- Give a helpful clue without revealing the full meaning
- Use a kid-friendly analogy or visual cue if helpful
- Keep it 1-2 short sentences
- Never use discouraging words like "wrong" or "incorrect"

Your goal is to build confidence and help students learn, not test for perfection.`
          },
          {
            role: "user",
            content: `Give an encouraging hint for the word "${word}". The meaning is: "${meaning}". Help the student without giving away the full answer. Keep it simple and fun!`
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate hint" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
