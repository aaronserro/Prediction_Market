import { View } from "react-native";
import { Button, Icon, PageScreen, Txt } from "../src/components/ui";
import { useStore } from "../src/store/AppStore";

export default function Tournaments() {
  const { c, tourNotify, setTourNotify } = useStore();
  return (
    <PageScreen title="Tournaments">
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 32, paddingBottom: 80 }}>
        <View style={{ width: 76, height: 76, borderRadius: 22, backgroundColor: c.ams, alignItems: "center", justifyContent: "center" }}>
          <Icon name="trophy-outline" size={38} color={c.amt} />
        </View>
        <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, backgroundColor: c.sf2 }}>
          <Txt s={11.5} w={650} ls={0.04} c={c.mu}>COMING SOON</Txt>
        </View>
        <Txt s={26} w={650} ls={-0.035} center>Tournaments are coming soon.</Txt>
        <Button
          onPress={() => setTourNotify(!tourNotify)}
          bg={tourNotify ? c.yess : c.pr}
          color={tourNotify ? c.yes : "#fff"}
          h={48} s={15}
          style={{ marginTop: 8, paddingHorizontal: 20 }}
          label={
            <>
              <Icon name={tourNotify ? "checkmark" : "notifications-outline"} size={18} color={tourNotify ? c.yes : "#fff"} />
              <Txt s={15} w={600} c={tourNotify ? c.yes : "#fff"}>{tourNotify ? "You're on the list" : "Notify me when it launches"}</Txt>
            </>
          }
        />
      </View>
    </PageScreen>
  );
}
