<<<<<<< HEAD
// Placeholder — implemented in feature/map-view
export default function AssetMap() {
  return null;
}
=======
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CATEGORY_COLORS } from '../../lib/categoryPalette';

const DEFAULT_COLOR = '#888888';

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
  center = [11.5585, 122.5890],
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

  // Ensure latitude and longitude are present and parse to finite numbers.
  // Number(null) and Number('') both return 0 (a finite number), so an explicit
  // null/empty-string guard is required before the Number() conversion — otherwise
  // listings with missing coordinates silently appear at 0°N 0°E (Gulf of Guinea).
  const validListings = listings.filter((l) => {
    if (l.latitude == null || l.longitude == null) return false;
    if (l.latitude === '' || l.longitude === '') return false;
    return Number.isFinite(Number(l.latitude)) && Number.isFinite(Number(l.longitude));
  });

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
                  {l.lgu_verified ? 'LGU verified' : 'Not verified'}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
>>>>>>> 08d0eba (feat: Implement AssetMap and MapLegend components with loading skeleton and error handling in MapView)
