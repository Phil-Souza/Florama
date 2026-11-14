import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { AppHeader, AppLayout } from "@/components/AppLayout";
import { useStore } from "@/context/StoreContext";
import type { Order } from "@/context/StoreContext";
import { apiFetch } from "@/services/api";

type AdminOrder = Order & {
  customerName: string;
  customerEmail: string;
  paymentValidatedAt: string | null;
  paymentValidatedBy: string | null;
  paymentValidatorName: string | null;
};

const nextStatus: Record<string, { value: string; label: string } | undefined> = {
  paga: { value: "em_preparo", label: "Iniciar preparo" },
  em_preparo: { value: "pronta_entrega", label: "Marcar pronta para entrega" },
  pronta_entrega: { value: "concluida", label: "Concluir pedido" },
};

const statusNames: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  paga: "Pagamento aprovado",
  em_preparo: "Em preparo",
  pronta_entrega: "Pronta para entrega",
  concluida: "Concluído",
  cancelada: "Cancelado",
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function AdminScreen() {
  const { user, authReady } = useStore();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [verifiedOrders, setVerifiedOrders] = useState<Record<string, boolean>>({});
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await apiFetch<AdminOrder[]>("/api/admin/orders"));
      setVerifiedOrders({});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (user?.role === "admin") void loadOrders();
  }, [loadOrders, user?.role]));
  useEffect(() => {
    if (authReady && user?.role !== "admin") router.replace("/perfil");
  }, [authReady, user?.role]);

  const updateOrder = async (
    orderId: string,
    action: "payment" | "status",
    newStatus?: string,
  ) => {
    if (action === "payment" && !verifiedOrders[orderId]) {
      setError("Marque a confirmação de conferência do recebimento antes de validar o pagamento.");
      return;
    }
    setBusyOrderId(orderId);
    setError("");
    setMessage("");
    try {
      const updated = action === "payment"
        ? await apiFetch<AdminOrder>(`/api/admin/orders/${encodeURIComponent(orderId)}/confirm-payment`, { method: "POST" })
        : await apiFetch<AdminOrder>(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        });
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
      setVerifiedOrders((current) => ({ ...current, [orderId]: false }));
      setMessage(action === "payment" ? "Pagamento validado e registrado." : "Andamento do pedido atualizado.");
      await loadOrders();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o pedido.");
    } finally {
      setBusyOrderId(null);
    }
  };

  const deleteOrder = async (order: AdminOrder) => {
    setBusyOrderId(order.id);
    setError("");
    setMessage("");
    try {
      await apiFetch<void>(`/api/admin/orders/${encodeURIComponent(order.id)}`, { method: "DELETE" });
      setOrders((current) => current.filter((item) => item.id !== order.id));
      setDeleteConfirmationId(null);
      setMessage(`Pedido #${order.id.slice(0, 8).toUpperCase()} excluído.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir o pedido.");
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <AppLayout activeTab="perfil">
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>‹ Voltar ao perfil</Text>
      </Pressable>
      <AppHeader title="Administração" subtitle="Pedidos e validação manual de pagamentos." showBrand={false} />

      <View style={styles.content}>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Confira o recebimento no extrato/conta antes de validar. Imagens de comprovante não confirmam o pagamento.
          </Text>
        </View>
        {message !== "" && <Text style={styles.success}>{message}</Text>}
        {error !== "" && <Text style={styles.error}>{error}</Text>}
        <Pressable accessibilityRole="button" onPress={() => void loadOrders()} disabled={loading} style={styles.refreshButton}>
          <Text style={styles.refreshText}>{loading ? "Atualizando..." : "Atualizar pedidos"}</Text>
        </Pressable>
        {loading && <Text style={styles.emptyText}>Carregando pedidos...</Text>}
        {!loading && orders.length === 0 && error === "" && (
          <Text style={styles.emptyText}>Ainda não há pedidos registrados.</Text>
        )}

        {orders.map((order) => {
          const next = nextStatus[order.status];
          const busy = busyOrderId === order.id;
          const needsPaymentValidation = order.status === "aguardando_pagamento" && order.paymentStatus === "pendente";
          return (
            <View key={order.id} style={[styles.orderCard, needsPaymentValidation && styles.pendingCard]}>
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderText}>
                  <Text style={styles.orderNumber}>Pedido #{order.id.slice(0, 8).toUpperCase()}</Text>
                  <Text style={styles.orderId}>ID completo: {order.id}</Text>
                  <Text style={styles.date}>{new Date(order.createdAt).toLocaleString("pt-BR")}</Text>
                </View>
                {needsPaymentValidation && (
                  <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>Aguardando pagamento</Text></View>
                )}
              </View>
              <Text style={styles.customerName}>{order.customerName}</Text>
              <Text style={styles.secondaryText}>{order.customerEmail}</Text>
              <Text style={styles.secondaryText}>Recebedor: {order.recipientName} · {order.recipientPhone}</Text>
              <Text style={styles.secondaryText}>Entrega: {order.deliveryAddress}</Text>
              <View style={styles.separator} />
              {order.items.map((item, index) => (
                <Text key={`${item.productId ?? item.name}-${index}`} style={styles.itemText}>
                  {item.quantity}× {item.name} — {formatCents(item.unitPriceCents * item.quantity)}
                </Text>
              ))}
              <View style={styles.summaryRow}>
                <Text style={styles.secondaryText}>Pagamento: {order.paymentStatus}</Text>
                <Text style={styles.total}>{formatCents(order.totalCents)}</Text>
              </View>
              <Text style={styles.status}>Andamento: {statusNames[order.status] ?? order.status}</Text>

              {needsPaymentValidation && (
                <View style={styles.paymentAction}>
                  <Text style={styles.verificationInstruction}>
                    Para validar este pedido, marque abaixo que conferiu o recebimento no extrato.
                    A confirmação precisa ser feita separadamente para cada pedido.
                  </Text>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: Boolean(verifiedOrders[order.id]) }}
                    onPress={() => {
                      setError("");
                      setVerifiedOrders((current) => ({ ...current, [order.id]: !current[order.id] }));
                    }}
                    style={styles.checkboxRow}
                  >
                    <View style={[styles.checkbox, verifiedOrders[order.id] && styles.checkboxChecked]}>
                      {verifiedOrders[order.id] && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkText}>Conferi o recebimento deste pedido no extrato/conta comercial.</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy || !verifiedOrders[order.id]}
                    onPress={() => void updateOrder(order.id, "payment")}
                    style={[styles.primaryButton, (busy || !verifiedOrders[order.id]) && styles.disabledButton]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {busy
                        ? "Validando..."
                        : verifiedOrders[order.id]
                          ? "Confirmar pagamento recebido"
                          : "Marque a conferência acima para continuar"}
                    </Text>
                  </Pressable>
                </View>
              )}

              {order.paymentValidatedAt && (
                <Text style={styles.auditText}>
                  Pagamento validado em {new Date(order.paymentValidatedAt).toLocaleString("pt-BR")}.
                  {order.paymentValidatorName ? ` Responsável: ${order.paymentValidatorName}.` : ""}
                </Text>
              )}
              {next && (
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => void updateOrder(order.id, "status", next.value)}
                  style={[styles.secondaryButton, busy && styles.disabledButton]}
                >
                  <Text style={styles.secondaryButtonText}>{busy ? "Salvando..." : next.label}</Text>
                </Pressable>
              )}
              {order.status === "aguardando_pagamento" && (
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => void updateOrder(order.id, "status", "cancelada")}
                  style={[styles.cancelButton, busy && styles.disabledButton]}
                >
                  <Text style={styles.cancelText}>{busy ? "Salvando..." : "Cancelar pedido"}</Text>
                </Pressable>
              )}
              {order.status === "cancelada" && order.paymentStatus === "pendente" && (
                deleteConfirmationId === order.id ? (
                  <View style={styles.deleteConfirmation}>
                    <Text style={styles.deletePrompt}>
                      Excluir permanentemente o pedido #{order.id.slice(0, 8).toUpperCase()}?
                      {"\n"}Esta ação não pode ser desfeita.
                    </Text>
                    <View style={styles.deleteActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => setDeleteConfirmationId(null)}
                        style={styles.keepButton}
                      >
                        <Text style={styles.keepButtonText}>Manter pedido</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => void deleteOrder(order)}
                        style={[styles.deleteButton, busy && styles.disabledButton]}
                      >
                        <Text style={styles.deleteButtonText}>{busy ? "Excluindo..." : "Excluir este pedido"}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => {
                      setError("");
                      setMessage("");
                      setDeleteConfirmationId(order.id);
                    }}
                    style={styles.deleteTrigger}
                  >
                    <Text style={styles.deleteTriggerText}>Excluir pedido cancelado</Text>
                  </Pressable>
                )
              )}
            </View>
          );
        })}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { marginHorizontal: 22, marginBottom: 8, alignSelf: "flex-start", paddingVertical: 6 },
  backText: { color: "#31583d", fontSize: 12, fontWeight: "600" },
  content: { paddingHorizontal: 18, paddingBottom: 12 },
  notice: { marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: "#fff3d8" },
  noticeText: { color: "#74591f", fontSize: 11, lineHeight: 16 },
  success: { marginBottom: 10, color: "#31583d", fontSize: 12, textAlign: "center" },
  error: { marginBottom: 10, color: "#a34444", fontSize: 12, textAlign: "center" },
  refreshButton: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 12 },
  refreshText: { color: "#31583d", fontSize: 11, fontWeight: "600" },
  emptyText: { padding: 24, color: "#718075", fontSize: 12, textAlign: "center" },
  orderCard: { marginBottom: 12, padding: 15, borderWidth: 1, borderColor: "#e6eae3", borderRadius: 15, backgroundColor: "#ffffff" },
  pendingCard: { borderColor: "#d8ad4c", borderWidth: 1.5 },
  orderHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  orderHeaderText: { flex: 1 },
  orderNumber: { color: "#293b30", fontSize: 13, fontWeight: "700" },
  orderId: { marginTop: 3, color: "#899089", fontSize: 9 },
  date: { marginTop: 4, marginBottom: 10, color: "#899089", fontSize: 10 },
  pendingBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: "#fff3d8" },
  pendingBadgeText: { color: "#74591f", fontSize: 9, fontWeight: "700" },
  customerName: { marginBottom: 3, color: "#293b30", fontSize: 12, fontWeight: "700" },
  secondaryText: { marginTop: 4, color: "#69756c", fontSize: 10, lineHeight: 15 },
  separator: { height: 1, marginVertical: 10, backgroundColor: "#edf0ea" },
  itemText: { marginTop: 5, color: "#526057", fontSize: 11 },
  summaryRow: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  total: { color: "#293b30", fontSize: 14, fontWeight: "700" },
  status: { marginTop: 8, color: "#31583d", fontSize: 11, fontWeight: "600" },
  paymentAction: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#edf0ea" },
  verificationInstruction: { marginBottom: 6, color: "#526057", fontSize: 10, lineHeight: 15 },
  checkboxRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  checkbox: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#879189", borderRadius: 6 },
  checkboxChecked: { borderColor: "#31583d", backgroundColor: "#31583d" },
  checkmark: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  checkText: { flex: 1, color: "#526057", fontSize: 10, lineHeight: 15 },
  primaryButton: { minHeight: 44, marginTop: 8, paddingVertical: 10, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#31583d" },
  primaryButtonText: { color: "#ffffff", fontSize: 11, fontWeight: "600", textAlign: "center" },
  secondaryButton: { marginTop: 10, paddingVertical: 11, alignItems: "center", borderWidth: 1, borderColor: "#31583d", borderRadius: 10 },
  secondaryButtonText: { color: "#31583d", fontSize: 11, fontWeight: "600" },
  cancelButton: { marginTop: 8, paddingVertical: 9, alignItems: "center" },
  cancelText: { color: "#9b514b", fontSize: 10, fontWeight: "600" },
  deleteTrigger: { marginTop: 8, paddingVertical: 9, alignItems: "center" },
  deleteTriggerText: { color: "#9b514b", fontSize: 10, fontWeight: "600" },
  deleteConfirmation: { marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: "#f9e9e6" },
  deletePrompt: { color: "#8e423b", fontSize: 10, lineHeight: 15, textAlign: "center" },
  deleteActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 6 },
  keepButton: { paddingVertical: 9, paddingHorizontal: 8 },
  keepButtonText: { color: "#526057", fontSize: 10, fontWeight: "600" },
  deleteButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 9, backgroundColor: "#9b514b" },
  deleteButtonText: { color: "#ffffff", fontSize: 10, fontWeight: "600" },
  auditText: { marginTop: 8, color: "#718075", fontSize: 10 },
  disabledButton: { opacity: 0.5 },
});
