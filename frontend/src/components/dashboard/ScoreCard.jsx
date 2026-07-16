import React, { useEffect, useRef, useCallback } from "react";

const CIRC = 2 * Math.PI * 38;

const DATA_DEFAULTS = {
  overall: 68,
  destination_name: "Carles, Iloilo",
  score_label: "Developing NomadReady Destination",
  explanation:
    "A scenic coastal municipality with emerging tourism appeal, moderate connectivity, and basic services — promising for digital nomads willing to pioneer off-the-beaten-path living.",
  categories: [
    { name: "Internet & Work Readiness",   score: 45,  color: "#F97316" },
    { name: "Long-Stay Accommodation",     score: 70,  color: "#0D9488" },
    { name: "Safety & Essential Services", score: 75,  color: "#0D9488" },
    { name: "Transport & Access",          score: 70,  color: "#0891B2" },
    { name: "Tourism & Lifestyle Appeal",  score: 100, color: "#059669" },
  ],
};

function resolveData(snapshot) {
  const s = snapshot || {};
  const overallRaw = s.overall_score != null ? Number(s.overall_score) : DATA_DEFAULTS.overall;
  const overall = Number.isFinite(overallRaw) ? Math.max(0, Math.min(100, Math.round(overallRaw))) : DATA_DEFAULTS.overall;

  const rawCats = s.category_scores || {};
  const categories = [
    { name: "Internet & Work Readiness",   score: rawCats.internet_work     ?? s.internet_work_score     ?? DATA_DEFAULTS.categories[0].score, color: "#F97316" },
    { name: "Long-Stay Accommodation",     score: rawCats.accommodation     ?? s.accommodation_score     ?? DATA_DEFAULTS.categories[1].score, color: "#0D9488" },
    { name: "Safety & Essential Services", score: rawCats.safety_services   ?? s.safety_services_score   ?? DATA_DEFAULTS.categories[2].score, color: "#0D9488" },
    { name: "Transport & Access",          score: rawCats.transport         ?? s.transport_score         ?? DATA_DEFAULTS.categories[3].score, color: "#0891B2" },
    { name: "Tourism & Lifestyle Appeal",  score: rawCats.tourism_lifestyle ?? s.tourism_lifestyle_score ?? DATA_DEFAULTS.categories[4].score, color: "#059669" },
  ].map((c) => ({ ...c, score: Math.max(0, Math.min(100, Math.round(Number(c.score) || 0))) }));

  return {
    overall,
    destination_name: s.destination_name || DATA_DEFAULTS.destination_name,
    score_label: s.score_label || DATA_DEFAULTS.score_label,
    explanation: s.explanation || DATA_DEFAULTS.explanation,
    categories,
  };
}

function animateCounter(el, target, ms) {
  if (!el) return;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / ms, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
}

