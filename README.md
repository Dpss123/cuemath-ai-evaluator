# Cuemath AI Tutor Screener 🎙️
> An AI-powered voice interview platform that screens tutor candidates exclusively on soft skills — communication clarity, warmth, patience, empathy, and English fluency.

---

## What I Built & Which Problem I Picked

Hiring great tutors at scale is one of the most time-consuming bottlenecks for edtech platforms. The traditional process — collecting applications, scheduling phone screens, and manually reviewing every candidate — is slow, expensive, and inconsistent. A single recruiter reviewing hundreds of applicants will inevitably introduce human bias and fatigue into the process.

I built **Cuemath AI Tutor Screener**: a fully automated, voice-first interview platform that replaces the first-round phone screen entirely. A candidate visits the URL, enters their name and email, and immediately starts a live 5–10 minute voice interview with an AI. The AI asks questions naturally, listens to real spoken answers, and produces a structured evaluation report graded across 5 soft-skill dimensions.

**The core insight behind the design:** For a children's math tutoring role, subject-matter expertise matters far less than how a tutor communicates. A brilliant mathematician who speaks coldly or impatiently will hurt a student. A warm, patient communicator who simplifies things clearly will genuinely help them. The AI is explicitly instructed to *ignore mathematical errors* and evaluate only on soft-skill criteria.

---

## Key Decisions & Tradeoffs

### 1. Voice-First Over Text-Based
**Decision:** Use the browser's Web Speech API for both input (speech-to-text) and output (text-to-speech) instead of a traditional typed chat interface.

**Reasoning:** A voice interview is far more representative of an actual tutoring session. Tutors teach using their voice — tone, warmth, pacing, and clarity are all lost in text. Voice also prevents candidates from rehearsing polished written answers.

**Tradeoff:** Browser-based speech APIs are inconsistent across browsers and operating systems. Chrome's implementation is significantly superior to others. We accepted this limitation by prominently recommending Chrome in the pre-flight check screen.

### 2. Groq (LLama 3.1) Over OpenAI/Gemini for the Interview Engine
**Decision:** Use Groq's `llama-3.1-8b-instant` model for the live conversation API.

**Reasoning:** Voice conversations feel unnatural when there is a 1–2 second delay between the candidate finishing speaking and the AI responding. Groq's LPU hardware responds in ~200ms, making the conversation feel fluid and human. Gemini Flash and GPT-4o mini both had 800ms–1.5s latencies that made the voice rhythm feel robotic.

**Tradeoff:** Llama 3.1 8B is less capable than GPT-4 class models. For a structured 5–10 minute interview on a very well-defined topic with a detailed system prompt, this trade-off is acceptable. The evaluation (assess API) uses the same model, but with `temperature: 0.2` and `response_format: json_object` enforcement for deterministic grading.

### 3. Prompt Engineering Over a Custom ML Model
**Decision:** The entire soft-skill evaluation is done through a precisely engineered prompt, not a fine-tuned classifier.

**Reasoning:** Building a training dataset for tutor soft-skill evaluation would require hundreds of labelled interviews — a significant data collection effort. A well-constructed prompt with concrete scoring rubrics, explicit rules ("do NOT default to 7 or 8"), and a forced JSON schema produces highly consistent results immediately with zero training cost.

**Tradeoff:** The AI's evaluations are still probabilistic. Two runs on the same transcript may produce slightly different scores. We mitigated this by setting `temperature: 0.2` for the assess call, making scores highly deterministic.

### 4. Browser-Native TTS Over a Paid Voice API
**Decision:** Use `window.speechSynthesis` (free, browser-built-in) instead of ElevenLabs or OpenAI's TTS API for the AI voice.

**Reasoning:** This keeps the platform free to run with zero per-request costs. Chrome's "Google UK English Female" voice is genuinely natural-sounding.

**Tradeoff:** Voice quality varies significantly by device. On some systems, the only available voice is a robotic default. We implemented a `waitForVoices()` promise that blocks speech until Chrome fully loads its premium neural voice pack — eliminating the "mid-sentence voice switch" bug that plagued earlier versions.

### 5. Evaluation-as-a-Gatekeeper for Round 2
**Decision:** The assessment report explicitly recommends whether to advance the candidate to a human-led second round.

**Reasoning:** The report is useless if hiring managers have to re-interpret it into a binary decision. The AI directly tells them: *"This candidate's warmth and communication clearly qualify them for the second round"* or *"This candidate gave vague, one-word answers and is not recommended."*

---

## Interesting Engineering Challenges

### Challenge 1: Chrome Kills the Microphone After 10 Seconds of Silence
**Problem:** The Web Speech API in Chrome automatically stops recognition after roughly 10 seconds of silence. This means if a candidate pauses to think, the mic silently turns off. Words spoken after the pause are completely lost.

