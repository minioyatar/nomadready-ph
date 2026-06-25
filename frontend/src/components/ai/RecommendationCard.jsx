import React from 'react';

const PRIORITY_STYLES = {
  high:   { bg: 'var(--red-light)',    color: 'var(--red-mid)' },
  medium: { bg: 'var(--orange-light)', color: 'var(--orange-dark)' },
  low:    { bg: 'var(--purple-pale)',  color: 'var(--purple-mid)' },
};

function PriorityPill({ priority }) {
  if (!priority) return null;
  const key = String(priority).toLowerCase();
  const style = PRIORITY_STYLES[key] || { bg: '#F0ECE4', color: 'var(--text-muted)' };
  return (
    <span
      className="priority-pill"
      style={{ background: style.bg, color: style.color }}
    >
      {priority}
    </span>
  );
}

export default function RecommendationCard({ rec }) {
  if (!rec) return null;

  const title = rec.title || rec.action || rec.text || 'Recommendation';
  const description = rec.description || rec.detail || rec.rationale || '';
  const category = rec.category || rec.tag;
  const priority = rec.priority;

  return (
    <div
      className="card"
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 0.18s ease, transform 0.18s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'var(--orange-light)', color: 'var(--orange-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
          </svg>
        </div>
        <PriorityPill priority={priority} />
      </div>

      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.35, margin: 0 }}>
          {title}
        </p>
        {description && (
          <p style={{ fontSize: 12.5, color: 'var(--text-faint)', lineHeight: 1.5, marginTop: 5 }}>
            {description}
          </p>
        )}
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
