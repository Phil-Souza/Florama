import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { AppHeader, AppLayout } from "@/components/AppLayout";
import type { Product } from "@/data/catalog";
import { useStore } from "@/context/StoreContext";
import { apiFetch } from "@/services/api";

type AdminProduct = Product & {
  categorySlug: string;
  active: boolean;
};

type CatalogCategory = {
  slug: string;
  name: string;
};

type ProductForm = {
  name: string;
  detail: string;
  price: string;
  categorySlug: string;
  flower: string;
  color: string;
};

const emptyForm: ProductForm = {
  name: "",
  detail: "",
  price: "",
  categorySlug: "",
  flower: "🌸",
  color: "#f5e9e8",
};

function priceToCents(value: string) {
  const raw = value.trim().replace(/\s/g, "");
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function formatCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function AdminCatalogScreen() {
  const { user, authReady } = useStore();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productList, categoryList] = await Promise.all([
        apiFetch<AdminProduct[]>("/api/admin/products"),
        apiFetch<CatalogCategory[]>("/api/categories"),
      ]);
      setProducts(productList);
      setCategories(categoryList);
      setForm((current) => ({
        ...current,
        categorySlug: current.categorySlug || categoryList[0]?.slug || "",
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar o catálogo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (user?.role === "admin") void loadCatalog();
  }, [loadCatalog, user?.role]));

  useEffect(() => {
    if (authReady && user?.role !== "admin") router.replace("/perfil");
  }, [authReady, user?.role]);

  const updateForm = (field: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const resetForm = () => {
    setForm({ ...emptyForm, categorySlug: categories[0]?.slug ?? "" });
    setEditingId(null);
    setError("");
  };

  const saveProduct = async () => {
    const cents = priceToCents(form.price);
    if (!form.name.trim() || !form.detail.trim() || !form.categorySlug || !form.flower.trim() || !form.color.trim()) {
      setError("Preencha todos os campos do produto.");
      return;
    }
    if (cents === null) {
      setError("Informe um preço maior que zero, por exemplo 49,90.");
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(form.color.trim())) {
      setError("A cor deve estar no formato hexadecimal, por exemplo #F5E9E8.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        detail: form.detail.trim(),
        priceCents: cents,
        categorySlug: form.categorySlug,
        flower: form.flower.trim(),
        color: form.color.trim(),
      };
      const saved = await apiFetch<AdminProduct>(
        editingId ? `/api/admin/products/${encodeURIComponent(editingId)}` : "/api/admin/products",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setProducts((current) => editingId
        ? current.map((product) => product.id === saved.id ? saved : product)
        : [saved, ...current]);
      setMessage(editingId ? "Produto atualizado." : "Produto adicionado ao catálogo.");
      resetForm();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o produto.");
    } finally {
      setBusy(false);
    }
  };

  const editProduct = (product: AdminProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      detail: product.detail,
      price: formatPrice(product.priceCents),
      categorySlug: product.categorySlug,
      flower: product.flower,
      color: product.color,
    });
    setConfirmDeactivateId(null);
    setError("");
    setMessage("");
  };

  const setProductAvailability = async (product: AdminProduct, active: boolean) => {
    setBusyProductId(product.id);
    setError("");
    setMessage("");
    try {
      const updated = await apiFetch<AdminProduct>(
        `/api/admin/products/${encodeURIComponent(product.id)}/availability`,
        { method: "PATCH", body: JSON.stringify({ active }) },
      );
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setConfirmDeactivateId(null);
      setMessage(active ? "Produto reativado no catálogo." : "Produto removido do catálogo.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o produto.");
    } finally {
      setBusyProductId(null);
    }
  };

  const deactivateProduct = async (product: AdminProduct) => {
    setBusyProductId(product.id);
    setError("");
    setMessage("");
    try {
      const updated = await apiFetch<AdminProduct>(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        { method: "DELETE" },
      );
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setConfirmDeactivateId(null);
      setMessage("Produto removido do catálogo. O histórico de pedidos foi preservado.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível remover o produto.");
    } finally {
      setBusyProductId(null);
    }
  };

  return (
    <AppLayout activeTab="perfil">
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>‹ Voltar à administração</Text>
      </Pressable>
      <AppHeader title="Gerenciar catálogo" subtitle="Adicione, edite ou retire produtos da loja." showBrand={false} />

      <View style={styles.content}>
        {message !== "" && <Text accessibilityRole="alert" style={styles.success}>{message}</Text>}
        {error !== "" && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{editingId ? "Editar produto" : "Adicionar produto"}</Text>
          <FormField label="Nome" value={form.name} onChangeText={(value) => updateForm("name", value)} placeholder="Ex.: Buquê Aurora" maxLength={100} />
          <FormField label="Descrição" value={form.detail} onChangeText={(value) => updateForm("detail", value)} placeholder="Detalhes exibidos no catálogo" maxLength={500} />
          <FormField label="Preço (R$)" value={form.price} onChangeText={(value) => updateForm("price", value)} placeholder="Ex.: 49,90" keyboardType="decimal-pad" />

          <Text style={styles.fieldLabel}>Categoria</Text>
          <View style={styles.categoryList}>
            {categories.map((category) => (
              <Pressable
                key={category.slug}
                accessibilityRole="radio"
                accessibilityState={{ selected: form.categorySlug === category.slug }}
                onPress={() => updateForm("categorySlug", category.slug)}
                style={[styles.categoryChip, form.categorySlug === category.slug && styles.categoryChipSelected]}
              >
                <Text style={[styles.categoryChipText, form.categorySlug === category.slug && styles.categoryChipTextSelected]}>
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <FormField label="Emoji" value={form.flower} onChangeText={(value) => updateForm("flower", value)} placeholder="🌷" />
            </View>
            <View style={styles.inlineField}>
              <FormField label="Cor de fundo" value={form.color} onChangeText={(value) => updateForm("color", value)} placeholder="#F5E9E8" autoCapitalize="characters" maxLength={7} />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void saveProduct()}
            style={[styles.primaryButton, busy && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>
              {busy ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar ao catálogo"}
            </Text>
          </Pressable>
          {editingId && (
            <Pressable accessibilityRole="button" disabled={busy} onPress={resetForm} style={styles.cancelEditButton}>
              <Text style={styles.cancelEditText}>Cancelar edição</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Produtos</Text>
          <Pressable accessibilityRole="button" disabled={loading} onPress={() => void loadCatalog()} style={styles.refreshButton}>
            <Text style={styles.refreshText}>{loading ? "Atualizando..." : "Atualizar"}</Text>
          </Pressable>
        </View>
        {loading && <Text style={styles.emptyText}>Carregando catálogo...</Text>}
        {!loading && products.length === 0 && <Text style={styles.emptyText}>Nenhum produto encontrado.</Text>}

        {products.map((product) => {
          const itemBusy = busyProductId === product.id;
          return (
            <View key={product.id} style={[styles.productCard, !product.active && styles.inactiveCard]}>
              <View style={styles.productHeader}>
                <View style={[styles.productIcon, { backgroundColor: product.color }]}>
                  <Text style={styles.productEmoji}>{product.flower}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productMeta}>{product.category} · {formatCents(product.priceCents)}</Text>
                  <Text style={styles.productDetail}>{product.detail}</Text>
                </View>
                <Text style={[styles.productState, !product.active && styles.inactiveState]}>
                  {product.active ? "Ativo" : "Retirado"}
                </Text>
              </View>
              <View style={styles.productActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={itemBusy}
                  onPress={() => editProduct(product)}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Editar</Text>
                </Pressable>
                {product.active ? (
                  confirmDeactivateId === product.id ? (
                    <View style={styles.confirmActions}>
                      <Text style={styles.confirmText}>Retirar este produto do catálogo?</Text>
                      <Pressable accessibilityRole="button" disabled={itemBusy} onPress={() => setConfirmDeactivateId(null)} style={styles.keepButton}>
                        <Text style={styles.keepButtonText}>Manter</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" disabled={itemBusy} onPress={() => void deactivateProduct(product)} style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>{itemBusy ? "Retirando..." : "Confirmar"}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      disabled={itemBusy}
                      onPress={() => setConfirmDeactivateId(product.id)}
                      style={styles.removeTrigger}
                    >
                      <Text style={styles.removeTriggerText}>Remover</Text>
                    </Pressable>
                  )
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    disabled={itemBusy}
                    onPress={() => void setProductAvailability(product, true)}
                    style={styles.restoreButton}
                  >
                    <Text style={styles.restoreButtonText}>{itemBusy ? "Restaurando..." : "Restaurar"}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </AppLayout>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "characters";
  maxLength?: number;
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  maxLength,
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9aa19b"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { marginHorizontal: 22, marginBottom: 8, alignSelf: "flex-start", paddingVertical: 6 },
  backText: { color: "#31583d", fontSize: 12, fontWeight: "600" },
  content: { paddingHorizontal: 18, paddingBottom: 18 },
  success: { marginBottom: 10, color: "#31583d", fontSize: 12, textAlign: "center" },
  error: { marginBottom: 10, color: "#a34444", fontSize: 12, lineHeight: 17, textAlign: "center" },
  formCard: { marginBottom: 18, padding: 15, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 16, backgroundColor: "#ffffff" },
  sectionTitle: { color: "#293b30", fontFamily: "Georgia", fontSize: 19 },
  field: { marginTop: 12 },
  fieldLabel: { marginBottom: 6, color: "#526057", fontSize: 11, fontWeight: "600" },
  input: { minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 11, backgroundColor: "#ffffff", color: "#293b30", fontSize: 12 },
  categoryList: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 12, backgroundColor: "#ffffff" },
  categoryChipSelected: { borderColor: "#31583d", backgroundColor: "#eaf0e8" },
  categoryChipText: { color: "#526057", fontSize: 10 },
  categoryChipTextSelected: { color: "#31583d", fontWeight: "700" },
  inlineFields: { flexDirection: "row", gap: 10 },
  inlineField: { flex: 1 },
  primaryButton: { minHeight: 44, marginTop: 14, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#31583d" },
  primaryButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  cancelEditButton: { marginTop: 8, paddingVertical: 9, alignItems: "center" },
  cancelEditText: { color: "#69756c", fontSize: 11, fontWeight: "600" },
  listHeader: { marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  refreshButton: { paddingHorizontal: 10, paddingVertical: 7 },
  refreshText: { color: "#31583d", fontSize: 11, fontWeight: "600" },
  emptyText: { padding: 22, color: "#718075", fontSize: 12, textAlign: "center" },
  productCard: { marginBottom: 10, padding: 12, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 14, backgroundColor: "#ffffff" },
  inactiveCard: { opacity: 0.72 },
  productHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  productIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  productEmoji: { fontSize: 22 },
  productInfo: { flex: 1 },
  productName: { color: "#293b30", fontSize: 12, fontWeight: "700" },
  productMeta: { marginTop: 3, color: "#526057", fontSize: 10 },
  productDetail: { marginTop: 3, color: "#899089", fontSize: 10 },
  productState: { color: "#31583d", fontSize: 9, fontWeight: "700" },
  inactiveState: { color: "#9b514b" },
  productActions: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  secondaryButton: { minHeight: 36, minWidth: 76, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#31583d", borderRadius: 9 },
  secondaryButtonText: { color: "#31583d", fontSize: 10, fontWeight: "600" },
  removeTrigger: { paddingHorizontal: 10, paddingVertical: 8 },
  removeTriggerText: { color: "#9b514b", fontSize: 10, fontWeight: "600" },
  confirmActions: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 7 },
  confirmText: { flexBasis: "100%", color: "#8e423b", fontSize: 10, textAlign: "right" },
  keepButton: { paddingHorizontal: 8, paddingVertical: 7 },
  keepButtonText: { color: "#526057", fontSize: 10, fontWeight: "600" },
  removeButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 8, backgroundColor: "#9b514b" },
  removeButtonText: { color: "#ffffff", fontSize: 10, fontWeight: "600" },
  restoreButton: { paddingHorizontal: 10, paddingVertical: 8 },
  restoreButtonText: { color: "#31583d", fontSize: 10, fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
});
