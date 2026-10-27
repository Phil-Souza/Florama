import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Product } from "@/data/catalog";

type ProductCardProps = {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: () => void;
};

export function ProductCard({ product, isFavorite, onToggleFavorite, onAddToCart }: ProductCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.art, { backgroundColor: product.color }]}>
        <Text style={styles.flower}>{product.flower}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            onPress={onToggleFavorite}
            hitSlop={8}
          >
            <Text style={[styles.heart, isFavorite && styles.heartSelected]}>{isFavorite ? "♥" : "♡"}</Text>
          </Pressable>
        </View>
        <Text numberOfLines={2} style={styles.detail}>{product.detail}</Text>
        <Text style={styles.price}>{product.price}</Text>
        <Pressable accessibilityRole="button" onPress={onAddToCart} style={styles.addButton}>
          <Text style={styles.addButtonText}>Adicionar à sacola</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "47%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#edf0ea",
    borderRadius: 17,
    backgroundColor: "#ffffff",
  },
  art: { height: 116, alignItems: "center", justifyContent: "center", margin: 8, borderRadius: 13 },
  flower: { fontSize: 52 },
  info: { paddingHorizontal: 10, paddingBottom: 11 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  name: { flex: 1, color: "#293b30", fontSize: 12, fontWeight: "600" },
  heart: { color: "#657267", fontSize: 20, lineHeight: 23 },
  heartSelected: { color: "#bd5364" },
  detail: { minHeight: 28, marginTop: 3, color: "#899089", fontSize: 9, lineHeight: 13 },
  price: { marginTop: 5, color: "#35463a", fontSize: 11, fontWeight: "700" },
  addButton: { marginTop: 9, paddingVertical: 9, alignItems: "center", borderRadius: 11, backgroundColor: "#31583d" },
  addButtonText: { color: "#ffffff", fontSize: 10, fontWeight: "600" },
});
