import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ComponentProps, ReactNode, useEffect, useRef } from "react";
import {
    Animated, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../store/AppStore";
import { cardShadow, fontFamily, Weight } from "../theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export const Icon = Ionicons;

type TxtProps = TextProps & {
  s?: number;          // font size
  w?: Weight;          // font weight
  c?: string;          // colour
  ls?: number;         // letter spacing in em, as in the design
  lh?: number;         // line height multiplier
  mono?: boolean;
  center?: boolean;
  style?: StyleProp<TextStyle>;
};

export function Txt({ s = 15, w = 400, c, ls, lh, mono, center, style, ...rest }: TxtProps) {
  const colors = useColors();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fontFamily(w, mono),
          fontSize: s,
          color: c ?? colors.tx,
          letterSpacing: ls !== undefined ? ls * s : undefined,
          lineHeight: lh ? lh * s : undefined,
          textAlign: center ? "center" : undefined,
        },
        style,
      ]}
    />
  );
}

export function Card({ style, children, onPress }: { style?: StyleProp<ViewStyle>; children: ReactNode; onPress?: () => void }) {
  const c = useColors();
  const base: ViewStyle = { backgroundColor: c.sf, borderWidth: 1, borderColor: c.bd, borderRadius: 16, ...(c.shadow ? cardShadow : null) };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { borderColor: c.bd2 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[{ height: StyleSheet.hairlineWidth * 2, backgroundColor: c.bd }, style]} />;
}

/** Pill-shaped filter chips (black-on-white selected state). */
export function Chips<T extends string>({
  items, value, onChange, h = 34, s = 13.5, scroll = true, style,
}: { items: readonly T[]; value: T; onChange: (v: T) => void; h?: number; s?: number; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const chips = items.map((label) => {
    const on = label === value;
    return (
      <Pressable
        key={label}
        onPress={() => onChange(label)}
        style={{ height: h, paddingHorizontal: h > 31 ? 14 : 12, borderRadius: 999, borderWidth: 1, borderColor: on ? c.tx : c.bd, backgroundColor: on ? c.tx : c.sf, justifyContent: "center" }}
      >
        <Txt s={s} w={500} c={on ? c.bg : c.tx2}>{label}</Txt>
      </Pressable>
    );
  });
  if (!scroll) return <View style={[{ flexDirection: "row", gap: 6 }, style]}>{chips}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={[{ gap: 6, paddingHorizontal: 16 }, style]}>
      {chips}
    </ScrollView>
  );
}

/** iOS-style segmented control. */
export function Segmented<T extends string>({
  items, value, onChange, h = 32, s = 13.5, mono, stretch = true, style,
}: { items: readonly T[]; value: T; onChange: (v: T) => void; h?: number; s?: number; mono?: boolean; stretch?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View style={[{ flexDirection: "row", gap: 2, padding: 3, borderRadius: h > 30 ? 10 : 9, backgroundColor: c.sf2 }, style]}>
      {items.map((label) => {
        const on = label === value;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(label)}
            style={[
              { height: h, borderRadius: h > 30 ? 8 : 7, alignItems: "center", justifyContent: "center", paddingHorizontal: stretch ? 0 : 10 },
              stretch && { flex: 1 },
              on && { backgroundColor: c.sf, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
            ]}
          >
            <Txt s={s} w={mono ? 500 : 600} mono={mono} c={on ? c.tx : c.mu}>{label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Underlined tab strip used in cards (Portfolio, Order book, Market detail). */
export function UnderlineTabs({
  items, value, onChange, h = 46, s = 14,
}: { items: { label: string; count?: string | number; color?: string }[]; value: string; onChange: (v: string) => void; h?: number; s?: number }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 4, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: c.bd }}>
      {items.map((t) => {
        const on = t.label === value;
        return (
          <Pressable key={t.label} onPress={() => onChange(t.label)} style={{ height: h, paddingHorizontal: 9, justifyContent: "center", borderBottomWidth: 2, borderBottomColor: on ? (t.color ?? c.pr) : "transparent", marginBottom: -1 }}>
            <Txt s={s} w={550} c={on ? c.tx : c.mu}>
              {t.label}
              {t.count !== undefined && t.count !== "" ? <Txt s={12} mono c={c.mu}>{"  " + t.count}</Txt> : null}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={{ width: 46, height: 28, borderRadius: 999, padding: 2, backgroundColor: on ? c.pr : c.bd2, alignItems: on ? "flex-end" : "flex-start" }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
    </Pressable>
  );
}

export function PulseDot({ size = 6, color }: { size?: number; color: string }) {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: op }} />;
}

export function Badge({ label, bg, color, s = 12, style }: { label: string; bg: string; color: string; s?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, backgroundColor: bg, alignSelf: "flex-start" }, style]}>
      <Txt s={s} w={600} c={color}>{label}</Txt>
    </View>
  );
}

export function LiveTag({ s = 12.5 }: { s?: number }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <PulseDot color={c.yes} />
      <Txt s={s} w={600} c={c.yes}>LIVE</Txt>
    </View>
  );
}

export function Avatar({ name, size = 34, bg, color, s }: { name: string; size?: number; bg?: string; color?: string; s?: number }) {
  const c = useColors();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? c.sf2, alignItems: "center", justifyContent: "center" }}>
      <Txt s={s ?? Math.round(size * 0.38)} w={600} c={color ?? c.tx2}>{name[0].toUpperCase()}</Txt>
    </View>
  );
}

