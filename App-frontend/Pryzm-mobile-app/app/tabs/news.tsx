import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function NewsScreen() {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.heading}>News</Text>
      <View style={s.empty}>
        <Text style={s.emptyText}>News coming soon.</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: "#080612" },
  content:   { padding: 16 },
  heading:   { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 16 },
  empty:     { borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 40, alignItems: "center" },
  emptyText: { color: "#475569", fontSize: 13 },
});
