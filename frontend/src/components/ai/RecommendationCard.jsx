import React from 'react';

const PRIORITY_TONES = {
  high:   { bg: 'var(--red-light)',    color: 'var(--red-mid)',    label: 'High priority' },
  medium: { bg: 'var(--orange-light)', color: 'var(--orange-dark)', label: 'Medium priority' },
  low:    { bg: 'var(--purple-pale)',  color: 'var(--purple-mid)', label: 'Low priority' },
};

const DEFAULT_TONE = { bg: '#F0ECE4', color: 'var(--text-muted)', label: null };

function getTone(priority) {
  const key = String(priority || '').toLowerCase();
  return PRIORITY_TONES[key] || DEFAULT_TONE;
}

export default function RecommendationCard({ rec }) {
  if (!rec) return null;

  const title = rec.title || rec.action || rec.text || 'Recommendation';
  const description = rec.description || rec.detail || rec.rationale || '';
  const category = rec.category || rec.tag;
  const priority = rec.priority;
  const tone = getTone(priority);

  return (
    <div
      className="card"
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
        cursor: 'default',
        transition: 'border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tone.color !== 'var(--text-muted)' ? tone.color : 'var(--orange)';
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(30,20,10,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--card-shadow)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        {/* Icon chip now shares the priority color, so severity reads instantly */}
        <div
          style={{
            width: 32, height: 32, borderRadius: 9,
            background: tone.bg, color: tone.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
          </svg>
        </div>

        {priority && (
          <span
            className="priority-pill"
            style={{ background: tone.bg, color: tone.color }}
            title={tone.label || undefined}
          >
            {priority}
          </span>
        )}
      </div>

      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.35, margin: 0 }}>
          {title}
        </p>
        <p style={{
          fontSize: 12.5,
          color: description ? 'var(--text-faint)' : 'var(--text-hint)',
          fontStyle: description ? 'normal' : 'italic',
          lineHeight: 1.5,
          marginTop: 5,
        }}>
          {description || 'No additional detail provided.'}
        </p>
      </div>

      {category && (
        <span
          style={{
            alignSelf: 'flex-start',
            fontSize: 10.5, fontWeight: 700,
            padding: '3px 9px', borderRadius: 999,
            background: '#F0ECE4', color: 'var(--text-mid)',
          }}
        >
          {category}
        </span>
      )}
    </div>
  );
}