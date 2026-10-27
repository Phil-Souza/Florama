import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, AppLayout } from "@/components/AppLayout";
import { useStore } from "@/context/StoreContext";
import { products } from "@/data/catalog";

function priceToCents(price: string) {
  const [wholePart, decimalPart = "00"] = price.replace("R$", "").trim().split(",");
  const whole = Number(wholePart.replace(/\./g, ""));
  return whole * 100 + Number(decimalPart);
}

function formatCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function CarrinhoScreen() {
  const { cartItems, cartCount, setCartQuantity } = useStore();
  const lines = Object.entries(cartItems)
    .map(([name, quantity]) => ({ product: products.find((item) => item.name === name), quantity }))
    .filter((line): line is { product: (typeof products)[number]; quantity: number } => Boolean(line.product));
  const subtotal = lines.reduce((sum, line) => sum + priceToCents(line.product.price) * line.quantity, 0);

  return (
    <AppLayout activeTab={null}>
      <AppHeader title="Minha sacola" subtitle={cartCount + " item(ns)"} showBrand={false} />

      {lines.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>▱</Text>
          <Text style={styles.emptyTitle}>Sua sacola está vazia</Text>
          <Text style={styles.emptyText}>Quando adicionar flores, elas aparecerão aqui.</Text>
          <Pressable style={styles.catalogButton} onPress={() => router.navigate("/navegation")}>
            <Text style={styles.catalogButtonText}>Voltar ao catálogo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.items}>
            {lines.map(({ product, quantity }) => (
              <View key={product.name} style={styles.item}>
                <View style={[styles.itemArt, { backgroundColor: product.color }]}>
                  <Text style={styles.itemEmoji}>{product.flower}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text numberOfLines={1} style={styles.itemName}>{product.name}</Text>
                  <Text style={styles.itemDetail}>{product.detail}</Text>
                  <Text style={styles.itemPrice}>{product.price}</Text>
                  <View style={styles.quantityRow}>
                    <Pressable accessibilityLabel="Diminuir quantidade" onPress={() => setCartQuantity(product.name, quantity - 1)} style={styles.quantityButton}>
                      <Text style={styles.quantitySymbol}>−</Text>
                    </Pressable>
                    <Text style={styles.quantity}>{quantity}</Text>
                    <Pressable accessibilityLabel="Aumentar quantidade" onPress={() => setCartQuantity(product.name, quantity + 1)} style={styles.quantityButton}>
                      <Text style={styles.quantitySymbol}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={"Remover " + product.name} onPress={() => setCartQuantity(product.name, 0)}>
                  <Text style={styles.remove}>Remover</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCents(subtotal)}</Text>
            </View>
            <Text style={styles.deliveryNote}>Entrega calculada na finalização do pedido.</Text>
            <Pressable disabled style={[styles.primaryButton, styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>Finalizar pedido</Text>
            </Pressable>
            <Text style={styles.apiNote}>A finalização será ativada quando conectarmos a API.</Text>
          </View>
        </>
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: 22, marginBottom: 18 },
  title: { color: "#293b30", fontFamily: "Georgia", fontSize: 24 },
  subtitle: { marginTop: 5, color: "#838a84", fontSize: 12 },
  items: { paddingHorizontal: 18, gap: 12 },
  item: { flexDirection: "row", alignItems: "center", padding: 10, borderWidth: 1, borderColor: "#edf0ea", borderRadius: 16, backgroundColor: "#ffffff" },
  itemArt: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  itemEmoji: { fontSize: 30 },
  itemInfo: { flex: 1, minWidth: 0, marginLeft: 10 },
  itemName: { color: "#293b30", fontSize: 13, fontWeight: "600" },
  itemDetail: { marginTop: 2, color: "#899089", fontSize: 10 },
  itemPrice: { marginTop: 4, color: "#35463a", fontSize: 11, fontWeight: "700" },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 7 },
  quantityButton: { width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#edf1e8" },
  quantitySymbol: { color: "#31583d", fontSize: 17, lineHeight: 20 },
  quantity: { minWidth: 14, color: "#293b30", textAlign: "center", fontSize: 12, fontWeight: "600" },
  remove: { marginLeft: 8, color: "#a14d59", fontSize: 10 },
  summary: { margin: 18, marginTop: 22, padding: 16, borderRadius: 16, backgroundColor: "#ffffff" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { color: "#526057", fontSize: 13 },
  summaryValue: { color: "#293b30", fontSize: 15, fontWeight: "700" },
  deliveryNote: { marginTop: 8, color: "#899089", fontSize: 10 },
  primaryButton: { marginTop: 16, paddingVertical: 13, alignItems: "center", borderRadius: 12, backgroundColor: "#31583d" },
  catalogButton: { marginTop: 20, alignSelf: "center", minHeight: 42, paddingHorizontal: 22, justifyContent: "center", borderWidth: 1, borderColor: "#31583d", borderRadius: 12, backgroundColor: "#ffffff" },
  catalogButtonText: { color: "#31583d", fontSize: 12, fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
  primaryButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  apiNote: { marginTop: 8, color: "#899089", fontSize: 10, textAlign: "center" },
  emptyState: { alignItems: "center", paddingHorizontal: 36, paddingVertical: 52 },
  emptyIcon: { color: "#78927d", fontSize: 48 },
  emptyTitle: { marginTop: 10, color: "#293b30", fontFamily: "Georgia", fontSize: 21 },
  emptyText: { marginTop: 8, color: "#838a84", fontSize: 13, lineHeight: 19, textAlign: "center" },
});
