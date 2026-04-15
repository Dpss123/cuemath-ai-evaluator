# Cuemath AI Tutor Screener 🎙️
> An AI-powered voice interview platform that screens tutor candidates exclusively on soft skills — communication clarity, warmth, patience, empathy, and English fluency.

**Live Demo:** [https://cuemath-ai-evaluator.vercel.app/](https://cuemath-ai-evaluator.vercel.app/)
**Repo:** [github.com/Dpss123/cuemath-ai-evaluator](https://github.com/Dpss123/cuemath-ai-evaluator)

---

## What I Built & Which Problem I Picked

Hiring great tutors at scale is one of the most time-consuming bottlenecks for edtech platforms. Cuemath hires hundreds of tutors every month — every one requires a 10-minute phone screen to evaluate communication clarity, patience, warmth, and ability to simplify concepts.

This is expensive, slow, and impossible to scale consistently. A human interviewer on call 50 varies from interviewer to interviewer. Fatigue, bias, and scheduling gaps degrade quality over time.

**I built an AI-powered voice interview platform that fully automates this first screening round.**

A candidate visits the URL, enters their name and email, and immediately begins a live 5–10 minute voice conversation with an AI HR interviewer. The AI:
- Asks relevant questions naturally, adapts to their answers, and follows up on vague responses
- Listens to their spoken answers in real-time using browser speech recognition
- Generates a structured, evidence-backed evaluation report across 5 soft-skill dimensions
- Produces a clear "Advance to Round 2" or "Not Recommend" hiring decision

**The core design insight:** For a children's math tutoring platform, subject-matter expertise matters far less than how a tutor communicates. A brilliant mathematician who speaks coldly or rushes students will hurt them. A warm, patient communicator who simplifies things clearly will genuinely help them. The AI is explicitly instructed to ignore mathematical errors and evaluate only on soft-skill criteria.

---

## Requirements Coverage

| Requirement | Implementation | Status |
|---|---|---|
| **Natural, flowing conversation** | AI prompt: "Act like a real person, be conversational, NOT robotic. 1–3 sentences max." | ✅ |
| **Follow up on vague answers** | Edge case rule: "If one-word answer, don't accept it — ask a specific probing follow-up" | ✅ |
| **Handle tangents** | Edge case rule: "If long tangent, gently interrupt and guide back" | ✅ |
| **Handle choppy audio** | Edge case rule: "If garbled input, naturally ask them to repeat" | ✅ |
| **Key tutoring questions** | Literally: "Explain fractions to a 9-year-old" + "Student staring at a problem for 5 minutes — what do you do?" | ✅ |
| **Voice-first, candidate speaks** | Web Speech API (`en-IN`), live waveform, auto-restart on silence | ✅ |
| **5-dimension rubric** | Communication Clarity, Warmth & Patience, Teaching Ability, Student Empathy, English Fluency | ✅ |
| **Verbatim quote evidence** | Every dimension requires an actual quote from the real transcript | ✅ |
| **Beyond pass/fail** | Score per dimension + overall score + hiring manager summary + explicit round 2 verdict | ✅ |
| **PDF export** | Print-optimized report for hiring managers with candidate details | ✅ |
| **Professional candidate experience** | Premium dark UI, pre-flight check, live session indicator, welcoming tone | ✅ |
| **Security — no exposed keys** | `lib/config.ts` gitignored; env vars used on Vercel | ✅ |

---

## Key Decisions & Tradeoffs

### 1. Voice-First Over Text-Based
**Decision:** Use the browser's Web Speech API for both input (speech-to-text) and output (text-to-speech) instead of a typed chat interface.

**Reasoning:** A voice interview is far more representative of an actual tutoring session. Tutors teach using their voice — tone, warmth, pacing, and clarity are all lost in text. Voice also prevents candidates from rehearsing polished written answers.

**Tradeoff:** Browser speech APIs are inconsistent across browsers. Chrome's implementation is significantly superior. We accepted this by recommending Chrome prominently in the pre-flight check screen.

---

### 2. Groq (LLaMA 3.1) for Lightning-Fast AI Responses
**Decision:** Use Groq's `llama-3.1-8b-instant` model for live conversation.

**Reasoning:** Voice conversations feel unnatural when there's a 1–2 second AI thinking delay. Groq's LPU hardware responds in ~200ms, making the dialogue feel genuinely fluid. Gemini Flash and GPT-4o mini both had 800ms–1.5s latencies that made the voice rhythm feel robotic and awkward.

**Tradeoff:** LLaMA 3.1 8B is less capable than GPT-4 class models. For a structured, well-prompted 10-minute interview on a specific topic, this tradeoff is completely acceptable. The grading route uses `temperature: 0.2` and enforced JSON output for deterministic evaluation.

---

### 3. Prompt Engineering Over Custom ML
**Decision:** Evaluation is done through a precisely engineered prompt, not a fine-tuned classifier.

**Reasoning:** Building training data for soft-skill evaluation requires hundreds of labelled interviews — significant time and cost. A well-structured prompt with a scored rubric, explicit honesty rules (*"Do NOT default to 7 or 8 — if the candidate said nothing meaningful, give a 1–3"*), and forced JSON schema produces consistent, actionable results immediately.

**Tradeoff:** Probabilistic outputs. Mitigated via `temperature: 0.2` on the assess call.

---

### 4. Browser-Native TTS to Keep Costs at Zero
**Decision:** Use `window.speechSynthesis` (free, browser-built-in) instead of ElevenLabs or OpenAI TTS.

**Reasoning:** Zero per-request cost. Chrome's "Google UK English Female" neural voice is genuinely natural at properly tuned settings (`rate: 0.88`, `pitch: 1.05`).

**Tradeoff:** Voice quality varies by device. We implemented a `waitForVoices()` async gate that blocks speech until Chrome's premium neural voice pack is confirmed loaded — fixing the "mid-sentence voice switch" that plagued earlier versions.

---

### 5. Evaluation as a Hard Round 2 Gate
**Decision:** The report explicitly recommends whether to advance the candidate.

**Reasoning:** A score table is useless if hiring managers must re-interpret it into a binary decision every time. The AI directly tells them: *"This candidate's warmth and communication clearly qualify them for the second round"* or *"Gave vague, one-word answers. Not recommended."*

---

## Interesting Engineering Challenges

### Challenge 1: Chrome Kills the Microphone After 10 Seconds of Silence
**Problem:** Chrome's Web Speech API automatically stops recognition after ~10 seconds of silence — silently and without error. Words spoken after a pause were completely lost.

**Solution:** Added `isListeningRef` — if `recognition.onend` fires while we still expect the mic to be on, we immediately restart recognition. The candidate experiences no interruption.

---

### Challenge 2: Words Lost on Auto-Restart
**Problem:** After fixing the silence cutoff, a new bug emerged. The `transcriptBuffer` was a local variable in `startListening()`. After a mic restart, the closure had already been released — words spoken in the second session were saved into a garbage-collected object that no longer updated React state.

**Solution:** Promoted `transcriptBuffer` to a persistent `transcriptBufferRef` (`useRef`) at the component level. It survives all recognition restarts, accumulating every word spoken across all sub-sessions.

---

### Challenge 3: AI Voice Changes Tone Mid-Sentence
**Problem:** Chrome loads basic offline voices synchronously on page load, then asynchronously loads premium neural voices ~2 seconds later (`onvoiceschanged`). The old code created `SpeechSynthesisUtterance` immediately — locking it to the robotic default voice. When premium voices loaded 2 seconds later, Chrome switched voice engines mid-sentence.

**Solution:** Implemented `waitForVoices()` — a Promise that wraps `onvoiceschanged`. The `speakQuestion` function now `await`s this before creating any utterance. The first syllable spoken is always in the premium voice.

---

### Challenge 4: API Keys Not Loading from `.env.local`
**Problem:** `process.env.GROQ_API_KEY` returned `undefined` in the Next.js dev server on this Windows machine, causing persistent 401 errors despite the key being correctly formatted in `.env.local`. Hardcoding the key worked but was unsafe to commit.

**Solution:** Created `lib/config.ts` — a TypeScript module that is added to `.gitignore`. It exports the key as `process.env.GROQ_API_KEY || "fallback_hardcoded_key"`. Locally, the fallback is used. On Vercel, the environment variable takes priority. The key never appears in the public repository.

---

### Challenge 5: Fake Evaluation Scores
**Problem:** The original assess prompt included a JSON example template with hardcoded values like `"overallScore": 7.4` and `"score": 8`. The AI was copying these placeholder numbers instead of evaluating the real interview! Every candidate got roughly the same score regardless of performance.

**Solution:** Rewrote the entire evaluate prompt. All placeholder values changed to `0`. Added a strict scoring guide with honest enforcement rules ("If the candidate gave no real answers — give scores 1–4, NOT 7 or 8"), required verbatim quotes from the actual transcript, and tied verdict directly to score range.

---

## What I'd Improve With More Time

### 🔊 Priority 1: ElevenLabs or OpenAI TTS for Truly Human Voice
The single biggest UX improvement would be replacing `window.speechSynthesis` with a premium TTS API. Browser voices — even Chrome's neural ones — still sound machine-like compared to modern AI voice synthesis.

- **ElevenLabs** (`Rachel` or `Grace` voice) sounds indistinguishable from a real human. Warmth, breath pauses, and natural intonation are built-in.
- **OpenAI TTS** (`alloy` or `nova`) is cheaper and nearly as natural.
- Both APIs stream audio chunks, so the voice starts playing immediately without waiting for the full response to generate.

This would transform the candidate experience from "talking to a bot" to "talking to a real HR person."

### 🎤 Priority 2: OpenAI Whisper for Accurate Speech-to-Text
Replace the browser Web Speech API with server-side Whisper (`whisper-large-v3` via Groq API — free tier). Benefits:
- Works on **all browsers**, not just Chrome
- Works on **mobile devices**
- Handles Indian English accents and Hinglish far more accurately
- Audio chunks sent every 3 seconds for near-real-time transcription
- No silent failure — explicit error handling

### ⚡ Priority 3: Streaming AI Responses
Currently the AI waits until it generates its complete response before TTS begins — adding ~200–400ms of silence. With streaming:
- AI generates sentence 1 → TTS begins immediately
- AI generates sentence 2 → appended to audio queue
- Perceived latency drops from 600ms to under 200ms

### 🗄️ Priority 4: Persistent Candidate Database
Currently all interview data lives in `sessionStorage` and disappears when the tab closes. A Supabase backend would allow:
- Dashboard of all completed interviews
- Filter/sort by score, date, verdict
- Historical trend tracking across hiring cohorts
- Long-term data for fine-tuning the evaluation rubric

### 📋 Priority 5: Recruiter Dashboard & ATS Integration
- Hiring manager view with candidate search and batch export to CSV
- One-click "Advance to Round 2" button that triggers a templated email
- Greenhouse / Lever / Workday integration via their APIs for enterprise customers

### 🎨 Priority 6: No-Code Persona & Question Builder
Allow hiring managers to configure the AI's persona, topic questions, and evaluation rubric through a drag-and-drop UI — making this a generalized soft-skills screener for any role, not just math tutors.

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/Dpss123/cuemath-ai-evaluator.git
cd cuemath-ai-evaluator

# 2. Install dependencies
npm install

# 3. Create the secure config (gitignored — never committed to GitHub)
mkdir -p lib
echo 'export const GROQ_API_KEY = process.env.GROQ_API_KEY || "your_groq_key_here";' > lib/config.ts
# Get your free key at: https://console.groq.com/keys

# 4. Start the dev server
npm run dev

# 5. Open in Chrome (required for Web Speech API)
open http://localhost:3000
```

> ⚠️ **Important:** Use **Google Chrome**. Voice recognition and premium TTS voices depend on Chrome's built-in Speech APIs.

---

## Vercel Deployment

1. Push repo to GitHub
2. Connect to [vercel.com](https://vercel.com) → Import `cuemath-ai-evaluator`
3. Set environment variable: `GROQ_API_KEY` → your key from [console.groq.com/keys](https://console.groq.com/keys)
4. Deploy → get live URL instantly

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router, Turbopack) | Fast build, API routes, full-stack in one repo |
| AI Interview Engine | Groq `llama-3.1-8b-instant` | ~200ms latency — essential for natural voice dialogue |
| AI Evaluation Engine | Groq `llama-3.1-8b-instant` (temp 0.2) | Deterministic scoring with JSON enforcement |
| Speech Input | Web Speech API `en-IN` | Zero cost, browser-native, auto-restart on silence |
| Speech Output | Web Speech Synthesis + `waitForVoices()` | Zero cost, premium Chrome neural voice |
| Styling | Vanilla CSS glassmorphism | No framework bloat, full visual control |
| PDF Export | `window.print()` + print CSS | Zero dependencies, clean A4 layout |
| Deployment | Vercel | One-click, auto-deploys on push |

---

## Evaluation Dimensions

Every candidate is graded on 5 soft-skill dimensions extracted exclusively from the real interview transcript:

| Dimension | What It Measures |
|-----------|-----------------|
| **Communication Clarity** | Can they explain concepts simply and coherently? |
| **Warmth & Patience** | Do they sound caring, kind, and student-first? |
| **Teaching Ability** | Can they break down a concept a young child would understand? |
| **Student Empathy** | Do they understand how students feel when stuck? |
| **English Fluency** | Is their language clear, fluent, and professional? |

**Scoring Guide:** `1–3` = Poor, `4–5` = Below Average, `6–7` = Average, `8–9` = Good, `10` = Exceptional

**Verdict:** `1–4` = Not Recommend · `5–6` = Borderline · `7–8` = Recommend · `9–10` = Strong Recommend
