import React, { useEffect, useState, useRef } from 'react';
import AssetMap from '../components/map/AssetMap';
import MapLegend from '../components/map/MapLegend';
import { getListings } from '../services/api';
import { CARLES_CENTER, MAP_TILE_URL } from '../lib/constants';

// ─── Map skeleton ─────────────────────────────────────────────────────────────

function Sk({ width = '100%', height = 13, radius = 6, style = {} }) {
  // Width and height are applied via inline style; other visual aspects use the .map-shimmer class.
  return (
    <div
      className="map-shimmer"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

function MapSkeleton() {
  return (
    <>
      <div className="map-view-grid">
        {/* Map area skeleton */}
        <div className="map-view-pane">
          {/* Fake tile grid */}
          <div className="tile-grid">
            {Array.from({ length: 20 }).map((_, i) => (
              <Sk key={i} width="100%" height="100%" radius={4}
                style={{ animationDelay: `${(i % 5) * 0.08}s` }} />
            ))}
          </div>
          {/* Fake zoom controls */}
            <div className="zoom-controls">
            <Sk width={30} height={30} radius={6} />
            <Sk width={30} height={30} radius={6} />
          </div>
          {/* Fake pin cluster */}
            <div className="pin-cluster">
            {[0, 1, 2].map((i) => (
              <Sk key={i} width={14} height={20} radius={99}
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-[#ece8e2] rounded-[12px] p-4">
            <Sk width="50%" height={12} className="mb-3" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <Sk width={10} height={10} radius={99} />
                <Sk width="60%" height={10} />
              </div>
            ))}
          </div>
          <div className="bg-white border border-[#ece8e2] rounded-[12px] p-4">
            <Sk width="40%" height={11} className="mb-2" />
            <Sk width="70%" height={10} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MapView ──────────────────────────────────────────────────────────────────

export default function MapView() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const headerRef  = useRef(null);
  const contentRef = useRef(null);
  const timers     = useRef([]);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getListings()
      .then((response) => {
        if (!mounted) return;
        const data = response && response.data ? response.data : response;
        setListings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load listings');
        setLoading(false);
      });
    return () => { mounted = false; timers.current.forEach(clearTimeout); };
  }, []);

  // Entrance animation on load complete
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    [headerRef, contentRef].forEach((r) => {
      if (!r.current) return;
      r.current.style.opacity = '0';
      r.current.style.transform = 'translateY(16px)';
      r.current.style.transition = 'none';
    });

    [headerRef, contentRef].forEach((r, i) => {
      later(() => {
        if (!r.current) return;
        r.current.style.transition = 'opacity 0.55s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';
        r.current.style.opacity = '1';
        r.current.style.transform = 'translateY(0)';
      }, 60 + i * 140);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [loading, error]);

  return (
    <div className="max-w-[1480px] mx-auto">

      {/* Responsive layout using Tailwind utilities – custom grid defined via inline style */}

      {/* Header */}
      <div ref={headerRef} className="mb-5 opacity-0 translate-y-4">
        <h1 className="text-xl font-semibold text-[#1a1a1a] mb-1">
          Carles Local Asset Map
        </h1>
        <p className="text-sm text-[#888] m-0">
          Map of seeded local assets — work spots, accommodations, services, transport, attractions
        </p>
      </div>

      {/* Content */}
      <div ref={contentRef} className="opacity-0 translate-y-4">

        {/* Loading skeleton */}
        {loading && <MapSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-12 bg-[#fbe9e7] rounded-[12px] text-[#D85A30] max-w-full">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold mb-1">Failed to load map data</h3>
            <p className="text-sm text-[#C1553E]">{error}</p>
          </div>
        )}

        {/* Map */}
        {!loading && !error && (
          <div className="map-view-grid">
            <div className="map-view-pane">
              <AssetMap
                center={[CARLES_CENTER.lat, CARLES_CENTER.lng]}
                listings={listings}
                tileUrl={MAP_TILE_URL}
              />
            </div>
            <div className="flex flex-col gap-3">

              <MapLegend listings={listings} />

              <div className="bg-[#FDFBF8] border border-[#F4EFE7] rounded-[12px] p-4">
                <p className="mb-1 text-xs font-semibold text-[#999] uppercase tracking-wider">
                  Summary
                </p>
                <p className="mb-1 text-sm text-[#555]">
                  <strong className="text-[#1a1a1a]">{listings.length}</strong> total listings
                </p>
                <p className="text-xs text-[#aaa]">
                  Showing pins for assets with coordinates
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}