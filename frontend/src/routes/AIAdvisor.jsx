import React, { useEffect, useState, useRef } from 'react';
import AdvisorPanel from '../components/ai/AdvisorPanel';
import RecommendationCard from '../components/ai/RecommendationCard';
import { getCurrentScore, generateAIAdvice } from '../services/api';
import Header from '../components/layout/Header';
import ErrorMessage from '../components/ui/ErrorMessage';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <div
      style={{
        width, height, borderRadius: radius,
        background: 'linear-gradient(90deg, #f5f0e8 25%, #ece7de 50%, #f5f0e8 75%)',
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
  const [generationError, setGenerationError] = useState(null);
  const [aiData, setAiData]     = useState(null);

  const headerRef = useRef(null);
  const panelRef  = useRef(null);
  const resultRef = useRef(null);
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
  useEffect(() => {
    if (!aiData || !resultRef.current) return;
    resultRef.current.style.opacity = '0';
    resultRef.current.style.transform = 'translateY(12px)';
    resultRef.current.style.transition = 'none';
    later(() => {
      if (!resultRef.current) return;
      resultRef.current.style.transition = 'opacity 0.45s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      resultRef.current.style.opacity = '1';
      resultRef.current.style.transform = 'translateY(0)';
    }, 40);
  }, [aiData]);

  const handleGenerate = async () => {
    if (!snapshot) return;
    // Reset any previous generation error before starting a new request
    setGenerationError(null);
    setAiLoading(true);
    setAiData(null);
    try {
      const payload = {
        // Use the snapshot's destination_name if present; otherwise fallback to a neutral placeholder.
        destination_name: snapshot.destination_name || 'Carles',
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
      setGenerationError(err?.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
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

            {(aiData || generationError) && (
              <div ref={resultRef} style={{ marginTop: 20 }}>
              {Array.isArray(aiData?.recommendations) && aiData.recommendations.length > 0 && (
                  <div className="card" style={{ padding: 22, marginBottom: 20 }}>
                    <div className="section-header">
                      <div className="section-title">Recommendations</div>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 12,
                    }}>
                      {aiData.recommendations.slice(0, 3).map((rec, i) => (
                        <RecommendationCard key={i} rec={rec} />
                      ))}
                    </div>
                  </div>
                )}

                {generationError && (
                  <div className="card" style={{ padding: 22, marginBottom: 20, background: '#fff5f0', borderColor: '#D85A30' }}>
                    <div className="section-header">
                      <div className="section-title" style={{ color: '#D85A30' }}>AI Generation Error</div>
                    </div>
                    <p style={{ color: '#D85A30' }}>{generationError}</p>
                  </div>
                )}

                {aiData?.summary && (
                  <div className="card" style={{ padding: 22 }}>
                    <div className="section-header">
                      <div className="section-title">AI Summary</div>
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
                      {aiData.summary}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}