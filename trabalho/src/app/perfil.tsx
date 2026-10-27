import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, AppLayout } from "@/components/AppLayout";
import { useStore } from "@/context/StoreContext";
import type { ProfileData } from "@/context/StoreContext";

const emptyForm: ProfileData = { name: "", email: "", phone: "", address: "" };

export default function PerfilScreen() {
  const { profile, saveProfile, signOut } = useStore();
  const [form, setForm] = useState<ProfileData>(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const hasAccount = Object.values(profile).every((value) => value.trim().length > 0);

  const updateField = (field: keyof ProfileData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setError("");
  };

  const handleSave = () => {
    if (Object.values(form).some((value) => value.trim().length === 0)) {
      setError("Preencha todos os campos para salvar seus dados.");
      setSaved(false);
      return;
    }
    saveProfile(form);
    setSaved(true);
    setError("");
  };

  const handleSignOut = () => {
    signOut();
    setForm(emptyForm);
    setSaved(false);
    setError("");
    router.replace("/navegation");
  };

  return (
    <AppLayout activeTab="perfil">
      <AppHeader title="Meu perfil" subtitle="Preencha seus dados para facilitar seus próximos pedidos." showBrand={false} />

      <View style={styles.form}>
        <Field label="Nome completo" value={form.name} placeholder="Como podemos chamar você?" onChangeText={(value) => updateField("name", value)} />
        <Field label="E-mail" value={form.email} placeholder="voce@email.com" keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => updateField("email", value)} />
        <Field label="Telefone" value={form.phone} placeholder="(00) 00000-0000" keyboardType="phone-pad" onChangeText={(value) => updateField("phone", value)} />
        <Field label="Endereço de entrega" value={form.address} placeholder="Rua, número, bairro e cidade" onChangeText={(value) => updateField("address", value)} />

        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Salvar dados</Text>
        </Pressable>
        {error !== "" && <Text style={styles.errorMessage}>{error}</Text>}
        {saved && <Text style={styles.savedMessage}>Dados guardados nesta sessão.</Text>}
        <Text style={styles.apiNote}>O perfil e os pedidos ainda não estão conectados ao banco de dados.</Text>

        {hasAccount && (
          <View style={styles.accountActions}>
            <Text style={styles.sectionTitle}>Minha conta</Text>
            <Pressable style={styles.actionButton} onPress={() => router.navigate("/pedidos")}>
              <Text style={styles.actionIcon}>▤</Text>
              <Text style={styles.actionLabel}>Meus pedidos</Text>
              <Text style={styles.actionArrow}>›</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.signOutButton]} onPress={handleSignOut}>
              <Text style={styles.actionIcon}>↪</Text>
              <Text style={[styles.actionLabel, styles.signOutLabel]}>Sair da conta</Text>
              <Text style={styles.actionArrow}>›</Text>
            </Pressable>
          </View>
        )}
      </View>
    </AppLayout>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

function Field({ label, value, placeholder, onChangeText, keyboardType = "default", autoCapitalize = "sentences" }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9aa19b"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: 22, paddingBottom: 20 },
  field: { marginBottom: 15 },
  label: { marginBottom: 6, color: "#526057", fontSize: 11, fontWeight: "600" },
  input: { minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 12, backgroundColor: "#ffffff", color: "#293b30", fontSize: 13 },
  saveButton: { marginTop: 4, paddingVertical: 14, alignItems: "center", borderRadius: 12, backgroundColor: "#31583d" },
  saveButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  errorMessage: { marginTop: 10, color: "#a34444", fontSize: 11, textAlign: "center" },
  savedMessage: { marginTop: 10, color: "#31583d", fontSize: 11, textAlign: "center" },
  apiNote: { marginTop: 12, color: "#899089", fontSize: 10, textAlign: "center" },
  accountActions: { marginTop: 28, gap: 10 },
  sectionTitle: { marginBottom: 2, color: "#293b30", fontFamily: "Georgia", fontSize: 19 },
  actionButton: { minHeight: 52, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e3e7df", borderRadius: 13, backgroundColor: "#ffffff" },
  actionIcon: { width: 28, color: "#31583d", fontSize: 19 },
  actionLabel: { flex: 1, color: "#405046", fontSize: 13, fontWeight: "600" },
  actionArrow: { color: "#879189", fontSize: 23 },
  signOutButton: { borderColor: "#eadfdd" },
  signOutLabel: { color: "#9b514b" },
});