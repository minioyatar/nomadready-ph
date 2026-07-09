import { ENDPOINTS, API_BASE_URL } from '../lib/constants';

// Centralized API service — all backend calls must go through here
// Returns demo fallbacks when backend endpoints are missing (safe stub for UI)

const MOCK_SCORE = {
  overall_score: 68,
  score_label: 'Developing NomadReady Destination',
  category_scores: {
    internet_work: 55,
    accommodation: 60,
    safety_services: 75,
    transport: 70,
    tourism_lifestyle: 90,
  },
  strongest_category: 'Tourism & Lifestyle Appeal',
  weakest_category: 'Internet & Work Readiness',
  top_gaps: [
    'No verified co-working spaces with published Wi-Fi speed',
    'No long-stay accommodation with published monthly rates',
    'Limited work-friendly spots with Zoom-friendly environment',
  ],
  explanation:
    'Demo snapshot: scores seeded for the Carles pilot destination. Replace with backend data when available.',
  metrics: {
    work_spots: 24,
    long_stay: 38,
    avg_stay: 22,
  },
};

const MOCK_LISTINGS = [
  { id: 1, name: 'Café Azul - coworking', category: 'work_spots', lgu_verified: true, contact: '0987-654-3210', latitude: 11.5585, longitude: 122.5890 },
  { id: 2, name: 'SeaView Homestay', category: 'accommodations', lgu_verified: true, contact: '0912-345-6789', latitude: 11.5642, longitude: 122.5921 },
  { id: 3, name: 'Carles Medical Clinic', category: 'services', lgu_verified: true, contact: '0981-234-5678', latitude: 11.5560, longitude: 122.5880 },
  { id: 4, name: 'Island Ferry Service', category: 'transport', lgu_verified: true, contact: '0998-765-4321', latitude: 11.5505, longitude: 122.5855 },
  { id: 5, name: 'Paradise Beach Resort', category: 'attractions', lgu_verified: true, contact: 'N/A', latitude: 11.5650, longitude: 122.5970 },
  { id: 6, name: 'WiFi Hub Carles', category: 'work_spots', lgu_verified: false, contact: '0921-654-3210', latitude: 11.5595, longitude: 122.5905 },
];

const MOCK_DESTINATION = {
  slug: 'carles',
  name: 'Carles, Iloilo',
  population: null,
  description: 'Pilot destination: Carles, Iloilo (demo data).',
};

const MOCK_AI = {
  _mock: true,
  suggestions: [
    { title: 'Certify 5 more cafés as work spots', description: "Nomads searched 'quiet café WiFi' 78 times this month with no result.", priority: 'High' },
    { title: 'Publish a brownout schedule', description: 'Power reliability is the #1 concern in nomad check-in surveys this month.', priority: 'High' },
    { title: 'Partner with 3 more homestays', description: 'Monthly stay demand up 38% but supply lags.', priority: 'Medium' },
  ],
};

async function request(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    // If endpoint not found, return null to allow graceful fallback
    if (res.status === 404) return null;

    // No content
    if (res.status === 204) return null;

    const text = await res.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch (err) {
      console.warn('API response JSON parse failed for', path, err);
      return text;
    }
  } catch (err) {
    // Network error or CORS — return null so UI can show placeholders
    console.warn('API request failed', path, err && err.message ? err.message : err);
    return null;
  }
}

export async function getCurrentScore() {
  const data = await request(ENDPOINTS.CURRENT_SCORE, { method: 'GET' });
  return data ?? MOCK_SCORE;
}

export async function recalculateScore() {
  const data = await request(ENDPOINTS.RECALCULATE_SCORE, { method: 'POST' });
  return data ?? MOCK_SCORE;
}

export async function getListings(params = {}) {
  try {
    const url = new URL(`${API_BASE_URL}${ENDPOINTS.LISTINGS}`);
    Object.keys(params || {}).forEach((k) => url.searchParams.append(k, params[k]));
    const response = await fetch(url.toString());
    if (!response.ok) {
      // if endpoint missing or returns error, fallback to mock listings
      console.warn('getListings failed, status:', response.status, 'returning MOCK_LISTINGS');
      return MOCK_LISTINGS;
    }
    return response.json();
  } catch (err) {
    console.warn('getListings network error, returning MOCK_LISTINGS', err && err.message ? err.message : err);
    return MOCK_LISTINGS;
  }
}

export async function getDestination(slug = 'carles') {
  const res = await request(`/api/destinations/${slug}/`);
  return res ?? MOCK_DESTINATION;
}

export async function generateAIAdvice(payload = {}) {
  // POST to AI generator; backend may not be implemented yet
  try {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.AI_ADVISOR}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 404) return MOCK_AI;
    if (res.status === 204) return MOCK_AI;

    const json = await res.json();
    return json ?? MOCK_AI;
  } catch (err) {
    console.warn('generateAIAdvice failed', err && err.message ? err.message : err);
    return MOCK_AI;
  }
}

export default {
  getCurrentScore,
  recalculateScore,
  getListings,
  getDestination,
  generateAIAdvice,
};
