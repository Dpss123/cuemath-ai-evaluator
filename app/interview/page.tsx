"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  [index: number]: { transcript: string };
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type Message = { role: "user" | "assistant"; content: string };

export default function InterviewPage() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("");
  const [phase, setPhase] = useState<"intro" | "speaking_question" | "listening" | "processing" | "done">("intro");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(20).fill(4));
  const [timeLeft, setTimeLeft] = useState(90);
  const [micError, setMicError] = useState("");
  const [aiText, setAiText] = useState(""); // Current question being read

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const barsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const loadedVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const name = sessionStorage.getItem("candidate_name");
    if (!name) { router.push("/"); return; }
    setCandidateName(name);
    
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const loadVoices = () => {
        loadedVoicesRef.current = window.speechSynthesis.getVoices();
      };
      loadVoices();
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [router]);

  const animateBars = useCallback((active: boolean) => {
    if (barsRef.current) clearInterval(barsRef.current);
    if (!active) { setBars(Array(20).fill(12)); return; }
    barsRef.current = setInterval(() => {
      setBars(prev => prev.map(() => active ? Math.random() * 36 + 12 : 12));
    }, 120);
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    if (timerRef.current) clearInterval(timerRef.current);
    animateBars(false);
  }, [animateBars]);

  const speakQuestion = useCallback((questionText: string, onDone: () => void) => {
    if (!synthRef.current) { onDone(); return; }
    synthRef.current.cancel();

    // Clean up text for speech
    const cleanText = questionText.replace(/\[.*\]/g, "");

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 0.95; // Slightly slower feels more conversational
    utter.pitch = 1.0; // Flat pitch helps avoid the robotic "sing-song" default
    utter.volume = 1;
    const voices = loadedVoicesRef.current.length > 0 ? loadedVoicesRef.current : synthRef.current.getVoices();
    
    // Proactively hunt for premium, natural-sounding, or high-definition voices
    const preferred = 
      voices.find(v => v.name.includes("Natural") && v.lang.includes("en")) ||
      voices.find(v => v.name.includes("Google UK English Female")) ||
      voices.find(v => v.name.includes("Google US English")) ||
      voices.find(v => v.name.includes("Aria")) ||
      voices.find(v => v.name.includes("Samantha")) ||
      voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) ||
      voices.find(v => v.lang.startsWith("en-"));
      
    if (preferred) utter.voice = preferred;
    utter.onstart = () => { setIsSpeaking(true); animateBars(true); };
    utter.onend = () => { setIsSpeaking(false); animateBars(false); onDone(); };
    utter.onerror = () => { setIsSpeaking(false); animateBars(false); onDone(); };
    synthRef.current.speak(utter);
  }, [animateBars]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicError("Your browser doesn't support voice input. Please use Chrome."); return; }
    setTranscript("");
    setInterimTranscript("");
    setTimeLeft(90);
    setPhase("listening");
    animateBars(true);

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      if (final) setTranscript(prev => prev + final);
      setInterimTranscript(interim);
    };
    
    recognition.onend = () => {
      if (isListeningRef.current) {
        // Browser aggressively cut off listening due to silence! Auto-restart it!
        try { recognition.start(); } catch { /* ignore */ }
      } else {
        animateBars(false);
      }
    };
    
    recognition.onerror = (e: { error: string }) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setMicError("Mic error: " + e.error + ". Please allow microphone access.");
      }
      animateBars(false);
    };

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    isListeningRef.current = true;
    recognition.start();
  }, [animateBars]);

  const getNextAIResponse = useCallback(async (newMessages: Message[]) => {
    setPhase("processing");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, candidateName })
      });
      const data = await res.json();

      let aiResponse: string = data.text || "Sorry, I missed that. Could you repeat?";
      const isEnd = aiResponse.includes("[END_INTERVIEW]");
      if (isEnd) {
        aiResponse = aiResponse.replace("[END_INTERVIEW]", "").trim();
      }

      const updatedMessages = [...newMessages, { role: "assistant", content: aiResponse } as Message];
      setMessages(updatedMessages);
      setAiText(aiResponse);
      setPhase("speaking_question");

      speakQuestion(aiResponse, () => {
        if (isEnd) {
          sessionStorage.setItem("interview_messages", JSON.stringify(updatedMessages));
          router.push("/results");
        } else {
          setTimeout(() => startListening(), 600);
        }
      });
    } catch (err) {
      console.error(err);
      setMicError("Network error asking AI. Please try again.");
      setPhase("listening"); // Let them re-submit or we could handle it via a button
    }
  }, [candidateName, speakQuestion, startListening, router]);

  const submitAnswer = useCallback(() => {
    stopListening();
    const finalAnswer = transcript.trim() || "(no response recorded)";
    const newMessages = [...messages, { role: "user", content: finalAnswer } as Message];
    setMessages(newMessages);
    getNextAIResponse(newMessages);
  }, [stopListening, transcript, messages, getNextAIResponse]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && phase === "listening") {
      submitAnswer();
    }
  }, [timeLeft, phase, submitAnswer]);

  const handleStartInterview = () => {
    // Initial prompt to start the conversation
    const initPayload: Message[] = [{ role: "user", content: "Hi! I am ready to begin my interview." }];
    setMessages(initPayload);
    getNextAIResponse(initPayload);
  };

  return (
    <main style={{
      position: "relative", zIndex: 1, minHeight: "100vh",
      display: "flex", flexDirection: "column",
      background: "#030712", overflow: "hidden", color: "#f8fafc"
    }}>
      <style>{`
        body { background: #030712; color: #f8fafc; margin: 0; font-family: 'Syne', sans-serif; }
        .hero-glow {
          position: absolute; top: -10%; left: 50%; transform: translateX(-50%); width: 70vw; height: 70vw;
          background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 60%);
          filter: blur(100px); pointer-events: none; z-index: 0;
        }
        .hero-glow-2 {
          position: absolute; bottom: -20%; right: -10%; width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 60%);
          filter: blur(100px); pointer-events: none; z-index: 0;
        }
        .glass-card {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12); border-top-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 32px 64px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .glass-panel {
          background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #6ee7b7, #818cf8);
          box-shadow: 0 12px 30px rgba(110,231,183,0.3), inset 0 2px 0 rgba(255,255,255,0.4);
          border: none; border-radius: 100px; padding: 20px 48px;
          font-size: 16px; font-weight: 800; color: #042f2e;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex; align-items: center; justify-content: center;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .btn-primary:hover {
          transform: translateY(-2px); box-shadow: 0 20px 40px rgba(110,231,183,0.5), inset 0 2px 0 rgba(255,255,255,0.4);
        }
        .btn-confirm {
          background: linear-gradient(135deg, #6ee7b7, #10b981);
          box-shadow: 0 10px 25px rgba(16,185,129,0.3), inset 0 2px 0 rgba(255,255,255,0.3);
          border: none; border-radius: 10px; padding: 14px 28px;
          font-size: 14px; font-weight: 800; color: #0a0a0f;
          cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(16,185,129,0.4); }
        .btn-disabled {
          background: rgba(255,255,255,0.06); color: #64748b; cursor: not-allowed;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 28px;
          font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
        }
      `}</style>

      <div className="hero-glow" />
      <div className="hero-glow-2" />

      {/* Header */}
      <header style={{
        padding: "20px 40px", position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #10b981, #06b6d4)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#000",
            boxShadow: "0 0 20px rgba(16,185,129,0.4)"
          }}>IQ</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>Cuemath Evaluator</span>
        </div>
        {phase !== "intro" && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>
              {candidateName}
            </span>
            <div style={{
              fontSize: 11, fontFamily: "monospace", color: "#6ee7b7",
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
              padding: "6px 14px", borderRadius: 20, letterSpacing: "0.05em",
              display: "flex", alignItems: "center", gap: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6ee7b7", display: "inline-block", boxShadow: "0 0 8px #6ee7b7", animation: "pulse 2s infinite" }} />
              LIVE SESSION
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "20px 24px",
        position: "relative", zIndex: 5
      }}>

        {/* INTRO STATE */}
        {phase === "intro" && (
          <div className="fade-up" style={{ textAlign: "center", maxWidth: 520 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.1))",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", fontSize: 32,
              boxShadow: "0 0 40px rgba(16,185,129,0.15), inset 0 0 20px rgba(255,255,255,0.05)"
            }}>🎙️</div>

            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 12 }}>
              Ready, {candidateName}?
            </h2>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: 32, fontSize: 15 }}>
              Get ready for a <strong style={{ color: "#f8fafc" }}>live voice interview</strong> with our AI.
              It works just like a phone call the AI will ask questions out loud, and you simply
              reply naturally using your microphone. It will listen to you and keep the conversation flowing smoothly!
            </p>

            <div className="glass-panel" style={{
              padding: "16px 20px", marginBottom: 32, textAlign: "left"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "monospace", color: "#fbbf24", marginBottom: 10, letterSpacing: "0.1em" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
                PRE-FLIGHT CHECK
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>
                • Please allow microphone browser permissions<br />
                • Use headphones for the best experience<br />
                • Find a quiet environment to speak clearly<br />
                • The AI interviewer will end the session automatically after 5 to 10 minutes
              </div>
            </div>

            <button onClick={handleStartInterview} className="btn-primary" style={{ width: "100%" }}>
              START INTERVIEW
            </button>
          </div>
        )}

        {/* QUESTION + LISTENING STATE */}
        {(phase === "speaking_question" || phase === "listening" || phase === "processing") && (
          <div style={{ width: "100%", maxWidth: 640 }}>
            {/* AI statement card */}
            <div className="fade-up glass-card" style={{
              borderRadius: 20, padding: "20px 24px", marginBottom: 16, minHeight: 80
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#000",
                  boxShadow: "0 0 16px rgba(16,185,129,0.3)"
                }}>AI</div>
                <div>
                  <p style={{ fontSize: 16, lineHeight: 1.5, fontWeight: 500, letterSpacing: "-0.01em", color: "#f8fafc", margin: 0, marginTop: 4 }}>
                    {aiText || "..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Waveform / status / user section */}
            <div className="glass-card" style={{
              borderRadius: 20, padding: "24px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16
            }}>
              {/* Status label */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: phase === "listening" ? "#ef4444" : phase === "speaking_question" ? "#10b981" : "#64748b",
                  boxShadow: phase === "listening" ? "0 0 16px #ef4444" : phase === "speaking_question" ? "0 0 16px #10b981" : "none",
                  transition: "all 0.3s"
                }} />
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.1em", color: "#94a3b8" }}>
                  {phase === "speaking_question" && "AI IS SPEAKING..."}
                  {phase === "listening" && "LISTENING — SPEAK NOW"}
                  {phase === "processing" && "AI IS THINKING..."}
                </span>
              </div>

              {/* Waveform bars */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, height: 48 }}>
                {bars.map((h, i) => (
                  <div key={i} style={{
                    width: 4, borderRadius: 4,
                    background: phase === "listening"
                      ? `rgba(239, 68, 68, ${0.4 + (h / 60) * 0.6})`
                      : `rgba(16, 185, 129, ${0.3 + (h / 60) * 0.7})`,
                    height: `${Math.max(12, h)}px`,
                    transition: "height 0.15s ease",
                    boxShadow: (phase === "listening" || phase === "speaking_question")
                      ? `0 0 8px ${phase === "listening" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`
                      : "none"
                  }} />
                ))}
              </div>

              {/* Timer (only when listening) */}
              {phase === "listening" && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: -8 }}>
                  <div style={{
                    fontSize: 24, fontWeight: 800, fontFamily: "monospace",
                    color: timeLeft < 20 ? "#ef4444" : timeLeft < 40 ? "#fbbf24" : "#10b981",
                    letterSpacing: "-0.03em", transition: "color 0.3s"
                  }}>
                    {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
                  </div>
                </div>
              )}

              {/* Live transcript */}
              {phase === "listening" && (
                <div style={{
                  width: "100%", background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
                  padding: "12px 16px", minHeight: 60, fontSize: 14,
                  lineHeight: 1.6, color: "#f8fafc", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.3)"
                }}>
                  {transcript || interimTranscript
                    ? <>{transcript}<span style={{ color: "#94a3b8" }}>{interimTranscript}</span></>
                    : <span style={{ color: "#64748b", fontStyle: "italic", fontWeight: 500 }}>Your speech transcription will appear here...</span>
                  }
                </div>
              )}

              {/* Submit button */}
              {phase === "listening" && (
                <button
                  onClick={submitAnswer}
                  className={transcript.trim().length > 5 ? "btn-confirm" : "btn-disabled"}
                >
                  Confirm Answer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
