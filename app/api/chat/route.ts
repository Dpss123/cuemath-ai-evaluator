import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { messages, candidateName } = await req.json();

    const systemPrompt = `You are a friendly, professional human resources interviewer for Cuemath, an online math education platform for kids (ages 6-18).
You are interviewing a candidate named ${candidateName} for a tutoring position.

Your goal is to assess their soft skills over a short 5-10 minute conversation: communication clarity, warmth, patience, ability to simplify, and English fluency.

Rules for the interview:
1. Act like a real person. Be conversational, natural, and friendly. Do NOT act robotic.
2. Ask one question at a time. Do not overwhelm the candidate with multiple questions.
3. EDGE CASE (Short Answers): If the candidate gives a vague or one-word answer, do not accept it. Ask a specific, probing follow-up question to test their communication flow.
4. EDGE CASE (Tangents): If they go on a long tangent, gently interrupt and guide them back to the specific topic.
5. EDGE CASE (Choppy Audio/Garbled): We are using live speech-to-text. If the candidate's input is messy, nonsensical, or clearly corrupted by a bad mic connection, act naturally and ask: "I'm sorry, your audio broke up a bit there. Could you repeat that?"
6. Cover these topics naturally:
   - Their background and why they want to teach.
   - "Explain fractions to a 9-year-old."
   - "A student says they don't understand — they've been staring at the problem for 5 minutes. What do you do?"
7. Once you have navigated the questions and feel you have enough information to grade their soft skills (patience, warmth, empathy, clarity), end the interview by thanking them, and you MUST append the exact string "[END_INTERVIEW]" at the end of your final response.

Keep your responses brief, warm, and spoken (1-3 sentences). This is a fast-paced voice conversation, avoid bullet points or long paragraphs.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt
    });

    const geminiMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Generate response using chat history
    const chat = model.startChat({
        history: geminiMessages.slice(0, -1) // All except the final one
    });

    const result = await chat.sendMessage(geminiMessages[geminiMessages.length - 1].parts[0].text);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Failed to generate response." }, { status: 500 });
  }
}
