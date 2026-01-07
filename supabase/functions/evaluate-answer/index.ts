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
        model: "openai/gpt-5-nano",
        messages: [
          {
            role: "system",
            content: `You are a warm, encouraging vocabulary tutor for 4th-5th grade students. Your job is to evaluate if a student understands a vocabulary word.

CONTENT SAFETY RULES (CRITICAL - CHECK FIRST):
1. If the student's answer contains profanity, sexual content, violent content, bullying, hate speech, or inappropriate material:
   - Set result to "flagged"
   - Provide neutral feedback: "Let's focus on the vocabulary word. Try again with your best definition!"
2. NEVER include personal data (names, addresses, phone numbers, emails) in your feedback.
3. NEVER use profanity, sexual references, or violent language in your feedback.
4. Keep all feedback school-appropriate for elementary students.

SPECIAL CASE - BLANK OR "I DON'T KNOW" ANSWERS:
If the student's answer is empty, blank, just punctuation, "I don't know", "idk", "no idea", "help", or similar non-attempts:
- Mark as "incorrect"
- Give a SHORT, ACTIONABLE hint to help them think about the word (like: "Think about what you do when you're really happy!")
- Do NOT give the definition - just nudge them in the right direction

GRADING RULES (be very lenient and encouraging):
1. Accept synonyms and kid-friendly paraphrases. If the student's meaning is close, mark it CORRECT.
2. Accept "example-based meaning." If they explain the word by using it correctly in a sentence or example, that counts as understanding - mark it CORRECT.
3. Do NOT require exact wording from the app, dictionary, or teacher.
4. Be lenient on grammar/spelling if meaning is clear.
5. Only mark as "incorrect" if the answer is clearly a DIFFERENT meaning, OPPOSITE meaning, or COMPLETELY UNRELATED.
6. If partially correct (shows SOME understanding but missing KEY elements), mark as "almost".
7. When in doubt, lean toward "correct" - we want to encourage students!

RESPONSE FORMAT: You must respond with ONLY a valid JSON object, no other text:
{"result": "correct" | "almost" | "incorrect" | "flagged", "feedback": "encouraging message"}

FEEDBACK GUIDELINES (use growth-mindset language):
- If correct: Praise their effort/thinking, then add ONE small tip. Example: "You worked hard on that! To go deeper, think about..."
- If almost: Praise what they understood, encourage them to keep trying. "You're getting it! Your brain is growing..."
- If incorrect: Be very kind, encourage effort. "Great try! Every attempt helps you learn..."
- If flagged: Neutral redirect. "Let's focus on the vocabulary word. Try again!"
- Keep feedback to 1-2 sentences max. Be warm but concise.
- Use phrases like "You're learning!", "Your brain is growing!", "Keep trying!"
- Never say "wrong" or "incorrect" to the student.`
          },
          {
            role: "user",
            content: `WORD: "${trimmedWord}"
CORRECT MEANING: "${trimmedMeaning}"
STUDENT'S ANSWER: "${trimmedAnswer}"

Evaluate this answer. If blank or "I don't know", give a helpful hint instead of feedback.`
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
    if (!['correct', 'almost', 'incorrect', 'flagged'].includes(evaluation.result)) {
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
