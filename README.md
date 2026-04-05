# Word Vocabulary app with Lovable
This is a word vocabulary app designed for elementary and middle school kids to help them build proficiency in learning new words and their meaning. It is created in soccer setup to help them meet their "GOAL". The app is designed to encourage learning and motivate them.

## Project

**URL**: word-champion-kicks.lovable.app

## Prompt used
Problem Statement - make elementary kids learn new vocab words

Users: Elementary kids with difficulty levels: easy, medium, difficult

Prompt - Build a vocabulary web app for elementary, middle school kids ( drop down selection to pick grade level) to help them learn new English words and track their progress towards their weekly goal 
Define what good looks like? 
Vocabulary understanding is fuzzy, not binary
Students may give partial, contextual, or paraphrased meanings
Progress tracking requires semantic similarity, not exact matches
The LLM should evaluate, not just generate.


- Difficulty level ( Easy, Medium, Hard, Very Hard)
- Generate 2 words per day. Ask the student for the meaning first and then say whether it is right or wrong. Then give them their true meaning along with an example of the usage of the word as a noun, verb, adjective
- Repeat those words every day for 2 weeks
  Give a count of how many vocubulary words they did each week
- Track the progress on weekly basis
- Reward them with a silver cup each week if they do it for 5 out of 7 days in a week and gold cup if they do it all 7 days in a week
- Allow kids to review the words they learned any time

Core Features
- User login and authentication (removed later due to lessons learned)
- Clean minimalist design
- Mobile friendly look and a dark mode
- Add soccer theme images with links (since my kid loves it - Hyper personalization)
- Charts showing progress to goal
- Feedback uses growth-mindset language, and blank OR "I don't know" answers get a helpful hint instead of generic feedback.Feedback.correction must be gentle; if correct, say what was good and add one small improvement. Be gentle and motivate the kids to learn new vocab words


## Which AI models are used for evaluation?
Options explored were:
google/gemini-2.5-pro - Most powerful, best for complex reasoning
google/gemini-2.5-flash (current) - Balanced speed/quality
google/gemini-2.5-flash-lite - Fastest, cheapest
openai/gpt-5 - Powerful all-rounder
openai/gpt-5-mini - Good balance of cost/performance
openai/gpt-5-nano - Fastest/cheapest OpenAI option


**Lovable AI**, which is pre-configured and requires **no API key setup**. It supports models like Gemini 2.5 Flash (comparable speed/cost to Claude Haiku 4.5) and GPT-5 (comparable reasoning to Claude Opus), with the advantage of zero configuration and built-in rate limit handling.

I used OpenAI/GPT-5-nano and tested the evaluation with the new model and changed it back to Gemini 2.5 flash since the response rate with nano was more than 5 secs with new evaluation criteria

## What technologies are used for this project?

This project is built with:
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Lessons learned


## User Feedback received


A) One kid loved it. He actually sat 20 mins doing it even though I have kept the practiece to 2 new words everyday. He keptpressing "Practice more words". Winner approach for parents

B) Another kid says it is too strict in judging his answer when it is in the ball park and meaning are subject to interpretations

C) One Parent - likes it, gamification, does not like the subjectivity and accuracy

D) One more kid wants higher difficulty level words



