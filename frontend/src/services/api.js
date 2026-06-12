// Centralized API service — all backend calls must go through here
// Implementation will be completed in feature/dashboard-overview and subsequent feature branches
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// GET /api/destinations/carles/
export const getDestination = () => api.get("/destinations/carles/");

// GET /api/listings/
export const getListings = (params = {}) => api.get("/listings/", { params });

// GET /api/scores/current/
export const getCurrentScore = () => api.get("/scores/current/");

// POST /api/scores/recalculate/
export const recalculateScore = () => api.post("/scores/recalculate/");

// POST /api/ai-advisor/generate/
export const generateAIAdvice = (payload) => api.post("/ai-advisor/generate/", payload);

export default api;
