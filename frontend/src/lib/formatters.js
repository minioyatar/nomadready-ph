// Shared formatting helpers

export function formatScore(score) {
  const num = Number(score);
  if (Number.isNaN(num)) return null; // callers can render a placeholder dash
  return Math.round(num);
}

export function getScoreColor(score) {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-600";
}

export function formatCategory(key) {
  const labels = {
    internet_work: "Internet & Work Readiness",
    accommodation: "Long-Stay Accommodation",
    safety_services: "Safety & Essential Services",
    transport: "Transport & Access",
    tourism_lifestyle: "Tourism & Lifestyle Appeal",
  };
  return labels[key] ?? key;
}