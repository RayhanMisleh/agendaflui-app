import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../utils/ThemeContext";
import { formatCents } from "../utils/money";
import { fonts } from "../theme/tokens";

// Preço de um produto: `finalPriceCents` em destaque, com o preço de tabela riscado quando há promoção.
export default function ProductPrice({ product, large = false }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const promo = product.promoPriceCents !== null && product.promoPriceCents !== undefined && product.finalPriceCents < product.priceCents;
  return (
    <View>
      {promo ? (
        <Text style={[styles.old, { color: c.inkMuted }]}>{formatCents(product.priceCents)}</Text>
      ) : null}
      <Text style={[large ? styles.large : styles.price, { color: c.ink }]}>{formatCents(product.finalPriceCents)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  old: { fontFamily: fonts.textMedium, fontSize: 12, lineHeight: 16, textDecorationLine: "line-through" },
  price: { fontFamily: fonts.textBold, fontSize: 17, lineHeight: 22, fontVariant: ["tabular-nums"] },
  large: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, fontVariant: ["tabular-nums"] },
});
