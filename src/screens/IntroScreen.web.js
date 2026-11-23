import React from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity, useWindowDimensions } from "react-native";
import { useTheme } from "../utils/ThemeContext";
import { useBusiness, useTerms } from "../business/BusinessProvider";
import Button from "../components/ui/Button";
import BrandLogo from "../components/ui/BrandLogo";
import StoreBadges from "../components/entry/StoreBadges";
import { config } from "../config";
import { fonts, radius, type } from "../theme/tokens";

// Entrada da versão web: logo e nome da loja sobre a cor da loja, com os botões das lojas de aplicativos.
export default function IntroScreen({ navigation }) {
  const { theme } = useTheme();
  const terms = useTerms();
  const { business } = useBusiness();
  const hasStoreButtons = Boolean(config.appStoreUrl || config.playStoreUrl);
  const styles = getStyles(theme);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.container}>
      <View style={[styles.block, isMobile && styles.blockMobile]}>
        <BrandLogo style={styles.logo} />
        {business ? <Text style={styles.storeName}>{business.name}</Text> : null}
        <Text style={styles.title}>Agende em segundos</Text>
        <Text style={styles.subtitle}>
          Escolha {terms.professional.singular.toLowerCase()}, o serviço e o horário. Tudo pelo navegador.
        </Text>

        <View style={styles.buttons}>
          <Button title="Entrar" onPress={() => navigation.navigate("Login")} fullWidth />
          <Button title="Criar conta" variant="outline" onPress={() => navigation.navigate("SignUp")} fullWidth />
        </View>

        <StoreBadges style={styles.badges} />
        {hasStoreButtons ? <Text style={styles.appNote}>No app você recebe os avisos dos seus horários.</Text> : null}
      </View>
      <TouchableOpacity
        style={styles.footer}
        onPress={() => Linking.openURL(config.siteUrl).catch(() => {})}
        accessibilityRole="link"
      >
        <Text style={styles.footerText}>Feito com Agenda Flui</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: theme.colors.ground,
    },
    block: {
      width: "100%",
      maxWidth: 500,
      padding: 40,
      borderRadius: radius.xl,
      backgroundColor: theme.colors.brandTint,
    },
    blockMobile: { padding: 24 },
    logo: { width: 200, height: 48, marginBottom: 16, alignSelf: "flex-start" },
    storeName: { ...type.h2, fontFamily: fonts.display, color: theme.colors.ink, marginBottom: 24 },
    title: { ...type.title, fontSize: 32, lineHeight: 38, color: theme.colors.ink, marginBottom: 12 },
    subtitle: { ...type.body, fontFamily: fonts.text, color: theme.colors.inkMuted, marginBottom: 32 },
    buttons: { gap: 12 },
    badges: { marginTop: 24 },
    appNote: { ...type.small, color: theme.colors.inkMuted, textAlign: "center", marginTop: 12 },
    footer: { paddingVertical: 24 },
    footerText: { ...type.caption, color: theme.colors.inkMuted },
  });
