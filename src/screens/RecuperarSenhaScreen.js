import React, { useRef, useState } from "react";
import { Text, StyleSheet } from "react-native";
import { forgotPassword, resetPassword } from "../api/auth";
import EntryLayout from "../components/entry/EntryLayout";
import Field from "../components/entry/Field";
import FormMessage from "../components/entry/FormMessage";
import Button from "../components/ui/Button";
import { validateEmail, validateCode, validatePassword } from "../utils/helpers";
import { useTheme } from "../utils/ThemeContext";
import { fonts, type } from "../theme/tokens";

const SENT_MESSAGE = "Se houver uma conta com esse e-mail, mandamos um código.";
const DONE_MESSAGE = "Senha trocada. Entre com a senha nova.";

// Dois passos na mesma tela: e-mail (pede o código) e código + senha nova.
export default function RecuperarSenhaScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (field, setter) => (text) => {
    setter(text);
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const goBack = () => {
    if (step === "reset") {
      setStep("email");
      setErrors({});
      setFailure("");
      setNotice("");
    } else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Login");
  };

  const requestCode = async () => {
    if (loading) return;
    const next = {};
    if (!email.trim()) next.email = "Digite seu e-mail.";
    else if (!validateEmail(email.trim())) next.email = "Confira o e-mail. Falta algo?";
    setErrors(next);
    setFailure("");
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("reset");
      setCode("");
      setNotice(SENT_MESSAGE);
    } catch (error) {
      setFailure(error.message);
    }
    setLoading(false);
  };

  const saveNewPassword = async () => {
    if (loading) return;
    const next = {};
    if (!validateCode(code)) next.code = "Digite os 6 números do código.";
    if (!validatePassword(password)) next.password = "Use de 10 a 200 caracteres na senha.";
    else if (confirm !== password) next.confirm = "As senhas não são iguais.";
    setErrors(next);
    setFailure("");
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await resetPassword({ email, code, password });
      navigation.navigate("Login", { notice: DONE_MESSAGE });
    } catch (error) {
      const fields = error.fields || {};
      setErrors({ code: fields.code, password: fields.password });
      setFailure(Object.keys(fields).length > 0 ? "" : error.message);
    }
    setLoading(false);
  };

  if (step === "email") {
    return (
      <EntryLayout title="Troque sua senha" hint="Digite seu e-mail. Mandamos um código para você criar uma senha nova." onBack={goBack}>
        <Field
          label="E-mail"
          value={email}
          onChangeText={change("email", setEmail)}
          error={errors.email}
          placeholder="voce@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="go"
          onSubmitEditing={requestCode}
          editable={!loading}
        />
        <FormMessage kind="error">{failure}</FormMessage>
        <Button title="Enviar código" onPress={requestCode} loading={loading} fullWidth />
        <Text style={styles.linkLine}>
          Lembrou a senha?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("Login")} accessibilityRole="link">
            Entrar
          </Text>
        </Text>
      </EntryLayout>
    );
  }

  return (
    <EntryLayout title="Crie a senha nova" hint={`Digite o código que enviamos para ${email.trim().toLowerCase()}.`} onBack={goBack}>
      {notice ? <FormMessage kind="info">{notice}</FormMessage> : null}
      <Field
        label="Código"
        value={code}
        onChangeText={(text) => change("code", setCode)(text.replace(/\D/g, "").slice(0, 6))}
        error={errors.code}
        placeholder="000000"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
        editable={!loading}
      />
      <Field
        ref={passwordRef}
        label="Senha nova"
        hint="Mínimo de 10 caracteres."
        value={password}
        onChangeText={change("password", setPassword)}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmRef.current && confirmRef.current.focus()}
        editable={!loading}
      />
      <Field
        ref={confirmRef}
        label="Repita a senha nova"
        value={confirm}
        onChangeText={change("confirm", setConfirm)}
        error={errors.confirm}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={saveNewPassword}
        editable={!loading}
      />
      <FormMessage kind="error">{failure}</FormMessage>
      <Button title="Trocar senha" onPress={saveNewPassword} loading={loading} fullWidth />
      <Text style={styles.linkLine}>
        Não chegou?{" "}
        <Text style={styles.link} onPress={requestCode} accessibilityRole="link">
          Pedir outro código
        </Text>
      </Text>
    </EntryLayout>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    linkLine: { ...type.body, color: theme.colors.inkMuted, textAlign: "center", marginTop: 24 },
    link: { fontFamily: fonts.textSemi, color: theme.colors.brandText },
  });
