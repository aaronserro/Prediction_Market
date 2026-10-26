import { Pressable, ScrollView, View } from "react-native";
import { DataUnavailable, IconName, IconTile, PageScreen, Txt } from "../src/components/ui";
import { useStore } from "../src/store/AppStore";

export default function Notifications() {
  const { c, notifs, setNotifs, realDataUnavailable } = useStore();
  return (
    <PageScreen
      title="Notifications"
      right={
        <Pressable onPress={() => setNotifs(notifs.map((x) => ({ ...x, unread: false })))} style={{ height: 40, paddingHorizontal: 8, justifyContent: "center" }}>
          <Txt s={13} w={550} c={c.pr}>Read all</Txt>
        </Pressable>
      }
    >
      {realDataUnavailable ? <DataUnavailable title="Real notifications are not configured" /> : <ScrollView>
        {notifs.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => setNotifs(notifs.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
            style={{ flexDirection: "row", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.bd, backgroundColor: n.unread ? c.sf : "transparent" }}
          >
            <IconTile name={n.icon as IconName} bg={c[n.bg]} color={c[n.color]} size={38} radius={11} iconSize={19} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Txt s={14} w={600} style={{ flexShrink: 1 }}>{n.title}</Txt>
                <Txt s={12} c={c.mu}>{n.ago}</Txt>
              </View>
              <Txt s={13.5} lh={1.45} c={c.tx2} style={{ marginTop: 2 }}>{n.body}</Txt>
            </View>
            <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: n.unread ? c.pr : "transparent" }} />
          </Pressable>
        ))}
      </ScrollView>}
    </PageScreen>
  );
}
