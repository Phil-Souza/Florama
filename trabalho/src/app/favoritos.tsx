import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, AppLayout } from "@/components/AppLayout";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";
import { products } from "@/data/catalog";

export default function FavoritosScreen() {
  const { favorites, toggleFavorite, addToCart } = useStore();
  const favoriteProducts = products.filter((product) => favorites.includes(product.name));

  return (
    <AppLayout activeTab="favoritos">
      <AppHeader title="Meus favoritos" subtitle={favoriteProducts.length + " produto(s) salvos"} showBrand={false} />

      {favoriteProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>♡</Text>
          <Text style={styles.emptyTitle}>Sua lista está vazia</Text>
          <Text style={styles.emptyText}>Toque no coração de um produto para guardá-lo aqui.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.navigate("/navegation")}>
            <Text style={styles.primaryButtonText}>Ver catálogo</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.productList}>
          {favoriteProducts.map((product) => (
            <ProductCard
              key={product.name}
              product={product}
              isFavorite={true}
              onToggleFavorite={() => toggleFavorite(product.name)}
              onAddToCart={() => addToCart(product.name)}
            />
          ))}
        </View>
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: 22, marginBottom: 18 },
  title: { color: "#293b30", fontFamily: "Georgia", fontSize: 24 },
  subtitle: { marginTop: 5, color: "#838a84", fontSize: 12 },
  productList: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  emptyState: { alignItems: "center", paddingHorizontal: 36, paddingVertical: 52 },
  emptyIcon: { color: "#78927d", fontSize: 48 },
  emptyTitle: { marginTop: 10, color: "#293b30", fontFamily: "Georgia", fontSize: 21 },
  emptyText: { marginTop: 8, color: "#838a84", fontSize: 13, lineHeight: 19, textAlign: "center" },
  primaryButton: { marginTop: 20, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 13, backgroundColor: "#31583d" },
  primaryButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
});
