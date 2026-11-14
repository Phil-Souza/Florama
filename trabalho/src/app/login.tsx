import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "@/context/StoreContext";

export default function LoginScreen() {
  const { login, user } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.replace("/navegation");
  }, [user]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Informe seu e-mail e sua senha.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/navegation");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.brand}>Florama</Text>
        <Text style={styles.title}>Que bom ter você de volta</Text>
        <Text style={styles.subtitle}>Entre para ver sua sacola, favoritos e pedidos.</Text>
        <Text style={styles.label}>E-mail</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="voce@email.com" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <Text style={styles.label}>Senha</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Sua senha" secureTextEntry style={styles.input} />
        {error !== "" && <Text style={styles.error}>{error}</Text>}
        <Pressable disabled={busy} onPress={() => void handleLogin()} style={[styles.primaryButton, busy && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{busy ? "Entrando..." : "Entrar"}</Text>
        </Pressable>
        <View style={styles.linkRow}>
          <Text style={styles.linkHint}>Ainda não tem conta?</Text>
          <Pressable onPress={() => router.navigate("/cadastro")}><Text style={styles.link}>Criar conta</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center", padding: 22, backgroundColor: "#f7f8f4" },
  card: { padding: 24, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 22, backgroundColor: "#ffffff" },
  brand: { color: "#24392c", fontFamily: "Georgia", fontSize: 32 },
  title: { marginTop: 24, color: "#293b30", fontFamily: "Georgia", fontSize: 22 },
  subtitle: { marginTop: 7, marginBottom: 24, color: "#838a84", fontSize: 12, lineHeight: 18 },
  label: { marginBottom: 6, color: "#526057", fontSize: 11, fontWeight: "600" },
  input: { minHeight: 48, marginBottom: 15, paddingHorizontal: 13, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 12, color: "#293b30", fontSize: 13 },
  error: { marginBottom: 12, color: "#a34444", fontSize: 11, lineHeight: 16 },
  primaryButton: { marginTop: 2, paddingVertical: 14, alignItems: "center", borderRadius: 12, backgroundColor: "#31583d" },
  primaryButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  linkRow: { marginTop: 20, flexDirection: "row", justifyContent: "center", gap: 5 },
  linkHint: { color: "#7b857d", fontSize: 11 },
  link: { color: "#31583d", fontSize: 11, fontWeight: "700" },
});