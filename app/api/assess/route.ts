import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GROQ_API_KEY } from "@/lib/config";

export async function POST(req: NextRequest) {
  const groq = new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  try {
    const { messages, candidateName } = await req.json();

    const transcript = messages.map((m: any) => (
      `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`
    )).join("\n\n");

    const prompt = `You are an expert senior HR evaluator at Cuemath, a premium online math education platform for students aged 6-18.

You have just conducted a real live voice interview with a tutor candidate. Below is the COMPLETE, VERBATIM transcript of everything that was said.

Candidate Name: ${candidateName}

=== FULL INTERVIEW TRANSCRIPT ===
${transcript}
=== END OF TRANSCRIPT ===

YOUR TASK: Read the transcript above carefully. Evaluate ONLY what the candidate actually said. Do NOT invent answers. Do NOT use example values. Your scores must be directly justified by real evidence from the transcript above.

SCORING GUIDE (be honest and strict):
- 1-3: Poor. The candidate barely responded, gave one-word answers, or said nothing meaningful.
- 4-5: Below average. Answered but very vaguely, showed little communication skill.
- 6-7: Average. Showed some warmth or clarity but room for improvement.
- 8-9: Good. Clear, empathetic, well-communicated answers.
- 10: Exceptional. Truly stood out in this dimension.

IMPORTANT RULES:
1. If the candidate gave very short, vague, or no answers — give LOW scores (1-4). Do NOT default to 7 or 8.
2. Every "quote" field MUST be an actual verbatim quote from the transcript above. If no useful quote exists, write "No relevant response given."
3. The "summary" must honestly reflect what they said, not what an ideal candidate would say.
4. The overallScore must be the true mathematical average of the 5 dimension scores (to 1 decimal place).
5. The verdict must match the score: 1-4="Not Recommend", 5-6="Borderline", 7-8="Recommend", 9-10="Strong Recommend"
6. The hiringManagerSummary must explicitly state whether this candidate should advance to the second round, based on their actual performance.

Evaluate on these 5 dimensions:
- Communication Clarity: How well did they explain things? Were they clear and structured?
- Warmth & Patience: Did they sound caring, kind, student-first?
- Teaching Ability: Could they break down concepts in a way a child would understand?
- Student Empathy: Did they show understanding of how students feel when stuck?
- English Fluency: Was their English clear, fluent, and professional?

Respond ONLY in this exact JSON format. Replace ALL placeholder values with your REAL evaluation:
{
  "candidateName": "${candidateName}",
  "overallVerdict": "YOUR_REAL_VERDICT_HERE",
  "overallScore": 0.0,
  "hiringManagerSummary": "YOUR_REAL_2_SENTENCE_SUMMARY_HERE.",
  "dimensions": [
    {
      "name": "Communication Clarity",
      "score": 0,
      "summary": "YOUR_REAL_SUMMARY_BASED_ON_TRANSCRIPT",
      "quote": "ACTUAL_VERBATIM_QUOTE_FROM_TRANSCRIPT",
      "improvement": "ONE_SPECIFIC_ACTIONABLE_IMPROVEMENT"
    },
    {
      "name": "Warmth & Patience",
      "score": 0,
      "summary": "YOUR_REAL_SUMMARY_BASED_ON_TRANSCRIPT",
      "quote": "ACTUAL_VERBATIM_QUOTE_FROM_TRANSCRIPT",
      "improvement": "ONE_SPECIFIC_ACTIONABLE_IMPROVEMENT"
    },
    {
      "name": "Teaching Ability",
      "score": 0,
      "summary": "YOUR_REAL_SUMMARY_BASED_ON_TRANSCRIPT",
      "quote": "ACTUAL_VERBATIM_QUOTE_FROM_TRANSCRIPT",
      "improvement": "ONE_SPECIFIC_ACTIONABLE_IMPROVEMENT"
    },
    {
      "name": "Student Empathy",
      "score": 0,
      "summary": "YOUR_REAL_SUMMARY_BASED_ON_TRANSCRIPT",
      "quote": "ACTUAL_VERBATIM_QUOTE_FROM_TRANSCRIPT",
      "improvement": "ONE_SPECIFIC_ACTIONABLE_IMPROVEMENT"
    },
    {
      "name": "English Fluency",
      "score": 0,
      "summary": "YOUR_REAL_SUMMARY_BASED_ON_TRANSCRIPT",
      "quote": "ACTUAL_VERBATIM_QUOTE_FROM_TRANSCRIPT",
      "improvement": "ONE_SPECIFIC_ACTIONABLE_IMPROVEMENT"
    }
  ]
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    });
    const raw = response.choices[0].message.content || "";

    // Strip markdown code fences if Gemini wraps the JSON
    const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Assessment error:", err);
    return NextResponse.json({ error: "Assessment failed. Please try again." }, { status: 500 });
  }
}
