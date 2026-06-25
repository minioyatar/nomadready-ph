import React from 'react';

export default function LoadingSpinner({ size = 36 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '4px solid rgba(0,0,0,0.08)',
          borderTopColor: 'var(--orange)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
