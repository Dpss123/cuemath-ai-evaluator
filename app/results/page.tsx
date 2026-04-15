"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Dimension = {
  name: string;
  score: number;
  summary: string;
  quote: string;
  improvement: string;
};

type Assessment = {
  candidateName: string;
  overallVerdict: string;
  overallScore: number;
  hiringManagerSummary: string;
  dimensions: Dimension[];
};

function SparkLine({ score }: { score: number }) {
  // Generate random looking spark sizes that average around the score
  const variance = score > 8 ? 2 : 4;
  const bars = Array.from({ length: 9 }).map((_, i) => {
    const val = Math.max(2, Math.min(10, score + (Math.random() * variance * 2 - variance)));
    return Math.round((val / 10) * 28); // max 28px height
  });

  return (
    <div className="metric-spark">
      {bars.map((h, i) => (
        <div key={i} className="spark-bar" style={{ height: h + "px" }} />
      ))}
    </div>
  );
}

function Waveform() {
  const [heights, setHeights] = useState([12,18,28,22,35,48,42,55,38,62,70,58,65,72,60,52,45,38,50,44,36,28,42,55,48,60,68,58,45,38,52,46,40,30,44,56,50,62,70,55,48,38,42,30,22,18,28,35,25,18]);
  const tRef = useRef(0);

  useEffect(() => {
    const orig = [...heights];
    const interval = setInterval(() => {
      tRef.current += 1;
      const t = tRef.current;
      setHeights(prev => prev.map((_, i) => {
        if (i > 8 && i < 38) {
          return Math.max(6, Math.round(orig[i] + Math.sin(t * 0.15 + i * 0.4) * 8));
        }
        return orig[i];
      }));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="waveform">
      {heights.map((h, i) => {
        const isActive = i > 8 && i < 38;
        const color = isActive
          ? `rgba(6,182,212,${0.4 + (h/70)*0.6})`
          : 'rgba(100,116,139,0.25)';
        return (
          <div key={i} className="wv-bar" style={{
            width: "5px", height: `${h}px`, background: color
          }} />
        );
      })}
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("Analyzing your interview...");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [activeTab, setActiveTab] = useState("Live Session");
  const [candidateEmail, setCandidateEmail] = useState("");

  useEffect(() => {
    const sessionMessages = sessionStorage.getItem("interview_messages");
    const name = sessionStorage.getItem("candidate_name");
    const email = sessionStorage.getItem("candidate_email") || "Not Provided";

    if (!sessionMessages || !name) {
      router.push("/");
      return;
    }

    setCandidateEmail(email);
    setMessages(JSON.parse(sessionMessages));

    const loaders = [
      "Running semantic analysis...",
      "Extracting transcript features...",
      "Scoring communication clarity...",
      "Generating diagnostic scorecard...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < loaders.length) setLoadingMsg(loaders[i]);
    }, 1500);

    fetch("/api/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: JSON.parse(sessionMessages),
        candidateName: name
      })
    })
      .then(r => r.json())
      .then(data => {
        clearInterval(interval);
        if (data.error) { setError(data.error); setLoading(false); return; }
        setAssessment(data);
        setLoading(false);
      })
      .catch(() => {
        clearInterval(interval);
        setError("Failed to get assessment. Please try again.");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1117" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "2px solid #1f2937", borderTopColor: "#06b6d4", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
          <p style={{ color: "#64748b", fontSize: 13, fontFamily: "monospace" }}>{loadingMsg}</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1117", color: "#f1f5f9" }}>
        <div style={{ textAlign: "center" }}>
          <h2>Assessment Failed</h2>
          <p style={{ color: "#ef4444", marginTop: 10 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const getInitials = (name: string) => name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  const highestDim = [...assessment.dimensions].sort((a,b) => b.score - a.score)[0];
  
  // Custom Status colors based on verdict
  let statusColor = "#06b6d4"; // blue-ish
  let statusBg = "rgba(6,182,212,0.12)";
  let statusBorder = "rgba(6,182,212,0.25)";
  if (assessment.overallVerdict === "Strong Recommend" || assessment.overallVerdict === "Recommend") {
    statusColor = "#10b981"; statusBg = "rgba(16,185,129,0.12)"; statusBorder = "rgba(16,185,129,0.25)";
  } else if (assessment.overallVerdict === "Borderline") {
    statusColor = "#f59e0b"; statusBg = "rgba(245,158,11,0.12)"; statusBorder = "rgba(245,158,11,0.25)";
  } else {
    statusColor = "#ef4444"; statusBg = "rgba(239,68,68,0.12)"; statusBorder = "rgba(239,68,68,0.25)";
  }

  const downloadResults = () => {
    window.print();
  };

  return (
    <div className="dash-wrapper">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; }
        @media print {
          @page { size: landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #0d1117 !important; }
          .topbar { display: none !important; }
          .end-btn, .export-btn { display: none !important; }
          .content { padding: 20px !important; max-width: 100% !important; }
          .dash { min-height: auto !important; }
          .wave-card .shortlist-btn { display: none !important; }
          .print-header { display: flex !important; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #1f2937; align-items: center; justify-content: space-between; }
          .page-title { display: none !important; }
        }
        .print-header { display: none; }
        .dash { background: #0d1117; border-radius: 12px; overflow: hidden; font-family: 'Syne', system-ui, sans-serif; color: #e2e8f0; min-height: 100vh; }
        .topbar { background: #111827; border-bottom: 1px solid #1f2937; padding: 0 20px; display: flex; align-items: center; gap: 0; height: 52px; user-select: none; }
        .logo { display: flex; align-items: center; gap: 8px; margin-right: 32px; cursor: pointer; }
        .logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #06b6d4, #3b82f6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; flex-shrink: 0; }
        .logo-text { font-size: 11px; font-weight: 700; line-height: 1.2; color: #f1f5f9; letter-spacing: 0.02em; }
        .nav { display: flex; gap: 4px; }
        .nav-item { padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #64748b; transition: all 0.15s; }
        .nav-item.active { color: #06b6d4; background: rgba(6,182,212,0.08); border-bottom: 2px solid #06b6d4; border-radius: 0; }
        .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
        .notif { width: 32px; height: 32px; border-radius: 50%; background: #1f2937; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; }
        .notif-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; position: absolute; top: 4px; right: 4px; border: 2px solid #111827; }
        .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; }
        .user-info { text-align: right; }
        .user-name { font-size: 13px; font-weight: 600; color: #f1f5f9; }
        .user-role { font-size: 11px; color: #64748b; }
        
        .content { padding: 24px; max-width: 1400px; margin: 0 auto; }
        .page-title { font-size: 22px; font-weight: 700; color: #f1f5f9; margin-bottom: 16px; letter-spacing: -0.02em; display: flex; justify-content: space-between; align-items: center; }
        .end-btn { background: #ef4444; color: white; border: none; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .end-btn:hover { background: #dc2626; }
        .export-btn { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.25); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .export-btn:hover { background: rgba(59,130,246,0.2); }

        .top-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px; }
        .stat-card { background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 14px 16px; position: relative; }
        .stat-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .stat-label { font-size: 11px; color: #64748b; letter-spacing: 0.04em; }
        .stat-menu { width: 20px; height: 20px; background: rgba(255,255,255,0.05); border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .stat-value { font-size: 26px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.03em; }
        .stat-delta { font-size: 11px; color: #10b981; margin-top: 4px; }

        .main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 14px; }
        @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
        .left-col { display: flex; flex-direction: column; gap: 14px; }

        .wave-card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; }
        .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .card-title { font-size: 14px; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 8px; }
        .candidate-id { color: #06b6d4; }
        .time-tag { font-size: 11px; color: #64748b; margin-top: 2px; }
        .shortlist-btn { background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.25); border-radius: 6px; padding: 4px 10px; font-size: 11px; color: #06b6d4; cursor: pointer; display: flex; align-items: center; gap: 4px; }

        .waveform { height: 80px; display: flex; align-items: center; gap: 2px; margin: 8px 0; overflow: hidden; }
        .wv-bar { border-radius: 2px; flex-shrink: 0; transition: height 0.15s ease; }

        .wave-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .wave-tag { font-size: 11px; padding: 3px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px; }
        .wave-tag::before { content: ''; width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
        .wt-flow { background: rgba(6,182,212,0.1); color: #06b6d4; }
        .wt-flow::before { background: #06b6d4; }
        .wt-inton { background: rgba(59,130,246,0.1); color: #60a5fa; }
        .wt-inton::before { background: #60a5fa; }
        .wt-qual { background: rgba(139,92,246,0.1); color: #a78bfa; }
        .wt-qual::before { background: #a78bfa; }

        .score-card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; }
        .candidate-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #1f2937; }
        .cand-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: white; flex-shrink: 0; box-shadow: 0 0 16px rgba(6,182,212,0.3); }
        .cand-name { font-size: 18px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.01em; }
        .cand-id { font-size: 12px; color: #64748b; margin-top: 4px; }
        .score-big { font-size: 28px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.02em; }
        .score-label { font-size: 11px; color: #64748b; margin-bottom: 2px; }
        .status-badge { padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }

        .metrics-title { font-size: 12px; font-weight: 600; color: #94a3b8; letter-spacing: 0.04em; margin-bottom: 12px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
        .metric-item { background: #0d1117; border: 1px solid #1f2937; border-radius: 10px; padding: 12px 10px; text-align: center; }
        .metric-name { font-size: 11px; color: #64748b; margin-bottom: 8px; line-height: 1.3; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .metric-spark { height: 30px; display: flex; align-items: flex-end; justify-content: center; gap: 2px; margin-bottom: 6px; }
        .spark-bar { width: 4px; border-radius: 2px; background: #06b6d4; opacity: 0.8; }
        .metric-score { font-size: 18px; font-weight: 800; color: #06b6d4; letter-spacing: -0.02em; }

        .right-col { display: flex; flex-direction: column; gap: 14px; }
        .perf-card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; }
        
        .highlight-box { background: rgba(6,182,212,0.06); border: 1px solid rgba(6,182,212,0.2); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
        .hl-label { font-size: 10px; color: #64748b; margin-bottom: 8px; letter-spacing: 0.05em; font-weight: 700; }
        .hl-score { font-size: 38px; font-weight: 800; color: #06b6d4; letter-spacing: -0.04em; line-height: 1; }
        .hl-icon { float: right; width: 36px; height: 36px; background: rgba(6,182,212,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; }

        .evidence-list { display: flex; flex-direction: column; gap: 12px; }
        .evi-item { border-bottom: 1px solid #1f2937; padding-bottom: 12px; }
        .evi-item:last-child { border-bottom: none; padding-bottom: 0; }
        .evi-label { font-size: 11px; font-weight: 700; color: #94a3b8; display: flex; justify-content: space-between; margin-bottom: 6px; }
        .evi-quote { font-size: 13px; font-style: italic; color: #cbd5e1; border-left: 2px solid #3b82f6; padding-left: 10px; line-height: 1.5; margin-bottom: 6px; }
        .evi-improve { font-size: 12px; color: #ef4444; display: flex; gap: 4px; }
        
        .score-block { text-align: center; margin-right: 24px; border-right: 1px solid #1f2937; padding-right: 24px; }
        .status-block { text-align: center; min-width: 100px; }

        @media (max-width: 768px) {
          .topbar { padding: 12px 20px; height: auto; flex-wrap: wrap; justify-content: space-between; }
          .logo { margin-right: 0; }
          .nav { order: 3; width: 100%; overflow-x: auto; padding-bottom: 8px; margin-top: 12px; border-top: 1px solid #1f2937; padding-top: 12px; justify-content: flex-start; }
          .content { padding: 16px; }
          .page-title { flex-direction: column; align-items: flex-start; gap: 12px; font-size: 18px; }
          .end-btn { width: 100%; text-align: center; padding: 10px; }
          .top-row { grid-template-columns: 1fr; }
          
          .candidate-row { flex-wrap: wrap; gap: 20px; border-bottom: none; padding-bottom: 0; }
          .score-block { margin-right: 0; border-right: none; padding-right: 0; text-align: left; border-top: 1px solid #1f2937; padding-top: 20px; width: 100%; display: flex; justify-content: space-between; align-items: center; }
          .status-block { width: 100%; text-align: left; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #1f2937; padding-bottom: 20px; }
          .score-big { font-size: 24px; }
          
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .highlight-box { margin-bottom: 24px; }
        }
      `}</style>

      <div className="dash">
        <div className="topbar">
          <div className="logo" onClick={() => router.push("/")}>
            <div className="logo-icon">IQ</div>
            <div className="logo-text">CUEMATH<br/>EVALUATOR</div>
          </div>
          <div className="nav">
            <div className={`nav-item ${activeTab === 'Live Session' ? 'active' : ''}`} onClick={() => setActiveTab('Live Session')}>Live Session</div>
            <div className={`nav-item ${activeTab === 'Candidate Pool' ? 'active' : ''}`} onClick={() => setActiveTab('Candidate Pool')}>Candidate Pool</div>
            <div className={`nav-item ${activeTab === 'Analytics' ? 'active' : ''}`} onClick={() => setActiveTab('Analytics')}>Analytics</div>
          </div>
          <div className="topbar-right">
            <div className="notif">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <div className="notif-dot"></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="avatar">HR</div>
              <div className="user-info">
                <div className="user-name">Recruitment Team</div>
                <div className="user-role">Cuemath Admin</div>
              </div>
            </div>
          </div>
        </div>

        <div className="content">
          {activeTab === "Live Session" ? (
            <>
              <div className="page-title">
                <span>Interview Diagnostics</span>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="export-btn" onClick={downloadResults}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export PDF
                  </button>
                  <button className="end-btn" onClick={() => router.push("/")}>End Session</button>
                </div>
              </div>

              <div className="print-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="logo-icon" style={{width: 44, height: 44, fontSize: 18}}>IQ</div>
                  <div>
                    <div style={{fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em'}}>Cuemath Evaluator</div>
                    <div style={{fontSize: 11, color: '#06b6d4', letterSpacing: '0.15em', fontWeight: 700}}>OFFICIAL CANDIDATE DIAGNOSTIC REPORT</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{fontSize: 16, fontWeight: 800, color: '#f1f5f9'}}>{assessment.candidateName}</div>
                  <div style={{fontSize: 13, color: '#64748b', marginTop: 2}}>{candidateEmail}</div>
                  <div style={{fontSize: 11, color: '#475569', marginTop: 4}}>Generated on {new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                </div>
              </div>

          <div className="top-row">
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">System Confidence</div>
                <div className="stat-menu"><svg width="10" height="10" viewBox="0 0 24 24" fill="#64748b"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></div>
              </div>
              <div className="stat-value">High</div>
              <div className="stat-delta">AI Processing Complete</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Hiring Manager Summary</div>
                <div className="stat-menu"><svg width="10" height="10" viewBox="0 0 24 24" fill="#64748b"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></div>
              </div>
              <div style={{ fontSize: 13, color: "#f1f5f9", lineHeight: 1.5, marginTop: 4 }}>
                {assessment.hiringManagerSummary}
              </div>
            </div>
          </div>

          <div className="main-grid">
            <div className="left-col">
              
              <div className="score-card">
                <div className="card-title" style={{ marginBottom: 16 }}>Candidate Scorecard</div>
                <div className="candidate-row">
                  <div className="cand-avatar">{getInitials(assessment.candidateName)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="cand-name">{assessment.candidateName}</div>
                    <div className="cand-id">{candidateEmail} &nbsp;•&nbsp; CANDIDATE ID: #{Math.floor(Math.random()*9000)+1000}</div>
                  </div>
                  <div className="score-block">
                    <div className="score-label">OVERALL SCORE</div>
                    <div className="score-big">{assessment.overallScore}<span style={{fontSize:16, color: "#64748b"}}>/10</span></div>
                  </div>
                  <div className="status-block">
                    <div className="score-label">VERDICT</div>
                    <div className="status-badge" style={{ color: statusColor, background: statusBg, border: `1px solid ${statusBorder}` }}>
                      {assessment.overallVerdict}
                    </div>
                  </div>
                </div>
                
                <div className="metrics-title">PERFORMANCE METRICS</div>
                <div className="metrics-grid">
                  {assessment.dimensions.map((dim, idx) => (
                    <div className="metric-item" key={idx}>
                      <div className="metric-name" title={dim.name}>{dim.name}</div>
                      <SparkLine score={dim.score} />
                      <div className="metric-score">{dim.score}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="wave-card">
                <div className="card-header">
                  <div>
                    <div className="card-title">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      Transcript Diagnostics
                    </div>
                    <div className="time-tag">Audio successfully processed & analyzed</div>
                  </div>
                  <div className="shortlist-btn" onClick={() => setShowLog(true)}>View Full Log ▾</div>
                </div>
                <Waveform />
                <div className="wave-tags">
                  <div className="wave-tag wt-flow">Speech Flow Recognized</div>
                  <div className="wave-tag wt-inton">Semantic Context Extracted</div>
                  <div className="wave-tag wt-qual">Acoustic Clarity High</div>
                </div>
              </div>
            </div>

            <div className="right-col">
              <div className="perf-card">
                <div className="card-title" style={{ marginBottom: 12 }}>Qualitative Analysis</div>
                
                <div className="highlight-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className="hl-label">STRONGEST TRAIT</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <div className="hl-score">{highestDim.score}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{highestDim.name}</div>
                      </div>
                    </div>
                    <div className="hl-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                  </div>
                </div>

                <div className="metrics-title" style={{ marginTop: 24 }}>EVIDENCE & FEEDBACK</div>
                <div className="evidence-list">
                  {assessment.dimensions.map((dim, i) => (
                    <div className="evi-item" key={i}>
                      <div className="evi-label">
                        <span>{dim.name}</span>
                        <span style={{ color: "#06b6d4" }}>{dim.score}/10</span>
                      </div>
                      <div className="evi-quote">&quot;{dim.quote}&quot;</div>
                      {dim.improvement && (
                        <div className="evi-improve">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginTop: 2}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          <span>{dim.improvement}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </>
          ) : activeTab === "Candidate Pool" ? (
            <div style={{ padding: "80px 0", textAlign: "center", animation: "fadeUp 0.3s ease forwards" }}>
              <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }`}</style>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <h2 style={{ color: "#f1f5f9", marginBottom: 8, fontSize: 24, fontWeight: 700 }}>Candidate Database</h2>
              <p style={{ color: "#64748b", lineHeight: 1.6 }}>Your historical candidate records will appear here.<br/>Please connect your ATS API via Settings to bulk-sync past interviews.</p>
            </div>
          ) : (
            <div style={{ padding: "80px 0", textAlign: "center", animation: "fadeUp 0.3s ease forwards" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
              <h2 style={{ color: "#f1f5f9", marginBottom: 8, fontSize: 24, fontWeight: 700 }}>Global Analytics Engine</h2>
              <p style={{ color: "#64748b", lineHeight: 1.6 }}>Aggregate hiring metrics and dimension trends require at least 5 completed assessments.<br/>Complete more interviews to unlock this dashboard!</p>
            </div>
          )}
        </div>
      </div>

      {showLog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(8px)" }}>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
             <div style={{ padding: "16px 24px", borderBottom: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
               <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                 Raw Interview Transcript
               </div>
               <button onClick={() => setShowLog(false)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 28, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="#f1f5f9"} onMouseLeave={e => e.currentTarget.style.color="#64748b"}>×</button>
             </div>
             <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ padding: 16, borderRadius: 12,
                    background: m.role === "assistant" ? "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(59,130,246,0.05))" : "rgba(255,255,255,0.03)",
                    borderLeft: `4px solid ${m.role === "assistant" ? "#06b6d4" : "#64748b"}` 
                  }}>
                    <div style={{ fontSize: 11, color: m.role === "assistant" ? "#06b6d4" : "#94a3b8", fontWeight: 800, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.05em" }}>
                      {m.role === "assistant" ? "AI Interviewer" : assessment.candidateName}
                    </div>
                    <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.6 }}>{m.content}</div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

