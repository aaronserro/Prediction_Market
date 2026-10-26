// Design tokens from Pryzm Mobile.dc.html ([data-theme] blocks).
export type ThemeName = "light" | "dark";

export type Palette = {
  bg: string; sf: string; sf2: string; bd: string; bd2: string;
  tx: string; tx2: string; mu: string;
  pr: string; prh: string; prs: string; prt: string;
  am: string; ams: string; amt: string;
  yes: string; yess: string; no: string; nos: string;
  shadow: boolean;
};

export const palettes: Record<ThemeName, Palette> = {
  light: {
    bg: "#f6f5f9", sf: "#ffffff", sf2: "#f1f0f5", bd: "#e6e4ec", bd2: "#d4d1de",
    tx: "#15121d", tx2: "#45414f", mu: "#6f6b7d",
    pr: "#6d3ae6", prh: "#5b2bd0", prs: "#efe9fd", prt: "#5b2bd0",
    am: "#f5a50b", ams: "#fdf3dc", amt: "#8f5400",
    yes: "#0f8a52", yess: "#e3f4ea", no: "#d43a47", nos: "#fbe9ea",
    shadow: true,
  },
  dark: {
    bg: "#0b0a10", sf: "#13121a", sf2: "#1c1a25", bd: "#26232f", bd2: "#36323f",
    tx: "#f3f2f7", tx2: "#c6c3d1", mu: "#918da1",
    pr: "#8b5cf6", prh: "#a07cf8", prs: "#231b3b", prt: "#bba6fb",
    am: "#fbbf24", ams: "#2a2112", amt: "#fbbf24",
    yes: "#34c47e", yess: "#11281c", no: "#f2646f", nos: "#2d1519",
    shadow: false,
  },
};

// Multi-outcome series colours (pryzm-data.js COLORS). oklch values converted to sRGB.
export const seriesColors = (c: Palette) => [c.pr, c.am, "#1f9aa3", "#c2546b", c.mu, c.bd2];

export const fonts = {
  sans: {
    400: "Geist_400Regular",
    500: "Geist_500Medium",
    600: "Geist_600SemiBold",
    700: "Geist_700Bold",
  },
  mono: {
    400: "GeistMono_400Regular",
    500: "GeistMono_500Medium",
    600: "GeistMono_600SemiBold",
    700: "GeistMono_700Bold",
  },
} as const;

export type Weight = 400 | 500 | 550 | 600 | 620 | 650 | 700;

// The design uses variable-font weights (550, 620, 650); map them to the nearest static face.
export function fontFamily(weight: Weight = 400, mono = false) {
  const w = weight <= 400 ? 400 : weight <= 550 ? 500 : weight <= 650 ? 600 : 700;
  return (mono ? fonts.mono : fonts.sans)[w];
}

export const cardShadow = {
  shadowColor: "#141028",
  shadowOpacity: 0.05,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
};
