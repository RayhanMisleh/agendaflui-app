import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import Skeleton from "../components/ui/Skeleton";
import QuantityStepper from "../components/ui/QuantityStepper";
import FormMessage from "../components/entry/FormMessage";
import EnderecoSelector from "../components/EnderecoSelector";
import FreteSelector from "../components/FreteSelector";
import FinalizarCompraModal from "../components/FinalizarCompraModal";
import { useAuth } from "../components/AuthProvider";
import { useBusiness } from "../business/BusinessProvider";
import { useTheme } from "../utils/ThemeContext";
import { useCart } from "../store/useCart";
import { getStoreOptions, createOrder, startCheckout } from "../api/store";
import { isFinalRejection } from "../api/idempotency";
import { toOrderLines, buildDelivery, checkoutReturnUrl, createOrderSubmitter, formatCents } from "../store/order";
import { openCheckout } from "../store/checkout";
import { fonts, radius, type } from "../theme/tokens";

const PAYMENT_OFF = "A loja ainda não recebe pagamentos pelo app.";
const QUOTE_REASONS = ["quote_expired", "invalid_quote"];

// Como mostrar o erro do pedido: o servidor já escreve em pt-BR, a tela só decide o botão.
function describeOrderError(error) {
  const reason = error && error.reason;
  const message = (error && error.message) || "Não deu para fazer o pedido. Tente de novo.";
  return {
    message,
    retry: !isFinalRejection(error), // rede, tempo esgotado ou 5xx: a mesma chave vale
    openOrders: reason === "too_many_open_orders",
    requote: QUOTE_REASONS.includes(reason),
  };
}

function Section({ title, subtitle, children, c }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.ink }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSub, { color: c.inkMuted }]}>{subtitle}</Text> : null}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

