import React, { useEffect, useRef, useState } from "react";

const SEVERITY_COLORS = [
  { bg: "#fef0ea", color: "#D85A30", dot: "#D85A30" },
  { bg: "#fdf3e3", color: "#BA7517", dot: "#BA7517" },
  { bg: "#eeedfe", color: "#534AB7", dot: "#7F77DD" },
];

const DEFAULT_GAPS = [
  "Limited fiber internet coverage in key barangays",
  "Insufficient long-stay accommodation options",
  "No verified co-working spaces registered",
];

export default function TopGapsCard({ topGaps = [] }) {
  const gaps = topGaps.length ? topGaps : DEFAULT_GAPS;
  const [expanded, setExpanded] = useState(null);
  const [dismissed, setDismissed] = useState([]);

  const headerRef  = useRef(null);
  const itemRefs   = useRef([]);
  const timers     = useRef([]);

  useEffect(() => {
    if (headerRef.current) {
      headerRef.current.style.opacity = "0";
      headerRef.current.style.transform = "translateY(-6px)";
      headerRef.current.style.transition = "none";
    }
    itemRefs.current.forEach((r) => {
      if (!r) return;
      r.style.opacity = "0";
      r.style.transform = "translateX(-10px)";
      r.style.transition = "none";
    });

    timers.current.push(setTimeout(() => {
      if (headerRef.current) {
        headerRef.current.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        headerRef.current.style.opacity = "1";
        headerRef.current.style.transform = "translateY(0)";
      }
    }, 60));

    gaps.forEach((_, i) => {
      timers.current.push(setTimeout(() => {
        const r = itemRefs.current[i];
        if (!r) return;
        r.style.transition = "opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.2,0.64,1)";
        r.style.opacity = "1";
        r.style.transform = "translateX(0)";
      }, 140 + i * 90));
    });

    return () => timers.current.forEach(clearTimeout);
  }, [gaps.length]);

  const visible = gaps.filter((_, i) => !dismissed.includes(i));

  return (
    <>
      <style>{`
        .tg-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #E2E8F0;
        }
        .tg-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .tg-title-row { display: flex; align-items: center; gap: 8px; }
        .tg-title { font-weight: 500; color: #2D2B25; font-size: 15px; }
        .tg-count {
          color: #C2700F; font-size: 11px; font-weight: 600;
          background: #FCEBD6; padding: 2px 8px; border-radius: 12px;
          animation: tgBadgePop 0.4s cubic-bezier(0.34,1.7,0.64,1) 0.3s both;
        }
        @keyframes tgBadgePop {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .tg-empty {
          color: #9B9486; padding: 24px;
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; text-align: center; font-size: 13px;
        }
        .tg-list { display: flex; flex-direction: column; gap: 8px; }
        .tg-item {
          border-radius: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          transition: border-color 0.18s ease, transform 0.18s ease;
          cursor: pointer;
        }
        .tg-item:hover { border-color: #0D9488; transform: translateY(-1px); }
        .tg-item:active { transform: scale(0.99); }
        .tg-item-top {
          display: flex; align-items: center; gap: 12px;
          padding: 12px;
        }
        .tg-icon {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.34,1.5,0.64,1);
        }
        .tg-item:hover .tg-icon { transform: scale(1.1) rotate(-4deg); }
        .tg-body { flex: 1; min-width: 0; }
        .tg-item-title { font-weight: 500; color: #2D2B25; font-size: 13px; }
        .tg-item-sub { color: #A8A296; font-size: 11px; margin-top: 2px; }
        .tg-chevron {
          color: #ccc;
          flex-shrink: 0;
          transition: transform 0.25s ease, color 0.2s ease;
        }
        .tg-chevron.open { transform: rotate(180deg); color: #0D9488; }
        .tg-expand {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease;
          opacity: 0;
        }
        .tg-expand.open { max-height: 200px; opacity: 1; }
        .tg-expand-inner {
          padding: 0 12px 12px 60px;
          font-size: 12px;
          color: #6b6660;
          line-height: 1.6;
          border-top: 1px solid #f0ece5;
          padding-top: 10px;
        }
        .tg-steps { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
        .tg-step {
          display: flex; align-items: flex-start; gap: 7px;
        }
        .tg-step-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #D85A30; flex-shrink: 0; margin-top: 5px;
        }
        .tg-dismiss {
          margin-top: 8px;
          background: none; border: none; cursor: pointer;
          font-size: 11px; color: #ccc; padding: 0;
          font-family: inherit;
          transition: color 0.15s ease;
        }
        .tg-dismiss:hover { color: #0D9488; }
        .tg-severity-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
          animation: tgDotPulse 2.5s ease-in-out infinite;
        }
        @keyframes tgDotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>

      <div className="tg-card">
        <div className="tg-header" ref={headerRef} style={{ opacity: 0, transform: "translateY(-6px)" }}>
          <div className="tg-title-row">
            <div className="tg-title">Top gaps</div>
            <div
              className="tg-severity-dot"
              style={{ background: "#D85A30", animationDelay: "0s" }}
            />
          </div>
          <div className="tg-count">{visible.length} area{visible.length !== 1 ? "s" : ""}</div>
        </div>

        {visible.length === 0 ? (
          <div className="tg-empty">
            <div style={{
              padding: 12, borderRadius: 12,
              background: "#FDFBF8", border: "1px solid #F4EFE7", color: "#C2700F",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div>No critical gaps identified.</div>
          </div>
        ) : (
          <div className="tg-list">
            {gaps.map((g, i) => {
              if (dismissed.includes(i)) return null;
              const accent = SEVERITY_COLORS[i % SEVERITY_COLORS.length];
              const isOpen = expanded === i;
              return (
                <div
                  key={i}
                  className="tg-item"
                  ref={(el) => (itemRefs.current[i] = el)}
                  style={{ opacity: 0, transform: "translateX(-10px)" }}
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpanded(isOpen ? null : i)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpanded(isOpen ? null : i);
                    }
                  }}
                  aria-label={`Gap: ${g}`}
                >
                  <div className="tg-item-top">
                    <div className="tg-icon" style={{ background: accent.bg, color: accent.color }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 9v4"/><path d="M12 17h.01"/>
                      </svg>
                    </div>
                    <div className="tg-body">
                      <div className="tg-item-title">{g}</div>
                      <div className="tg-item-sub">{isOpen ? "Hide steps" : "Tap to view remediation steps"}</div>
                    </div>
                    <svg
                      className={`tg-chevron${isOpen ? " open" : ""}`}
                      width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>

                  <div className={`tg-expand${isOpen ? " open" : ""}`}>
                    <div className="tg-expand-inner">
                      <ul className="tg-steps">
                        <li className="tg-step"><span className="tg-step-dot"/><span>Identify specific sub-areas most affected.</span></li>
                        <li className="tg-step"><span className="tg-step-dot"/><span>Coordinate with LGU department for budget allocation.</span></li>
                        <li className="tg-step"><span className="tg-step-dot"/><span>Set a 90-day improvement target and track monthly.</span></li>
                      </ul>
                      <button
                        className="tg-dismiss"
                        onClick={(e) => { e.stopPropagation(); setDismissed((d) => [...d, i]); setExpanded(null); }}
                      >
                        Mark as resolved
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}