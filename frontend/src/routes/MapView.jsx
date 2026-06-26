// Placeholder — Map View will be implemented in feature/map-view
export default function MapView() {
  return (
<<<<<<< HEAD
    <div className="p-6">
      <h1 className="text-2xl font-bold">Map View</h1>
      <p className="mt-2 text-gray-500">Leaflet map with asset pins — coming soon.</p>
=======
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
>>>>>>> 0c6c1f3 (feat: Implement AssetMap and MapLegend components with loading skeleton and error handling in MapView)
    </div>
  );
}