function ChoiceCard({ icon, title, text, selected, onPress, c }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.choice, { backgroundColor: selected ? c.brandTint : c.surface, borderColor: selected ? c.brand : c.line }]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: selected ? c.surface : c.brandTint }]}>
        <Icon name={icon} size={18} color={c.brand} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.choiceTitle, { color: c.ink }]}>{title}</Text>
        {text ? <Text style={[styles.choiceText, { color: c.inkMuted }]}>{text}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function CarrinhoScreen({ navigation }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isAuthenticated } = useAuth();
  const { slug } = useBusiness();
  const { cart, items, totalCents, loaded } = useCart();
  const submitter = useRef(createOrderSubmitter({ send: createOrder })).current;
  const sendingRef = useRef(false);
  const payingRef = useRef(false);

  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState(null);
  const [method, setMethod] = useState(null);
  const [address, setAddress] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [quoteKey, setQuoteKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [review, setReview] = useState(false);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [payError, setPayError] = useState(null);
  const [order, setOrder] = useState(null);

  const loadOptions = useCallback(async () => {
    setOptionsError(null);
    try {
      const result = await getStoreOptions();
      setOptions(result);
      setMethod((current) => current || (result.pickup.enabled ? "PICKUP" : result.shipping.enabled ? "SHIPPING" : null));
    } catch (failure) {
      setOptionsError(failure.message);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadOptions();
  }, [isAuthenticated, slug, loadOptions]);

  // A entrega só vale com tudo definido; a opção de frete é do endereço em que foi cotada.
  const quoteOk = shipping && address && shipping.addressId === address.id;
  const choice =
    method === "PICKUP"
      ? { method: "PICKUP" }
      : method === "SHIPPING" && quoteOk
        ? { method: "SHIPPING", addressId: address.id, quoteToken: shipping.quoteToken }
        : null;
  const paymentOn = Boolean(options && options.payment.available);
  const shippingCents = method === "SHIPPING" && quoteOk ? shipping.priceCents : 0;
  const canReview = items.length > 0 && choice !== null && paymentOn;

  const goToOrder = (orderId) => navigation.replace("MeusPedidos", { screen: "PedidoDetalhes", params: { orderId }, initial: false });

  const pay = async (target) => {
    if (payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    setPayError(null);
    try {
      const origin = Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : null;
      const checkout = await startCheckout(target.id, checkoutReturnUrl({ platform: Platform.OS, origin, slug, orderId: target.id }));
      await openCheckout(checkout.checkoutUrl);
      // Celular: o navegador fechou; o pedido abre e busca o valor de novo. Na web a página já foi ao pagamento.
      if (Platform.OS !== "web") goToOrder(target.id);
    } catch (failure) {
      setPayError(failure.message);
    } finally {
      payingRef.current = false;
      setPaying(false);
    }
  };

  const confirm = async () => {
    if (sendingRef.current || submitter.isSending() || !canReview) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    let created;
    try {
      created = await submitter.submit({ lines: toOrderLines(items), delivery: buildDelivery(choice) });
    } catch (failure) {
      const shown = describeOrderError(failure);
      if (shown.requote) {
        // A cotação venceu ou não vale mais: cota de novo e a pessoa escolhe outra vez.
        setReview(false);
        setNotice(shown.message);
        setShipping(null);
        setQuoteKey((key) => key + 1);
      } else {
        setError(shown);
      }
      sendingRef.current = false;
      setSending(false);
      return;
    }
    sendingRef.current = false;
    setSending(false);
    try {
      await cart.clear();
    } catch (failure) {
      // o pedido já existe; o carrinho velho só sobra até a próxima limpeza
    }
    setOrder(created);
    await pay(created);
  };

  const closeReview = () => {
    if (sending || paying) return;
    // Pedido já feito: a janela não fecha para o carrinho vazio, vai ao pedido.
    if (order) {
      goToOrder(order.id);
      return;
    }
    setReview(false);
    setError(null);
    setPayError(null);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.ground }]} edges={["top", "bottom"]}>
        <Header navigation={navigation} c={c} />
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.ink }]}>Entre para ver o carrinho</Text>
          <Button title="Entrar" onPress={() => navigation.navigate("Login")} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  const delivery =
    method === "SHIPPING"
      ? { method: "SHIPPING", address, option: quoteOk ? shipping : null }
      : { method: "PICKUP", instructions: options && options.pickup.instructions };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.ground }]} edges={["top", "bottom"]}>
      <Header navigation={navigation} c={c} />

      {!loaded ? (
        <View style={styles.pad}>
          <Skeleton width="100%" height={96} style={{ borderRadius: radius.lg }} />
        </View>
      ) : items.length === 0 && !order ? (
        <View style={styles.empty}>
          <Icon name="shopping-bag" size={36} color={c.inkMuted} />
          <Text style={[styles.emptyTitle, { color: c.ink }]}>Seu carrinho está vazio</Text>
          <Text style={[styles.emptyText, { color: c.inkMuted }]}>Escolha produtos na loja para fazer um pedido.</Text>
          <Button title="Ver produtos" onPress={() => navigation.navigate("MainTabs", { screen: "Loja" })} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {notice ? <FormMessage kind="info">{notice}</FormMessage> : null}
            {optionsError ? (
              <View>
                <FormMessage kind="error">{optionsError}</FormMessage>
                <Button title="Tentar de novo" variant="secondary" size="sm" onPress={loadOptions} style={{ alignSelf: "flex-start" }} />
              </View>
            ) : null}
            {options && !paymentOn ? <FormMessage kind="info">{PAYMENT_OFF}</FormMessage> : null}

            <Section title="Seus itens" c={c}>
              {items.map((item) => (
                <View key={item.productId} style={[styles.item, { backgroundColor: c.surface, borderColor: c.line }]}>
                  <View style={[styles.thumb, { backgroundColor: c.brandTint }]}>
                    {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} resizeMode="cover" /> : <Icon name="image" size={22} color={c.brand} />}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: c.ink }]} numberOfLines={2}>{item.name}</Text>
                    <Text style={[styles.itemPrice, { color: c.inkMuted }]}>{formatCents(item.unitPriceCents)}</Text>
                    <View style={styles.itemActions}>
                      <QuantityStepper value={item.quantity} max={item.maxQuantity} onChange={(next) => cart.setQuantity(item.productId, next)} />
                      <TouchableOpacity onPress={() => cart.remove(item.productId)} accessibilityRole="button" accessibilityLabel={`Tirar ${item.name}`} style={styles.remove}>
                        <Icon name="trash-2" size={18} color={c.inkMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </Section>

            {options ? (
              <Section title="Como receber" c={c}>
                {!options.pickup.enabled && !options.shipping.enabled ? (
                  <FormMessage kind="info">A loja ainda não está combinando retirada nem entrega pelo app.</FormMessage>
                ) : null}
                {options.pickup.enabled ? (
                  <ChoiceCard c={c} icon="map-pin" title="Retirar na loja" text={options.pickup.instructions} selected={method === "PICKUP"} onPress={() => setMethod("PICKUP")} />
                ) : null}
                {options.shipping.enabled ? (
                  <ChoiceCard c={c} icon="truck" title="Receber em casa" text="Escolha o endereço e o frete." selected={method === "SHIPPING"} onPress={() => setMethod("SHIPPING")} />
                ) : null}
              </Section>
            ) : !optionsError ? (
              <Skeleton width="100%" height={72} style={{ borderRadius: radius.lg }} />
            ) : null}

            {options && method === "SHIPPING" ? (
              <>
                <Section title="Endereço" c={c}>
                  <EnderecoSelector selectedId={address ? address.id : null} onSelect={setAddress} />
                </Section>
                <Section title="Frete" subtitle="O valor vale por 30 minutos." c={c}>
                  <FreteSelector
                    addressId={address ? address.id : null}
                    items={items}
                    refreshKey={quoteKey}
                    pickupEnabled={options.pickup.enabled}
                    onChange={setShipping}
                  />
                </Section>
              </>
            ) : null}
          </ScrollView>

          <View style={[styles.bar, { backgroundColor: c.surface, borderTopColor: c.line }]}>
            <View style={styles.barTotal}>
              <Text style={[styles.barLabel, { color: c.inkMuted }]}>Total estimado</Text>
              <Text style={[styles.barValue, { color: c.ink }]}>{formatCents(totalCents + shippingCents)}</Text>
            </View>
            {paymentOn ? (
              <Button title="Finalizar pedido" onPress={() => { setNotice(""); setReview(true); }} disabled={!canReview} fullWidth size="lg" />
            ) : null}
          </View>

          <FinalizarCompraModal
            visible={review}
            items={items}
            delivery={delivery}
            itemsCents={totalCents}
            order={order}
            sending={sending}
            paying={paying}
            error={error}
            payError={payError}
            onConfirm={confirm}
            onClose={closeReview}
            onPay={() => order && pay(order)}
            onViewOrder={() => order && goToOrder(order.id)}
            onViewOrders={() => {
              setReview(false);
              navigation.navigate("MeusPedidos");
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function Header({ navigation, c }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar">
        <Icon name="arrow-left" size={24} color={c.ink} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: c.ink }]}>Carrinho</Text>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...type.h2 },
  pad: { padding: 20 },
  scroll: { padding: 20, paddingTop: 4, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: { ...type.h2 },
  sectionSub: { ...type.small, marginTop: 2 },
  item: { flexDirection: "row", borderWidth: 1, borderRadius: radius.lg, padding: 12, marginBottom: 10 },
  thumb: { width: 72, height: 72, borderRadius: radius.sm, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  thumbImage: { width: "100%", height: "100%" },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontFamily: fonts.textSemi, fontSize: 15, lineHeight: 20 },
  itemPrice: { ...type.small, marginTop: 2 },
  itemActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  remove: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  choice: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  choiceIcon: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  choiceTitle: { fontFamily: fonts.textBold, fontSize: 15, lineHeight: 20 },
  choiceText: { ...type.small, marginTop: 2 },
  bar: { padding: 16, borderTopWidth: 1 },
  barTotal: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  barLabel: { ...type.small },
  barValue: { fontFamily: fonts.display, fontSize: 22, fontVariant: ["tabular-nums"] },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { ...type.h2, textAlign: "center", marginTop: 12 },
  emptyText: { ...type.body, textAlign: "center", marginTop: 8 },
});
