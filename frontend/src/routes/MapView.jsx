import React, { useEffect, useState, useRef } from 'react';
import AssetMap from '../components/map/AssetMap';
import MapLegend from '../components/map/MapLegend';
import { getListings } from '../services/api';
import { CARLES_CENTER, MAP_TILE_URL } from '../lib/constants';

// ─── Map skeleton ─────────────────────────────────────────────────────────────

function Sk({ width = '100%', height = 13, radius = 6, style = {} }) {
  // Width and height are applied via inline style; other visual aspects use the .map-shimmer class.
  return (
<<<<<<< HEAD
<div style={{ maxWidth: 1480, margin: '0 auto' }}>

  {/* Responsive + marker styling (scoped, no external CSS file needed) */}
  <style>{`
    .map-view-grid {
      grid-template-columns: 1fr 240px;
    }
    .map-view-pane {
      aspect-ratio: 16 / 10;
      width: 100%;
      min-height: 420px;
      max-height: 780px;
      min-width: 0;
    }
    @media (max-width: 768px) {
      .map-view-grid {
        grid-template-columns: 1fr !important;
      }
      .map-view-pane {
        aspect-ratio: 4 / 3.4;
        max-height: 520px !important;
        height: auto !important;
      }
    }
    /* Strip Leaflet's default white box + drop-shadow around our custom SVG pins */
    .leaflet-div-icon.asset-map-pin {
      background: transparent;
      border: none;
    }
    .asset-map-pin svg {
      display: block;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.25));
    }
  `}</style>

  {/* Header */}
  <div ref={headerRef} style={{ marginBottom: 20, opacity: 0, transform: 'translateY(16px)' }}>
    <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
      Carles Local Asset Map
    </h1>
    <p style={{ color: '#888', fontSize: 13, margin: 0 }}>
      Map of seeded local assets — work spots, accommodations, services, transport, attractions
    </p>
  </div>

  {/* Content */}
  <div ref={contentRef} style={{ opacity: 0, transform: 'translateY(16px)' }}>

    {/* Loading skeleton */}
    {loading && <MapSkeleton />}

    {/* Error */}
    {!loading && error && (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        background: '#fbe9e7', borderRadius: 12, color: '#D85A30',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Failed to load map data</h3>
        <p style={{ fontSize: 13, color: '#C1553E' }}>{error}</p>
      </div>
    )}

    {/* Map */}
    {!loading && !error && (
      <div className="map-view-grid" style={{ display: 'grid', gap: 12 }}>
        <div
          className="map-view-pane"
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #ece8e2',
            minWidth: 0,
          }}
        >
          <AssetMap
            center={[CARLES_CENTER.lat, CARLES_CENTER.lng]}
            listings={listings}
            tileUrl={MAP_TILE_URL}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MapLegend listings={listings} />
          <div style={{
            background: '#FDFBF8', border: '1px solid #F4EFE7',
            borderRadius: 12, padding: 16,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Summary
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: '#555' }}>
              <strong style={{ color: '#1a1a1a' }}>{listings.length}</strong> total listings
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>
              Showing pins for assets with coordinates
            </p>
          </div>
        </div>
      </div>
    )}
  </div>

</div>
    </div>
=======
=======
>>>>>>> 29bc69d (feat: Implement AssetMap and MapLegend components with loading skeleton and error handling in MapView)
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #f5f0e8 25%, #ece7de 50%, #f5f0e8 75%)',
      backgroundSize: '200% 100%',
      animation: 'mapShimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
<<<<<<< HEAD
>>>>>>> e7f199d (feat: Implement AssetMap and MapLegend components with loading skeleton and error handling in MapView)
=======
>>>>>>> 29bc69d (feat: Implement AssetMap and MapLegend components with loading skeleton and error handling in MapView)
=======
=======
>>>>>>> 4a6a039a118a49ff259ff40c167222122c6a839f
    <div
      className="map-shimmer"
      style={{ width, height, borderRadius: radius, ...style }}
    />
