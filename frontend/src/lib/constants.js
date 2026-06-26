// Shared constants — do not import from route files, import from here

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || '';

export const ENDPOINTS = {
  CURRENT_SCORE: '/api/scores/current/',
  RECALCULATE_SCORE: '/api/scores/recalculate/',
  LISTINGS: '/api/listings/',
  DESTINATIONS: '/api/destinations/',
  AI_ADVISOR: '/api/ai-advisor/generate/',
  GENERATE_AI_ADVICE: '/api/ai-advisor/generate/',
};

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

export const CARLES_CENTER = {
  lat: 11.4000,
  lng: 122.5583,
};

export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const CATEGORY_WEIGHTS = {
  internet_work: 0.30,
  accommodation: 0.20,
  safety_services: 0.20,
  transport: 0.15,
  tourism_lifestyle: 0.15,
};
