import React from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from "react-native";
import Button from "./ui/Button";
import Icon from "./ui/Icon";
import FormMessage from "./entry/FormMessage";
import { useTheme } from "../utils/ThemeContext";
import { formatCents, addressLine, orderStatusLabel } from "../store/order";
import { fonts, radius, type } from "../theme/tokens";

function Row({ label, value, strong, c }) {
  return (
    <View style={styles.row}>
      <Text style={[strong ? styles.strongLabel : styles.label, { color: strong ? c.ink : c.inkMuted }]}>{label}</Text>
      <Text style={[strong ? styles.strongValue : styles.value, { color: c.ink }]}>{value}</Text>
    </View>
  );
}

// Resumo do pedido: itens, entrega, frete e total. Antes do pedido os valores são estimativas; depois do pedido
// a janela mostra o que o servidor devolveu (`order`) e leva ao pagamento.
export default function FinalizarCompraModal({
  visible,
  items,
  delivery, // { method: 'PICKUP', instructions } | { method: 'SHIPPING', address, option }
  itemsCents,
  order, // pedido devolvido pelo servidor, ou null
  sending,
  paying,
  error, // { message, retry: boolean, openOrders: boolean } | null
  payError,
  onConfirm,
  onClose,
  onPay,
  onViewOrder,
  onViewOrders,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const shippingCents = delivery && delivery.method === "SHIPPING" && delivery.option ? delivery.option.priceCents : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={sending || paying ? undefined : onClose}>
      <TouchableWithoutFeedback onPress={sending || paying || order ? undefined : onClose}>
        <View style={[styles.backdrop, { backgroundColor: c.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: c.ground, borderColor: c.line }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: c.ink }]}>{order ? `Pedido ${order.number} feito` : "Resumo do pedido"}</Text>
                {!order ? (
                  <TouchableOpacity onPress={onClose} disabled={sending} accessibilityRole="button" accessibilityLabel="Fechar" style={styles.close}>
                    <Icon name="x" size={22} color={c.ink} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {(order ? order.items : items).map((item) =>
                  order ? (
                    <Row key={item.id} c={c} label={`${item.quantity}x ${item.name}`} value={formatCents(item.totalCents)} />
                  ) : (
                    <Row key={item.productId} c={c} label={`${item.quantity}x ${item.name}`} value={formatCents(item.unitPriceCents * item.quantity)} />
                  )
                )}

                <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
                  {order ? (
                    order.deliveryMethod === "SHIPPING" && order.address ? (
                      <>
                        <Text style={[styles.boxTitle, { color: c.ink }]}>Receber em casa{order.shipping ? ` · ${order.shipping.serviceName}` : ""}</Text>
                        <Text style={[styles.boxText, { color: c.inkMuted }]}>{addressLine(order.address)}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.boxTitle, { color: c.ink }]}>Retirar na loja</Text>
                        {order.pickupInstructions ? <Text style={[styles.boxText, { color: c.inkMuted }]}>{order.pickupInstructions}</Text> : null}
                      </>
                    )
                  ) : delivery && delivery.method === "SHIPPING" ? (
                    <>
                      <Text style={[styles.boxTitle, { color: c.ink }]}>Receber em casa{delivery.option ? ` · ${delivery.option.name}` : ""}</Text>
                      <Text style={[styles.boxText, { color: c.inkMuted }]}>{addressLine(delivery.address)}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.boxTitle, { color: c.ink }]}>Retirar na loja</Text>
                      {delivery && delivery.instructions ? <Text style={[styles.boxText, { color: c.inkMuted }]}>{delivery.instructions}</Text> : null}
                    </>
                  )}
                </View>

                {order ? (
                  <>
                    <Row c={c} label="Produtos" value={formatCents(order.itemsCents)} />
                    <Row c={c} label="Frete" value={order.shippingCents > 0 ? formatCents(order.shippingCents) : "Grátis"} />
                    <Row c={c} strong label="Total" value={formatCents(order.totalCents)} />
                    <Text style={[styles.note, { color: c.inkMuted }]}>
                      {orderStatusLabel(order)}. Pague até {order.expiresLabel} para garantir os produtos.
                    </Text>
                  </>
                ) : (
                  <>
                    <Row c={c} label="Produtos" value={formatCents(itemsCents)} />
                    {delivery && delivery.method === "SHIPPING" ? <Row c={c} label="Frete" value={formatCents(shippingCents)} /> : null}
                    <Row c={c} strong label="Total estimado" value={formatCents(itemsCents + shippingCents)} />
                    <Text style={[styles.note, { color: c.inkMuted }]}>O valor final é confirmado quando você faz o pedido.</Text>
                  </>
                )}

                {error ? <View style={{ marginTop: 12 }}><FormMessage kind="error">{error.message}</FormMessage></View> : null}
                {payError ? <View style={{ marginTop: 12 }}><FormMessage kind="error">{payError}</FormMessage></View> : null}
              </ScrollView>

              <View style={styles.footer}>
                {order ? (
                  <>
                    {order.canPay ? <Button title="Pagar agora" onPress={onPay} loading={paying} fullWidth size="lg" /> : null}
                    <Button title="Ver pedido" variant="secondary" onPress={onViewOrder} disabled={paying} fullWidth style={{ marginTop: 10 }} />
                  </>
                ) : error && error.openOrders ? (
                  <>
                    <Button title="Ver meus pedidos" onPress={onViewOrders} fullWidth size="lg" />
                    <Button title="Voltar" variant="ghost" onPress={onClose} fullWidth style={{ marginTop: 6 }} />
                  </>
                ) : (
                  <Button title={error && error.retry ? "Tentar de novo" : "Fazer pedido"} onPress={onConfirm} loading={sending} fullWidth size="lg" />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: { maxHeight: "90%", width: "100%", maxWidth: 800, alignSelf: "center", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 8 },
  title: { ...type.h2, flex: 1 },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  label: { ...type.small, flex: 1, marginRight: 12 },
  value: { ...type.small, fontFamily: fonts.textSemi, fontVariant: ["tabular-nums"] },
  strongLabel: { fontFamily: fonts.textBold, fontSize: 17 },
  strongValue: { fontFamily: fonts.display, fontSize: 20, fontVariant: ["tabular-nums"] },
  box: { borderWidth: 1, borderRadius: radius.lg, padding: 14, marginVertical: 12 },
  boxTitle: { fontFamily: fonts.textBold, fontSize: 15 },
  boxText: { ...type.small, marginTop: 4 },
  note: { ...type.small, marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
});
