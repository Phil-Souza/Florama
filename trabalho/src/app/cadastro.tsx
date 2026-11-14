import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "@/context/StoreContext";

export default function CadastroScreen() {
  const { register, user } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.replace("/navegation");
  }, [user]);

  const handleRegister = async () => {
    if (![name, email, phone, address, password].every((value) => value.trim())) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await register({ name, email, phone, address, password });
      router.replace("/navegation");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar sua conta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.brand}>Florama</Text>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>Seus dados vão facilitar os próximos pedidos.</Text>
        <Field label="Nome completo" value={name} onChangeText={setName} placeholder="Como podemos chamar você?" />
        <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Telefone" value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
        <Field label="Endereço de entrega" value={address} onChangeText={setAddress} placeholder="Rua, número, bairro e cidade" />
        <Field label="Senha (mínimo 8 caracteres)" value={password} onChangeText={setPassword} placeholder="Crie uma senha" secureTextEntry />
        {error !== "" && <Text style={styles.error}>{error}</Text>}
        <Pressable disabled={busy} onPress={() => void handleRegister()} style={[styles.primaryButton, busy && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{busy ? "Criando conta..." : "Criar conta"}</Text>
        </Pressable>
        <View style={styles.linkRow}>
          <Text style={styles.linkHint}>Já tem conta?</Text>
          <Pressable onPress={() => router.navigate("/login")}><Text style={styles.link}>Entrar</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
};

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", autoCapitalize = "sentences", secureTextEntry = false }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9aa19b" keyboardType={keyboardType} autoCapitalize={autoCapitalize} secureTextEntry={secureTextEntry} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center", padding: 22, backgroundColor: "#f7f8f4" },
  card: { padding: 24, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 22, backgroundColor: "#ffffff" },
  brand: { color: "#24392c", fontFamily: "Georgia", fontSize: 32 },
  title: { marginTop: 22, color: "#293b30", fontFamily: "Georgia", fontSize: 22 },
  subtitle: { marginTop: 7, marginBottom: 20, color: "#838a84", fontSize: 12, lineHeight: 18 },
  field: { marginBottom: 12 },
  label: { marginBottom: 6, color: "#526057", fontSize: 11, fontWeight: "600" },
  input: { minHeight: 46, paddingHorizontal: 13, borderWidth: 1, borderColor: "#e3e7df", borderRadius: 12, color: "#293b30", fontSize: 13 },
  error: { marginBottom: 12, color: "#a34444", fontSize: 11, lineHeight: 16 },
  primaryButton: { marginTop: 4, paddingVertical: 14, alignItems: "center", borderRadius: 12, backgroundColor: "#31583d" },
  primaryButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  disabled: { opacity: 0.6 },
  linkRow: { marginTop: 18, flexDirection: "row", justifyContent: "center", gap: 5 },
  linkHint: { color: "#7b857d", fontSize: 11 },
  link: { color: "#31583d", fontSize: 11, fontWeight: "700" },
});