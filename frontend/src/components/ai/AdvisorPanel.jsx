import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatScore } from '../../lib/formatters';

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3.6 2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.4l-5 2.65.96-5.6L3.9 9.5l5.6-.8z" />
    </svg>
  );
}

function scoreRing(score) {
  if (score >= 75) return { ring: 'var(--orange)', ringSoft: 'var(--orange-light)' };
  if (score >= 50) return { ring: 'var(--purple)', ringSoft: 'var(--purple-pale)' };
  return { ring: 'var(--red)', ringSoft: 'var(--red-light)' };
}

export default function AdvisorPanel({ snapshot, onGenerate, generating, aiData }) {
  const overall = snapshot?.overall_score ?? 0;
  const label = snapshot?.score_label ?? '';
  const strongest = snapshot?.strongest_category ?? '—';
  const weakest = snapshot?.weakest_category ?? '—';
  const topGaps = snapshot?.top_gaps || [];
  const { ring, ringSoft } = scoreRing(overall);

  return (
    <div className="mid-grid" style={{ marginTop: 14 }}>
      {/* Left: score + strongest/weakest + generate action */}
      <Card style={{ padding: '26px 28px' }}>
        <div className="readiness-top" style={{ flexWrap: 'wrap' }}>
          <div
            className="donut-ring"
            style={{ background: `conic-gradient(${ring} ${overall * 3.6}deg, ${ringSoft} 0deg)` }}
          >
            <div className="donut-inner">
              <span className="donut-number">{formatScore(overall)}</span>
              <span className="donut-denom">/ 100</span>
            </div>
          </div>

          <div className="readiness-info" style={{ minWidth: 200 }}>
            <h2 style={{ fontSize: 19 }}>{label || 'Readiness snapshot'}</h2>
            <p style={{ marginBottom: 10 }}>
              <strong style={{ color: 'var(--text-dark)' }}>Strongest:</strong>{' '}
              <span style={{ color: '#0F6E56', fontWeight: 600 }}>{strongest}</span>
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong style={{ color: 'var(--text-dark)' }}>Weakest:</strong>{' '}
              <span style={{ color: 'var(--red-mid)', fontWeight: 600 }}>{weakest}</span>
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <Button
              onClick={onGenerate}
              disabled={generating}
              loading={generating}
              variant="accent"
              icon={!generating ? <SparkleIcon /> : null}
            >
              {generating ? 'Generating' : aiData ? 'Regenerate' : 'Generate AI Recommendations'}
            </Button>
          </div>
        </div>

        {aiData && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #F0EBE2' }}>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 8 }}>
              <SparkleIcon />
              AI Preview
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
              {aiData.summary ?? aiData.excerpt ?? 'AI recommendations ready.'}
            </p>
          </div>
        )}
      </Card>

      {/* Right column: Top Gaps + Key Metrics */}
      <div className="db-right-col">
        <Card className="gaps-card">
          <div className="section-header" style={{ marginBottom: 10 }}>
            <div className="section-title" style={{ fontSize: 15 }}>Top Gaps</div>
          </div>
          {topGaps.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>No major gaps detected.</p>
          ) : (
            topGaps.slice(0, 5).map((g, i) => (
              <div className="gap-item" key={g}>
                <div className="gap-icon" style={{ background: 'var(--red-light)', color: 'var(--red-mid)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" />
                  </svg>
                </div>
                <div className="gap-body">
                  <div className="gap-title">{g}</div>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card style={{ padding: '22px 24px' }}>
          <div className="section-header" style={{ marginBottom: 10 }}>
            <div className="section-title" style={{ fontSize: 15 }}>Key Metrics</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <MetricRow label="Work spots" value={snapshot?.metrics?.work_spots} />
            <MetricRow label="Long-stay options" value={snapshot?.metrics?.long_stay} />
            <MetricRow label="Avg stay (days)" value={snapshot?.metrics?.avg_stay} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-dark)' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}
