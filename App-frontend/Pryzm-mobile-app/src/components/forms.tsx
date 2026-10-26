import React from "react";
import { View } from "react-native";
import { useStore } from "../store/AppStore";
import { fontFamily, Palette } from "../theme";
import { Txt } from "./ui";

export const inputStyle = (c: Palette) => ({
  height: 50, borderRadius: 12, borderWidth: 1, borderColor: c.bd2, backgroundColor: c.sf, color: c.tx,
  paddingHorizontal: 14, fontSize: 16, fontFamily: fontFamily(400),
});

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  const { c } = useStore();
  return (
    <View style={{ gap: 6 }}>
      <Txt s={13} w={550} c={c.tx2}>{label}</Txt>
      {children}
      {hint}
    </View>
  );
}

export function ErrorBox({ msg }: { msg: string }) {
  const { c } = useStore();
  return (
    <View style={{ paddingVertical: 11, paddingHorizontal: 13, borderRadius: 10, backgroundColor: c.nos }}>
      <Txt s={13.5} w={500} c={c.no}>{msg}</Txt>
    </View>
  );
}
