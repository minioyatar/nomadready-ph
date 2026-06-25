import { useRef, useEffect } from 'react';

export default function AssetFilters({ options, activeCategory, onCategoryChange, count }) {
  const btnRefs  = useRef([]);
  const countRef = useRef(null);
  const timers   = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Reset
    btnRefs.current.forEach((el) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'none';
    });
    if (countRef.current) {
      countRef.current.style.opacity = '0';
      countRef.current.style.transition = 'none';
    }

    // Stagger buttons in
    btnRefs.current.forEach((el, i) => {
      const t = setTimeout(() => {
        if (!el) return;
        el.style.transition = 'opacity 0.35s ease, transform 0.4s cubic-bezier(0.34,1.3,0.64,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 55);
      timers.current.push(t);
    });

    // Count fades in last
    const t = setTimeout(() => {
      if (!countRef.current) return;
      countRef.current.style.transition = 'opacity 0.4s ease';
      countRef.current.style.opacity = '1';
    }, options.length * 55 + 80);
    timers.current.push(t);

    return () => timers.current.forEach(clearTimeout);
  }, [activeCategory]); // re-run stagger on category change too

  return (
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
          style={{
            padding: '7px 14px',
            borderRadius: '8px',
            border: activeCategory === opt.value ? '2px solid #D85A30' : '1.5px solid #e0dbd3',
            background: activeCategory === opt.value ? '#fff5f0' : '#fff',
            color: activeCategory === opt.value ? '#D85A30' : '#666',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeCategory === opt.value ? '600' : '500',
            transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease, transform 0.15s ease',
            opacity: 0,
            transform: 'translateY(8px)',
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
        style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: '#aaa',
          fontWeight: 500,
          opacity: 0,
        }}
      >
        {count} result{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}