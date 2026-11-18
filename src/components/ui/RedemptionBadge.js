import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, radius } from "../../theme/tokens";
import { redemptionStatusLabel, redemptionStatusTone } from "../../loyalty/prizes";

// Situação do resgate: texto sempre; o ponto de cor só acompanha.
export default function RedemptionBadge({ status, style }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const dot = { success: c.success, warning: c.caramelo, neutral: c.inkMuted }[redemptionStatusTone(status)];
  return (
    <View style={[styles.badge, { backgroundColor: c.ground, borderColor: c.line }, style]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.text, { color: c.ink }]}>{redemptionStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  text: { fontFamily: fonts.textSemi, fontSize: 12, lineHeight: 16 },
});
