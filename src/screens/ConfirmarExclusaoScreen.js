import React, { useState } from "react";
import { Text, StyleSheet, Platform } from "react-native";
import Toast from "react-native-toast-message";
import EntryLayout from "../components/entry/EntryLayout";
import Field from "../components/entry/Field";
import FormMessage from "../components/entry/FormMessage";
import Button from "../components/ui/Button";
import { useAuth } from "../components/AuthProvider";
import { deleteAccount } from "../api/me";
import { unregisterDevice } from "../services/notificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBusiness } from "../business/BusinessProvider";
import { clearCartFor } from "../services/cartService";
import { useTheme } from "../utils/ThemeContext";
import { type } from "../theme/tokens";

// Excluir a conta: confirma com a senha (POST /v1/me/delete). Os dados pessoais são anonimizados.
export default function ConfirmarExclusaoScreen({ navigation }) {
  const { theme } = useTheme();
  const { endSession } = useAuth();
  const { slug } = useBusiness();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setMessage("");
    if (loading) return;
    if (!password) {
      setError("Digite a sua senha.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await unregisterDevice();
      await deleteAccount(password);
      await endSession();
      await clearCartFor(AsyncStorage, slug).catch(() => {});
      Toast.show({ type: "success", text1: "Sua conta foi excluída.", visibilityTime: 4000 });
      // Na web volta para a Intro; no celular, para a aba Agendar.
      navigation.reset({ index: 0, routes: [{ name: Platform.OS === "web" ? "Intro" : "Navigator" }] });
    } catch (failure) {
      setMessage(failure.message);
      setLoading(false);
    }
  };

  return (
    <EntryLayout title="Excluir conta" onBack={() => navigation.goBack()}>
      <Text style={[styles.text, { color: theme.colors.ink }]}>
        Seus dados pessoais são apagados e você sai da conta em todos os aparelhos. Não dá para desfazer.
      </Text>
      <Text style={[styles.text, { color: theme.colors.inkMuted }]}>Para continuar, confirme com a sua senha.</Text>
      <FormMessage kind="error">{message}</FormMessage>
      <Field label="Sua senha" secure value={password} onChangeText={setPassword} error={error} autoCapitalize="none" autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
      <Button title="Excluir minha conta" onPress={submit} loading={loading} fullWidth size="lg" style={{ backgroundColor: theme.colors.danger }} />
      <Button title="Voltar" variant="ghost" onPress={() => navigation.goBack()} fullWidth style={{ marginTop: 8 }} />
    </EntryLayout>
  );
}

const styles = StyleSheet.create({
  text: { ...type.body, marginBottom: 12 },
});
