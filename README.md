# TutorScreen AI 🎙️
AI-Powered Voice Interviewer for Cuemath Tutor Candidates

## Setup
1. `npm install`
2. Copy `.env.local.example` to `.env.local` and add your `ANTHROPIC_API_KEY`
3. `npm run dev` → open http://localhost:3000

Use **Chrome** for best speech recognition.

## Deploy to Vercel
1. Push to GitHub
2. Connect repo to vercel.com
3. Add `ANTHROPIC_API_KEY` in Vercel environment variables
4. Deploy

## Tech Stack
- Next.js 15 (App Router)
- Claude claude-opus-4-5 (Anthropic API)
- Web Speech API + SpeechSynthesis (browser-native, free)
- Deployed on Vercel
