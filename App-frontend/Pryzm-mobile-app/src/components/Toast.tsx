import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "../store/AppStore";
import { Icon, Txt } from "./ui";

export default function Toast() {
  const { c, toast } = useStore();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: insets.top + 4, left: 16, right: 16, zIndex: 80, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c.tx, flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}
    >
      <Icon name="checkmark-circle" size={18} color={c.yes} />
      <Txt s={13.5} w={550} c={c.bg}>{toast}</Txt>
    </View>
  );
}
