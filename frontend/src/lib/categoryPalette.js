// Shared category palette used by both AssetMap and MapLegend
// Keeps colors and labels in sync across map components.
export const CATEGORY_PALETTE = [
  { key: 'work_spots', label: 'Work Spots', color: '#534AB7' },
  { key: 'accommodations', label: 'Accommodations', color: '#D85A30' },
  { key: 'services', label: 'Services', color: '#0F6E56' },
  { key: 'transport', label: 'Transport', color: '#BA7517' },
  { key: 'attractions', label: 'Attractions', color: '#6A1B9A' },
];

// Helper to map category key to color quickly
export const CATEGORY_COLORS = CATEGORY_PALETTE.reduce((acc, cur) => {
  acc[cur.key] = cur.color;
  return acc;
}, {});
