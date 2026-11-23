import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../utils/ThemeContext";
import Icon from "../../components/ui/Icon";
import { type } from "../../theme/tokens";

// Topo das telas da pilha da equipe: voltar e título.
export default function ScreenHeader({ title }) {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const styles = getStyles(theme);
  return (
    <SafeAreaView edges={["top"]} style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : null)}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Icon name="arrow-left" size={22} color={theme.colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    wrap: { backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
    row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 6 },
    back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    title: { ...type.bodyStrong, color: theme.colors.ink, flex: 1, marginLeft: 4 },
  });
