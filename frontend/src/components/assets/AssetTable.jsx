import { useRef, useEffect } from 'react';

const CATEGORY_STYLES = {
  work_spots:     { bg: '#eeedfe', color: '#534AB7' },
  accommodations: { bg: '#fef0ea', color: '#D85A30' },
  services:       { bg: '#e1f5ee', color: '#0F6E56' },
  transport:      { bg: '#fdf3e3', color: '#BA7517' },
  attractions:    { bg: '#f3e5f5', color: '#6A1B9A' },
};

function CategoryBadge({ category }) {
  // Guard against null/undefined category values
  const safeCategory = typeof category === 'string' ? category : '';
  const s = CATEGORY_STYLES[safeCategory] || { bg: '#f5f5f5', color: '#666' };
  const label = safeCategory ? safeCategory.replace(/_/g, ' ') : '—';
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 9px',
      borderRadius: 6,
      background: s.bg,
      color: s.color,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'capitalize',
    }}>
      {label}
    </span>
  );
}

function VerificationBadge({ verified }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 9px',
      borderRadius: 6,
      background: verified ? '#e1f5ee' : '#fbe9e7',
      color: verified ? '#0F6E56' : '#D85A30',
      fontSize: 11,
      fontWeight: 600,
    }}>
      {verified ? '✓ Verified' : '⚠ Unverified'}
    </span>
  );
}

export default function AssetTable({ listings }) {
  const rowRefs = useRef([]);
  const headRef = useRef(null);
  const timers  = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (headRef.current) {
      headRef.current.style.opacity = '0';
      headRef.current.style.transition = 'none';
    }
    rowRefs.current.forEach((el) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateX(-10px)';
      el.style.transition = 'none';
    });

    timers.current.push(setTimeout(() => {
      if (!headRef.current) return;
      headRef.current.style.transition = 'opacity 0.35s ease';
      headRef.current.style.opacity = '1';
    }, 40));

    rowRefs.current.forEach((el, i) => {
      timers.current.push(setTimeout(() => {
        if (!el) return;
        el.style.transition = 'opacity 0.4s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
      }, 80 + i * 60));
    });

    return () => timers.current.forEach(clearTimeout);
  }, [listings]);

  return (
    /* ── Card shell ── */
    <div style={{
      background: '#fff',
      border: '1px solid #ece8e2',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(30,20,10,.04), 0 4px 12px rgba(30,20,10,.03)',
    }}>
      {/* Card header */}
      <div style={{
        padding: '16px 20px 14px',
        borderBottom: '1px solid #f0ece6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: '#fef0ea', color: '#D85A30',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h14V9"/>
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>Local Assets</span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#aaa',
          background: '#f5f1eb', borderRadius: 6, padding: '2px 8px',
        }}>
          {listings.length} listing{listings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr
              ref={headRef}
              style={{ background: '#faf8f5', borderBottom: '1px solid #f0ece6', opacity: 0 }}
            >
              {['Name', 'Category', 'Status', 'Contact'].map((h) => (
                <th key={h} style={{
                  padding: '10px 20px',
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.map((listing, i) => (
              <tr
                key={listing.id}
                ref={(el) => (rowRefs.current[i] = el)}
                style={{
                  borderBottom: i < listings.length - 1 ? '1px solid #f5f1eb' : 'none',
                  opacity: 0,
                  transform: 'translateX(-10px)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fdfcfa')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '13px 20px', fontWeight: 500, color: '#1a1a1a' }}>
                  {listing.name}
                </td>
                <td style={{ padding: '13px 20px' }}>
                  <CategoryBadge category={listing.category} />
                </td>
                <td style={{ padding: '13px 20px' }}>
                  <VerificationBadge verified={listing.lgu_verified} />
                </td>
                <td style={{ padding: '13px 20px', color: '#888', fontSize: 12 }}>
                  {listing.contact || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}