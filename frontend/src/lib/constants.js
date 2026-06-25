// Shared constants — do not import from route files, import from here

export const LISTING_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "work_spot", label: "Work Spots" },
  { value: "accommodation", label: "Accommodations" },
  { value: "service", label: "Services" },
  { value: "transport", label: "Transport" },
  { value: "attraction", label: "Attractions" },
];

export const VERIFICATION_STATUS = {
  draft: "Draft",
  lgu_verified: "LGU Verified",
  needs_update: "Needs Update",
};

export const SCORE_LABELS = {
  NOT_READY: "Not Yet NomadReady",
  EMERGING: "Emerging Destination",
  DEVELOPING: "Developing NomadReady Destination",
  NOMADREADY: "NomadReady Destination",
  HIGHLY_READY: "Highly NomadReady Destination",
};

// Use Vite environment variables in the browser (import.meta.env)
// Default to the backend dev server when no VITE_API_BASE_URL is defined
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const ENDPOINTS = {
  CURRENT_SCORE: '/api/scores/current/',
  RECALCULATE_SCORE: '/api/scores/recalculate/',
  LISTINGS: '/api/listings/',
};

export const WEIGHTS = {
  internet_work: 0.3,
  accommodation: 0.2,
  safety_services: 0.2,
  transport: 0.15,
  tourism_lifestyle: 0.15,
};

export const CARLES_CENTER = { lat: 11.5585, lng: 122.5890 };
export const MAP_TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
