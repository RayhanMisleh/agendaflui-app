import React, { useRef, useState } from "react";
import { View, Text, Linking, StyleSheet } from "react-native";
import { login } from "../api/auth";
import { useAuth } from "../components/AuthProvider";
import EntryLayout from "../components/entry/EntryLayout";
import Field from "../components/entry/Field";
import FormMessage from "../components/entry/FormMessage";
import Button from "../components/ui/Button";
import { validateEmail } from "../utils/helpers";
import { useTheme } from "../utils/ThemeContext";
import { config } from "../config";
import { fonts, type } from "../theme/tokens";

export default function LoginScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { startSession } = useAuth();
  const styles = getStyles(theme);
  const notice = route && route.params ? route.params.notice : null;

  const passwordRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Navigator");
  };

  const handleLogin = async () => {
    if (loading) return;
    const next = {};
    if (!email.trim()) next.email = "Digite seu e-mail.";
    else if (!validateEmail(email.trim())) next.email = "Confira o e-mail. Falta algo?";
    if (!password) next.password = "Digite sua senha.";
    setErrors(next);
    setFailure("");
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const session = await login({ email, password });
      await startSession(session);
      navigation.navigate("Navigator");
    } catch (error) {
      setFailure(error.message);
      setLoading(false);
    }
  };

  return (
    <EntryLayout title="Entre na sua conta" hint="Use o e-mail e a senha do seu cadastro." onBack={goBack}>
      {notice ? <FormMessage kind="info">{notice}</FormMessage> : null}

      <Field
        label="E-mail"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors({ ...errors, email: undefined });
        }}
        error={errors.email}
        placeholder="voce@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
        editable={!loading}
      />
      <Field
        ref={passwordRef}
        label="Senha"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors({ ...errors, password: undefined });
        }}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
        editable={!loading}
      />

      <FormMessage kind="error">{failure}</FormMessage>

      <Button title="Entrar" onPress={handleLogin} loading={loading} fullWidth />

      <View style={styles.links}>
        <Text style={styles.linkLine}>
          Esqueceu a senha?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("RecuperarSenha")} accessibilityRole="link">
            Trocar senha
          </Text>
        </Text>
        <Text style={styles.linkLine}>
          Ainda não tem conta?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("SignUp")} accessibilityRole="link">
            Criar conta
          </Text>
        </Text>
      </View>

      <Text style={styles.legal}>
        Ao continuar, você aceita os{" "}
        <Text style={styles.legalLink} onPress={() => Linking.openURL(config.termsUrl).catch(() => {})}>
          Termos de uso
        </Text>{" "}
        e a{" "}
        <Text style={styles.legalLink} onPress={() => Linking.openURL(config.privacyUrl).catch(() => {})}>
          Política de privacidade
        </Text>
        .
      </Text>
    </EntryLayout>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    links: { marginTop: 24, gap: 12 },
    linkLine: { ...type.body, color: theme.colors.inkMuted, textAlign: "center" },
    link: { fontFamily: fonts.textSemi, color: theme.colors.brand },
    legal: { ...type.caption, color: theme.colors.inkMuted, textAlign: "center", marginTop: 24 },
    legalLink: { color: theme.colors.brand, textDecorationLine: "underline" },
  });