export function IconTile({ name, bg, color, size = 32, radius = 9, iconSize = 18 }: { name: IconName; bg: string; color: string; size?: number; radius?: number; iconSize?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Icon name={name} size={iconSize} color={color} />
    </View>
  );
}

type BtnProps = { label: ReactNode; onPress?: () => void; bg: string; color: string; h?: number; s?: number; radius?: number; border?: string; disabled?: boolean; style?: StyleProp<ViewStyle> };
export function Button({ label, onPress, bg, color, h = 52, s = 16, radius = 12, border, disabled, style }: BtnProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        { height: h, borderRadius: radius, backgroundColor: bg, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        border ? { borderWidth: 1, borderColor: border } : null,
        style,
      ]}
    >
      {typeof label === "string" ? <Txt s={s} w={650} c={color}>{label}</Txt> : label}
    </Pressable>
  );
}

/** Full-screen pushed page with a back-button header bar. */
export function PageScreen({ title, right, children, footer }: { title?: ReactNode; right?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ height: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: c.bd, backgroundColor: c.sf, gap: 4 }}>
        <Pressable onPress={() => router.back()} hitSlop={6} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Icon name="chevron-back" size={23} color={c.tx} />
        </Pressable>
        <View style={{ flex: 1 }}>
          {typeof title === "string" ? <Txt s={16} w={620} ls={-0.02} center>{title}</Txt> : title}
        </View>
        <View style={{ minWidth: 40, flexDirection: "row", justifyContent: "flex-end" }}>{right}</View>
      </View>
      {children}
      {footer}
    </View>
  );
}

export function HeaderIconButton({ name, onPress, color, size = 20 }: { name: IconName; onPress: () => void; color?: string; size?: number }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} hitSlop={4} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
      <Icon name={name} size={size} color={color ?? c.tx} />
    </Pressable>
  );
}

/** Large left-aligned tab-screen title. */
export function ScreenTitle({ title, sub }: { title: string; sub?: ReactNode }) {
  const c = useColors();
  return (
    <View>
      <Txt s={28} w={650} ls={-0.04}>{title}</Txt>
      {sub ? <Txt s={14} c={c.mu} style={{ marginTop: 2 }}>{sub}</Txt> : null}
    </View>
  );
}

export function DataUnavailable({ title = "Real data unavailable", message = "This screen is ready for real data, but its backend integration has not been configured yet." }: { title?: string; message?: string }) {
  const c = useColors();
  return (
    <View style={{ margin: 16, paddingVertical: 36, paddingHorizontal: 22, borderWidth: 1.5, borderStyle: "dashed", borderColor: c.bd2, borderRadius: 16, alignItems: "center", gap: 9 }}>
      <Icon name="cloud-offline-outline" size={28} color={c.mu} />
      <Txt s={16} w={650} center>{title}</Txt>
      <Txt s={13.5} lh={1.5} c={c.mu} center>{message}</Txt>
    </View>
  );
}

export function KV({ k, v, bold, vColor, mono = true }: { k: string; v: ReactNode; bold?: boolean; vColor?: string; mono?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Txt s={13.5} w={bold ? 600 : 400} c={bold ? c.tx : c.mu}>{k}</Txt>
      {typeof v === "string" ? <Txt s={13.5} mono={mono} w={bold ? 600 : 400} c={vColor ?? c.tx}>{v}</Txt> : v}
    </View>
  );
}

export function CoinDot({ size = 14 }: { size?: number }) {
  const c = useColors();
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.am, borderWidth: Math.max(2, size / 14), borderColor: "rgba(0,0,0,0.12)" }} />;
}