// hideOverallScore: when true, suppresses the Overall Score card at the bottom
// (Dashboard renders it separately in the right column via OverallScoreCard)
export default function ScoreCard({ snapshot = null, hideOverallScore = false }) {
  const data = resolveData(snapshot);

  const arcRef      = useRef(null);
  const numRef      = useRef(null);
  const titleRef    = useRef(null);
  const descRef     = useRef(null);
  const badgeRef    = useRef(null);
  const dividerRef  = useRef(null);
  const bkHeadRef   = useRef(null);
  const trendRef    = useRef(null);
  const sparkRef    = useRef(null);
  const sparkDotRef = useRef(null);
  const barRowRefs  = useRef([]);
  const barFillRefs = useRef([]);
  const barScoreRefs= useRef([]);
  const replayBtnRef= useRef(null);
  const timers      = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  const runAnimation = useCallback(() => {
    clearTimers();

    const arc = arcRef.current;
    if (arc) {
      arc.style.transition = "none";
      arc.style.strokeDasharray = `0 ${CIRC}`;
    }

    const num = numRef.current;
    if (num) { num.style.opacity = "0"; num.style.transform = "scale(0.6)"; num.textContent = "0"; }

    [titleRef, descRef, badgeRef, dividerRef, bkHeadRef, trendRef].forEach((r) => {
      if (r.current) r.current.style.opacity = "0";
    });
    if (titleRef.current) titleRef.current.style.transform = "translateX(-8px)";
    if (badgeRef.current) badgeRef.current.style.transform = "translateY(4px)";

    if (sparkRef.current) sparkRef.current.style.strokeDashoffset = "200";
    if (sparkDotRef.current) sparkDotRef.current.style.opacity = "0";

    barRowRefs.current.forEach((r) => {
      if (!r) return;
      r.style.transition = "none";
      r.style.opacity = "0";
      r.style.transform = "translateX(-12px)";
    });
    barFillRefs.current.forEach((r) => { if (r) r.style.width = "0%"; });
    barScoreRefs.current.forEach((r) => { if (r) r.textContent = "—"; });

    later(() => {
      if (!arc) return;
      arc.style.transition = "stroke-dasharray 1.4s cubic-bezier(0.34,1.1,0.64,1)";
      const d = (data.overall / 100) * CIRC;
      arc.style.strokeDasharray = `${d} ${CIRC - d}`;
    }, 80);

    later(() => {
      if (!num) return;
      num.style.transition = "opacity 0.4s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)";
      num.style.opacity = "1";
      num.style.transform = "scale(1)";
      animateCounter(num, data.overall, 900);
    }, 860);

    later(() => {
      if (!titleRef.current) return;
      titleRef.current.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      titleRef.current.style.opacity = "1";
      titleRef.current.style.transform = "translateX(0)";
    }, 180);

    later(() => {
      if (!descRef.current) return;
      descRef.current.style.transition = "opacity 0.5s ease";
      descRef.current.style.opacity = "1";
    }, 360);

    later(() => {
      if (!badgeRef.current) return;
      badgeRef.current.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      badgeRef.current.style.opacity = "1";
      badgeRef.current.style.transform = "translateY(0)";
    }, 600);

    later(() => {
      if (dividerRef.current) { dividerRef.current.style.transition = "opacity 0.4s ease"; dividerRef.current.style.opacity = "1"; }
      if (bkHeadRef.current)  { bkHeadRef.current.style.transition  = "opacity 0.4s ease"; bkHeadRef.current.style.opacity  = "1"; }
    }, 700);

    data.categories.forEach((_, i) => {
      later(() => {
        const row = barRowRefs.current[i];
        if (row) {
          row.style.transition = "opacity 0.45s ease, transform 0.45s ease";
          row.style.opacity = "1";
          row.style.transform = "translateX(0)";
        }
        setTimeout(() => {
          const fill = barFillRefs.current[i];
          if (fill) fill.style.width = `${data.categories[i].score}%`;
          const score = barScoreRefs.current[i];
          if (score) animateCounter(score, data.categories[i].score, 700);
        }, 80);
      }, 810 + i * 110);
    });

    later(() => {
      if (trendRef.current) { trendRef.current.style.transition = "opacity 0.5s ease"; trendRef.current.style.opacity = "1"; }
    }, 1440);

    later(() => {
      if (sparkRef.current) { sparkRef.current.style.transition = "stroke-dashoffset 1.2s ease"; sparkRef.current.style.strokeDashoffset = "0"; }
    }, 1520);

    later(() => {
      if (sparkDotRef.current) { sparkDotRef.current.style.transition = "opacity 0.3s ease"; sparkDotRef.current.style.opacity = "1"; }
    }, 2760);
  }, [data]);

  useEffect(() => { runAnimation(); return clearTimers; }, [runAnimation]);

  const handleReplay = () => {
    const btn = replayBtnRef.current;
    if (btn) {
      btn.classList.add("nr-spin");
      setTimeout(() => btn.classList.remove("nr-spin"), 620);
    }
    runAnimation();
  };

  return (
    <>
      <style>{`
        .nr-card {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 1.5rem;
          font-family: sans-serif;
          overflow: hidden;
          position: relative;
          color: #0F172A;
        }
        .nr-top { display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 1.5rem; }
        .nr-donut-wrap { position: relative; width: 110px; height: 110px; flex-shrink: 0; }
        .nr-donut-svg { width: 110px; height: 110px; transform: rotate(-90deg); }
        .nr-donut-track { fill: none; stroke: #E2E8F0; stroke-width: 10; }
        .nr-donut-arc { fill: none; stroke: #0D9488; stroke-width: 10; stroke-linecap: round; }
        .nr-donut-pulse {
          position: absolute; inset: 0; border-radius: 50%;
          border: 2px solid #0D9488; opacity: 0;
          animation: nrPulse 2.2s ease-out 1.5s infinite;
        }
        @keyframes nrPulse { 0%{transform:scale(0.85);opacity:0.5} 100%{transform:scale(1.2);opacity:0} }
        .nr-donut-inner {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          pointer-events: none;
        }
        .nr-donut-num { font-size: 26px; font-weight: 500; color: #1a1a1a; line-height: 1; }
        .nr-donut-denom { font-size: 11px; color: #888; margin-top: 1px; }
        .nr-info { flex: 1; min-width: 0; }
        .nr-stage-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600; color: #0F766E;
          background: #CCFBF1; border: 0.5px solid #99F6E4;
          border-radius: 20px; padding: 4px 10px;
        }
        .nr-stage-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #0D9488;
          animation: nrBlink 2s ease-in-out 2s infinite;
        }
        @keyframes nrBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .nr-divider { height: 1px; background: #ece8e2; margin-bottom: 1rem; }
        .nr-bk-head { font-size: 10px; letter-spacing: 0.09em; text-transform: uppercase; color: #aaa; font-weight: 500; margin-bottom: 12px; }
        .nr-bar-row { display: grid; grid-template-columns: 160px 1fr 38px; align-items: center; gap: 10px; margin-bottom: 10px; }
        .nr-bar-name { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #555; min-width: 0; }
        .nr-bar-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .nr-bar-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nr-bar-track { height: 6px; background: #E2E8F0; border-radius: 99px; overflow: hidden; }
        .nr-bar-fill {
          height: 100%; border-radius: 99px; width: 0%;
          transition: width 1.1s cubic-bezier(0.34,1.2,0.64,1);
          position: relative;
        }
        .nr-bar-fill::after {
          content: ''; position: absolute; right: 0; top: 0; bottom: 0;
          width: 6px; background: inherit; filter: brightness(1.3);
          border-radius: 99px; opacity: 0;
          animation: nrShine 2.4s ease-in-out 1.9s infinite;
        }
        @keyframes nrShine { 0%,100%{opacity:0} 40%,60%{opacity:0.7} }
        .nr-bar-score { font-size: 13px; font-weight: 500; color: #1a1a1a; text-align: right; }
        .nr-trend {
          margin-top: 1.2rem; padding-top: 1rem; border-top: 1px solid #ece8e2;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nr-trend-label { font-size: 10px; color: #aaa; letter-spacing: 0.07em; text-transform: uppercase; }
        .nr-trend-val { font-size: 13px; color: #0D9488; font-weight: 500; margin-top: 2px; }
        .nr-spark-path {
          fill: none; stroke: #0D9488; stroke-width: 1.5;
          stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: 200; stroke-dashoffset: 200;
        }
        .nr-spark-dot { fill: #0D9488; }
        .nr-replay-btn {
          position: absolute; top: 1rem; right: 1rem;
          background: none; border: 0.5px solid #ddd; border-radius: 8px;
          padding: 4px 9px; cursor: pointer; font-size: 12px; color: #999;
          display: flex; align-items: center; gap: 4px;
          transition: color 0.2s, border-color 0.2s, transform 0.2s;
          font-family: inherit;
        }
        .nr-replay-btn:hover { color: #1a1a1a; border-color: #bbb; }
        .nr-replay-btn:active { transform: scale(0.95); }
        .nr-replay-btn.nr-spin svg { animation: nrSpinIt 0.6s linear; }
        @keyframes nrSpinIt { to { transform: rotate(360deg); } }
      `}</style>

      <div className="nr-card">
        <button className="nr-replay-btn" ref={replayBtnRef} onClick={handleReplay} aria-label="Replay animation">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          replay
        </button>

        <div className="nr-top">
          <div className="nr-donut-wrap">
            <svg className="nr-donut-svg" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
              <circle className="nr-donut-track" cx="45" cy="45" r="38" />
              <circle className="nr-donut-arc" ref={arcRef} cx="45" cy="45" r="38" style={{ strokeDasharray: `0 ${CIRC}` }} />
            </svg>
            <div className="nr-donut-pulse" />
            <div className="nr-donut-inner">
              <div className="nr-donut-num" ref={numRef} style={{ opacity: 0, transform: "scale(0.6)" }}>0</div>
              <div className="nr-donut-denom">/ 100</div>
            </div>
          </div>

          <div className="nr-info">
            <h2 ref={titleRef} style={{ fontSize: 15, fontWeight: 500, margin: "0 0 6px", opacity: 0, transform: "translateX(-8px)", color: "#1a1a1a" }}>
              {data.destination_name} readiness
            </h2>
            <p ref={descRef} style={{ fontSize: 13, color: "#666", margin: "0 0 10px", lineHeight: 1.6, opacity: 0 }}>
              {data.explanation}
            </p>
            {data.score_label && (
              <div className="nr-stage-badge" ref={badgeRef} style={{ opacity: 0, transform: "translateY(4px)" }}>
                <span className="nr-stage-dot" />
                {data.score_label}
              </div>
            )}
          </div>
        </div>

        <div className="nr-divider" ref={dividerRef} style={{ opacity: 0 }} />
        <div className="nr-bk-head" ref={bkHeadRef} style={{ opacity: 0 }}>Breakdown</div>

        <div>
          {data.categories.map((cat, i) => (
            <div
              key={cat.name}
              className="nr-bar-row"
              ref={(el) => (barRowRefs.current[i] = el)}
              style={{ opacity: 0, transform: "translateX(-12px)" }}
            >
              <div className="nr-bar-name">
                <div className="nr-bar-dot" style={{ background: cat.color }} />
                <div className="nr-bar-label">{cat.name}</div>
              </div>
              <div className="nr-bar-track">
                <div
                  className="nr-bar-fill"
                  ref={(el) => (barFillRefs.current[i] = el)}
                  style={{ background: cat.color, width: "0%" }}
                />
              </div>
              <div className="nr-bar-score" ref={(el) => (barScoreRefs.current[i] = el)}>—</div>
            </div>
          ))}
        </div>

        <div className="nr-trend" ref={trendRef} style={{ opacity: 0 }}>
          <div>
            <div className="nr-trend-label">6-month trend</div>
            <div className="nr-trend-val">+3 pts projected</div>
          </div>
          <svg width="100" height="32" viewBox="0 0 100 32" aria-hidden="true" style={{ overflow: "visible" }}>
            <path ref={sparkRef} className="nr-spark-path" d="M2,28 L18,26 L34,22 L50,20 L66,16 L82,12 L98,7" />
            <circle ref={sparkDotRef} className="nr-spark-dot" cx="98" cy="7" r="3" style={{ opacity: 0 }} />
          </svg>
        </div>
      </div>

      {/* Overall Score card — hidden when Dashboard renders it in the right column */}
      {!hideOverallScore && (
        <div style={{
          marginTop: 16,
          background: "#F0FDFA",
          border: "1px solid #99F6E4",
          borderRadius: 12,
          padding: 20,
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Overall Score
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, color: "#0D9488" }}>
              {data.overall}
            </span>
            <span style={{ fontSize: 14, color: "#94A3B8", marginBottom: 6 }}>/&nbsp;100</span>
          </div>
          {data.score_label && (
            <span style={{
              display: "inline-block",
              fontSize: 11, fontWeight: 600,
              padding: "3px 10px", borderRadius: 20,
              background: "#CCFBF1", color: "#0F766E",
            }}>
              {data.score_label}
            </span>
          )}
        </div>
      )}
    </>
  );
}

export const ScoreCardSummary = ({ overallScore, scoreLabel }) => (
  <div style={{
    background: "#F0FDFA",
    border: "1px solid #99F6E4",
    borderRadius: 12,
    padding: 20,
  }}>
    <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: "#0F766E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      Overall Score
    </p>
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, color: "#0D9488" }}>{overallScore}</span>
      <span style={{ fontSize: 14, color: "#94A3B8", marginBottom: 6 }}>/&nbsp;100</span>
    </div>
    {scoreLabel && (
      <span style={{
        display: "inline-block",
        fontSize: 11, fontWeight: 600,
        padding: "3px 10px", borderRadius: 20,
        background: "#CCFBF1", color: "#0F766E",
      }}>
        {scoreLabel}
      </span>
    )}
  </div>
);