import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, AppLayout } from "@/components/AppLayout";

export default function PedidosScreen() {
  return (
    <AppLayout activeTab="perfil">
      <AppHeader title="Meus pedidos" subtitle="Acompanhe suas compras na Florama." showBrand={false} />
      <View style={styles.emptyState}>
        <View style={styles.iconCircle}><Text style={styles.icon}>▤</Text></View>
        <Text style={styles.title}>Nenhum pedido por aqui ainda</Text>
        <Text style={styles.description}>Quando o histórico de compras estiver disponível, seus pedidos aparecerão nesta tela.</Text>
        <Pressable style={styles.button} onPress={() => router.navigate("/perfil")}>
          <Text style={styles.buttonText}>Voltar ao perfil</Text>
        </Pressable>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  emptyState: { alignItems: "center", paddingHorizontal: 36, paddingVertical: 54 },
  iconCircle: { width: 76, height: 76, alignItems: "center", justifyContent: "center", borderRadius: 38, backgroundColor: "#eaf0e8" },
  icon: { color: "#56775d", fontSize: 31 },
  title: { marginTop: 18, color: "#293b30", fontFamily: "Georgia", fontSize: 20, textAlign: "center" },
  description: { marginTop: 9, color: "#838a84", fontSize: 12, lineHeight: 19, textAlign: "center" },
  button: { marginTop: 22, minHeight: 42, paddingHorizontal: 20, justifyContent: "center", borderWidth: 1, borderColor: "#31583d", borderRadius: 12, backgroundColor: "#ffffff" },
  buttonText: { color: "#31583d", fontSize: 12, fontWeight: "600" },
});