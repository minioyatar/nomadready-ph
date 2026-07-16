import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CATEGORY_COLORS } from '../../lib/categoryPalette';

const DEFAULT_COLOR = '#888888';
const CARLES_CENTER = [11.572, 123.134];

// Fits the map to the bounds of the provided coordinates, or falls back to
// Carles center at zoom 13 when no valid coordinates are available.
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, minZoom: 11 });
    } else {
      map.setView(CARLES_CENTER, 13);
    }
  }, [map, positions]);
  return null;
}

// ─── Build a Leaflet divIcon from inline SVG (no external PNG dependency) ─────

function buildPinIcon(color) {
  const svg = `
    <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2C8.477 2 4 6.477 4 12c0 7.5 10 24 10 24S24 19.5 24 12c0-5.523-4.477-10-10-10z"
        fill="${color}"
        stroke="rgba(0,0,0,0.18)"
        stroke-width="1"
      />
      <circle cx="14" cy="12" r="4.5" fill="#fff" opacity="0.92"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'asset-map-pin', // strips Leaflet's default white box/shadow styles
    iconSize: [28, 38],
    iconAnchor: [14, 36],   // tip of the pin touches the coordinate
    popupAnchor: [0, -32],
  });
}

export default function AssetMap({
  center = CARLES_CENTER,
  zoom = 13,
  listings = [],
  tileUrl,
  interactive = true,
}) {
  // Cache one icon instance per category instead of rebuilding per-marker render
  const iconsByCategory = useMemo(() => {
    const cache = {};
    Object.entries(CATEGORY_COLORS).forEach(([key, color]) => {
      cache[key] = buildPinIcon(color);
    });
    cache.__default = buildPinIcon(DEFAULT_COLOR);
    return cache;
  }, []);



  // Memoized so FitBounds is not re-triggered by unrelated parent re-renders.
  // Number(null) and Number('') both return 0 (finite), so explicit null/empty
  // guards are required before Number() to avoid pins at 0°N 0°E (Gulf of Guinea).
  const validListings = useMemo(() =>
    listings.filter((l) => {
      if (l.latitude == null || l.longitude == null) return false;
      if (l.latitude === '' || l.longitude === '') return false;
      return Number.isFinite(Number(l.latitude)) && Number.isFinite(Number(l.longitude));
    }),
    [listings]
  );

  const positions = useMemo(() =>
    validListings.map((l) => [Number(l.latitude), Number(l.longitude)]),
    [validListings]
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
      zoomControl={interactive}
      attributionControl={interactive}
    >
      <TileLayer url={tileUrl} />
      <FitBounds positions={positions} />
      {validListings.map((l) => {
        const icon = iconsByCategory[l.category] || iconsByCategory.__default;
        return (
          <Marker key={l.id} position={[l.latitude, l.longitude]} icon={icon}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>{l.name}</strong>
                <div style={{ fontSize: 13, color: '#666' }}>{l.category}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>{l.type ? l.type : '—'}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  {l.verification_status === 'lgu_verified' ? 'LGU Verified' : l.verification_status || 'Unverified'}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}