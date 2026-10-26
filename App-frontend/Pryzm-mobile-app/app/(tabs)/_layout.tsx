import { Tabs } from "expo-router";
import { ComponentProps } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, IconName, Txt } from "../../src/components/ui";
import { useStore } from "../../src/store/AppStore";

const TABS: Record<string, [string, string]> = {
  home: ["Home", "home"],
  search: ["Search", "search"],
  portfolio: ["Portfolio", "pie-chart"],
  activity: ["Activity", "pulse"],
  more: ["More", "menu"],
};

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

function TabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const { c } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: "row", paddingTop: 7, paddingHorizontal: 6, paddingBottom: Math.max(insets.bottom, 10), backgroundColor: c.sf, borderTopWidth: 1, borderTopColor: c.bd }}>
      {state.routes.map((route, i) => {
        const on = state.index === i;
        const [label, icon] = TABS[route.name] ?? [route.name, "ellipse"];
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const e = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!on && !e.defaultPrevented) navigateToTab(route.key);
            }}
            style={{ flex: 1, height: 48, alignItems: "center", justifyContent: "center", gap: 3 }}
          >
            <Icon name={(on ? icon : icon + "-outline") as IconName} size={23} color={on ? c.pr : c.mu} />
            <Txt s={10.5} w={on ? 600 : 500} c={on ? c.pr : c.mu}>{label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { c } = useStore();
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="portfolio" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
