import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, AppLayout } from "@/components/AppLayout";
import { useStore } from "@/context/StoreContext";

function formatCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    aguardando_pagamento: "Aguardando pagamento",
    paga: "Pagamento aprovado",
    em_preparo: "Em preparo",
    pronta_entrega: "Pronto para entrega",
    concluida: "Concluído",
    cancelada: "Cancelado",
  };
  return labels[status] ?? status;
}

export default function PedidosScreen() {
  const { orders, ordersLoading, ordersError, loadOrders } = useStore();

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <AppLayout activeTab="perfil">
      <AppHeader title="Meus pedidos" subtitle="Acompanhe suas compras na Florama." showBrand={false} />

      {ordersLoading && <Text style={styles.loading}>Carregando pedidos...</Text>}
      {ordersError !== "" && (
        <Pressable onPress={() => void loadOrders()} style={styles.errorBox}>
          <Text style={styles.errorText}>{ordersError} Toque para tentar novamente.</Text>
        </Pressable>
      )}
      {!ordersLoading && orders.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}><Text style={styles.icon}>▤</Text></View>
          <Text style={styles.title}>Nenhum pedido por aqui ainda</Text>
          <Text style={styles.description}>Seus pedidos aparecerão aqui depois que você confirmar uma compra.</Text>
          <Pressable style={styles.button} onPress={() => router.navigate("/navegation")}>
            <Text style={styles.buttonText}>Ver catálogo</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.orderList}>
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeading}>
              <View>
                <Text style={styles.orderNumber}>Pedido #{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.date}>{new Date(order.createdAt).toLocaleString("pt-BR")}</Text>
              </View>
              <Text style={styles.status}>{statusLabel(order.status)}</Text>
            </View>
            <View style={styles.separator} />
            {order.items.map((item, index) => (
              <View key={`${order.id}-${index}`} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.quantity}× {item.name}</Text>
                <Text style={styles.itemPrice}>{formatCents(item.unitPriceCents * item.quantity)}</Text>
              </View>
            ))}
            <View style={[styles.itemRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCents(order.totalCents)}</Text>
            </View>
            {order.paymentStatus === "pendente" && <Text style={styles.paymentNote}>Pagamento pendente</Text>}
          </View>
        ))}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  loading: { padding: 28, color: "#718075", fontSize: 12, textAlign: "center" },
  errorBox: { marginHorizontal: 18, padding: 12, borderRadius: 11, backgroundColor: "#f9e9e6" },
  errorText: { color: "#8e423b", fontSize: 11, lineHeight: 16, textAlign: "center" },
  emptyState: { alignItems: "center", paddingHorizontal: 36, paddingVertical: 54 },
  iconCircle: { width: 76, height: 76, alignItems: "center", justifyContent: "center", borderRadius: 38, backgroundColor: "#eaf0e8" },
  icon: { color: "#56775d", fontSize: 31 },
  title: { marginTop: 18, color: "#293b30", fontFamily: "Georgia", fontSize: 20, textAlign: "center" },
  description: { marginTop: 9, color: "#838a84", fontSize: 12, lineHeight: 19, textAlign: "center" },
  button: { marginTop: 22, minHeight: 42, paddingHorizontal: 20, justifyContent: "center", borderWidth: 1, borderColor: "#31583d", borderRadius: 12, backgroundColor: "#ffffff" },
  buttonText: { color: "#31583d", fontSize: 12, fontWeight: "600" },
  orderList: { paddingHorizontal: 18, paddingBottom: 20, gap: 12 },
  orderCard: { padding: 15, borderWidth: 1, borderColor: "#e6eae3", borderRadius: 16, backgroundColor: "#ffffff" },
  orderHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  orderNumber: { color: "#293b30", fontSize: 12, fontWeight: "700" },
  date: { marginTop: 4, color: "#899089", fontSize: 9 },
  status: { maxWidth: 120, color: "#31583d", fontSize: 10, fontWeight: "600", textAlign: "right" },
  separator: { height: 1, marginVertical: 12, backgroundColor: "#edf0ea" },
  itemRow: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", gap: 12 },
  itemName: { flex: 1, color: "#526057", fontSize: 11 },
  itemPrice: { color: "#526057", fontSize: 11 },
  totalRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#edf0ea" },
  totalLabel: { color: "#293b30", fontSize: 12, fontWeight: "700" },
  totalValue: { color: "#293b30", fontSize: 12, fontWeight: "700" },
  paymentNote: { marginTop: 10, color: "#8a6b32", fontSize: 10 },
});