import { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppLayout, AppHeader } from "@/components/AppLayout";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";
import { categorySymbols } from "@/data/catalog";
import type { Category, Product } from "@/data/catalog";

function HeroFlowers() {
  return (
    <View accessible={false} style={styles.heroFlowers}>
      <View style={[styles.heroStem, styles.heroStemOne]} />
      <View style={[styles.heroStem, styles.heroStemTwo]} />
      <View style={[styles.heroStem, styles.heroStemThree]} />
      <View style={[styles.heroLeaf, styles.heroLeafOne]} />
      <View style={[styles.heroLeaf, styles.heroLeafTwo]} />
      <View style={[styles.heroLeaf, styles.heroLeafThree]} />
      <View style={[styles.heroLeaf, styles.heroLeafFour]} />
      <View style={styles.heroBloom}>
        <View style={styles.heroBloomCenter} />
      </View>
      <View style={styles.heroVase} />
    </View>
  );
}

export default function Navegation() {
  const [activeCategory, setActiveCategory] = useState<Category>("Tudo");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "priceAsc" | "priceDesc">("name");
  const {
    favorites, toggleFavorite, addToCart, products, categories,
    catalogLoading, catalogError, refreshCatalog,
  } = useStore();

  const visibleProducts = useMemo(
    () => {
      const normalizedSearch = search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
      const filtered = products.filter((product) => {
        const matchesCategory = activeCategory === "Tudo" || product.category === activeCategory;
        const searchableText = `${product.name} ${product.detail} ${product.category}`
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
        return matchesCategory && searchableText.includes(normalizedSearch);
      });
      return filtered.sort((first, second) => {
        if (sortBy === "priceAsc") return first.priceCents - second.priceCents || first.name.localeCompare(second.name, "pt-BR");
        if (sortBy === "priceDesc") return second.priceCents - first.priceCents || first.name.localeCompare(second.name, "pt-BR");
        return first.name.localeCompare(second.name, "pt-BR");
      });
    },
    [activeCategory, products, search, sortBy],
  );

  return (
    <AppLayout activeTab="inicio" scrollable={false}>
      <FlatList<Product>
        style={styles.catalogList}
        data={visibleProducts}
        keyExtractor={(product) => product.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.catalogListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={catalogLoading} onRefresh={() => void refreshCatalog()} />}
        ListHeaderComponent={
          <>
            <AppHeader subtitle="Flores para momentos especiais" />
            {catalogError !== "" && (
              <Pressable onPress={() => void refreshCatalog()} style={styles.apiNotice}>
                <Text style={styles.apiNoticeText}>Não foi possível atualizar o catálogo. Toque para tentar novamente.</Text>
              </Pressable>
            )}

            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>FEITO À MÃO, COM CARINHO</Text>
                <Text style={styles.heroTitle}>Flores que{"\n"}marcam momentos</Text>
                <Text style={styles.heroDescription}>Buquês artesanais para celebrar a sua história.</Text>
              </View>
              <HeroFlowers />
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Escolha suas flores</Text>
                <Text style={styles.sectionSubtitle}>Qual tipo combina com o momento?</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
              {categories.map((category) => {
                const selected = activeCategory === category;
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setActiveCategory(category)}
                    style={[styles.categoryButton, selected && styles.categoryButtonSelected]}
                  >
                    <Text style={[styles.categorySymbol, selected && styles.categoryTextSelected]}>
                      {categorySymbols[category] ?? "✽"}
                    </Text>
                    <Text style={[styles.categoryLabel, selected && styles.categoryTextSelected]}>{category}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.searchContainer}>
              <TextInput
                accessibilityLabel="Buscar produtos no catálogo"
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar flores, buquês..."
                placeholderTextColor="#899089"
                returnKeyType="search"
                style={styles.searchInput}
              />
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.sortLabel}>Ordenar por</Text>
              <View style={styles.sortOptions}>
                {([
                  ["name", "Nome"],
                  ["priceAsc", "Menor preço"],
                  ["priceDesc", "Maior preço"],
                ] as const).map(([value, label]) => {
                  const selected = sortBy === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSortBy(value)}
                      style={[styles.sortButton, selected && styles.sortButtonSelected]}
                    >
                      <Text style={[styles.sortButtonText, selected && styles.sortButtonTextSelected]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.productsHeading}>
              <View>
                <Text style={styles.sectionTitle}>
                  {activeCategory === "Tudo" ? "Catálogo completo" : activeCategory}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {visibleProducts.length} produto(s) encontrado(s)
                </Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.noProducts}>
            <Text style={styles.sectionSubtitle}>
              {catalogLoading ? "Carregando catálogo..." : "Nenhum produto encontrado. Tente outra busca ou categoria."}
            </Text>
          </View>
        }
        renderItem={({ item: product }) => (
          <ProductCard
            product={product}
            isFavorite={favorites.includes(product.id)}
            onToggleFavorite={() => toggleFavorite(product.id)}
            onAddToCart={() => addToCart(product.id)}
          />
        )}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8f4",
  },
  page: {
    flex: 1,
    backgroundColor: "#f7f8f4",
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 22,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    color: "#24392c",
    fontFamily: "Georgia",
    fontSize: 29,
    letterSpacing: -1,
  },
  headerSubtitle: {
    marginTop: 2,
    color: "#7a817b",
    fontSize: 11,
  },
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
  bagIcon: {
    color: "#31583d",
    fontSize: 25,
    lineHeight: 29,
  },
  bagBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#31583d",
  },
  bagBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
  },
  apiNotice: { marginHorizontal: 18, marginBottom: 12, padding: 10, borderRadius: 10, backgroundColor: "#f9e9e6" },
  apiNoticeText: { color: "#8e423b", fontSize: 11, textAlign: "center" },
  hero: {
    minHeight: 224,
    marginHorizontal: 16,
    marginBottom: 25,
    padding: 20,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#e9eee4",
  },
  heroCopy: {
    zIndex: 2,
    width: "65%",
  },
  heroEyebrow: {
    color: "#526c57",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  heroTitle: {
    marginTop: 10,
    color: "#263c2e",
    fontFamily: "Georgia",
    fontSize: 27,
    lineHeight: 31,
  },
  heroDescription: {
    maxWidth: 190,
    marginTop: 8,
    color: "#6b776d",
    fontSize: 10,
    lineHeight: 15,
  },
  heroFlowers: {
    position: "absolute",
    right: 2,
    bottom: 0,
    width: "44%",
    height: "100%",
  },
  heroStem: {
    position: "absolute",
    bottom: 44,
    width: 2,
    borderRadius: 2,
    backgroundColor: "#31583d",
  },
  heroStemOne: {
    left: "49%",
    height: 132,
    transform: [{ rotate: "-10deg" }],
  },
  heroStemTwo: {
    left: "58%",
    height: 110,
    transform: [{ rotate: "12deg" }],
  },
  heroStemThree: {
    left: "40%",
    height: 94,
    transform: [{ rotate: "-23deg" }],
  },
  heroLeaf: {
    position: "absolute",
    width: 28,
    height: 57,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 30,
    backgroundColor: "#4c8159",
  },
  heroLeafOne: {
    left: "17%",
    top: "43%",
    transform: [{ rotate: "-49deg" }],
  },
  heroLeafTwo: {
    left: "52%",
    top: "34%",
    transform: [{ rotate: "42deg" }],
  },
  heroLeafThree: {
    left: "41%",
    top: "14%",
    transform: [{ rotate: "-37deg" }],
    backgroundColor: "#285638",
  },
  heroLeafFour: {
    left: "72%",
    top: "50%",
    transform: [{ rotate: "42deg" }],
  },
  heroBloom: {
    position: "absolute",
    top: 15,
    left: "37%",
    width: 31,
    height: 36,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: "#b76770",
    transform: [{ rotate: "8deg" }],
  },
  heroBloomCenter: {
    position: "absolute",
    top: 12,
    left: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#e7bd83",
  },
  heroVase: {
    position: "absolute",
    right: 19,
    bottom: -2,
    width: 66,
    height: 62,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    backgroundColor: "#52775b",
  },
  sectionHeading: {
    paddingHorizontal: 22,
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#293b30",
    fontFamily: "Georgia",
    fontSize: 19,
  },
  sectionSubtitle: {
    marginTop: 4,
    color: "#838a84",
    fontSize: 10,
  },
  categoryList: {
    paddingHorizontal: 18,
    paddingBottom: 25,
    gap: 10,
  },
  categoryButton: {
    minWidth: 76,
    height: 77,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ebeee8",
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  categoryButtonSelected: {
    borderColor: "#31583d",
    backgroundColor: "#31583d",
  },
  categorySymbol: {
    color: "#3e6548",
    fontSize: 23,
    lineHeight: 27,
  },
  categoryLabel: {
    marginTop: 5,
    color: "#69756c",
    fontSize: 9,
    fontWeight: "500",
  },
  categoryTextSelected: {
    color: "#ffffff",
  },
  productsHeading: {
    paddingHorizontal: 22,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productList: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  productCard: {
    width: "47%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#edf0ea",
    borderRadius: 17,
    backgroundColor: "#ffffff",
  },
  productArt: {
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
    borderRadius: 13,
  },
  productFlower: {
    fontSize: 57,
  },
  productInfo: {
    paddingHorizontal: 10,
    paddingBottom: 11,
  },
  productTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productName: {
    flex: 1,
    color: "#293b30",
    fontSize: 12,
    fontWeight: "600",
  },
  heart: {
    marginLeft: 5,
    color: "#657267",
    fontSize: 18,
  },
  productDetail: {
    marginTop: 3,
    color: "#899089",
    fontSize: 9,
  },
  productPrice: {
    marginTop: 7,
    color: "#35463a",
    fontSize: 11,
    fontWeight: "600",
  },
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
  bottomItem: {
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomIcon: {
    color: "#9aa19b",
    fontSize: 21,
    lineHeight: 24,
  },
  bottomIconActive: {
    color: "#31583d",
  },
  bottomLabel: {
    marginTop: 2,
    color: "#9aa19b",
    fontSize: 9,
  },
  bottomLabelActive: {
    color: "#31583d",
    fontWeight: "600",
  },
  catalogListContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 18,
  },
  catalogList: { flex: 1 },
  productRow: {
    paddingHorizontal: 18,
    justifyContent: "space-between",
    columnGap: 12,
    marginBottom: 12,
  },
  searchContainer: {
    marginHorizontal: 18,
    marginBottom: 14,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#e3e7df",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  searchInput: {
    minHeight: 46,
    color: "#293b30",
    fontSize: 13,
  },
  sortSection: {
    paddingHorizontal: 22,
    marginBottom: 18,
  },
  sortLabel: {
    marginBottom: 8,
    color: "#526057",
    fontSize: 10,
    fontWeight: "600",
  },
  sortOptions: {
    flexDirection: "row",
    gap: 8,
  },
  sortButton: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e3e7df",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  sortButtonSelected: {
    borderColor: "#31583d",
    backgroundColor: "#edf1e8",
  },
  sortButtonText: {
    color: "#69756c",
    fontSize: 9,
  },
  sortButtonTextSelected: {
    color: "#31583d",
    fontWeight: "700",
  },
  noProducts: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
  },
});
