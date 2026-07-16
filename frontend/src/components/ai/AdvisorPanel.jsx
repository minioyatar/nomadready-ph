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

function scoreTone(score) {
  if (score >= 75) return { ring: '#059669', soft: '#D1FAE5' };
  if (score >= 50) return { ring: '#0D9488', soft: '#CCFBF1' };
  return { ring: '#F97316', soft: '#FFF7ED' };
}

// Real SVG ring: a background track + a foreground arc that fills
// proportionally to score, instead of a flat conic-gradient disc.
function ScoreRing({ score }) {
  const { ring, soft } = scoreTone(score);
  const size = 108;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(score, 0), 100) / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={soft} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={ring} strokeWidth={stroke} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="donut-number">{formatScore(score)}</span>
        <span className="donut-denom">/ 100</span>
      </div>
    </div>
  );
}

export default function AdvisorPanel({ snapshot, onGenerate, generating, aiData }) {
  const overall = snapshot?.overall_score ?? 0;
  const label = snapshot?.score_label ?? '';
  const strongest = snapshot?.strongest_category ?? '—';
  const weakest = snapshot?.weakest_category ?? '—';
  const topGaps = snapshot?.top_gaps || [];

  return (
    <div className="mid-grid" style={{ marginTop: 14 }}>
      {/* Left: score + strongest/weakest + generate action */}
      <Card style={{ padding: '26px 28px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <ScoreRing score={overall} />

          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: 19, marginBottom: 12 }}>{label || 'Readiness snapshot'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F6E56', flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Strongest</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F6E56' }}>{strongest}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red-mid)', flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Weakest</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--red-mid)' }}>{weakest}</span>
              </div>
            </div>
          </div>

          <div style={{ flexShrink: 0, alignSelf: 'center' }}>
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
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #E2E8F0' }}>
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
            topGaps.slice(0, 5).map((g) => (
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