import React from "react";
import { View, StyleSheet } from "react-native";
import PointsDisplay from "../../components/ui/PointsDisplay";
import { useTheme } from "../../utils/ThemeContext";
import { pointsLabel, pointsWord } from "../../business/terms";
import { radius } from "../../theme/tokens";

// Saldo de pontos no topo do Agendar. `balance` vem de GET /v1/loyalty/me (null: ainda não chegou).
const SaldoPontos = ({ balance, terms }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  if (balance === null || balance === undefined) return null;
  return (
    <View
      style={[styles.box, { backgroundColor: c.carameloTint, borderColor: c.line }]}
      accessible
      accessibilityLabel={`Seu saldo: ${pointsLabel(balance, terms)}`}
    >
      <PointsDisplay amount={balance} label={pointsWord(balance, terms)} size="lg" />
    </View>
  );
};

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
});

export default SaldoPontos;
