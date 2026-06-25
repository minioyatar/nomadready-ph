import { useState, useEffect, useRef } from 'react';
import { getListings } from '../services/api';
import AssetFilters from '../components/assets/AssetFilters';
import AssetTable from '../components/assets/AssetTable';

const CATEGORIES = [
  { value: 'all',            label: 'All' },
  { value: 'work_spots',     label: 'Work Spots' },
  { value: 'accommodations', label: 'Accommodations' },
  { value: 'services',       label: 'Services' },
  { value: 'transport',      label: 'Transport' },
  { value: 'attractions',    label: 'Attractions' },
];

export default function Assets() {
  const [listings, setListings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const headerRef  = useRef(null);
  const filtersRef = useRef(null);
  const tableRef   = useRef(null);
  const timers     = useRef([]);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => {
    loadListings();
  }, [activeCategory]);

  // Entrance animation whenever content is ready (not loading, no error, has listings)
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    const blocks = [headerRef, filtersRef, tableRef];
    blocks.forEach((r) => {
      if (!r.current) return;
      r.current.style.opacity = '0';
      r.current.style.transform = 'translateY(16px)';
      r.current.style.transition = 'none';
    });

    blocks.forEach((r, i) => {
      later(() => {
        if (!r.current) return;
        r.current.style.transition = 'opacity 0.55s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';
        r.current.style.opacity = '1';
        r.current.style.transform = 'translateY(0)';
      }, 60 + i * 130);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [loading, error]);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = activeCategory !== 'all' ? { category: activeCategory } : {};
      const data = await getListings(params);
      setListings(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load assets');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div ref={headerRef} style={{ marginBottom: '24px', opacity: 0, transform: 'translateY(16px)' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
          Local Assets
        </h1>
        <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
          Browse verified work spots, accommodations, and services
        </p>
      </div>

      {/* Filters */}
      <div ref={filtersRef} style={{ opacity: 0, transform: 'translateY(16px)' }}>
        <AssetFilters
          options={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          count={listings.length}
        />
      </div>

      {/* Content area */}
      <div ref={tableRef} style={{ opacity: 0, transform: 'translateY(16px)' }}>

        {/* Loading skeleton */}
        {loading && <AssetTableSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#fbe9e7', borderRadius: '12px', color: '#D85A30',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Failed to load assets</h3>
            <p style={{ fontSize: '13px', marginBottom: '16px', color: '#C1553E' }}>{error}</p>
            <button
              onClick={loadListings}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: '#D85A30', color: '#fff', cursor: 'pointer',
                fontSize: '13px', fontWeight: '600',
              }}
              onMouseEnter={(e) => (e.target.style.background = '#C1553E')}
              onMouseLeave={(e) => (e.target.style.background = '#D85A30')}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && listings.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#f9f7f4', borderRadius: '12px', color: '#666',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>No assets found</h3>
            <p style={{ fontSize: '13px', color: '#999' }}>
              {activeCategory !== 'all'
                ? `No ${activeCategory.replace(/_/g, ' ')} available yet.`
                : 'No local assets available yet.'}
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && listings.length > 0 && (
          <AssetTable listings={listings} />
        )}
      </div>
    </div>
  );
}

// ─── Table skeleton matching AssetTable layout ────────────────────────────────

function Sk({ width = '100%', height = 13, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #f5f0e8 25%, #ece7de 50%, #f5f0e8 75%)',
      backgroundSize: '200% 100%',
      animation: 'assetShimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

function AssetTableSkeleton() {
  return (
    <>
      <style>{`
        @keyframes assetShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ borderRadius: '12px', border: '1px solid #ece8e2', overflow: 'hidden' }}>
        {/* thead */}
        <div style={{ background: '#f9f7f4', borderBottom: '1px solid #ece8e2', padding: '12px 16px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16 }}>
          {['45%', '35%', '40%', '30%'].map((w, i) => (
            <Sk key={i} width={w} height={11} />
          ))}
        </div>
        {/* rows */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              padding: '14px 16px',
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: 16,
              borderBottom: '1px solid #ece8e2',
              alignItems: 'center',
              animationDelay: `${i * 0.06}s`,
            }}
          >
            <Sk width="70%" height={13} />
            <Sk width={80} height={24} radius={6} />
            <Sk width={90} height={24} radius={6} />
            <Sk width="55%" height={13} />
          </div>
        ))}
      </div>
    </>
  );
}