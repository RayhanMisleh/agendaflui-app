import React from "react";
import { View, Text, StyleSheet, Image, useWindowDimensions } from "react-native";
import { useTheme } from "../utils/ThemeContext";
import { useTerms } from "../business/BusinessProvider";
import Button from "../components/ui/Button";
import { fonts, radius, type } from "../theme/tokens";

// Entrada da versão web: marca Agenda Flui sobre o fundo da marca, com um bloco de destaque.
export default function IntroScreen({ navigation }) {
  const { theme } = useTheme();
  const terms = useTerms();
  const styles = getStyles(theme);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.container}>
      <View style={[styles.block, isMobile && styles.blockMobile]}>
        <Image
          source={theme.isDarkMode ? require("../../assets/logo-horizontal-negativo.png") : require("../../assets/logo-horizontal.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Agende em segundos</Text>
        <Text style={styles.subtitle}>
          Escolha {terms.professional.singular.toLowerCase()}, o serviço e o horário. Tudo pelo navegador.
        </Text>

        <View style={styles.buttons}>
          <Button title="Entrar" onPress={() => navigation.navigate("Login")} fullWidth />
          <Button title="Criar conta" variant="outline" onPress={() => navigation.navigate("SignUp")} fullWidth />
        </View>
      </View>
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
    logo: { width: 200, height: 43, marginBottom: 32 },
    title: { ...type.title, fontSize: 32, lineHeight: 38, color: theme.colors.ink, marginBottom: 12 },
    subtitle: { ...type.body, fontFamily: fonts.text, color: theme.colors.inkMuted, marginBottom: 32 },
    buttons: { gap: 12 },
  });
