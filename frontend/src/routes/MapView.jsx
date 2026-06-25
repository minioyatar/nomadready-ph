import React, { useEffect, useState, useRef } from 'react';
import AssetMap from '../components/map/AssetMap';
import MapLegend from '../components/map/MapLegend';
import { getListings } from '../services/api';
import { CARLES_CENTER, MAP_TILE_URL } from '../lib/constants';

// ─── Map skeleton ─────────────────────────────────────────────────────────────

function Sk({ width = '100%', height = 13, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #f5f0e8 25%, #ece7de 50%, #f5f0e8 75%)',
      backgroundSize: '200% 100%',
      animation: 'mapShimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

function MapSkeleton() {
  return (
    <>
      <style>{`
        @keyframes mapShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="map-view-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 12 }}>
        {/* Map area skeleton */}
        <div
          className="map-view-pane"
          style={{
            aspectRatio: '16 / 10',
            minHeight: 420,
            maxHeight: 780,
            borderRadius: 12,
            border: '1px solid #ece8e2', overflow: 'hidden',
            position: 'relative', background: '#f9f7f4',
          }}
        >
          {/* Fake tile grid */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(5, 1fr)', gap: 2, padding: 2,
          }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <Sk key={i} width="100%" height="100%" radius={4}
                style={{ animationDelay: `${(i % 5) * 0.08}s` }} />
            ))}
          </div>
          {/* Fake zoom controls */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <Sk width={30} height={30} radius={6} />
            <Sk width={30} height={30} radius={6} />
          </div>
          {/* Fake pin cluster */}
          <div style={{
            position: 'absolute', top: '40%', left: '45%',
            display: 'flex', gap: 20,
          }}>
            {[0, 1, 2].map((i) => (
              <Sk key={i} width={14} height={20} radius={99}
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>

        {/* Legend skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            background: '#fff', border: '1px solid #ece8e2',
            borderRadius: 12, padding: 16,
          }}>
            <Sk width="50%" height={12} style={{ marginBottom: 14 }} />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Sk width={10} height={10} radius={99} />
                <Sk width="60%" height={10} />
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #ece8e2', borderRadius: 12, padding: 16 }}>
            <Sk width="40%" height={11} style={{ marginBottom: 8 }} />
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
      .then((data) => {
        if (!mounted) return;
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
    <div style={{ maxWidth: 1480, margin: '0 auto' }}>

      {/* Responsive + marker styling (scoped, no external CSS file needed) */}
      <style>{`
        .map-view-grid {
          grid-template-columns: 1fr 240px;
        }
        @media (max-width: 768px) {
          .map-view-grid {
            grid-template-columns: 1fr !important;
          }
          .map-view-pane {
            aspect-ratio: 4 / 3.4;
            max-height: 520px !important;
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
                aspectRatio: '16 / 10',
                minHeight: 420,
                maxHeight: 780,
              }}
            >
              <AssetMap
                center={[CARLES_CENTER.lat, CARLES_CENTER.lng]}
                listings={listings}
                tileUrl={MAP_TILE_URL}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MapLegend />
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
  );
}