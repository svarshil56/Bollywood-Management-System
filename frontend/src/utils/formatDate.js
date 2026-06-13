/**
 * ==========================================
 * CINEFLOW UTILS: formatDate.js
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Employs the native ECMAScript Internationalization API (`Intl.DateTimeFormat`) rather than loading heavy external formatting packages.
 * - Formats dates to matches localized format standard (Indian English `en-IN` matches Bollywood datasets).
 * ==========================================
 */

export function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
