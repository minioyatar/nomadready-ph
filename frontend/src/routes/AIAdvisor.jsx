import React, { useEffect, useState, useRef } from 'react';
import AdvisorPanel from '../components/ai/AdvisorPanel';
import { getCurrentScore, generateAIAdvice } from '../services/api';
import Header from '../components/layout/Header';
import ErrorMessage from '../components/ui/ErrorMessage';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <div
      style={{
        width, height, borderRadius: radius,
        background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

function AdvisorSkeleton() {
  return (
    <>
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Advisor panel skeleton */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
          <Skeleton width={48} height={48} radius={12} />
          <div style={{ flex: 1 }}>
            <Skeleton width="40%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="85%" height={11} style={{ marginBottom: 5 }} />
            <Skeleton width="60%" height={11} />
          </div>
        </div>
        <Skeleton width={160} height={40} radius={12} />
      </div>

      {/* Recommendation cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <Skeleton width={34} height={34} radius={10} style={{ marginBottom: 12 }} />
            <Skeleton width="80%" height={13} style={{ marginBottom: 8 }} />
            <Skeleton width="95%" height={10} style={{ marginBottom: 5 }} />
            <Skeleton width="70%" height={10} />
          </div>
        ))}
      </div>
    </>
  );
}

// ─── AIAdvisor ────────────────────────────────────────────────────────────────

export default function AIAdvisor() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError]       = useState(null);
  const [aiData, setAiData]     = useState(null);

  const headerRef = useRef(null);
  const panelRef  = useRef(null);
  const timers    = useRef([]);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getCurrentScore()
      .then((res) => {
        if (!mounted) return;
        setSnapshot(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load score snapshot');
        setLoading(false);
      });
    return () => { mounted = false; timers.current.forEach(clearTimeout); };
  }, []);

  // Entrance animation, same pattern as Dashboard.jsx
  useEffect(() => {
    if (loading || error) return;

    [headerRef, panelRef].forEach((r) => {
      if (!r.current) return;
      r.current.style.opacity = '0';
      r.current.style.transform = 'translateY(16px)';
      r.current.style.transition = 'none';
    });

    [headerRef, panelRef].forEach((r, i) => {
      later(() => {
        if (!r.current) return;
        r.current.style.transition = 'opacity 0.55s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';
        r.current.style.opacity = '1';
        r.current.style.transform = 'translateY(0)';
      }, 60 + i * 160);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [loading, error]);

  // Fade in AI results when they arrive

  const handleGenerate = async () => {
    if (!snapshot) return;

    // Guard: destination_name must come from the snapshot — substituting a hardcoded
    // value here would generate advice labelled for the wrong place if the API ever
    // returns a different destination or omits the field entirely.
    if (!snapshot.destination_name) {
      setError('Destination name is missing from the score snapshot. Please refresh and try again.');
      return;
    }

    setAiLoading(true);
    setAiData(null);
    try {
      const payload = {
        destination_name: snapshot.destination_name,
        overall_score: snapshot.overall_score,
        score_label: snapshot.score_label,
        category_scores: snapshot.category_scores || {
          internet_work: snapshot.internet_work_score,
          accommodation: snapshot.accommodation_score,
          safety_services: snapshot.safety_services_score,
          transport: snapshot.transport_score,
          tourism_lifestyle: snapshot.tourism_lifestyle_score,
        },
        strongest_category: snapshot.strongest_category,
        weakest_category: snapshot.weakest_category,
        top_gaps: snapshot.top_gaps,
      };

      const res = await generateAIAdvice(payload);
      setAiData(res);
    } catch (err) {
      setError(err?.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '8px 0' }}>
      <div className="db-main">
        {loading ? (
          <AdvisorSkeleton />
        ) : error && !snapshot ? (
          <div style={{ padding: 24 }}>
            <ErrorMessage message={error} />
          </div>
        ) : (
          <>
            <div ref={headerRef} style={{ opacity: 0, transform: 'translateY(16px)' }}>
              <Header
                title="AI Readiness Advisor"
                subtitle="AI-generated explanation and LGU action plan based on verified destination data"
              />
            </div>

            <div ref={panelRef} style={{ opacity: 0, transform: 'translateY(16px)', marginTop: 20 }}>
              <AdvisorPanel
                snapshot={snapshot}
                onGenerate={handleGenerate}
                generating={aiLoading}
                aiData={aiData}
              />
            </div>

            {/* Recommendation cards — shown after AI data loads */}
            {aiLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 20 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="card" style={{ padding: 18 }}>
                    <Skeleton width={34} height={34} radius={10} style={{ marginBottom: 12 }} />
                    <Skeleton width="80%" height={13} style={{ marginBottom: 8 }} />
                    <Skeleton width="95%" height={10} style={{ marginBottom: 5 }} />
                    <Skeleton width="70%" height={10} />
                  </div>
                ))}
              </div>
            )}

            {aiData && !aiLoading && (
              <div style={{ marginTop: 20 }}>
                {/* Strengths and Weaknesses */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 20 }}>
                  <div className="card" style={{ padding: '20px 22px' }}>
                    <div className="section-title" style={{ fontSize: 14, marginBottom: 10, color: '#0F6E56' }}>
                      Strengths
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {(aiData.strengths || []).map((s) => (
                        <li key={s} style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: 4 }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="card" style={{ padding: '20px 22px' }}>
                    <div className="section-title" style={{ fontSize: 14, marginBottom: 10, color: 'var(--red-mid)' }}>
                      Areas to Improve
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {(aiData.weaknesses || []).map((w) => (
                        <li key={w} style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: 4 }}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Top 3 Recommended Actions */}
                <div className="section-title" style={{ fontSize: 15, marginBottom: 12 }}>
                  Top Recommended Actions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {(aiData.recommendations || []).map((rec) => {
                    const priorityStyle = rec.priority === 'high'
                      ? { bg: '#FFF7ED', color: '#EA580C' }
                      : rec.priority === 'medium'
                      ? { bg: '#E0F2FE', color: '#0891B2' }
                      : { bg: '#F1F5F9', color: '#64748B' };
                    return (
                      <div key={rec.title} className="card" style={{ padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                            padding: '2px 8px', borderRadius: 6,
                            background: priorityStyle.bg, color: priorityStyle.color,
                          }}>
                            {rec.priority}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                            {rec.affected_category}
                          </span>
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px 0', lineHeight: 1.4 }}>
                          {rec.title}
                        </h4>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                          {rec.reason}
                        </p>
                        {rec.suggested_next_step && (
                          <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                            Next step: {rec.suggested_next_step}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}