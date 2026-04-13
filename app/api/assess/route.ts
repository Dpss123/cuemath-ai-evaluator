import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { messages, candidateName } = await req.json();

    const transcript = messages.map((m: any) => (
      `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`
    )).join("\n\n");

    const prompt = `You are an expert interviewer evaluating a tutor candidate for Cuemath, an online math education platform for students ages 6-18.

Candidate name: ${candidateName}

Here is the full interview transcript:
${transcript}

Evaluate the candidate on these 5 dimensions. For each dimension, provide:
1. A score from 1-10
2. A one-line summary (max 12 words)
3. One direct quote from their answer as evidence (keep it under 20 words)
4. One specific improvement suggestion

Dimensions to score:
- Communication Clarity: Can they explain things simply and coherently?
- Warmth & Patience: Do they sound caring, empathetic, student-first?
- Teaching Ability: Can they break down concepts effectively?
- Student Empathy: Do they understand how students feel when stuck?
- English Fluency: Is their language clear and appropriate?

Also provide:
- Overall verdict: "Strong Recommend" / "Recommend" / "Borderline" / "Not Recommend"
- Overall score (average of 5 dimensions, to 1 decimal)
- A 2-sentence hiring manager summary

Respond ONLY in this exact JSON format, no markdown, no extra text:
{
  "candidateName": "${candidateName}",
  "overallVerdict": "Recommend",
  "overallScore": 7.4,
  "hiringManagerSummary": "Two sentences about this candidate for the hiring manager.",
  "dimensions": [
    {
      "name": "Communication Clarity",
      "score": 8,
      "summary": "Explains ideas in a clear, structured way",
      "quote": "Direct quote from their answer here",
      "improvement": "One specific thing they could improve"
    },
    {
      "name": "Warmth & Patience",
      "score": 7,
      "summary": "Shows genuine care for student progress",
      "quote": "Direct quote from their answer here",
      "improvement": "One specific thing they could improve"
    },
    {
      "name": "Teaching Ability",
      "score": 8,
      "summary": "Uses relatable examples to teach concepts",
      "quote": "Direct quote from their answer here",
      "improvement": "One specific thing they could improve"
    },
    {
      "name": "Student Empathy",
      "score": 7,
      "summary": "Acknowledges student frustration thoughtfully",
      "quote": "Direct quote from their answer here",
      "improvement": "One specific thing they could improve"
    },
    {
      "name": "English Fluency",
      "score": 7,
      "summary": "Clear English with occasional hesitations",
      "quote": "Direct quote from their answer here",
      "improvement": "One specific thing they could improve"
    }
  ]
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Assessment error:", err);
    return NextResponse.json({ error: "Assessment failed. Please try again." }, { status: 500 });
  }
}
