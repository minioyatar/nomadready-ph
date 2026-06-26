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

  // Monotonically-increasing counter. Each call to loadListings captures its
  // own snapshot; if a newer call has already started by the time the await
  // resolves, the snapshot no longer matches and the result is discarded.
  const requestId = useRef(0);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

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
    // Claim this request's identity before any await so the check below is
    // always comparing against the most recent call, not a closure-captured value.
    const thisId = ++requestId.current;

    setLoading(true);
    setError(null);
    try {
      // activeCategory now matches backend enum values directly (singular).
      // The special "all" case should omit the category filter.
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

  const block = (i) =>
    `transition-[opacity,transform] duration-500 ease-out ${
      shown[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`;

  return (
    <div className="max-w-[1200px] mx-auto">

      {/* Header */}
      <div className={`mb-6 ${block(0)}`}>
        <p className="text-[13px] text-[#888] m-0">
          Browse verified work spots, accommodations, and services
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
          <div className="text-center py-16 px-5 bg-[#fbe9e7] rounded-xl text-[#D85A30]">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-[15px] font-semibold mb-1">Failed to load assets</h3>
            <p className="text-[13px] text-[#C1553E] mb-4">{error}</p>
            <button
              onClick={loadListings}
              className="px-4 py-2 rounded-lg bg-[#D85A30] text-white text-[13px] font-semibold
                         border-none cursor-pointer hover:bg-[#C1553E] transition-colors duration-150"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-16 px-5 bg-[#f9f7f4] rounded-xl text-[#666]">
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-[#f5f0e8] via-[#ece7de] to-[#f5f0e8]
                  bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className}`}
      style={style}
    />
  );
}

function AssetTableSkeleton() {
  return (
    <>
      {/* Shimmer keyframes are defined globally in index.css */}
      <div className="rounded-xl border border-[#ece8e2] overflow-hidden">
        {/* thead */}
        <div className="bg-[#f9f7f4] border-b border-[#ece8e2] px-4 py-3
                        grid grid-cols-[2fr_1fr_1fr_1fr] gap-4">
          {['w-[45%]', 'w-[35%]', 'w-[40%]', 'w-[30%]'].map((w, i) => (
            <Sk key={i} className={`h-[11px] ${w}`} />
          ))}
        </div>
        {/* rows */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-[14px] grid grid-cols-[2fr_1fr_1fr_1fr]
                                  gap-4 border-b border-[#ece8e2] items-center">
            <Sk className="h-[13px] w-[70%]" />
            <Sk className="h-6 w-20 rounded-md" />
            <Sk className="h-6 w-[90px] rounded-md" />
            <Sk className="h-[13px] w-[55%]" />
          </div>
        ))}
      </div>
    </>
  );
}import { useState, useEffect, useRef } from 'react';
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
    <div className="max-w-[1200px] mx-auto">

      {/* Header */}
      <div className={`mb-6 ${block(0)}`}>
        <p className="text-[13px] text-[#888] m-0">
          Browse verified work spots, accommodations, and services
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
          <div className="text-center py-16 px-5 bg-[#fbe9e7] rounded-xl text-[#D85A30]">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-[15px] font-semibold mb-1">Failed to load assets</h3>
            <p className="text-[13px] text-[#C1553E] mb-4">{error}</p>
            <button
              onClick={loadListings}
              className="px-4 py-2 rounded-lg bg-[#D85A30] text-white text-[13px] font-semibold
                         border-none cursor-pointer hover:bg-[#C1553E] transition-colors duration-150"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-16 px-5 bg-[#f9f7f4] rounded-xl text-[#666]">
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-[#f5f0e8] via-[#ece7de] to-[#f5f0e8]
                  bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className}`}
      style={style}
    />
  );
}

function AssetTableSkeleton() {
  return (
    <>
      {/* Shimmer keyframes are defined globally in index.css */}
      <div className="rounded-xl border border-[#ece8e2] overflow-hidden">
        {/* thead */}
        <div className="bg-[#f9f7f4] border-b border-[#ece8e2] px-4 py-3
                        grid grid-cols-[2fr_1fr_1fr_1fr] gap-4">
          {['w-[45%]', 'w-[35%]', 'w-[40%]', 'w-[30%]'].map((w, i) => (
            <Sk key={i} className={`h-[11px] ${w}`} />
          ))}
        </div>
        {/* rows */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-[14px] grid grid-cols-[2fr_1fr_1fr_1fr]
                                  gap-4 border-b border-[#ece8e2] items-center">
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