import React from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import Button from "../components/ui/Button";
import { radius, type } from "../theme/tokens";
import { ROUTES } from "../navigation/routes";

// Primeira tela sem loja escolhida: a Agenda Flui (a loja ainda não existe aqui) e a escolha do modo.
export default function BoasVindasScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.block}>
            <Image
              source={theme.isDarkMode ? require("../../assets/logo-horizontal-negativo.png") : require("../../assets/logo-horizontal.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Agenda Flui"
            />
            <Text style={styles.title} accessibilityRole="header">
              Como você usa o app?
            </Text>
            <Text style={styles.hint}>Escolha uma opção para continuar.</Text>
            <Button title="Sou cliente" onPress={() => navigation.navigate(ROUTES.CodigoLoja)} fullWidth />
            <Button
              title="Sou da equipe"
              variant="outline"
              onPress={() => navigation.navigate(ROUTES.EntradaEquipe)}
              fullWidth
              style={styles.second}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.ground },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
    content: { width: "100%", maxWidth: 440, alignSelf: "center" },
    block: { padding: 28, borderRadius: radius.xl, backgroundColor: theme.colors.brandTint },
    logo: { width: 200, height: 43, alignSelf: "flex-start", marginBottom: 32 },
    title: { ...type.title, color: theme.colors.ink, marginBottom: 8 },
    hint: { ...type.body, color: theme.colors.inkMuted, marginBottom: 32 },
    second: { marginTop: 12 },
  });
