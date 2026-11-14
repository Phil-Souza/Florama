import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader, AppLayout } from "@/components/AppLayout";
import { useStore } from "@/context/StoreContext";
import type { Order } from "@/context/StoreContext";

function formatCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    aguardando_pagamento: "Aguardando pagamento",
    paga: "Pagamento aprovado",
    pendente: "Pendente",
    em_preparo: "Em preparo",
    pronta_entrega: "Pronto para entrega",
    concluida: "Concluído",
    cancelada: "Cancelado",
  };
  return labels[status] ?? status;
}

export default function PedidoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Array.isArray(id) ? id[0] : id;
  const { getOrder } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const loading = Boolean(orderId) && loadedOrderId !== orderId;
  const visibleError = orderId ? error : "Não foi possível identificar este pedido.";

  useEffect(() => {
    let active = true;
    if (!orderId) return () => { active = false; };
    void getOrder(orderId)
      .then((result) => {
        if (active) {
          setOrder(result);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o pedido.");
      })
      .finally(() => {
        if (active) setLoadedOrderId(orderId);
      });
    return () => { active = false; };
  }, [attempt, getOrder, orderId]);

  return (
    <AppLayout activeTab="perfil">
      <Pressable
        accessibilityRole="button"
        onPress={() => router.canGoBack() ? router.back() : router.replace("/pedidos")}
        style={styles.backButton}
      >
        <Text style={styles.backText}>‹ Voltar aos pedidos</Text>
      </Pressable>
      <AppHeader title="Detalhes do pedido" subtitle="Acompanhe os itens e valores da sua compra." showBrand={false} />

      {loading && <Text style={styles.message}>Carregando pedido...</Text>}
      {!loading && visibleError !== "" && (
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{visibleError}</Text>
          {orderId && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOrder(null);
                setError("");
                setLoadedOrderId(null);
                setAttempt((current) => current + 1);
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          )}
        </View>
      )}
      {!loading && order && order.id === orderId && (
        <>
          <View style={styles.orderCard}>
            <Text style={styles.orderNumber}>Pedido #{order.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.date}>{new Date(order.createdAt).toLocaleString("pt-BR")}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.status}>{statusLabel(order.status)}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Pagamento</Text>
              <Text style={styles.status}>{statusLabel(order.paymentStatus)}</Text>
            </View>
            <View style={styles.deliveryInfo}>
              <Text style={styles.label}>Recebedor</Text>
              <Text style={styles.deliveryValue}>{order.recipientName}</Text>
              <Text style={styles.deliveryValue}>{order.recipientPhone}</Text>
              <Text style={styles.label}>Endereço de entrega</Text>
              <Text style={styles.deliveryValue}>{order.deliveryAddress}</Text>
            </View>
          </View>

          <View style={styles.itemsCard}>
            <Text style={styles.sectionTitle}>Itens do pedido</Text>
            {order.items.map((item, index) => (
              <View key={`${item.productId ?? item.name}-${index}`} style={styles.itemRow}>
                <View style={styles.itemDescription}>
                  <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
                  {item.detail !== "" && <Text style={styles.detail}>{item.detail}</Text>}
                </View>
                <Text style={styles.itemPrice}>{formatCents(item.unitPriceCents * item.quantity)}</Text>
              </View>
            ))}

            <View style={styles.separator} />
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCents(order.subtotalCents)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Entrega</Text>
              <Text style={styles.summaryValue}>
                {order.deliveryFeeCents === 0 ? "Grátis" : formatCents(order.deliveryFeeCents)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCents(order.totalCents)}</Text>
            </View>
          </View>

          {order.paymentStatus === "pendente" && (
            <Text style={styles.paymentNote}>
              Pagamento pendente. O pedido só será considerado pago após a conferência e validação manual pela administração.
            </Text>
          )}
        </>
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { marginHorizontal: 22, marginBottom: 8, alignSelf: "flex-start", paddingVertical: 6 },
  backText: { color: "#31583d", fontSize: 12, fontWeight: "600" },
  message: { padding: 28, color: "#718075", fontSize: 12, textAlign: "center" },
  errorState: { marginHorizontal: 18, padding: 16, alignItems: "center", borderRadius: 12, backgroundColor: "#f9e9e6" },
  errorText: { color: "#8e423b", fontSize: 12, lineHeight: 18, textAlign: "center" },
  retryButton: { marginTop: 12, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: "#ffffff" },
  retryText: { color: "#31583d", fontSize: 11, fontWeight: "600" },
  orderCard: { marginHorizontal: 18, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: "#e6eae3", borderRadius: 16, backgroundColor: "#ffffff" },
  orderNumber: { color: "#293b30", fontSize: 14, fontWeight: "700" },
  date: { marginTop: 5, marginBottom: 12, color: "#899089", fontSize: 10 },
  statusRow: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { color: "#69756c", fontSize: 11 },
  status: { flex: 1, color: "#31583d", fontSize: 11, fontWeight: "600", textAlign: "right" },
  deliveryInfo: { marginTop: 14, paddingTop: 12, gap: 5, borderTopWidth: 1, borderTopColor: "#edf0ea" },
  deliveryValue: { color: "#526057", fontSize: 11, lineHeight: 16 },
  itemsCard: { marginHorizontal: 18, padding: 16, borderWidth: 1, borderColor: "#e6eae3", borderRadius: 16, backgroundColor: "#ffffff" },
  sectionTitle: { marginBottom: 6, color: "#293b30", fontFamily: "Georgia", fontSize: 18 },
  itemRow: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", gap: 12 },
  itemDescription: { flex: 1 },
  itemName: { color: "#526057", fontSize: 12, fontWeight: "600" },
  detail: { marginTop: 3, color: "#899089", fontSize: 10 },
  itemPrice: { color: "#526057", fontSize: 11 },
  separator: { height: 1, marginTop: 16, marginBottom: 6, backgroundColor: "#edf0ea" },
  summaryRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryValue: { color: "#526057", fontSize: 11 },
  totalRow: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#edf0ea" },
  totalLabel: { color: "#293b30", fontSize: 13, fontWeight: "700" },
  totalValue: { color: "#293b30", fontSize: 13, fontWeight: "700" },
  paymentNote: { marginHorizontal: 22, marginTop: 12, color: "#8a6b32", fontSize: 11, lineHeight: 16, textAlign: "center" },
});
