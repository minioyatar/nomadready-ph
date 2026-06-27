import { useRef, useEffect } from 'react';

const CATEGORY_COLORS = {
  work_spots:     { bg: '#eeedfe', color: '#534AB7' },
  accommodations: { bg: '#fef0ea', color: '#D85A30' },
  services:       { bg: '#e1f5ee', color: '#0F6E56' },
  transport:      { bg: '#fdf3e3', color: '#BA7517' },
  attractions:    { bg: '#f3e5f5', color: '#6A1B9A' },
};

function CategoryBadge({ category }) {
  const s = CATEGORY_COLORS[category] || { bg: '#f5f5f5', color: '#666' };
  const label = category ? category.replace(/_/g, ' ') : 'uncategorized';
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 9px',
      borderRadius: '6px',
      background: s.bg,
      color: s.color,
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.02em',
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
      gap: '4px',
      padding: '3px 9px',
      borderRadius: '6px',
      background: verified ? '#e1f5ee' : '#fbe9e7',
      color: verified ? '#0F6E56' : '#D85A30',
      fontSize: '11px',
      fontWeight: '600',
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

    // Reset header
    if (headRef.current) {
      headRef.current.style.opacity = '0';
      headRef.current.style.transition = 'none';
    }

    // Reset rows
    rowRefs.current.forEach((el) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateX(-10px)';
      el.style.transition = 'none';
    });

    // Animate header
    const ht = setTimeout(() => {
      if (!headRef.current) return;
      headRef.current.style.transition = 'opacity 0.35s ease';
      headRef.current.style.opacity = '1';
    }, 40);
    timers.current.push(ht);

    // Stagger rows
    rowRefs.current.forEach((el, i) => {
      const t = setTimeout(() => {
        if (!el) return;
        el.style.transition = 'opacity 0.4s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
      }, 80 + i * 60);
      timers.current.push(t);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [listings]); // re-animate when listings change (category filter)

  return (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #ece8e2' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr
            ref={headRef}
            style={{
              background: '#f9f7f4',
              borderBottom: '1px solid #ece8e2',
              opacity: 0,
            }}
          >
            {['Name', 'Category', 'Status', 'Contact'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '11px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#555',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}
              >
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
                borderBottom: '1px solid #ece8e2',
                opacity: 0,
                transform: 'translateX(-10px)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#faf8f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1a1a1a' }}>
                {listing.name}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <CategoryBadge category={listing.category} />
              </td>
              <td style={{ padding: '12px 16px' }}>
                <VerificationBadge verified={listing.lgu_verified} />
              </td>
              <td style={{ padding: '12px 16px', color: '#888', fontSize: '12px' }}>
                {listing.contact || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}