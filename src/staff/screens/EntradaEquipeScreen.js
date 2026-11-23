import React, { useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import EntryLayout from "../../components/entry/EntryLayout";
import Field from "../../components/entry/Field";
import FormMessage from "../../components/entry/FormMessage";
import Button from "../../components/ui/Button";
import { useStaffSession } from "../StaffSessionProvider";
import { validateEmail } from "../../utils/helpers";
import { useTheme } from "../../utils/ThemeContext";
import { config } from "../../config";
import { fonts, type } from "../../theme/tokens";

// Entrada da equipe: e-mail e senha. A loja vem na resposta do login e a marca dela aparece depois.
export default function EntradaEquipeScreen({ navigation }) {
  const { theme } = useTheme();
  const { signIn } = useStaffSession();
  const styles = getStyles(theme);

  const passwordRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
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
      await signIn(email, password);
      // A pilha raiz troca sozinha para a área da equipe quando o modo é gravado.
    } catch (error) {
      setFailure(error.message);
      setLoading(false);
    }
  };

  const forgot = () => {
    WebBrowser.openBrowserAsync(`${config.painelUrl}/esqueci-a-senha`).catch(() => {});
  };

  return (
    <EntryLayout title="Entre na equipe" hint="Use o e-mail e a senha que você usa no painel." onBack={navigation.canGoBack() ? goBack : undefined}>
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
        <Text style={styles.link} onPress={forgot} accessibilityRole="link">
          Esqueci a senha
        </Text>
      </View>
    </EntryLayout>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    links: { marginTop: 24, alignItems: "center" },
    link: { ...type.small, fontFamily: fonts.textSemi, color: theme.colors.brandText, textDecorationLine: "underline" },
  });