<<<<<<< HEAD
>>>>>>> 49a3286 (feat: Enhance map components with responsive layout, improved error handling, and consistent color palette integration)
=======
>>>>>>> 4a6a039a118a49ff259ff40c167222122c6a839f
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
<<<<<<< HEAD
=======
      .then((response) => {
        if (!mounted) return;
        const data = response && response.data ? response.data : response;
>>>>>>> 0359ab0 (feat: Refactor AssetMap and MapLegend to use CATEGORY_PALETTE and improve listing validation in MapView)
=======
      .then((response) => {
        if (!mounted) return;
        const data = response && response.data ? response.data : response;
>>>>>>> 4a6a039a118a49ff259ff40c167222122c6a839f
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

  // Entrance animation on load complete – use Tailwind class toggling
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Reset to hidden state using Tailwind utilities
    [headerRef, contentRef].forEach((r) => {
      if (!r.current) return;
      r.current.classList.remove('opacity-100', 'translate-y-0', 'transition-all', 'duration-500');
      r.current.classList.add('opacity-0', 'translate-y-4');
    });

    // Animate in after a short delay
    [headerRef, contentRef].forEach((r, i) => {
      later(() => {
        if (!r.current) return;
        r.current.classList.remove('opacity-0', 'translate-y-4');
        r.current.classList.add('opacity-100', 'translate-y-0', 'transition-all', 'duration-500');
      }, 60 + i * 140);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [loading, error]);

  return (
    <div className="max-w-[1480px] mx-auto">

<<<<<<< HEAD
.then((response) => {
        if (!mounted) return;
        const data = response && response.data ? response.data : response;
          .map-view-grid {
            grid-template-columns: 1fr !important;
          }
          .map-view-pane {
/* Responsive + marker styling (scoped, no external CSS file needed) */
.map-view-grid {
  grid-template-columns: minmax(0, 2fr) 300px;
  gap: 20px;
}
.map-view-pane {
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 420px;
  max-height: 760px;
  min-width: 0;
}
@media (max-width: 1024px) {
  .map-view-grid {
    grid-template-columns: 1fr !important;
  }
  .map-view-pane {
    aspect-ratio: 16 / 9;
    max-height: 620px !important;
    height: auto !important;
  }
}
          }
        }
        /* Strip Leaflet's default white box + drop-shadow around our custom SVG pins */
        .leaflet-div-icon.asset-map-pin {
          background: transparent;
          border: none;
        }
        .asset-map-pin svg {
          display: block;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.25));
        }
      `}</style>
=======
      {/* Responsive layout using Tailwind utilities – custom grid defined via inline style */}
>>>>>>> 49a3286 (feat: Enhance map components with responsive layout, improved error handling, and consistent color palette integration)
=======
      {/* Responsive layout using Tailwind utilities – custom grid defined via inline style */}
>>>>>>> 4a6a039a118a49ff259ff40c167222122c6a839f

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
<<<<<<< HEAD
@media (max-width: 768px) {
  .map-view-grid {
    grid-template-columns: 1fr !important;
  }
  .map-view-pane {
    aspect-ratio: 4 / 3.4;
    max-height: 520px !important;
    height: auto !important;
  }
}
=======
          <div className="map-view-grid">
            <div className="map-view-pane">
>>>>>>> 4a6a039a118a49ff259ff40c167222122c6a839f
              <AssetMap
                center={[CARLES_CENTER.lat, CARLES_CENTER.lng]}
                listings={listings}
                tileUrl={MAP_TILE_URL}
              />
            </div>
<<<<<<< HEAD
<div className="map-view-grid">
            <div className="map-view-pane">
=======
            <div className="flex flex-col gap-3">

              <MapLegend listings={listings} />

              <div className="bg-[#FDFBF8] border border-[#F4EFE7] rounded-[12px] p-4">
                <p className="mb-1 text-xs font-semibold text-[#999] uppercase tracking-wider">
>>>>>>> 4a6a039a118a49ff259ff40c167222122c6a839f
                  Summary
                </p>
                <p className="mb-1 text-sm text-[#555]">
                  {/* Count only listings that have valid coordinates, matching the pins shown on the map */}
                  <strong className="text-[#1a1a1a]">{listings.filter(l => l.latitude != null && l.longitude != null && l.latitude !== '' && l.longitude !== '' && Number.isFinite(Number(l.latitude)) && Number.isFinite(Number(l.longitude))).length}</strong> total listings
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