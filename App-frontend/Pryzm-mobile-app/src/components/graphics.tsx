import React, { useState } from "react";
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { RankKey } from "../data/pryzm";

// assets/pryzm-icon.svg
export function PryzmLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="pzbg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#7c3aed" />
          <Stop offset="100%" stopColor="#5b21b6" />
        </LinearGradient>
        <LinearGradient id="pzbolt" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#fde68a" />
          <Stop offset="100%" stopColor="#f59e0b" />
        </LinearGradient>
      </Defs>
      <Rect width="32" height="32" rx="7" fill="url(#pzbg)" />
      <Path d="M18.5 4L8 17h8l-2.5 11L26 15h-8.5L18.5 4z" fill="url(#pzbolt)" />
    </Svg>
  );
}

// assets/ranks/*.svg — one shield, parameterised per tier.
const RANK_STYLE: Record<RankKey, { top: string; bottom: string; stroke: string; shine: number; ink: string; ink2: string; stars: string }> = {
  BRONZE_3: { top: "#d97232", bottom: "#8b4513", stroke: "#c8671e", shine: 0.25, ink: "#fff5e0", ink2: "#ffe4b0", stars: "★★★" },
  BRONZE_2: { top: "#e07a38", bottom: "#93481a", stroke: "#cd7032", shine: 0.28, ink: "#fff5e0", ink2: "#ffe4b0", stars: "★★☆" },
  BRONZE_1: { top: "#e88040", bottom: "#9a4e20", stroke: "#d47838", shine: 0.32, ink: "#fff5e0", ink2: "#ffe4b0", stars: "★☆☆" },
  SILVER_3: { top: "#b0b8c8", bottom: "#606878", stroke: "#a0a8b8", shine: 0.35, ink: "#f0f4ff", ink2: "#e0e8f8", stars: "★★★" },
  SILVER_2: { top: "#bcc4d4", bottom: "#6a7282", stroke: "#acb4c4", shine: 0.38, ink: "#f0f4ff", ink2: "#e0e8f8", stars: "★★☆" },
  SILVER_1: { top: "#c8d0e0", bottom: "#747c8c", stroke: "#b8c0d0", shine: 0.42, ink: "#f0f4ff", ink2: "#e0e8f8", stars: "★☆☆" },
  GOLD_3: { top: "#ffd040", bottom: "#b87800", stroke: "#e8b800", shine: 0.35, ink: "#3d2000", ink2: "#3d2000", stars: "★★★" },
  GOLD_2: { top: "#ffe050", bottom: "#c08400", stroke: "#eccb00", shine: 0.4, ink: "#3d2000", ink2: "#3d2000", stars: "★★☆" },
  GOLD_1: { top: "#fff060", bottom: "#c89000", stroke: "#f0da00", shine: 0.45, ink: "#3d2000", ink2: "#3d2000", stars: "★☆☆" },
};
const SHIELD = "M50 6 L90 22 L90 62 C90 85 50 114 50 114 C50 114 10 85 10 62 L10 22 Z";

export function RankBadge({ rank, width = 40, opacity = 1, grayscale = false }: { rank: RankKey; width?: number; opacity?: number; grayscale?: boolean }) {
  const st = RANK_STYLE[rank];
  const [tier, num] = rank.split("_");
  const top = grayscale ? "#b8b8be" : st.top, bottom = grayscale ? "#6e6e76" : st.bottom, stroke = grayscale ? "#a4a4ac" : st.stroke;
  const id = rank + (grayscale ? "g" : "");
  return (
    <Svg width={width} height={width * 1.2} viewBox="0 0 100 120" opacity={opacity}>
      <Defs>
        <LinearGradient id={"rb" + id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={top} />
          <Stop offset="100%" stopColor={bottom} />
        </LinearGradient>
        <LinearGradient id={"rs" + id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity={st.shine} />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={SHIELD} fill={`url(#rb${id})`} />
      <Path d={SHIELD} fill={`url(#rs${id})`} />
      <Path d={SHIELD} fill="none" stroke={stroke} strokeWidth={2} />
      <SvgText x="50" y="72" textAnchor="middle" fontSize="38" fontWeight="800" fill={st.ink} opacity={0.92}>{num}</SvgText>
      <SvgText x="50" y="44" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="2" fill={st.ink2} opacity={0.88}>{tier}</SvgText>
      <SvgText x="50" y="100" textAnchor="middle" fontSize="11" fill={st.ink2} opacity={0.72}>{st.stars}</SvgText>
    </Svg>
  );
}

/** Rank progress bar with the design's purple→amber gradient fill. */
export function XpBar({ pct, h = 7, track, from, to }: { pct: number; h?: number; track: string; from: string; to: string }) {
  return (
    <View style={{ height: h, borderRadius: 99, backgroundColor: track, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: h, borderRadius: 99, overflow: "hidden" }}>
        <Svg width="100%" height={h}>
          <Defs>
            <LinearGradient id="xp" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor={from} />
              <Stop offset="100%" stopColor={to} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height={h} fill="url(#xp)" />
        </Svg>
      </View>
    </View>
  );
}

/**
 * Line chart measured to its container so strokes stay crisp
 * (the design relies on vector-effect: non-scaling-stroke).
 */
export function LineChart({
  height, lines, area, style, strokeWidth = 2.25,
}: {
  height: number;
  lines: { pts: number[]; color: string }[];
  area?: { color: string; opacity?: number };
  style?: StyleProp<ViewStyle>;
  strokeWidth?: number;
}) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const path = (pts: number[]) =>
    pts.map((v, i) => (i ? "L" : "M") + ((i / (pts.length - 1)) * w).toFixed(1) + " " + (height - (v / 100) * height).toFixed(1)).join(" ");
  return (
    <View style={[{ height }, style]} onLayout={onLayout}>
      {w > 0 && (
        <Svg width={w} height={height} style={{ overflow: "visible" }}>
          {area && lines[0] && <Path d={path(lines[0].pts) + ` L${w} ${height} L0 ${height} Z`} fill={area.color} opacity={area.opacity ?? 0.7} />}
          {lines.map((ln, i) => (
            <Path key={i} d={path(ln.pts)} fill="none" stroke={ln.color} strokeWidth={strokeWidth} strokeLinejoin="round" />
          ))}
        </Svg>
      )}
    </View>
  );
}
