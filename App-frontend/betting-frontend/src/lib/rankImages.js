// src/lib/rankImages.js
// Maps rank keys returned by GET /api/ranks/{userId} to their badge images.
// Place the image files in: public/ranks/
// e.g. public/ranks/bronze1.svg, public/ranks/silver3.svg, etc.

const rankImages = {
  BRONZE_3: "/ranks/bronze3.svg",
  BRONZE_2: "/ranks/bronze2.svg",
  BRONZE_1: "/ranks/bronze1.svg",
  SILVER_3: "/ranks/silver3.svg",
  SILVER_2: "/ranks/silver2.svg",
  SILVER_1: "/ranks/silver1.svg",
  GOLD_3:   "/ranks/gold3.svg",
  GOLD_2:   "/ranks/gold2.svg",
  GOLD_1:   "/ranks/gold1.svg",
};

export default rankImages;

/** "BRONZE_1" → "Bronze 1",  "GOLD_3" → "Gold 3" */
export function formatRank(raw) {
  if (!raw) return "—";
  return raw
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** All ranks, lowest to highest. */
export const RANK_KEYS = [
  "BRONZE_3", "BRONZE_2", "BRONZE_1",
  "SILVER_3", "SILVER_2", "SILVER_1",
  "GOLD_3", "GOLD_2", "GOLD_1",
];

// Point floors per rank (mirrors the mobile app's rankUtils).
const RANK_FLOORS = [0, 100, 150, 200, 300, 400, 550, 750, 1000];

export function computeRank(points = 0) {
  let key = RANK_KEYS[0];
  RANK_FLOORS.forEach((floor, i) => { if (points >= floor) key = RANK_KEYS[i]; });
  return key;
}

/** Progress within the current rank: { have, need, pct, isMax }. */
export function rankProgress(points = 0) {
  const i = RANK_KEYS.indexOf(computeRank(points));
  if (i === RANK_KEYS.length - 1) return { have: points, need: points, pct: 100, isMax: true };
  const floor = RANK_FLOORS[i];
  const ceil = RANK_FLOORS[i + 1];
  return { have: points - floor, need: ceil - floor, pct: Math.min(100, ((points - floor) / (ceil - floor)) * 100), isMax: false };
}
