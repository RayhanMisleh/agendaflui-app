import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, StyleSheet, TouchableWithoutFeedback } from "react-native";
import Button from "./ui/Button";
import Icon from "./ui/Icon";
import QuantityStepper from "./ui/QuantityStepper";
import { useTheme } from "../utils/ThemeContext";
import { useCart } from "../store/useCart";
import { formatCents } from "../utils/money";
import { fonts, radius, type } from "../theme/tokens";

// Carrinho rápido, em folha, aberto pelo cabeçalho da Loja. O total é uma estimativa: o pedido devolve o valor de verdade.
export default function CarrinhoComponent({ visible, onClose, onGoToCart }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { cart, items, totalCents } = useCart();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: c.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: c.ground, borderColor: c.line }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: c.ink }]}>Seu carrinho</Text>
                <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar" style={styles.close}>
                  <Icon name="x" size={22} color={c.ink} />
                </TouchableOpacity>
              </View>

              {items.length === 0 ? (
                <View style={styles.empty}>
                  <Icon name="shopping-bag" size={32} color={c.inkMuted} />
                  <Text style={[styles.emptyText, { color: c.inkMuted }]}>Seu carrinho está vazio.</Text>
                </View>
              ) : (
                <>
                  <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                    {items.map((item) => (
                      <View key={item.productId} style={[styles.row, { backgroundColor: c.surface, borderColor: c.line }]}>
                        <View style={[styles.thumb, { backgroundColor: c.brandTint }]}>
                          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} resizeMode="cover" /> : <Icon name="image" size={20} color={c.brand} />}
                        </View>
                        <View style={styles.info}>
                          <Text style={[styles.name, { color: c.ink }]} numberOfLines={2}>{item.name}</Text>
                          <Text style={[styles.price, { color: c.inkMuted }]}>{formatCents(item.unitPriceCents)}</Text>
                          <QuantityStepper
                            value={item.quantity}
                            min={0}
                            max={item.maxQuantity}
                            onChange={(next) => cart.setQuantity(item.productId, next)}
                            style={{ marginTop: 8 }}
                          />
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  <View style={styles.footer}>
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: c.inkMuted }]}>Total estimado</Text>
                      <Text style={[styles.total, { color: c.ink }]}>{formatCents(totalCents)}</Text>
                    </View>
                    <Button title="Ver carrinho" onPress={onGoToCart} fullWidth size="lg" />
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: { maxHeight: "85%", width: "100%", maxWidth: 800, alignSelf: "center", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 8 },
  title: { ...type.h2 },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { ...type.body, marginTop: 12 },
  list: { paddingHorizontal: 20 },
  row: { flexDirection: "row", borderWidth: 1, borderRadius: radius.lg, padding: 12, marginBottom: 10 },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  thumbImage: { width: "100%", height: "100%" },
  info: { flex: 1, marginLeft: 12 },
  name: { fontFamily: fonts.textSemi, fontSize: 15, lineHeight: 20 },
  price: { ...type.small, marginTop: 2 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { ...type.small },
  total: { fontFamily: fonts.display, fontSize: 22, fontVariant: ["tabular-nums"] },
});
