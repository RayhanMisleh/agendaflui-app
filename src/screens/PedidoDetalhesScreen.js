import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import Skeleton from "../components/ui/Skeleton";
import OrderStatusBadge from "../components/ui/OrderStatusBadge";
import FormMessage from "../components/entry/FormMessage";
import ConfirmModal from "../components/ConfirmModal";
import { useBusiness } from "../business/BusinessProvider";
import { useTheme } from "../utils/ThemeContext";
import { getOrder, cancelOrder, startCheckout } from "../api/store";
import { formatCents, addressLine, checkoutReturnUrl, shippingDaysLabel } from "../store/order";
import { openCheckout } from "../store/checkout";
import { fonts, radius, type } from "../theme/tokens";

function Row({ label, value, strong, c }) {
  return (
    <View style={styles.row}>
      <Text style={[strong ? styles.strongLabel : styles.label, { color: strong ? c.ink : c.inkMuted }]}>{label}</Text>
      <Text style={[strong ? styles.strongValue : styles.value, { color: c.ink }]}>{value}</Text>
    </View>
  );
}

const PedidoDetalhesScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { theme } = useTheme();
  const c = theme.colors;
  const { slug } = useBusiness();
  const [order, setOrder] = useState(null);
  const [failed, setFailed] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState("");
  const busy = useRef(false);

  const load = useCallback(
    async ({ pull = false } = {}) => {
      if (pull) setRefreshing(true);
      setFailed(null);
      try {
        setOrder(await getOrder(orderId));
      } catch (error) {
        setFailed(error.message);
      } finally {
        setRefreshing(false);
      }
    },
    [orderId]
  );

  // Busca ao abrir e a cada volta à tela: depois do pagamento o pedido pode ter mudado de situação.
  useEffect(() => {
    setOrder(null);
    load();
    const unsubscribe = navigation.addListener("focus", () => load({ pull: true }));
    return unsubscribe;
  }, [orderId, slug, load, navigation]);

  const back = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("MeusPedidosList");
  };

  const pay = async () => {
    if (busy.current || !order) return;
    busy.current = true;
    setPaying(true);
    setMessage("");
    try {
      const origin = Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : null;
      const checkout = await startCheckout(order.id, checkoutReturnUrl({ platform: Platform.OS, origin, slug, orderId: order.id }));
      await openCheckout(checkout.checkoutUrl);
      if (Platform.OS !== "web") await load({ pull: true }); // o navegador fechou: busca de novo
    } catch (error) {
      setMessage(error.message);
    } finally {
      busy.current = false;
      setPaying(false);
    }
  };

  const cancel = async () => {
    if (busy.current || !order) return;
    busy.current = true;
    setCanceling(true);
    setMessage("");
    try {
      setOrder(await cancelOrder(order.id, null));
      setConfirmCancel(false);
    } catch (error) {
      setConfirmCancel(false);
      setMessage(error.message);
      load({ pull: true });
    } finally {
      busy.current = false;
      setCanceling(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.ground }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={back} accessibilityRole="button" accessibilityLabel="Voltar">
          <Icon name="arrow-left" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.ink }]}>{order ? `Pedido ${order.number}` : "Pedido"}</Text>
        <View style={styles.back} />
      </View>

      {!order && failed ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.ink }]}>Não deu para abrir o pedido</Text>
          <Text style={[styles.emptyText, { color: c.inkMuted }]}>{failed}</Text>
          <Button title="Tentar de novo" onPress={() => load()} style={{ marginTop: 16 }} />
        </View>
      ) : !order ? (
        <View style={{ padding: 20 }}>
          <Skeleton width="100%" height={160} style={{ borderRadius: radius.lg }} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} tintColor={c.brand} colors={[c.brand]} />}
        >
          {message ? <FormMessage kind="error">{message}</FormMessage> : null}

          <OrderStatusBadge order={order} />
          <Text style={[styles.small, { color: c.inkMuted, marginTop: 8 }]}>Feito em {order.createdLabel}</Text>
          {order.status === "AWAITING_PAYMENT" ? <Text style={[styles.small, { color: c.ink, marginTop: 4 }]}>Pague até {order.expiresLabel}.</Text> : null}
          {order.paidLabel ? <Text style={[styles.small, { color: c.inkMuted, marginTop: 4 }]}>Pago em {order.paidLabel}.</Text> : null}
          {order.canceledLabel ? <Text style={[styles.small, { color: c.inkMuted, marginTop: 4 }]}>Cancelado em {order.canceledLabel}.</Text> : null}
          {order.cancelReason ? <Text style={[styles.small, { color: c.inkMuted, marginTop: 4 }]}>{order.cancelReason}</Text> : null}

          <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Text style={[styles.boxTitle, { color: c.ink }]}>Itens</Text>
            {order.items.map((item) => (
              <Row key={item.id} c={c} label={`${item.quantity}x ${item.name}`} value={formatCents(item.totalCents)} />
            ))}
            <View style={[styles.line, { backgroundColor: c.line }]} />
            <Row c={c} label="Produtos" value={formatCents(order.itemsCents)} />
            {order.deliveryMethod === "SHIPPING" ? <Row c={c} label="Frete" value={order.shippingCents > 0 ? formatCents(order.shippingCents) : "Grátis"} /> : null}
            <Row c={c} strong label="Total" value={formatCents(order.totalCents)} />
          </View>

          {order.deliveryMethod === "SHIPPING" ? (
            <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Text style={[styles.boxTitle, { color: c.ink }]}>Entrega em casa</Text>
              {order.shipping ? (
                <Text style={[styles.text, { color: c.ink }]}>{order.shipping.serviceName} · {shippingDaysLabel(order.shipping.days)}</Text>
              ) : null}
              {order.address ? <Text style={[styles.text, { color: c.inkMuted }]}>{order.address.recipientName} · {addressLine(order.address)}</Text> : null}
              {order.shipping && order.shipping.trackingCode ? (
                <Text style={[styles.text, { color: c.ink }]}>Código de rastreio: {order.shipping.trackingCode}</Text>
              ) : null}
            </View>
          ) : order.deliveryMethod === "PICKUP" ? (
            <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Text style={[styles.boxTitle, { color: c.ink }]}>Retirar na loja</Text>
              {order.pickupInstructions ? <Text style={[styles.text, { color: c.inkMuted }]}>{order.pickupInstructions}</Text> : null}
            </View>
          ) : null}

          {order.customerNote ? (
            <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Text style={[styles.boxTitle, { color: c.ink }]}>Sua observação</Text>
              <Text style={[styles.text, { color: c.inkMuted }]}>{order.customerNote}</Text>
            </View>
          ) : null}

          {order.canPay ? <Button title="Pagar agora" onPress={pay} loading={paying} disabled={canceling} fullWidth size="lg" style={{ marginTop: 8 }} /> : null}
          {order.canCancel ? (
            <Button title="Cancelar pedido" variant="outline" onPress={() => setConfirmCancel(true)} disabled={paying} fullWidth style={{ marginTop: 10, borderColor: c.danger }} textStyle={{ color: c.danger }} />
          ) : null}
        </ScrollView>
      )}

      <ConfirmModal
        visible={confirmCancel}
        title="Cancelar pedido"
        message="Os produtos voltam para a loja e você não paga nada. Não dá para desfazer."
        confirmText="Cancelar pedido"
        cancelText="Voltar"
        destructive
        iconName="x-circle"
        loading={canceling}
        onConfirm={cancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...type.h2 },
  scroll: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  small: { ...type.small },
  text: { ...type.small, marginTop: 6 },
  box: { borderWidth: 1, borderRadius: radius.lg, padding: 16, marginTop: 16 },
  boxTitle: { fontFamily: fonts.textBold, fontSize: 16, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  label: { ...type.small, flex: 1, marginRight: 12 },
  value: { ...type.small, fontFamily: fonts.textSemi, fontVariant: ["tabular-nums"] },
  strongLabel: { fontFamily: fonts.textBold, fontSize: 16 },
  strongValue: { fontFamily: fonts.display, fontSize: 20, fontVariant: ["tabular-nums"] },
  line: { height: 1, marginVertical: 8 },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { ...type.h2, textAlign: "center" },
  emptyText: { ...type.body, textAlign: "center", marginTop: 8 },
});

export default PedidoDetalhesScreen;
