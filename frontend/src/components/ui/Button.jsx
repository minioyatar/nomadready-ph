import React from 'react';

const VARIANTS = {
  primary: {
    background: 'var(--text-dark)',
    color: '#fff',
    border: 'none',
  },
  accent: {
    background: 'var(--orange)',
    color: '#fff',
    border: 'none',
  },
  outline: {
    background: '#fff',
    color: 'var(--text-dark)',
    border: '1px solid var(--border-soft)',
  },
};

export default function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon = null,
  className = '',
  style = {},
}) {
  const palette = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 18px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-body)',
        cursor: isDisabled ? 'default' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'opacity 0.15s ease, transform 0.1s ease',
        ...palette,
        ...style,
      }}
      onMouseDown={(e) => { if (!isDisabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? <Spinner color={palette.color} /> : icon}
      {children}
    </button>
  );
}

function Spinner({ color = '#fff' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'btnSpin 0.8s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.3" strokeWidth="3" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      <style>{`
        @keyframes btnSpin { to { transform: rotate(360deg); } }
      `}</style>
    </svg>
  );
}
