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
