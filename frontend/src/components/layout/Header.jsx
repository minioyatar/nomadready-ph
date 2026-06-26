import React from 'react';

export default function Header({ title = 'Dashboard', subtitle = 'Overview' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-dark)' }}>{title}</div>
        <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* topbar helpers kept minimal */}
      </div>
    </div>
  );
}