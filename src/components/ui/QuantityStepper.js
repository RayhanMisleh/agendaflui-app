import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "./Icon";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, radius } from "../../theme/tokens";

// Quantidade de 1 até `max` (o máximo por pedido que a API informa). Com `min = 0`, o botão de menos zera.
export default function QuantityStepper({ value, max, min = 1, onChange, disabled = false, style }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const canLess = !disabled && value > min;
  const canMore = !disabled && value < max;
  const button = (name, enabled, next, label) => (
    <TouchableOpacity
      onPress={() => enabled && onChange(next)}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, { borderColor: c.line, backgroundColor: c.surface, opacity: enabled ? 1 : 0.4 }]}
    >
      <Icon name={name} size={18} color={c.ink} />
    </TouchableOpacity>
  );
  return (
    <View style={[styles.row, style]}>
      {button("minus", canLess, value - 1, "Diminuir quantidade")}
      <Text style={[styles.value, { color: c.ink }]} accessibilityLabel={`Quantidade ${value}`}>{value}</Text>
      {button("plus", canMore, value + 1, "Aumentar quantidade")}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  button: { width: 36, height: 36, borderRadius: radius.pill, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  value: { fontFamily: fonts.textBold, fontSize: 16, minWidth: 36, textAlign: "center", fontVariant: ["tabular-nums"] },
});
