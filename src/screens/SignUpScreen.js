import React, { useRef, useState } from "react";
import { Text, StyleSheet } from "react-native";
import { register } from "../api/auth";
import { pendingRegistration } from "../auth/pendingRegistration";
import EntryLayout from "../components/entry/EntryLayout";
import Field from "../components/entry/Field";
import FormMessage from "../components/entry/FormMessage";
import Button from "../components/ui/Button";
import { validateEmail, validatePassword } from "../utils/helpers";
import { useTheme } from "../utils/ThemeContext";
import { fonts, type } from "../theme/tokens";

export default function SignUpScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (field, setter) => (text) => {
    setter(text);
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Login");
  };

  const handleSignUp = async () => {
    if (loading) return;
    const next = {};
    if (name.trim().length < 2) next.name = "Digite seu nome.";
    if (!email.trim()) next.email = "Digite seu e-mail.";
    else if (!validateEmail(email.trim())) next.email = "Confira o e-mail. Falta algo?";
    if (phone.trim()) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 13) next.phone = "Confira o telefone, com DDD.";
    }
    if (!validatePassword(password)) next.password = "Use de 10 a 200 caracteres na senha.";
    setErrors(next);
    setFailure("");
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      await register({ name, email, phone, password });
      pendingRegistration.set({ name, email, phone, password });
      setLoading(false);
      navigation.navigate("NewUserEmailCode", { email: email.trim().toLowerCase() });
    } catch (error) {
      const fields = error.fields || {};
      setErrors({ name: fields.name, email: fields.email, phone: fields.phone, password: fields.password });
      setFailure(Object.keys(fields).length > 0 ? "" : error.message);
      setLoading(false);
    }
  };

  return (
    <EntryLayout title="Crie sua conta" hint="Mandamos um código para o seu e-mail confirmar." onBack={goBack}>
      <Field
        label="Nome"
        value={name}
        onChangeText={change("name", setName)}
        error={errors.name}
        placeholder="Como você se chama"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => emailRef.current && emailRef.current.focus()}
        editable={!loading}
      />
      <Field
        ref={emailRef}
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
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => phoneRef.current && phoneRef.current.focus()}
        editable={!loading}
      />
      <Field
        ref={phoneRef}
        label="Telefone (opcional)"
        value={phone}
        onChangeText={change("phone", setPhone)}
        error={errors.phone}
        placeholder="(11) 91234-5678"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current && passwordRef.current.focus()}
        editable={!loading}
      />
      <Field
        ref={passwordRef}
        label="Senha"
        hint="Mínimo de 10 caracteres."
        value={password}
        onChangeText={change("password", setPassword)}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleSignUp}
        editable={!loading}
      />

      <FormMessage kind="error">{failure}</FormMessage>

      <Button title="Criar conta" onPress={handleSignUp} loading={loading} fullWidth />

      <Text style={styles.linkLine}>
        Já tem conta?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Login")} accessibilityRole="link">
          Entrar
        </Text>
      </Text>
    </EntryLayout>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    linkLine: { ...type.body, color: theme.colors.inkMuted, textAlign: "center", marginTop: 24 },
    link: { fontFamily: fonts.textSemi, color: theme.colors.brand },
  });
