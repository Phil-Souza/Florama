import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Category = "Tudo" | "Rosas" | "Tulipas" | "Buquês";

type Product = {
  name: string;
  detail: string;
  price: string;
  category: Exclude<Category, "Tudo">;
  flower: string;
  color: string;
};

const categories: Category[] = ["Tudo", "Rosas", "Tulipas", "Buquês"];

const products: Product[] = [
  { name: "Monalisa", detail: "1 rosa", price: "R$ 15,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Triana", detail: "3 rosas", price: "R$ 30,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Septália", detail: "7 rosas", price: "R$ 65,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Década", detail: "10 rosas", price: "R$ 90,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Donzela", detail: "12 rosas", price: "R$ 110,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Quinzel", detail: "15 rosas", price: "R$ 130,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Octelle", detail: "18 rosas", price: "R$ 155,00", category: "Rosas", flower: "🌹", color: "#f5e9e8" },
  { name: "Primavera", detail: "1 tulipa", price: "R$ 15,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Turban", detail: "3 tulipas", price: "R$ 30,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Holanda", detail: "7 tulipas", price: "R$ 65,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Tulipar", detail: "10 tulipas", price: "R$ 90,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Jardim", detail: "12 tulipas", price: "R$ 110,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Amsterdam", detail: "15 tulipas", price: "R$ 130,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Campo", detail: "18 tulipas", price: "R$ 155,00", category: "Tulipas", flower: "🌷", color: "#edf1e8" },
  { name: "Rosa Adormecida", detail: "Buquê artesanal em cetim", price: "R$ 70,00", category: "Buquês", flower: "💐", color: "#f3eaf0" },
  { name: "Rosa de Ouro", detail: "Buquê artesanal em cetim", price: "R$ 70,00", category: "Buquês", flower: "💐", color: "#f3eee0" },
];

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

function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${product.name}, ${product.detail}, ${product.price}`} style={styles.productCard}>
      <View style={[styles.productArt, { backgroundColor: product.color }]}>
        <Text style={styles.productFlower}>{product.flower}</Text>
      </View>
      <View style={styles.productInfo}>
        <View style={styles.productTitleRow}>
          <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
          <Text style={styles.heart}>♡</Text>
        </View>
        <Text numberOfLines={1} style={styles.productDetail}>{product.detail}</Text>
        <Text style={styles.productPrice}>{product.price}</Text>
      </View>
    </Pressable>
  );
}

export default function Navegation() {
  const [activeCategory, setActiveCategory] = useState<Category>("Tudo");

  const visibleProducts = useMemo(
    () => activeCategory === "Tudo"
      ? products
      : products.filter((product) => product.category === activeCategory),
    [activeCategory],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.page}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>Florama</Text>
              <Text style={styles.headerSubtitle}>Flores para momentos especiais</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Sacola de compras" style={styles.bagButton}>
              <Text style={styles.bagIcon}>▱</Text>
              <View style={styles.bagBadge}><Text style={styles.bagBadgeText}>0</Text></View>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>FEITO À MÃO, COM CARINHO</Text>
              <Text style={styles.heroTitle}>Flores que{ "\n" }marcam momentos</Text>
              <Text style={styles.heroDescription}>Buquês artesanais para celebrar a sua história.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveCategory("Tudo")}
                style={styles.heroButton}
              >
                <Text style={styles.heroButtonText}>Explorar catálogo</Text>
              </Pressable>
            </View>
            <HeroFlowers />
          </View>

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Escolha suas flores</Text>
              <Text style={styles.sectionSubtitle}>Qual tipo combina com o momento?</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {categories.map((category) => {
              const selected = activeCategory === category;
              const symbol = category === "Rosas" ? "✿" : category === "Tulipas" ? "❀" : category === "Buquês" ? "❋" : "✽";
              return (
                <Pressable
                  key={category}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setActiveCategory(category)}
                  style={[styles.categoryButton, selected && styles.categoryButtonSelected]}
                >
                  <Text style={[styles.categorySymbol, selected && styles.categoryTextSelected]}>{symbol}</Text>
                  <Text style={[styles.categoryLabel, selected && styles.categoryTextSelected]}>{category}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.productsHeading}>
            <View>
              <Text style={styles.sectionTitle}>{activeCategory === "Tudo" ? "Destaques do catálogo" : activeCategory}</Text>
              <Text style={styles.sectionSubtitle}>Modelos e valores do nosso catálogo</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setActiveCategory("Tudo")}>
              <Text style={styles.viewAll}>Ver todos  →</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productList}
          >
            {visibleProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </ScrollView>

          <View style={styles.customOrder}>
            <Text style={styles.customOrderIcon}>✿</Text>
            <View style={styles.customOrderCopy}>
              <Text style={styles.customOrderTitle}>Monte seu buquê</Text>
              <Text style={styles.customOrderDescription}>Escolha as flores, cores e quantidades.</Text>
            </View>
            <Text style={styles.customOrderArrow}>›</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.bottomItem}>
            <Text style={[styles.bottomIcon, styles.bottomIconActive]}>⌂</Text>
            <Text style={[styles.bottomLabel, styles.bottomLabelActive]}>Início</Text>
          </View>
          <View style={styles.bottomItem}>
            <Text style={styles.bottomIcon}>❀</Text>
            <Text style={styles.bottomLabel}>Flores</Text>
          </View>
          <View style={styles.bottomItem}>
            <Text style={styles.bottomIcon}>♡</Text>
            <Text style={styles.bottomLabel}>Favoritos</Text>
          </View>
          <View style={styles.bottomItem}>
            <Text style={styles.bottomIcon}>○</Text>
            <Text style={styles.bottomLabel}>Perfil</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
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
  heroButton: {
    alignSelf: "flex-start",
    marginTop: 13,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#31583d",
  },
  heroButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
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
  viewAll: {
    color: "#647568",
    fontSize: 10,
  },
  productList: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 12,
  },
  productCard: {
    width: 145,
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
  customOrder: {
    marginHorizontal: 18,
    marginTop: 2,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    backgroundColor: "#e9eee4",
  },
  customOrderIcon: {
    width: 38,
    height: 38,
    marginRight: 12,
    overflow: "hidden",
    borderRadius: 12,
    color: "#31583d",
    backgroundColor: "#ffffff",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 24,
  },
  customOrderCopy: {
    flex: 1,
  },
  customOrderTitle: {
    color: "#2e4434",
    fontSize: 12,
    fontWeight: "600",
  },
  customOrderDescription: {
    marginTop: 3,
    color: "#768176",
    fontSize: 9,
  },
  customOrderArrow: {
    color: "#31583d",
    fontSize: 25,
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
});
