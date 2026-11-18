import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, radius } from "../../theme/tokens";
import { appointmentStatus } from "../../booking/selection";

// Situação sempre em texto; o ponto de cor só acompanha.
export default function StatusBadge({ status, style }) {
  const { theme } = useTheme();
  const { label, tone } = appointmentStatus(status);
  const dot = { success: theme.colors.success, warning: theme.colors.caramelo, danger: theme.colors.danger, neutral: theme.colors.inkMuted }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.ground, borderColor: theme.colors.line }, style]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.text, { color: theme.colors.ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  text: { fontFamily: fonts.textSemi, fontSize: 12, lineHeight: 16 },
});
