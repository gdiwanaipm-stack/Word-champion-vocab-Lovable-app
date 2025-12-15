import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_WORD_LENGTH = 100;
const MAX_MEANING_LENGTH = 500;
const MAX_ANSWER_LENGTH = 500;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word, meaning, studentAnswer } = await req.json();

    // Input validation
    if (!word || typeof word !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Word is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!meaning || typeof meaning !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Meaning is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!studentAnswer || typeof studentAnswer !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Student answer is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize and limit inputs
    const trimmedWord = word.trim().slice(0, MAX_WORD_LENGTH);
    const trimmedMeaning = meaning.trim().slice(0, MAX_MEANING_LENGTH);
    const trimmedAnswer = studentAnswer.trim().slice(0, MAX_ANSWER_LENGTH);

    if (trimmedWord.length === 0 || trimmedMeaning.length === 0 || trimmedAnswer.length === 0) {
      return new Response(
        JSON.stringify({ error: 'All fields must have content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Evaluating answer for word:', trimmedWord);
    console.log('Student answer:', trimmedAnswer);

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
            content: `You are a warm, encouraging vocabulary tutor for 4th-5th grade students. Your job is to evaluate if a student understands a vocabulary word.

GRADING RULES (be very lenient and encouraging):
1. Accept synonyms and kid-friendly paraphrases. If the student's meaning is close, mark it CORRECT.
2. Accept "example-based meaning." If they explain the word by using it correctly in a sentence or example, that counts as understanding - mark it CORRECT.
3. Do NOT require exact wording from the app, dictionary, or teacher.
4. Be lenient on grammar/spelling if meaning is clear.
5. Only mark as "incorrect" if the answer is clearly a DIFFERENT meaning, OPPOSITE meaning, or COMPLETELY UNRELATED.
6. If partially correct (shows SOME understanding but missing KEY elements), mark as "almost".
7. When in doubt, lean toward "correct" - we want to encourage students!

RESPONSE FORMAT: You must respond with ONLY a valid JSON object, no other text:
{"result": "correct" | "almost" | "incorrect", "feedback": "encouraging message"}

FEEDBACK GUIDELINES:
- If correct: Celebrate! "Amazing job! You really understand this word!"
- If almost: Praise what they got right, then gently add the missing part. "Great thinking! You're so close..."
- If incorrect: Be very kind. "Nice try! Let me help you understand..."
- Never say "wrong" or "incorrect" to the student. Use positive language always.`
          },
          {
            role: "user",
            content: `WORD: "${trimmedWord}"
CORRECT MEANING: "${trimmedMeaning}"
STUDENT'S ANSWER: "${trimmedAnswer}"

Evaluate this answer using the grading rules. Remember to be encouraging!`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit hit');
        // Fallback to lenient grading
        return new Response(
          JSON.stringify({ result: 'correct', feedback: "Great effort! You're doing wonderfully!" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ result: 'correct', feedback: "Great effort! Keep up the good work!" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to evaluate answer");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    console.log('AI response:', content);

    // Parse the JSON response
    let evaluation;
    try {
      // Clean the response - remove any markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse evaluation response:', content);
      // Fallback to lenient grading
      evaluation = {
        result: "correct",
        feedback: "Great effort! You're doing wonderfully with your vocabulary learning!"
      };
    }

    // Validate the result
    if (!['correct', 'almost', 'incorrect'].includes(evaluation.result)) {
      evaluation.result = 'correct'; // Default to correct (lenient)
    }

    console.log('Evaluation result:', evaluation.result);

    return new Response(
      JSON.stringify(evaluation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in evaluate-answer function:', error);
    // Return a lenient fallback on error
    return new Response(
      JSON.stringify({ 
        result: 'correct',
        feedback: "Great effort! Keep up the wonderful work!"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
