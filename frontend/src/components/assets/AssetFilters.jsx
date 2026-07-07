import { useEffect, useState, useRef } from 'react';

/* ---------------------------------------------------------------------------
 * Scoped styles for the stagger animation.
 * Initial state (hidden) lives in .af-btn / .af-count.
 * Revealed state is toggled by adding .af-btn--visible / .af-count--visible.
 * Per-button delay is driven by the --delay CSS custom property set once in
 * the JSX style prop — never mutated by the effect.
 * --------------------------------------------------------------------------- */
const STYLES = `
  .af-btn {
    opacity: 0;
    transform: translateY(8px);
    transition: none;
  }
  .af-btn--visible {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity   0.35s ease                              var(--delay, 0ms),
      transform 0.4s  cubic-bezier(0.34, 1.3, 0.64, 1) var(--delay, 0ms);
  }
  .af-count {
    opacity: 0;
    transition: none;
  }
  .af-count--visible {
    opacity: 1;
    transition: opacity 0.4s ease var(--delay, 0ms);
  }
`;

export default function AssetFilters({ options, activeCategory, onCategoryChange, count }) {
  const [visible, setVisible] = useState([]);
  const [countVisible, setCountVisible] = useState(false);
  const btnRefs = useRef([]);
  const countRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    // Cancel any in-flight timers from a previous run
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Reset: strip the visible class so elements return to their hidden state
    btnRefs.current.forEach((el) => {
      if (!el) return;
      el.classList.remove('af-btn--visible');
    });
    if (countRef.current) {
      countRef.current.classList.remove('af-count--visible');
    }

    // Stagger buttons in by adding the visible class after a per-button delay
    btnRefs.current.forEach((el, i) => {
      const t = setTimeout(() => {
        if (!el) return;
        el.classList.add('af-btn--visible');
      }, i * 55);
      timers.current.push(t);
    });

    // Count badge fades in after all buttons have started animating
    const t = setTimeout(() => {
      if (!countRef.current) return;
      countRef.current.classList.add('af-count--visible');
    }, options.length * 55 + 80);
    timers.current.push(t);

    return () => timers.current.forEach(clearTimeout);
  }, [activeCategory, options.length]); // re-run stagger on category change or list resize

  return (
    <>
      {/* Inject scoped animation styles once — no global stylesheet edit required */}
      <style>{STYLES}</style>

      <div style={{
        marginBottom: '20px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {options.map((opt, i) => (
          <button
            key={opt.value}
            ref={(el) => (btnRefs.current[i] = el)}
            onClick={() => onCategoryChange(opt.value)}
            className="af-btn"
            style={{
              // --delay is set once here; the effect only toggles the visible class
              '--delay': `${i * 55}ms`,
              padding: '7px 14px',
              borderRadius: '8px',
              border: activeCategory === opt.value ? '2px solid #D85A30' : '1.5px solid #e0dbd3',
              background: activeCategory === opt.value ? '#fff5f0' : '#fff',
              color: activeCategory === opt.value ? '#D85A30' : '#666',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeCategory === opt.value ? '600' : '500',
              // Only the hover micro-interaction transition stays inline;
              // the stagger entrance transition is handled by .af-btn / .af-btn--visible
              transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== opt.value) {
                e.currentTarget.style.borderColor = '#D85A30';
                e.currentTarget.style.background = '#fdf9f6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== opt.value) {
                e.currentTarget.style.borderColor = '#e0dbd3';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {opt.label}
          </button>
        ))}

        <span
          ref={countRef}
          className="af-count"
          style={{
            '--delay': `${options.length * 55 + 80}ms`,
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#aaa',
            fontWeight: 500,
          }}
        >
          {count} result{count !== 1 ? 's' : ''}
        </span>
      </div>
    </>
  );
}
