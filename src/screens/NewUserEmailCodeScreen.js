import React, { useRef, useState } from "react";
import { Text, StyleSheet } from "react-native";
import { verify, register } from "../api/auth";
import { pendingRegistration } from "../auth/pendingRegistration";
import { useAuth } from "../components/AuthProvider";
import EntryLayout from "../components/entry/EntryLayout";
import Field from "../components/entry/Field";
import FormMessage from "../components/entry/FormMessage";
import Button from "../components/ui/Button";
import { validateCode } from "../utils/helpers";
import { useTheme } from "../utils/ThemeContext";
import { fonts, type } from "../theme/tokens";

export default function NewUserEmailCodeScreen({ navigation, route }) {
  const email = route && route.params && route.params.email ? route.params.email : "";
  const { theme } = useTheme();
  const { startSession } = useAuth();
  const styles = getStyles(theme);

  const sending = useRef(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("SignUp");
  };

  const submit = async (value) => {
    if (sending.current) return;
    if (!validateCode(value)) {
      setError("Digite os 6 números do código.");
      return;
    }
    sending.current = true;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const session = await verify({ email, code: value });
      pendingRegistration.clear();
      await startSession(session);
      navigation.navigate("Navigator");
    } catch (failure) {
      setError(failure.message);
    }
    sending.current = false;
    setLoading(false);
  };

  const handleChange = (text) => {
    const digits = text.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (error) setError("");
    if (digits.length === 6) submit(digits);
  };

  // A v1 não tem rota de reenvio: pedir de novo é repetir o cadastro com os mesmos dados.
  const handleResend = async () => {
    if (resending || loading) return;
    const pending = pendingRegistration.get(email);
    if (!pending) {
      navigation.navigate("SignUp");
      return;
    }
    setResending(true);
    setError("");
    setNotice("");
    try {
      await register(pending);
      setCode("");
      setNotice("Mandamos um novo código para o seu e-mail.");
    } catch (failure) {
      setError(failure.message);
    }
    setResending(false);
  };

  return (
    <EntryLayout title="Confirme seu e-mail" hint={`Digite o código de 6 números que enviamos para ${email}.`} onBack={goBack}>
      {notice ? <FormMessage kind="info">{notice}</FormMessage> : null}

      <Field
        label="Código"
        value={code}
        onChangeText={handleChange}
        error={error}
        placeholder="000000"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        editable={!loading}
        returnKeyType="go"
        onSubmitEditing={() => submit(code)}
      />

      <Button title="Confirmar" onPress={() => submit(code)} loading={loading} fullWidth />

      <Text style={styles.linkLine}>
        Não chegou?{" "}
        <Text style={styles.link} onPress={handleResend} accessibilityRole="link">
          {resending ? "Enviando..." : "Reenviar código"}
        </Text>
      </Text>
      <Text style={styles.linkLine}>
        E-mail errado?{" "}
        <Text style={styles.link} onPress={goBack} accessibilityRole="link">
          Voltar ao cadastro
        </Text>
      </Text>
    </EntryLayout>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    linkLine: { ...type.body, color: theme.colors.inkMuted, textAlign: "center", marginTop: 20 },
    link: { fontFamily: fonts.textSemi, color: theme.colors.brand },
  });
