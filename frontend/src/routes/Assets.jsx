import { useState, useEffect, useRef } from 'react';
import { getListings } from '../services/api';
import AssetFilters from '../components/assets/AssetFilters';
import AssetTable from '../components/assets/AssetTable';
// Existing imports …
import { LISTING_CATEGORIES } from '../lib/constants';


export default function Assets() {
  const [listings, setListings]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Block-level entrance: 0=header, 1=filters, 2=table
  const [shown, setShown] = useState([false, false, false]);
  // Separate timer stores: one for the initial mount animation (header & filters)
  // and another for the content block (table / skeleton / error) animation.
  const mountTimers   = useRef([]);
  const contentTimers = useRef([]);
  const requestId = useRef(0);
  const mounted = useRef(true);

  // Helper to schedule a timeout and track it in the appropriate timer array.
  const laterMount = (fn, ms) => { mountTimers.current.push(setTimeout(fn, ms)); };
  const laterContent = (fn, ms) => { contentTimers.current.push(setTimeout(fn, ms)); };

  useEffect(() => { loadListings(); }, [activeCategory]);

  // Track mounted status safely across React Strict Mode remounts.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Animate header (block 0) and filters (block 1) once on mount.
  useEffect(() => {
    // Clear any previous mount timers (in case of strict mode remounts).
    mountTimers.current.forEach(clearTimeout);
    mountTimers.current = [];
    // Animate blocks 0 and 1 sequentially.
    [0, 1].forEach((i) => {
      laterMount(() =>
        setShown((s) => {
          const n = [...s];
          n[i] = true;
          return n;
        })
      , 60 + i * 130);
    });
    // Cleanup mount timers on unmount.
    return () => mountTimers.current.forEach(clearTimeout);
  }, []);

  // Re-run entrance animation for the content block (table/skeleton/error) whenever loading or error changes.
  useEffect(() => {
    // Clear any previous content timers.
    contentTimers.current.forEach(clearTimeout);
    contentTimers.current = [];
    // Reset only the content block (index 2) to hidden.
    setShown((s) => {
      const n = [...s];
      n[2] = false;
      return n;
    });
    // Animate the content block after a short delay.
    laterContent(() =>
      setShown((s) => {
        const n = [...s];
        n[2] = true;
        return n;
      })
    , 60);
    return () => contentTimers.current.forEach(clearTimeout);
  }, [loading, error]);

  const loadListings = async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      // activeCategory now matches backend enum values directly (singular).
      // The special "all" case should omit the category filter.
      const params = activeCategory !== 'all' ? { category: activeCategory } : {};
      const response = await getListings(params);
      const data = response && response.data ? response.data : response;
      if (id !== requestId.current) return;
      if (!mounted.current) return;
      setListings(data || []);
    } catch (err) {
      if (id !== requestId.current) return;
      if (!mounted.current) return;
      setError(err?.message || 'Failed to load assets');
      setListings([]);
    } finally {
      // Only clear loading if this is the latest request to avoid stale
      // responses turning off the spinner prematurely.
      if (id === requestId.current && mounted.current) {
        setLoading(false);
      }
    }
  };

  const block = (i) =>
    `transition-[opacity,transform] duration-500 ease-out ${
      shown[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "8px 0" }}>

      {/* Header */}
      <div className={`mb-5 ${block(0)}`}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 4, marginTop: 0 }}>
          Local Assets
        </h1>
        <p className="text-[13px] text-[#888] m-0">
          Browse verified work spots, accommodations, services, transport, and attractions
        </p>
      </div>

      {/* Filters */}
      <div className={block(1)}>
        <AssetFilters
          options={LISTING_CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          count={listings.length}
        />
      </div>

      {/* Content */}
      <div className={block(2)}>

        {/* Skeleton */}
        {loading && <AssetTableSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16 px-5 rounded-xl" style={{ background: "#F0FDFA", color: "#0F766E" }}>
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-[15px] font-semibold mb-1">Failed to load assets</h3>
            <p className="text-[13px] mb-4" style={{ color: "#0D9488" }}>{error}</p>
            <button
              onClick={loadListings}
              className="px-4 py-2 rounded-lg text-white text-[13px] font-semibold border-none cursor-pointer transition-colors duration-150"
              style={{ background: "#0D9488" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0F766E"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0D9488"; }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-16 px-5 rounded-xl" style={{ background: "#F8FAFC", color: "#475569" }}>
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-[15px] font-semibold mb-1">No assets found</h3>
            <p className="text-[13px] text-[#999]">
              {activeCategory !== 'all'
                ? `No ${activeCategory.replace(/_/g, ' ')} available yet.`
                : 'No local assets available yet.'}
            </p>
          </div>
        )}

        {/* Verification guide + Table */}
        {!loading && !error && listings.length > 0 && (
          <>
            <VerificationGuide />
            <AssetTable listings={listings} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Verification guide ───────────────────────────────────────────────────────

const STATUS_LEGEND = [
  { bg: '#DCFCE7', color: '#15803D', label: '✓ Verified',      desc: 'LGU-reviewed · counts toward score' },
  { bg: '#F1F5F9', color: '#475569', label: 'Draft',           desc: 'Pending review · not counted' },
  { bg: '#FFF7ED', color: '#EA580C', label: '⚠ Needs Update',  desc: 'Requires re-review before counting' },
];

function VerificationGuide() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 10,
    }}>
      <div style={{
        flexShrink: 0,
        width: 26, height: 26,
        borderRadius: 8,
        background: '#F0FDFA',
        color: '#0D9488',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
      </div>
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Verification Status — </span>
        <span style={{ fontSize: 12, color: '#64748B' }}>Only verified assets are counted in the readiness score.</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
          {STATUS_LEGEND.map(({ bg, color, label, desc }) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B' }}>
              <span style={{ padding: '2px 8px', borderRadius: 5, background: bg, color, fontWeight: 600, flexShrink: 0 }}>
                {label}
              </span>
              {desc}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-[#F1F5F9] via-[#E2E8F0] to-[#F1F5F9]
                  bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className}`}
      style={style}
    />
  );
}

function AssetTableSkeleton() {
  return (
    <>
      {/* Shimmer keyframes are defined globally in index.css */}
      <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
        {/* thead */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3
                        grid grid-cols-[2fr_1fr_1fr_1fr] gap-4">
          {['w-[45%]', 'w-[35%]', 'w-[40%]', 'w-[30%]'].map((w, i) => (
            <Sk key={i} className={`h-[11px] ${w}`} />
          ))}
        </div>
        {/* rows */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-[14px] grid grid-cols-[2fr_1fr_1fr_1fr]
                                  gap-4 border-b border-[#E2E8F0] items-center">
            <Sk className="h-[13px] w-[70%]" />
            <Sk className="h-6 w-20 rounded-md" />
            <Sk className="h-6 w-[90px] rounded-md" />
            <Sk className="h-[13px] w-[55%]" />
          </div>
        ))}
      </div>
    </>
  );
}