import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTheme } from "../utils/ThemeContext";
import { useBusiness } from "../business/BusinessProvider";
import { normalizeSlug } from "../business/storeLink";
import { fetchBusiness } from "../api/business";
import { api } from "../api";
import Button from "../components/ui/Button";
import { fonts, radius, type } from "../theme/tokens";

const INVALID_CODE_MESSAGE = "Digite o código como a loja mandou: letras, números e hífen.";

// Primeira tela sem link de loja: pede o código (o slug) e confere na API antes de seguir.
export default function CodigoLojaScreen() {
  const { theme } = useTheme();
  const { selectBusiness } = useBusiness();
  const styles = getStyles(theme);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const slug = normalizeSlug(code);
    if (!slug) {
      setError(INVALID_CODE_MESSAGE);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const business = await fetchBusiness(api.http, slug);
      await selectBusiness(slug, business);
    } catch (failure) {
      setError(failure.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Image
            source={theme.isDarkMode ? require("../../assets/logo-horizontal-negativo.png") : require("../../assets/logo-horizontal.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Qual é a sua loja?</Text>
          <Text style={styles.hint}>O código está no link que a loja mandou para você.</Text>

          <Text style={styles.label}>Código da loja</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={code}
            onChangeText={(text) => {
              setCode(text);
              if (error) setError("");
            }}
            placeholder="patas-e-pelos"
            placeholderTextColor={theme.colors.inkMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="go"
            onSubmitEditing={handleContinue}
            editable={!loading}
            accessibilityLabel="Código da loja"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Continuar" onPress={handleContinue} loading={loading} fullWidth style={styles.button} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.ground },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
    content: { width: "100%", maxWidth: 420, alignSelf: "center" },
    logo: { width: 200, height: 43, alignSelf: "flex-start", marginBottom: 40 },
    title: { ...type.title, color: theme.colors.ink, marginBottom: 8 },
    hint: { ...type.body, color: theme.colors.inkMuted, marginBottom: 32 },
    label: { ...type.small, fontFamily: fonts.textSemi, color: theme.colors.ink, marginBottom: 8 },
    input: {
      ...type.body,
      color: theme.colors.ink,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.line,
      borderRadius: radius.sm,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    inputError: { borderColor: theme.colors.danger },
    error: { ...type.small, color: theme.colors.danger, marginTop: 8 },
    button: { marginTop: 24 },
  });
