import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../utils/ThemeContext";
import { useBusiness } from "../../business/BusinessProvider";
import Icon from "../ui/Icon";
import { config } from "../../config";
import { fonts, radius, type } from "../../theme/tokens";

// Marca da loja no topo: o logo da conta; sem ele (ou se não carregar), o nome em Bricolage.
export function StoreMark() {
  const { theme } = useTheme();
  const { business } = useBusiness();
  const logoUrl = business && business.brand ? business.brand.logoUrl : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  if (logoUrl && !failed) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={markStyles.logo}
        resizeMode="contain"
        accessibilityLabel={business.name}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <Text style={[markStyles.name, { color: theme.colors.ink }]} numberOfLines={2}>
      {business ? business.name : "Agenda Flui"}
    </Text>
  );
}

const markStyles = StyleSheet.create({
  logo: { width: 180, height: 48, alignSelf: "flex-start" },
  name: { ...type.h2, fontFamily: fonts.display, alignSelf: "flex-start" },
});

// Moldura das telas de entrada: voltar, marca da loja, título e "Feito com Agenda Flui" no rodapé.
export default function EntryLayout({ title, hint, onBack, children }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {onBack ? (
              <TouchableOpacity
                style={styles.back}
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <Icon name="arrow-left" size={22} color={theme.colors.ink} />
              </TouchableOpacity>
            ) : null}
            <View style={styles.mark}>
              <StoreMark />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            {children}
          </View>
          <TouchableOpacity
            style={styles.footer}
            onPress={() => Linking.openURL(config.siteUrl).catch(() => {})}
            accessibilityRole="link"
          >
            <Text style={styles.footerText}>Feito com Agenda Flui</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: theme.colors.ground },
    scroll: { flexGrow: 1, justifyContent: "space-between", padding: 24 },
    content: { width: "100%", maxWidth: 420, alignSelf: "center", paddingTop: 8 },
    back: {
      width: 44,
      height: 44,
      marginLeft: -10,
      marginBottom: 8,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.pill,
    },
    mark: { marginBottom: 32 },
    title: { ...type.title, color: theme.colors.ink, marginBottom: 8 },
    hint: { ...type.body, color: theme.colors.inkMuted, marginBottom: 24 },
    footer: { alignSelf: "center", paddingVertical: 24 },
    footerText: { ...type.caption, color: theme.colors.inkMuted },
  });
