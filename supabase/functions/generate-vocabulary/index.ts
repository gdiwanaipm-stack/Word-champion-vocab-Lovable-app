import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gradeLevel, difficulty, count = 3 } = await req.json();

    if (!gradeLevel || !difficulty) {
      throw new Error('gradeLevel and difficulty are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a vocabulary educator creating age-appropriate vocabulary words for students. 
Generate ${count} vocabulary words with the following specifications:
- Grade Level: ${gradeLevel === 'elementary' ? 'Elementary School (ages 6-11)' : 'Middle School (ages 11-14)'}
- Difficulty: ${difficulty}
- Theme: Sports (especially soccer)

For each word, provide:
1. The vocabulary word
2. A clear, age-appropriate meaning/definition
3. One example sentence for each applicable form: noun, verb, and/or adjective
   - Use sports contexts in examples when possible
   - Make examples engaging and relatable to students

Return ONLY a valid JSON array with this exact structure:
[
  {
    "word": "string",
    "meaning": "string",
    "nounExample": "string or empty string if not applicable",
    "verbExample": "string or empty string if not applicable", 
    "adjectiveExample": "string or empty string if not applicable"
  }
]

Requirements:
- Choose words appropriate for the grade level and difficulty
- Ensure definitions are clear and concise
- Examples should be engaging and use sports themes
- Return valid JSON only, no other text`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${count} vocabulary words for ${gradeLevel} school at ${difficulty} difficulty level.` }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate vocabulary words');
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    let vocabularyWords;
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      vocabularyWords = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedText);
      throw new Error('Invalid response format from AI');
    }

    // Add IDs and metadata to each word
    const wordsWithMetadata = vocabularyWords.map((word: any, index: number) => ({
      id: `ai-${gradeLevel}-${difficulty}-${Date.now()}-${index}`,
      word: word.word,
      difficulty: difficulty,
      gradeLevel: gradeLevel,
      meaning: word.meaning,
      nounExample: word.nounExample || undefined,
      verbExample: word.verbExample || undefined,
      adjectiveExample: word.adjectiveExample || undefined,
    }));

    return new Response(
      JSON.stringify({ words: wordsWithMetadata }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-vocabulary function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
