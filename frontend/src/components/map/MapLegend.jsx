import React, { useRef, useEffect } from 'react';

const CATEGORIES = [
  { key: 'work_spots',     label: 'Work Spots',     color: '#534AB7' },
  { key: 'accommodations', label: 'Accommodations',  color: '#D85A30' },
  { key: 'services',       label: 'Services',        color: '#0F6E56' },
  { key: 'transport',      label: 'Transport',       color: '#BA7517' },
  { key: 'attractions',    label: 'Attractions',     color: '#6A1B9A' },
];

export default function MapLegend() {
  const itemRefs = useRef([]);
  const timers   = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    itemRefs.current.forEach((el) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateX(8px)';
      el.style.transition = 'none';
    });

    CATEGORIES.forEach((_, i) => {
      const t = setTimeout(() => {
        const el = itemRefs.current[i];
        if (!el) return;
        el.style.transition = 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.34,1.3,0.64,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
      }, 200 + i * 70);
      timers.current.push(t);
    });

    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      background: '#FDFBF8',
      border: '1px solid #F4EFE7',
      borderRadius: 12,
      padding: 16,
    }}>
      <p style={{
        margin: '0 0 12px',
        fontSize: 11, fontWeight: 600,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        Legend
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.key}
            ref={(el) => (itemRefs.current[i] = el)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: 0, transform: 'translateX(8px)',
            }}
          >
            {/* Mini pin shape matching map marker */}
            <svg width="14" height="19" viewBox="0 0 28 38" style={{ flexShrink: 0 }}>
              <path
                d="M14 2C8.477 2 4 6.477 4 12c0 7.5 10 24 10 24S24 19.5 24 12c0-5.523-4.477-10-10-10z"
                fill={cat.color}
              />
              <circle cx="14" cy="12" r="4.5" fill="#fff" opacity="0.9"/>
            </svg>
            <span style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
              {cat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}