**Solution:** Added an `isListeningRef` boolean. The `recognition.onend` event now checks this flag — if it fired while we still *expect* the mic to be on, we immediately call `recognition.start()` to restart it. The candidate experiences zero interruption.

### Challenge 2: Words Being Lost on Mic Auto-Restart
**Problem:** After fixing the silence cutoff issue above, a new bug emerged: words spoken in subsequent listening sessions after a restart weren't being accumulated correctly. The `transcriptBuffer` was a local variable inside `startListening()`, so after a restart, the closure had already been garbage-collected. Each restart was saving words into an orphaned object that no longer updated the React state.

**Solution:** Promoted `transcriptBuffer` to a stable `transcriptBufferRef` (`useRef`) at the component level. This ref survives across all recognition restarts, accumulating every word spoken across all sub-sessions into a single persistent string.

### Challenge 3: AI Voice Changes Tone Mid-Sentence
**Problem:** Chrome loads basic voices synchronously on page load but asynchronously loads premium neural voices ~2 seconds later. The old code created a `SpeechSynthesisUtterance` immediately on startup — locking it to the default robotic voice. When the premium voices loaded 2 seconds later, Chrome switched the TTS engine mid-utterance, causing a jarring audible tone change.

**Solution:** Implemented a `waitForVoices()` async function that wraps `onvoiceschanged` in a Promise. The `speakQuestion` function now `await`s this before creating any `SpeechSynthesisUtterance`, guaranteeing the utterance is always created with the premium voice.

### Challenge 4: The `process.env` Environment Variable Problem
**Problem:** The Groq API key in `.env.local` consistently returned `undefined` when accessed via `process.env.GROQ_API_KEY`, causing persistent `401 Invalid API Key` errors even after server restarts. The hardcoded key worked perfectly but obviously couldn't be committed to GitHub.

**Solution:** Created a `lib/config.ts` module that exports the key as a TypeScript constant. This file is added to `.gitignore`, ensuring it never reaches the public repository. The API routes import `GROQ_API_KEY` from this module directly — bypassing `process.env` entirely while keeping the key out of source control.

---

## What I'd Improve With More Time

### 1. Real-Time Streaming AI Responses
Currently the AI waits until it generates its complete response before the TTS begins. With streaming, the voice could start reading the first sentence of the AI's response while the rest is still being generated — reducing perceived latency dramatically.

### 2. Whisper API for Speech Recognition
The browser Web Speech API is unreliable and varies by device. Replacing it with OpenAI Whisper (or `whisper-large-v3` via Groq) would give us server-side, consistent, highly accurate transcription across all devices and browsers — including mobile.

### 3. Persistent Candidate Database
Currently all data lives in `sessionStorage` and disappears when the tab closes. A Supabase or PostgreSQL backend would allow hiring managers to:
- Access a dashboard of all completed interviews
- Filter/sort candidates by score
- Track historical trends across cohorts

### 4. Recruiter Dashboard & ATS Integration
Build a full hiring manager view with candidate search, batch export to CSV, and a one-click "Advance to Round 2" button that triggers an email to the candidate. Integration with tools like Greenhouse or Lever via their APIs would make this plug-and-play for enterprise teams.

### 5. Interviewer Persona Customization
Allow non-technical hiring managers to configure the AI's persona, interview topics, and evaluation criteria through a no-code UI — making this a generalized soft-skills screening tool for any role, not just math tutors.

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Create the secure config file (gitignored — never committed)
# Create lib/config.ts with:
# export const GROQ_API_KEY = "gsk_your_key_here";

# 3. Start the development server
npm run dev

# 4. Open in Chrome (required for Web Speech API)
open http://localhost:3000
```

> **Note:** This application requires **Google Chrome**. The Web Speech API used for voice recognition and the premium TTS voices are only reliably available in Chrome.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| AI Interview Engine | Groq API — `llama-3.1-8b-instant` |
| AI Evaluation Engine | Groq API — `llama-3.1-8b-instant` (temperature 0.2) |
| Speech Input | Web Speech API (`webkitSpeechRecognition`, en-IN) |
| Speech Output | Web Speech Synthesis API (Chrome Neural Voices) |
| Styling | Vanilla CSS (dark glassmorphism UI) |
| Deployment | Vercel |

---

## Evaluation Dimensions

Every candidate is graded on 5 soft-skill dimensions from the real interview transcript:

| Dimension | What It Measures |
|-----------|-----------------|
| **Communication Clarity** | Can they explain concepts simply and coherently? |
| **Warmth & Patience** | Do they sound caring and student-first? |
| **Teaching Ability** | Can they break down ideas a child would understand? |
| **Student Empathy** | Do they understand how students feel when stuck? |
| **English Fluency** | Is their language clear, fluent, and professional? |

The overall score is the true mathematical average of these 5 dimensions. The verdict maps directly: `1–4` = Not Recommend, `5–6` = Borderline, `7–8` = Recommend, `9–10` = Strong Recommend.
