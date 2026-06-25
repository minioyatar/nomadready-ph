import React, { useEffect, useRef } from "react";

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const bigint = parseInt(full, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function animateCounter(el, target, ms) {
  if (!el || typeof target !== "number") return;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / ms, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
}

const CATEGORY_MAP = {
  "Tourism & Lifestyle Appeal":   { color: "#b79ff1", icon: "tourism" },
  "Internet & Work Readiness":    { color: "#9e86d6", icon: "wifi" },
  "Long-Stay Accommodation":      { color: "#e7a357", icon: "home" },
  "Safety & Essential Services":  { color: "#e7a357", icon: "shield" },
  "Transport & Access":           { color: "#e7a357", icon: "transport" },
};

const ICONS = {
  tourism: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  wifi: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <circle cx="12" cy="20" r="1" fill="currentColor"/>
    </svg>
  ),
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  shield: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  transport: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/>
      <path d="M16 8h4l3 3v5h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
};

export default function CategoryScoreCard({ name, score, animationDelay = 0 }) {
  const pct =
    score !== null && score !== undefined && !Number.isNaN(Number(score))
      ? Math.max(0, Math.min(100, Math.round(Number(score))))
      : null;

  const { color: baseColor = "#e7a357", icon: iconKey = "wifi" } =
    CATEGORY_MAP[name] || {};

  const cardRef  = useRef(null);
  const iconRef  = useRef(null);
  const numRef   = useRef(null);
  const fillRef  = useRef(null);
  const timers   = useRef([]);

  useEffect(() => {
    const card = cardRef.current;
    const icon = iconRef.current;
    const num  = numRef.current;
    const fill = fillRef.current;

    if (card) { card.style.opacity = "0"; card.style.transform = "translateY(12px)"; card.style.transition = "none"; }
    if (icon) { icon.style.opacity = "0"; icon.style.transform = "scale(0.6)"; icon.style.transition = "none"; }
    if (num)  { num.textContent = "0"; }
    if (fill) { fill.style.width = "0%"; }

    const t = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

    t(() => {
      if (card) {
        card.style.transition = "opacity 0.45s ease, transform 0.5s cubic-bezier(0.34,1.2,0.64,1)";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }
    }, animationDelay);

    t(() => {
      if (icon) {
        icon.style.transition = "opacity 0.35s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)";
        icon.style.opacity = "1";
        icon.style.transform = "scale(1)";
      }
    }, animationDelay + 120);

    t(() => {
      if (pct !== null) animateCounter(num, pct, 850);
      if (fill) {
        fill.style.transition = "width 1s cubic-bezier(0.34,1.1,0.64,1)";
        fill.style.width = `${pct}%`;
      }
    }, animationDelay + 200);

    return () => timers.current.forEach(clearTimeout);
  }, [pct, animationDelay]);

  const hoverEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.borderColor = hexToRgba(baseColor, 0.3);
    e.currentTarget.style.boxShadow = `0 8px 22px ${hexToRgba(baseColor, 0.12)}`;
  };
  const hoverLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.borderColor = "#f0ece6";
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(45,43,37,0.04)";
  };

  return (
    <>
      <style>{`
        .csc-bar-track {
          height: 3px;
          background: #f0ece6;
          border-radius: 99px;
          overflow: hidden;
          margin-top: 10px;
        }
        .csc-bar-fill {
          height: 100%;
          border-radius: 99px;
          width: 0%;
          position: relative;
        }
        .csc-bar-fill::after {
          content: '';
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 5px;
          background: inherit;
          filter: brightness(1.3);
          border-radius: 99px;
          opacity: 0;
          animation: cscShine 2.4s ease-in-out 1.4s infinite;
        }
        @keyframes cscShine { 0%,100%{opacity:0} 40%,60%{opacity:0.8} }
      `}</style>

      <div
        ref={cardRef}
        style={{
          padding: 14,
          background: "#fbf9f6",
          border: "1px solid #f0ece6",
          boxShadow: "0 2px 8px rgba(45,43,37,0.04)",
          borderRadius: 12,
          opacity: 0,
          transform: "translateY(12px)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
          cursor: "default",
        }}
        onMouseEnter={hoverEnter}
        onMouseLeave={hoverLeave}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            ref={iconRef}
            style={{
              background: "rgba(255,255,255,0.9)",
              border: `1px solid ${hexToRgba(baseColor, 0.18)}`,
              color: baseColor,
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              opacity: 0,
              transform: "scale(0.6)",
              transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {ICONS[iconKey]}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: "#5b5650",
              fontSize: 12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginBottom: 2,
            }}>
              {name}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span
                ref={numRef}
                style={{ fontSize: 24, color: "#3d3a36", fontWeight: 500, lineHeight: 1 }}
              >
                {pct !== null ? "0" : "—"}
              </span>
              {pct !== null && (
                <span style={{ fontSize: 11, color: "#bbb", fontWeight: 400 }}>/ 100</span>
              )}
            </div>
          </div>
        </div>

        <div className="csc-bar-track">
          <div
            ref={fillRef}
            className="csc-bar-fill"
            style={{ background: baseColor, width: "0%" }}
          />
        </div>
      </div>
    </>
  );
}