import React, { useEffect, useRef } from 'react';

const DEFAULT_METRICS = [
  { label: 'Verified work spots', value: 12,   suffix: 'cafes',  icon: 'wifi' },
  { label: 'Long-stay places',    value: 8,    suffix: 'spots',  icon: 'home' },
];

const ICONS = {
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
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  chart: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
};

const ACCENT_COLORS = [
  { bg: '#CCFBF1', color: '#0D9488' },
  { bg: '#E0F2FE', color: '#0891B2' },
  { bg: '#D1FAE5', color: '#059669' },
  { bg: '#FFF7ED', color: '#F97316' },
];

function animateCounter(el, target, ms) {
  if (!el || typeof target !== 'number') return;
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

export default function KeyMetricsCard({ metrics = [], loading = false }) {
  const items = (metrics.length ? metrics : DEFAULT_METRICS).map((m, i) => ({
    icon: m.icon || Object.keys(ICONS)[i % 4],
    ...m,
  }));

  const cardRefs  = useRef([]);
  const iconRefs  = useRef([]);
  const valueRefs = useRef([]);

  useEffect(() => {
    cardRefs.current.forEach((card) => {
      if (!card) return;
      card.style.opacity = '0';
      card.style.transform = 'translateY(14px)';
      card.style.transition = 'none';
    });

    iconRefs.current.forEach((icon) => {
      if (!icon) return;
      icon.style.transform = 'scale(0.5)';
      icon.style.opacity = '0';
      icon.style.transition = 'none';
    });

    const timers = [];

    items.forEach((m, i) => {
      timers.push(setTimeout(() => {
        const card = cardRefs.current[i];
        if (card) {
          card.style.transition = 'opacity 0.45s ease, transform 0.5s cubic-bezier(0.34,1.3,0.64,1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }

        setTimeout(() => {
          const icon = iconRefs.current[i];
          if (icon) {
            icon.style.transition = 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
            icon.style.opacity = '1';
            icon.style.transform = 'scale(1)';
          }
        }, 120);

        setTimeout(() => {
          const valEl = valueRefs.current[i];
          if (!loading && valEl && typeof m.value === 'number') {
            animateCounter(valEl, m.value, 800);
          }
        }, 200);

      }, 80 + i * 100));
    });

    return () => timers.forEach(clearTimeout);
  // Re-run animations when number of items, loading state, or values change.
  // Use a stable dependency by joining values into a string.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, loading, items.map((m) => String(m.value)).join(',')]);

  return (
    <>
      <style>{`
        .km-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }
        .km-card {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px;
          position: relative;
          overflow: hidden;
          cursor: default;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .km-card:hover {
          border-color: #0D9488;
          transform: translateY(-2px);
        }
        .km-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 0 0 12px 12px;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .km-card:hover::after { opacity: 1; }
        .km-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px;
          flex-shrink: 0;
        }
        .km-label {
          font-size: 11px;
          color: #888;
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .km-value-row {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }
        .km-value {
          font-size: 22px;
          font-weight: 500;
          color: #1a1a1a;
          line-height: 1;
        }
        .km-suffix {
          font-size: 11px;
          color: #aaa;
          font-weight: 400;
        }
        .km-value-str {
          font-size: 18px;
          font-weight: 500;
          color: #1a1a1a;
          line-height: 1;
        }
      `}</style>

      <div className="km-grid">
        {items.map((m, i) => {
          const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
          const isNumber = typeof m.value === 'number';
          return (
            <div
              key={i}
              className="km-card"
              ref={(el) => (cardRefs.current[i] = el)}
              style={{ opacity: 0, transform: 'translateY(14px)' }}
            >
              <div
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 2, background: accent.color,
                  borderRadius: '0 0 12px 12px',
                  opacity: 0,
                  transition: 'opacity 0.25s ease',
                }}
                className="km-accent-bar"
              />

              <div
                className="km-icon-wrap"
                ref={(el) => (iconRefs.current[i] = el)}
                style={{
                  background: accent.bg,
                  color: accent.color,
                  opacity: 0,
                  transform: 'scale(0.5)',
                }}
              >
                {ICONS[m.icon] || ICONS.chart}
              </div>

              <div className="km-label">{m.label}</div>
              <div className="km-value-row">
                {isNumber ? (
                  loading ? (
                    <>
                      <span className="km-value-str">—</span>
                      {m.suffix && <span className="km-suffix">{m.suffix}</span>}
                    </>
                  ) : (
                    <>
                      <span className="km-value" ref={(el) => (valueRefs.current[i] = el)}>0</span>
                      {m.suffix && <span className="km-suffix">{m.suffix}</span>}
                    </>
                  )
                ) : (
                  <span className="km-value-str" ref={(el) => (valueRefs.current[i] = el)}>{m.value}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .km-card:hover .km-accent-bar { opacity: 1 !important; }
      `}</style>
    </>
  );
}