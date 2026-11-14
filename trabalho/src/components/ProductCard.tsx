import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Product } from "@/data/catalog";

function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(priceCents / 100);
}

type ProductCardProps = {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart: () => Promise<boolean>;
  compact?: boolean;
};

export function ProductCard({ product, isFavorite, onToggleFavorite, onAddToCart, compact = false }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addFailed, setAddFailed] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current);
  }, []);

  const handleAddToCart = async () => {
    setAdding(true);
    setJustAdded(false);
    setAddFailed(false);
    if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current);
    try {
      const added = await onAddToCart();
      setJustAdded(added);
      setAddFailed(!added);
      if (added) {
        feedbackTimer.current = setTimeout(() => {
          setJustAdded(false);
          feedbackTimer.current = null;
        }, 1600);
      }
    } catch {
      setAddFailed(true);
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
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
        <Text style={styles.price}>{formatPrice(product.priceCents)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            adding ? "Adicionando " + product.name + " à sacola"
              : justAdded ? product.name + " foi adicionado à sacola"
                : addFailed ? "Não foi possível adicionar " + product.name + " à sacola"
                  : "Adicionar " + product.name + " à sacola"
          }
          accessibilityState={{ disabled: adding }}
          disabled={adding}
          onPress={() => void handleAddToCart()}
          style={[styles.addButton, justAdded && styles.addButtonConfirmed, adding && styles.addButtonDisabled]}
        >
          <Text style={styles.addButtonText}>
            {adding ? "Adicionando..." : justAdded ? "✓ Adicionado" : addFailed ? "Tentar novamente" : "Adicionar à sacola"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#edf0ea",
    borderRadius: 17,
    backgroundColor: "#ffffff",
  },
  compactCard: { width: "47%" },
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
  addButtonConfirmed: { backgroundColor: "#64876a" },
  addButtonDisabled: { opacity: 0.65 },
  addButtonText: { color: "#ffffff", fontSize: 10, fontWeight: "600" },
});