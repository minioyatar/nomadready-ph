import React, { useEffect, useState, useRef, Component } from 'react';
import { Link } from 'react-router-dom';
import AssetMap from '../map/AssetMap';
import { getListings } from '../../services/api';
import { CARLES_CENTER, MAP_TILE_URL } from '../../lib/constants';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Sk({ width = '100%', height = 13, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #f5f0e8 25%, #ece7de 50%, #f5f0e8 75%)',
      backgroundSize: '200% 100%',
      animation: 'miniMapShimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

function MiniMapSkeleton() {
  return (
    <>
      <style>{`
        @keyframes miniMapShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{
        height: 260, borderRadius: 14,
        border: '1px solid var(--border)', overflow: 'hidden',
        position: 'relative', background: '#f9f7f4',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)', gap: 2, padding: 2,
        }}>
          {Array.from({ length: 18 }).map((_, i) => (
            <Sk key={i} width="100%" height="100%" radius={4}
              style={{ animationDelay: `${(i % 6) * 0.07}s` }} />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── MapFallback — shown when AssetMap returns null or throws ────────────────

function MapFallback() {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8,
      background: '#f9f7f4', color: 'var(--text-hint)',
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        style={{ opacity: 0.45 }}>
        <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
        <path d="M9 3v15M15 6v15" />
      </svg>
      <span style={{ fontSize: 12 }}>Map preview unavailable</span>
      <Link to="/map" style={{ fontSize: 12, color: 'var(--accent)' }}>
        Open full map →
      </Link>
    </div>
  );
}

// Class-based error boundary so a throwing AssetMap doesn't crash the card.
class MapErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? <MapFallback /> : this.props.children;
  }
}

// Wraps AssetMap and swaps in MapFallback if the component renders null.
function MapWithFallback(props) {
  const rendered = <AssetMap {...props} />;
  return rendered == null ? <MapFallback /> : (
    <MapErrorBoundary>{rendered}</MapErrorBoundary>
  );
}

// ─── MiniMapCard ──────────────────────────────────────────────────────────────

export default function MiniMapCard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const contentRef = useRef(null);

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
        setError(err?.message || 'Failed to load map data');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card map-card">
      <div className="section-header">
        <div className="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
            <path d="M9 3v15M15 6v15" />
          </svg>
          Asset Map
        </div>
        {/* FIX 1: was <a href="/map"> — caused full-page reload on internal route */}
        <Link to="/map" className="section-link">View full map →</Link>
      </div>

      {loading && <MiniMapSkeleton />}

      {!loading && error && (
        <div style={{
          textAlign: 'center', padding: '40px 20px',
          background: 'var(--red-light)', borderRadius: 14, color: 'var(--red-mid)',
        }}>
          <p style={{ fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && (
        // FIX 2: MapWithFallback guards against AssetMap returning null/throwing,
        // replacing the blank framed box with a meaningful placeholder.
        <div ref={contentRef} style={{
          height: 260, borderRadius: 14, overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <MapWithFallback
            center={[CARLES_CENTER.lat, CARLES_CENTER.lng]}
            zoom={12}
            listings={listings}
            tileUrl={MAP_TILE_URL}
            interactive={false}
          />
        </div>
      )}

      {!loading && !error && (
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-hint)' }}>
          {listings.filter((l) => l.latitude && l.longitude).length} listings shown · open the full map to pan, zoom, and explore
        </p>
      )}
    </div>
  );
}