const RANK_TIERS = [
  { floor: 0,    ceil: 100  }, // BRONZE_3
  { floor: 100,  ceil: 150  }, // BRONZE_2
  { floor: 150,  ceil: 200  }, // BRONZE_1
  { floor: 200,  ceil: 300  }, // SILVER_3
  { floor: 300,  ceil: 400  }, // SILVER_2
  { floor: 400,  ceil: 550  }, // SILVER_1
  { floor: 550,  ceil: 750  }, // GOLD_3
  { floor: 750,  ceil: 1000 }, // GOLD_2
  { floor: 1000, ceil: null }, // GOLD_1 (max)
];

export function rankProgress(pts: number) {
  const tier =
    [...RANK_TIERS].reverse().find((t) => pts >= t.floor) ?? RANK_TIERS[0];
  if (tier.ceil === null) return { pct: 100, next: tier.floor, isMax: true };
  return {
    pct: Math.min(((pts - tier.floor) / (tier.ceil - tier.floor)) * 100, 100),
    next: tier.ceil,
    isMax: false,
  };
}

export function computeRank(pts = 0): string {
  if (pts >= 1000) return "GOLD_1";
  if (pts >= 750)  return "GOLD_2";
  if (pts >= 550)  return "GOLD_3";
  if (pts >= 400)  return "SILVER_1";
  if (pts >= 300)  return "SILVER_2";
  if (pts >= 200)  return "SILVER_3";
  if (pts >= 150)  return "BRONZE_1";
  if (pts >= 100)  return "BRONZE_2";
  return "BRONZE_3";
}

export function formatRank(key: string | null): string {
  if (!key) return "—";
  const map: Record<string, string> = {
    GOLD_1:    "Gold I",
    GOLD_2:    "Gold II",
    GOLD_3:    "Gold III",
    SILVER_1:  "Silver I",
    SILVER_2:  "Silver II",
    SILVER_3:  "Silver III",
    BRONZE_1:  "Bronze I",
    BRONZE_2:  "Bronze II",
    BRONZE_3:  "Bronze III",
  };
  return map[key] ?? key;
}

export function rankColor(key: string | null): string {
  if (!key) return "#a78bfa";
  if (key.startsWith("GOLD"))   return "#fbbf24";
  if (key.startsWith("SILVER")) return "#94a3b8";
  return "#cd7f32"; // bronze
}

export function rankEmoji(key: string | null): string {
  if (!key) return "🏅";
  if (key.startsWith("GOLD"))   return "🥇";
  if (key.startsWith("SILVER")) return "🥈";
  return "🥉";
}
