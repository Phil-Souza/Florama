import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { AppHeader, AppLayout } from "@/components/AppLayout";
import { useStore } from "@/context/StoreContext";
import type { Order } from "@/context/StoreContext";


function formatCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function CarrinhoScreen() {
  const { cartItems, cartCount, setCartQuantity, products, createOrder } = useStore();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const orderMessage = (order: Order) => [
    `Olá! Gostaria de finalizar o pedido #${order.id}.`,
    "",
    "Itens:",
    ...order.items.map((item) => `- ${item.quantity}x ${item.name}`),
    "",
    `Total: ${formatCents(order.totalCents)}`,
  ].join("\n");

  const openWhatsApp = async (order: Order) => {
    const number = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
    if (!/^\d{8,15}$/.test(number)) {
      setWhatsappMessage(
        number
          ? "O número comercial está ausente ou inválido. Você ainda pode copiar os dados do pedido."
          : "O WhatsApp comercial ainda não está configurado. Você pode copiar os dados do pedido.",
      );
      return;
    }

    const encodedMessage = encodeURIComponent(orderMessage(order));
    const webUrl = `https://wa.me/${number}?text=${encodedMessage}`;
    if (Platform.OS !== "web") {
      try {
        await Linking.openURL(`whatsapp://send?phone=${number}&text=${encodedMessage}`);
        setWhatsappMessage("O WhatsApp abriu com a mensagem pronta. Revise e envie a mensagem para concluir o contato.");
        return;
      } catch {
        // Continue with the universal HTTPS link if the app scheme is unavailable.
      }
    }

    try {
      await Linking.openURL(webUrl);
      setWhatsappMessage("O link do WhatsApp foi aberto. Se a conversa não aparecer, instale/ative o WhatsApp ou copie os dados do pedido.");
    } catch {
      setWhatsappMessage("Não foi possível abrir o link do WhatsApp. Copie os dados do pedido e tente novamente.");
    }
  };

  const copyOrder = async (order: Order) => {
    try {
      await Clipboard.setStringAsync(orderMessage(order));
      setCopyMessage("Dados do pedido copiados.");
    } catch {
      setCopyMessage("Não foi possível copiar os dados. Anote o número do pedido e tente novamente.");
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    setCheckoutError("");
    try {
      const order = await createOrder();
      setCompletedOrder(order);
      await openWhatsApp(order);
    } catch (cause) {
      setCheckoutError(cause instanceof Error ? cause.message : "Não foi possível registrar o pedido.");
    } finally {
      setCheckingOut(false);
    }
  };
  const lines = Object.entries(cartItems)
    .map(([productId, quantity]) => ({ product: products.find((item) => item.id === productId), quantity }))
    .filter((line): line is { product: (typeof products)[number]; quantity: number } => Boolean(line.product));
  const subtotal = lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);

  return (
    <AppLayout activeTab={null}>
      <AppHeader title="Minha sacola" subtitle={cartCount + " item(ns)"} showBrand={false} />

      {completedOrder ? (
        <View style={styles.completedCard}>
          <Text style={styles.completedTitle}>Pedido registrado</Text>
          <Text style={styles.completedText}>
            Pedido #{completedOrder.id.slice(0, 8).toUpperCase()} · {formatCents(completedOrder.totalCents)}
          </Text>
          <Text style={styles.whatsappNotice}>{whatsappMessage}</Text>
          <Text style={styles.pendingNotice}>
            O pedido continua aguardando pagamento até a confirmação manual. Abrir ou enviar uma mensagem não confirma o pagamento.
          </Text>
          {copyMessage !== "" && <Text style={styles.copyMessage}>{copyMessage}</Text>}
          <Pressable onPress={() => void copyOrder(completedOrder)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Copiar dados do pedido</Text>
          </Pressable>
          <Pressable onPress={() => void openWhatsApp(completedOrder)} style={styles.whatsappButton}>
            <Text style={styles.whatsappButtonText}>Tentar abrir o WhatsApp</Text>
          </Pressable>
          <Pressable onPress={() => router.navigate("/pedidos")} style={styles.ordersButton}>
            <Text style={styles.ordersButtonText}>Ver meus pedidos</Text>
          </Pressable>
        </View>
      ) : lines.length === 0 ? (
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
              <View key={product.id} style={styles.item}>
                <View style={[styles.itemArt, { backgroundColor: product.color }]}>
                  <Text style={styles.itemEmoji}>{product.flower}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text numberOfLines={1} style={styles.itemName}>{product.name}</Text>
                  <Text style={styles.itemDetail}>{product.detail}</Text>
                  <Text style={styles.itemPrice}>{formatCents(product.priceCents)}</Text>
                  <View style={styles.quantityRow}>
                    <Pressable disabled={checkingOut} accessibilityLabel="Diminuir quantidade" onPress={() => setCartQuantity(product.id, quantity - 1)} style={styles.quantityButton}>
                      <Text style={styles.quantitySymbol}>−</Text>
                    </Pressable>
                    <Text style={styles.quantity}>{quantity}</Text>
                    <Pressable disabled={checkingOut || quantity >= 99} accessibilityLabel="Aumentar quantidade" onPress={() => setCartQuantity(product.id, quantity + 1)} style={styles.quantityButton}>
                      <Text style={styles.quantitySymbol}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <Pressable disabled={checkingOut} accessibilityRole="button" accessibilityLabel={"Remover " + product.name} onPress={() => setCartQuantity(product.id, 0)}>
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
            <Text style={styles.deliveryNote}>Entrega grátis: R$ 0,00</Text>
            {checkoutError !== "" && <Text style={styles.checkoutError}>{checkoutError}</Text>}
            <Pressable disabled={checkingOut} onPress={() => void handleCheckout()} style={[styles.primaryButton, checkingOut && styles.disabledButton]}>
              <Text style={styles.primaryButtonText}>{checkingOut ? "Registrando pedido..." : "Confirmar pedido"}</Text>
            </Pressable>
            <Text style={styles.apiNote}>Após criar o pedido, o app abrirá o WhatsApp com uma mensagem pronta. Você precisa enviá-la.</Text>
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
  checkoutError: { marginTop: 10, color: "#a34444", fontSize: 11, lineHeight: 16, textAlign: "center" },
  completedCard: { marginHorizontal: 18, padding: 18, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 16, backgroundColor: "#ffffff" },
  completedTitle: { color: "#293b30", fontFamily: "Georgia", fontSize: 20 },
  completedText: { marginTop: 9, color: "#526057", fontSize: 12, fontWeight: "600" },
  whatsappNotice: { marginTop: 14, color: "#31583d", fontSize: 12, lineHeight: 18 },
  pendingNotice: { marginTop: 12, color: "#74591f", fontSize: 11, lineHeight: 16 },
  copyMessage: { marginTop: 10, color: "#31583d", fontSize: 11, textAlign: "center" },
  secondaryButton: { marginTop: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#31583d", borderRadius: 11 },
  secondaryButtonText: { color: "#31583d", fontSize: 12, fontWeight: "600" },
  whatsappButton: { marginTop: 9, paddingVertical: 12, alignItems: "center", borderRadius: 11, backgroundColor: "#31583d" },
  whatsappButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  ordersButton: { marginTop: 9, paddingVertical: 12, alignItems: "center" },
  ordersButtonText: { color: "#526057", fontSize: 11, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingHorizontal: 36, paddingVertical: 52 },
  emptyIcon: { color: "#78927d", fontSize: 48 },
  emptyTitle: { marginTop: 10, color: "#293b30", fontFamily: "Georgia", fontSize: 21 },
  emptyText: { marginTop: 8, color: "#838a84", fontSize: 13, lineHeight: 19, textAlign: "center" },
});
