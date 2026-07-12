import React, { useEffect, useState, useRef } from "react";
import ScoreCard, { ScoreCardSummary } from "../components/dashboard/ScoreCard";
import TopGapsCard from "../components/dashboard/TopGapsCard";
import KeyMetricsCard from "../components/dashboard/KeyMetricsCard";
import Header from "../components/layout/Header";
import ErrorMessage from "../components/ui/ErrorMessage";
import * as api from "../services/api";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ width = "100%", height = 16, radius = 8, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, #f5f0e8 25%, #ece7de 50%, #f5f0e8 75%)",
        backgroundSize: "200% 100%",
        animation: "skeletonShimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Key metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 12, padding: 14 }}>
            <Skeleton width={32} height={32} radius={8} style={{ marginBottom: 10 }} />
            <Skeleton width="60%" height={10} style={{ marginBottom: 6 }} />
            <Skeleton width="40%" height={20} />
          </div>
        ))}
      </div>

      {/* ScoreCard + right column */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginTop: 20 }}>
        {/* ScoreCard skeleton */}
        <div style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <Skeleton width={110} height={110} radius={99} />
            <div style={{ flex: 1 }}>
              <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="90%" height={11} style={{ marginBottom: 5 }} />
              <Skeleton width="75%" height={11} style={{ marginBottom: 14 }} />
              <Skeleton width={120} height={24} radius={20} />
            </div>
          </div>
          <Skeleton width="30%" height={10} style={{ marginBottom: 12 }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 38px", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <Skeleton height={10} />
              <Skeleton height={6} radius={99} />
              <Skeleton width={28} height={10} />
            </div>
          ))}
        </div>

        {/* Right column skeleton: AI Suggestions + Overall Score */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 12, padding: 20, flex: 1 }}>
            <Skeleton width="50%" height={14} style={{ marginBottom: 12 }} />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <Skeleton width="90%" height={11} style={{ marginBottom: 5 }} />
                <Skeleton width="30%" height={18} radius={6} />
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 12, padding: 20 }}>
            <Skeleton width="40%" height={11} style={{ marginBottom: 10 }} />
            <Skeleton width="35%" height={40} style={{ marginBottom: 8 }} />
            <Skeleton width={110} height={22} radius={20} />
          </div>
        </div>
      </div>

      {/* Top Gaps skeleton */}
      <div style={{ background: "#fff", border: "1px solid #e8e4de", borderRadius: 14, padding: 20, marginTop: 20 }}>
        <Skeleton width="30%" height={13} style={{ marginBottom: 14 }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
            <Skeleton width={36} height={36} radius={8} />
            <div style={{ flex: 1 }}>
              <Skeleton width="70%" height={11} style={{ marginBottom: 5 }} />
              <Skeleton width="45%" height={9} />
            </div>
            <Skeleton width={40} height={20} radius={6} />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── AI Suggestions ───────────────────────────────────────────────────────────

const TAG_COLORS = {
  "Internet":   { bg: "#eeedfe", color: "#534AB7" },
  "Accom.":     { bg: "#fef0ea", color: "#D85A30" },
  "Transport":  { bg: "#fdf3e3", color: "#BA7517" },
  "Work spots": { bg: "#eeedfe", color: "#7F77DD" },
  "Tourism":    { bg: "#e1f5ee", color: "#0F6E56" },
};

function AISuggestionsPanel({ suggestions = [] }) {
  const itemRefs = useRef([]);
  const timers   = useRef([]);

  useEffect(() => {
    itemRefs.current.forEach((r) => {
      if (!r) return;
      r.style.opacity = "0";
      r.style.transform = "translateX(10px)";
      r.style.transition = "none";
    });
    suggestions.forEach((_, i) => {
      timers.current.push(setTimeout(() => {
        const r = itemRefs.current[i];
        if (!r) return;
        r.style.transition = "opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.2,0.64,1)";
        r.style.opacity = "1";
        r.style.transform = "translateX(0)";
      }, 500 + i * 90));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [suggestions]);

  return (
    <div
      style={{
        background: "#FDFBF8",
        border: "1px solid #F4EFE7",
        borderRadius: 12,
        padding: 20,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "#fef0ea", color: "#D85A30",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3.6 2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.4l-5 2.65.96-5.6L3.9 9.5l5.6-.8z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 500, color: "#2D2B25", fontSize: 14 }}>AI Suggestions</span>
        </div>
        <span style={{
          background: "#FCEBD6", color: "#D97B14",
          fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
          animation: "badgePop 0.4s cubic-bezier(0.34,1.7,0.64,1) 0.4s both",
        }}>
          {suggestions.length} new
        </span>
      </div>

      {suggestions.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 8,
            padding: "12px 8px",
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#F4EFE7",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8B0A2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3.6 2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.4l-5 2.65.96-5.6L3.9 9.5l5.6-.8z"/>
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#918A7E", lineHeight: 1.5 }}>
            No suggestions right now.<br />Check back after your next score update.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          {suggestions.map((s, i) => {
            // Support both the original static shape (text/tag) and the AI response shape (title/priority).
            const text = s.text ?? s.title ?? "";
            const tag = s.tag ?? s.priority ?? "";
            const accent = TAG_COLORS[tag] || { bg: "#f0ece6", color: "#888" };
            return (
              <div
                key={i}
                ref={(el) => (itemRefs.current[i] = el)}
                style={{ opacity: 0, transform: "translateX(10px)" }}
              >
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #ece8e2",
                    borderRadius: 10,
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    transition: "border-color 0.18s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#D85A30"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#ece8e2"}
                >
                  <p style={{ margin: 0, fontSize: 12, color: "#555", lineHeight: 1.5 }}>{text}</p>
                  {tag && (
                    <span style={{
                      alignSelf: "flex-start",
                      fontSize: 10, fontWeight: 600,
                      padding: "2px 7px", borderRadius: 6,
                      background: accent.bg, color: accent.color,
                    }}>
                      {tag}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes badgePop {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [aiSuggestions, setAISuggestions] = useState([]);
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const headerRef = useRef(null);
  const gridRef   = useRef(null);
  const gapsRef   = useRef(null);
  const timers    = useRef([]);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getCurrentScore()
      .then((data) => {
        if (mounted) {
          setSnapshot(data || null);
          // After snapshot, also fetch AI suggestions (demo fallback works)
          api.generateAIAdvice({ destination_name: data?.destination_name }).then((ai) => {
            if (!mounted) return;
            // If the AI response is a demo/mock, treat as no suggestions so the card stays empty
            if (ai && ai._mock) {
              setAISuggestions([]);
            } else {
              setAISuggestions(ai?.suggestions ?? []);
            }
          }).catch(() => {
            if (mounted) setAISuggestions([]);
          });
          // Fetch listings to compute key metrics (backend may return actual listings)
          setLoadingListings(true);
          api.getListings().then((ls) => {
            if (!mounted) return;
            // Normalize to array
            const arr = Array.isArray(ls) ? ls : [];
            setListings(arr);
            setLoadingListings(false);
          }).catch(() => {
            if (mounted) {
              setListings([]);
              setLoadingListings(false);
            }
          });
          setLoading(false);
        }
      })
      .catch(() => { if (mounted) { setError("Failed to load dashboard data"); setLoading(false); } });
    return () => { mounted = false; timers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (loading || error) return;

    [headerRef, gridRef, gapsRef].forEach((r) => {
      if (!r.current) return;
      r.current.style.opacity = "0";
      r.current.style.transform = "translateY(16px)";
      r.current.style.transition = "none";
    });

    [headerRef, gridRef, gapsRef].forEach((r, i) => {
      later(() => {
        if (!r.current) return;
        r.current.style.transition = "opacity 0.55s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)";
        r.current.style.opacity = "1";
        r.current.style.transform = "translateY(0)";
      }, 60 + i * 160);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [loading, error]);

  const metrics = [
    { label: "Verified work spots", value: (() => {
        if (loadingListings) return "—";
        if (listings?.length) {
          return listings.filter((l) => {
            const cat = (l.category || "").toString().toLowerCase();
            const verified = (l.verification_status || "").toString().toLowerCase() === 'lgu_verified' || l.lgu_verified === true;
            return verified && (cat.includes('work') || cat.includes('cowork') || cat.includes('cafe'));
          }).length;
        }
        return snapshot?.metrics?.work_spots ?? "—";
      })(), icon: "wifi" },
    { label: "Long-stay places",    value: (() => {
        if (loadingListings) return "—";
        if (listings?.length) {
          return listings.filter((l) => {
            const cat = (l.category || "").toString().toLowerCase();
            const verified = (l.verification_status || "").toString().toLowerCase() === 'lgu_verified' || l.lgu_verified === true;
            return verified && (cat.includes('accomm') || cat.includes('long') || cat.includes('homestay'));
          }).length;
        }
        return snapshot?.metrics?.long_stay   ?? "—";
      })(), icon: "home" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <style>{`
        /* 2-column: ScoreCard (left) | right column (AI Suggestions + Overall Score) */
        .db-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-top: 20px;
          align-items: stretch;
        }
        /* Right column stacks vertically and fills the row height */
        .db-right-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }
        @media (max-width: 768px) {
          .db-grid { grid-template-columns: 1fr; }
          .db-right-col { height: auto; }
        }
      `}</style>

      <div className="db-main">
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div style={{ padding: 24 }}>
            <ErrorMessage message={error} />
          </div>
        ) : (
          <>
            {/* Row 1: Header + Key Metrics */}
            <div ref={headerRef} style={{ opacity: 0, transform: "translateY(16px)" }}>
              <Header title="Dashboard" subtitle="Overview" />
              <KeyMetricsCard metrics={metrics} />
            </div>

            {/* Row 2: ScoreCard (left) | AI Suggestions (right) */}
            <div ref={gridRef} style={{ opacity: 0, transform: "translateY(16px)" }}>
              <div className="db-grid">
                {/* Left: ScoreCard — hide the built-in overall score summary */}
                <ScoreCard snapshot={snapshot} hideOverallScore />

                {/* Right: AI Suggestions + Overall Score */}
                <div className="db-right-col">
                  <AISuggestionsPanel suggestions={aiSuggestions} />
                  <ScoreCardSummary
                    overallScore={snapshot?.overall_score ?? snapshot?.overall ?? "—"}
                    scoreLabel={snapshot?.score_label ?? ""}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Top Gaps */}
            <div ref={gapsRef} style={{ opacity: 0, transform: "translateY(16px)", marginTop: 20 }}>
              <TopGapsCard topGaps={snapshot?.top_gaps || []} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}