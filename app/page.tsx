"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);

  const canStart = name.trim().length > 1 && email.trim().includes("@");

  const handleStart = () => {
    if (!canStart) return;
    sessionStorage.setItem("candidate_name", name.trim());
    sessionStorage.setItem("candidate_email", email.trim());
    router.push("/interview");
  };

  return (
    <main style={{
      position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "#030712", overflow: "hidden"
    }}>
      <style>{`
        body { background: #030712; color: #f8fafc; }
        .hero-glow {
          position: absolute; top: -20%; left: 10%; width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 60%);
          filter: blur(100px); pointer-events: none; z-index: 0;
        }
        .hero-glow-2 {
          position: absolute; bottom: -10%; right: -10%; width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%);
          filter: blur(100px); pointer-events: none; z-index: 0;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #6ee7b7, #818cf8, #6ee7b7);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        @keyframes shimmer { to { background-position: 200% center; } }
        
        .pulse-badge {
          position: relative; display: inline-flex; align-items: center; gap: 8px;
          background: rgba(110,231,183,0.05); border: 1px solid rgba(110,231,183,0.2);
          border-radius: 100px; padding: 6px 16px; font-size: 12px; font-family: "monospace";
          color: #6ee7b7; letter-spacing: 0.08em; text-transform: uppercase;
        }
        .pulse-badge::before {
          content: ''; position: absolute; inset: -1px; border-radius: 100px;
          background: linear-gradient(90deg, rgba(110,231,183,0), rgba(110,231,183,0.5), rgba(110,231,183,0));
          z-index: -1; animation: slideGlow 3s ease-in-out infinite; opacity: 0;
        }
        @keyframes slideGlow { 
          0% { opacity: 0; transform: translateX(-100%); } 
          50% { opacity: 1; transform: translateX(0%); } 
          100% { opacity: 0; transform: translateX(100%); } 
        }

        .glass-card {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-top-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 32px 64px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .input-premium {
          background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px; padding: 18px 20px; font-size: 15px; font-weight: 500;
          color: #f8fafc; outline: none; width: 100%; transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
        .input-premium:focus { 
          background: rgba(0,0,0,0.6); border-color: #6ee7b7; 
          box-shadow: 0 0 0 4px rgba(110,231,183,0.15), inset 0 2px 4px rgba(0,0,0,0.3); 
        }
        .input-premium::placeholder { color: #64748b; font-weight: 500; }

        .btn-premium {
          margin-top: 12px;
          border: 1px solid transparent; border-radius: 12px; padding: 18px 24px;
          font-size: 15px; font-weight: 800; color: #0a0a0f;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative; overflow: hidden; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .btn-premium:disabled { 
          background: rgba(255,255,255,0.06); color: #64748b; cursor: not-allowed; 
          border: 1px solid rgba(255,255,255,0.08); 
        }
        .btn-premium:not(:disabled) {
          background: linear-gradient(135deg, #6ee7b7, #10b981);
          box-shadow: 0 10px 25px rgba(16,185,129,0.3), inset 0 2px 0 rgba(255,255,255,0.3);
        }
        .btn-premium:not(:disabled):hover {
          transform: translateY(-2px); box-shadow: 0 15px 35px rgba(16,185,129,0.4), inset 0 2px 0 rgba(255,255,255,0.3);
        }
        .btn-premium:not(:disabled):active { transform: translateY(1px); }

        .btn-primary {
          background: linear-gradient(135deg, #6ee7b7, #818cf8);
          box-shadow: 0 12px 30px rgba(110,231,183,0.3), inset 0 2px 0 rgba(255,255,255,0.4);
          border: none; border-radius: 100px; padding: 20px 48px;
          font-size: 16px; font-weight: 800; color: #042f2e;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex; align-items: center; letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .btn-primary:hover {
          transform: translateY(-2px); box-shadow: 0 20px 40px rgba(110,231,183,0.5), inset 0 2px 0 rgba(255,255,255,0.4);
        }
        
        @keyframes slideDownForm {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .form-reveal {
          animation: slideDownForm 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top center;
        }

        .step-card {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.4) 100%);
          border: 1px solid rgba(255,255,255,0.08); border-top-color: rgba(255,255,255,0.15);
          border-radius: 20px; padding: 32px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative; overflow: hidden;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 40px -10px rgba(0,0,0,0.5);
        }
        .step-card:hover {
          background: linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.6) 100%); 
          border-color: rgba(110,231,183,0.3);
          transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .process-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .process-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .process-grid { grid-template-columns: 1fr; } }
        
        .mockup-wrapper {
          position: relative; border-radius: 24px; padding: 8px;
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
          backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 40px 100px -20px rgba(0,0,0,1), 0 0 60px rgba(99,102,241,0.2);
          transform: perspective(1200px) rotateY(-8deg) rotateX(4deg);
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .mockup-wrapper:hover {
          transform: perspective(1200px) rotateY(-2deg) rotateX(1deg) translateY(-10px);
          box-shadow: 0 50px 120px -20px rgba(0,0,0,1), 0 0 80px rgba(99,102,241,0.3);
        }
      `}</style>

      <div className="hero-glow" />
      <div className="hero-glow-2" />

      <header style={{
        padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)", position: "relative", zIndex: 10
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
        <div style={{
          fontSize: 11, fontFamily: "monospace", color: "#94a3b8",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)",
          padding: "6px 14px", borderRadius: 20, letterSpacing: "0.05em",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6ee7b7", display: "inline-block", boxShadow: "0 0 8px #6ee7b7" }} />
          SYSTEM ONLINE
        </div>
      </header>

      <div style={{
        width: "100%", padding: "60px 40px", display: "flex", justifyContent: "center"
      }}>
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "flex-start",
          justifyContent: "space-between", gap: "60px", maxWidth: 1200, width: "100%",
          position: "relative", zIndex: 1
        }}>
          {/* Left Column Component */}
          <div style={{ flex: "1 1 400px", maxWidth: 520, paddingTop: "20px" }}>
            <div className="fade-up pulse-badge" style={{ marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6ee7b7", boxShadow: "0 0 10px #6ee7b7" }} />
              Intelligent Tutor Screening
            </div>

            <h1 className="fade-up" style={{
              fontSize: "clamp(42px, 5vw, 68px)", fontWeight: 800,
              letterSpacing: "-0.04em", lineHeight: 1.05,
              marginBottom: 20, animationDelay: "0.1s", opacity: 0
            }}>
              Your Interview.<br />
              <span className="shimmer-text">AI-Powered.</span>
            </h1>

            <p className="fade-up" style={{
              fontSize: 17, color: "#94a3b8", lineHeight: 1.6,
              marginBottom: 40, maxWidth: 480,
              animationDelay: "0.2s", opacity: 0
            }}>
              A 5 to 10 minute interactive voice conversation evaluating your teaching clarity, empathy, and mathematical communication. <strong>No human required.</strong>
            </p>

            {!showForm ? (
              <div className="fade-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  Begin Evaluation
                </button>
                <div style={{ marginTop: 16, fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#10b981" }}>✔</span> Requires microphone access
                </div>
              </div>
            ) : (
              <div className="form-reveal glass-card" style={{
                borderRadius: 20, padding: "32px", width: "100%", maxWidth: 460
              }}>
                <p style={{
                  fontSize: 12, color: "#94a3b8", marginBottom: 24, fontWeight: 700,
                  textAlign: "left", letterSpacing: "0.1em", textTransform: "uppercase"
                }}>Candidate Authentication</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <input
                    type="text" placeholder="Full Legal Name" value={name}
                    onChange={e => setName(e.target.value)}
                    className="input-premium"
                    autoFocus
                  />
                  <input
                    type="email" placeholder="Work Email Address" value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-premium"
                    onKeyDown={e => e.key === "Enter" && handleStart()}
                  />
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button
                      onClick={() => setShowForm(false)}
                      style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12, padding: "18px 24px", color: "#94a3b8", cursor: "pointer",
                        fontWeight: 700, fontSize: 13, textTransform: "uppercase", transition: "all 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    >Cancel</button>

                    <button
                      onClick={handleStart} disabled={!canStart}
                      className="btn-premium" style={{ flex: 1, margin: 0 }}
                    >Initialize Session</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column Component: Dashboard Mockup Image */}
          <div className="fade-up" style={{
            flex: "1 1 500px", maxWidth: 680,
            animationDelay: "0.2s", opacity: 0
          }}>
            <div className="mockup-wrapper">
              <img
                src="/dashboard_mockup.png"
                alt="AI Platform Dashboard Interface"
                style={{
                  width: "100%", height: "auto", display: "block",
                  borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)"
                }}
              />
              {/* Floating badges on top of mockup */}
              <div style={{ position: "absolute", top: -20, right: -20, background: "rgba(15,23,42,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", animation: "float 6s ease-in-out infinite" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "conic-gradient(#10b981 92%, #334155 0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#10b981" }}>9.2</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.05em" }}>OVERALL SCORE</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>Strong Recommend</div>
                </div>
              </div>
            </div>

            <style>{`@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }`}</style>
          </div>
        </div>
      </div>

      <section style={{
        padding: "80px 40px", borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,0,0,0.2)", position: "relative", zIndex: 1
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
            <div>
              <p style={{ fontSize: 13, color: "#10b981", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>The Process</p>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>Automated Evaluation Workflow</h2>
            </div>
          </div>

          <div className="process-grid">
            {[
              { step: "01", icon: "👤", title: "Identity Verification", desc: "Secure input of candidate credentials." },
              { step: "02", icon: "🎙️", title: "Contextual Q&A", desc: "AI conducts a dynamic, multi-stage verbal assessment." },
              { step: "03", icon: "🧠", title: "Semantic Parsing", desc: "Real-time speech-to-text semantic analysis." },
              { step: "04", icon: "📊", title: "Diagnostic Report", desc: "Instant scoring across 5 key teaching metrics." },
            ].map((item, i) => (
              <div key={item.step} className="step-card fade-up" style={{ animationDelay: `${i * 0.1 + 0.4}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 28, boxShadow: "inset 0 0 20px rgba(16,185,129,0.1)"
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>{item.step}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em" }}>{item.title}</div>
                <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
