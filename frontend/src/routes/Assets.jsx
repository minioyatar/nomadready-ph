import { useState, useEffect, useRef } from 'react';
import { getListings } from '../services/api';
import AssetFilters from '../components/assets/AssetFilters';
import AssetTable from '../components/assets/AssetTable';
import { LISTING_CATEGORIES } from '../lib/constants';

// Use the canonical category list from constants which matches backend enum values.
const CATEGORIES = LISTING_CATEGORIES;

export default function Assets() {
  const [listings, setListings]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const headerRef  = useRef(null);
  const filtersRef = useRef(null);
  const tableRef   = useRef(null);
  const timers     = useRef([]);

  // Monotonically-increasing counter. Each call to loadListings captures its
  // own snapshot; if a newer call has already started by the time the await
  // resolves, the snapshot no longer matches and the result is discarded.
  const requestId = useRef(0);

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
    // Claim this request's identity before any await so the check below is
    // always comparing against the most recent call, not a closure-captured value.
    const thisId = ++requestId.current;

    setLoading(true);
    setError(null);
    try {
      const params = activeCategory !== 'all' ? { category: activeCategory } : {};
      // Unwrap at the call site: getListings may return a raw Axios response
      // ({ data: [...] }) or the array directly depending on the api layer.
      // Normalising here keeps Assets.jsx correct either way.
      const result = await getListings(params);
      const payload = Array.isArray(result) ? result : (result?.data ?? []);

      // Discard stale responses — a newer request has already taken ownership
      if (thisId !== requestId.current) return;

      setListings(payload);
    } catch (err) {
      if (thisId !== requestId.current) return; // also discard stale errors
      setError(err?.message || 'Failed to load assets');
      setListings([]);
    } finally {
      // Only clear the loading flag for the request that currently owns state
      if (thisId === requestId.current) setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto">

      {/* Header */}
      <div ref={headerRef} className="mb-6 opacity-0 translate-y-4">
        <h1 className="text-[22px] font-semibold text-[#1a1a1a] mb-1">
          Local Assets
        </h1>
        <p className="text-[#888] text-[13px] m-0">
          Browse verified work spots, accommodations, and services
        </p>
      </div>

      {/* Filters */}
      <div ref={filtersRef} className="opacity-0 translate-y-4">
        <AssetFilters
          options={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          count={listings.length}
        />
      </div>

      {/* Content area */}
      <div ref={tableRef} className="opacity-0 translate-y-4">

        {/* Loading skeleton */}
        {loading && <AssetTableSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-12 bg-[#fbe9e7] rounded-[12px] text-[#D85A30]">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-[15px] font-semibold mb-1">Failed to load assets</h3>
            <p className="text-[13px] mb-4 text-[#C1553E]">{error}</p>
            <button
              onClick={loadListings}
              className="px-4 py-2 rounded bg-[#D85A30] text-white font-semibold text-[13px] hover:bg-[#C1553E]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-12 px-5 bg-[#f9f7f4] rounded-[12px] text-[#666]">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-[15px] font-semibold mb-1">No assets found</h3>
            <p className="text-[13px] text-[#999]">
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