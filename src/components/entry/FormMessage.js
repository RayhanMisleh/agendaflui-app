import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import Icon from "../ui/Icon";
import { radius, type } from "../../theme/tokens";

// Aviso do formulário: erro (vermelho) ou informação (bolha). O ícone e o texto dizem o que é, não só a cor.
export default function FormMessage({ kind = "info", children }) {
  const { theme } = useTheme();
  if (!children) return null;
  const isError = kind === "error";
  const color = isError ? theme.colors.danger : theme.colors.brandStrong;
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: isError ? theme.colors.carameloTint : theme.colors.brandTint, borderColor: theme.colors.line },
      ]}
      accessibilityRole={isError ? "alert" : undefined}
    >
      <Icon name={isError ? "alert-circle" : "info"} size={18} color={color} />
      <Text style={[styles.text, { color: theme.colors.ink }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: 16,
  },
  text: { ...type.small, flex: 1 },
});
