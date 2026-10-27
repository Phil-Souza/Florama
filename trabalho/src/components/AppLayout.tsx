import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { useStore } from "@/context/StoreContext";

export type AppTab = "inicio" | "favoritos" | "perfil";

type AppLayoutProps = {
  children: ReactNode;
  activeTab: AppTab | null;
};

type AppHeaderProps = {
  subtitle: string;
  title?: string;
  showBrand?: boolean;
};

export function AppHeader({ subtitle, title, showBrand = true }: AppHeaderProps) {
  const { cartCount } = useStore();
  const bagButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={"Sacola de compras, " + cartCount + " itens"}
      onPress={() => router.navigate("/carrinho")}
      style={styles.bagButton}
    >
      <View style={styles.shoppingBagIcon}>
        <View style={styles.shoppingBagHandle} />
        <View style={styles.shoppingBagBody}>
          <Text style={styles.shoppingBagFlower}>✿</Text>
        </View>
      </View>
      <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
    </Pressable>
  );
  const heading = showBrand ? (
    <View style={styles.headerCopy}>
      <Text style={styles.brand}>Florama</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  ) : (
    <View style={styles.headerCopy}>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <View style={[styles.header, !showBrand && styles.pageHeader]}>
      {heading}
      {showBrand ? bagButton : <View style={styles.pageBagButton}>{bagButton}</View>}
    </View>
  );
}

function BottomNavigation({ activeTab }: { activeTab: AppTab | null }) {
  const tabs: { key: AppTab; label: string; icon: string; route: "/navegation" | "/favoritos" | "/perfil" }[] = [
    { key: "inicio", label: "Início", icon: "⌂", route: "/navegation" },
    { key: "favoritos", label: "Favoritos", icon: "♡", route: "/favoritos" },
    { key: "perfil", label: "Perfil", icon: "○", route: "/perfil" },
  ];

  return (
    <View style={styles.bottomBar}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => router.navigate(tab.route)}
            style={styles.bottomItem}
          >
            <Text style={[styles.bottomIcon, selected && styles.bottomIconActive]}>{tab.icon}</Text>
            <Text style={[styles.bottomLabel, selected && styles.bottomLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AppLayout({ children, activeTab }: AppLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.page}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {children}
        </ScrollView>
        <BottomNavigation activeTab={activeTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f8f4" },
  page: { flex: 1, backgroundColor: "#f7f8f4" },
  scrollContent: { paddingTop: 12, paddingBottom: 24 },
  header: {
    minHeight: 56,
    paddingHorizontal: 22,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCopy: { flex: 1 },
  pageHeader: { justifyContent: "flex-start" },
  pageBagButton: { position: "absolute", top: 7, right: 22 },
  brand: { color: "#24392c", fontFamily: "Georgia", fontSize: 29, letterSpacing: -1 },
  pageTitle: { color: "#293b30", fontFamily: "Georgia", fontSize: 21 },
  subtitle: { marginTop: 2, color: "#7a817b", fontSize: 11 },
  bagButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e3e7df",
    borderRadius: 15,
    backgroundColor: "#ffffff",
  },
  shoppingBagIcon: { width: 24, height: 25, alignItems: "center", justifyContent: "flex-end" },
  shoppingBagHandle: { position: "absolute", top: 0, width: 12, height: 10, borderWidth: 1.7, borderBottomWidth: 0, borderColor: "#31583d", borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  shoppingBagBody: { width: 21, height: 18, alignItems: "center", justifyContent: "center", borderWidth: 1.7, borderColor: "#31583d", borderRadius: 5, backgroundColor: "#f4f7f1" },
  shoppingBagFlower: { color: "#78927d", fontSize: 9, lineHeight: 12 },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#31583d",
  },
  badgeText: { color: "#ffffff", fontSize: 9, fontWeight: "700" },
  bottomBar: {
    minHeight: 64,
    paddingHorizontal: 10,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#e9ece7",
    backgroundColor: "#ffffff",
  },
  bottomItem: { minWidth: 58, alignItems: "center", justifyContent: "center" },
  bottomIcon: { color: "#9aa19b", fontSize: 21, lineHeight: 24 },
  bottomIconActive: { color: "#31583d" },
  bottomLabel: { marginTop: 2, color: "#9aa19b", fontSize: 9 },
  bottomLabelActive: { color: "#31583d", fontWeight: "600" },
});
