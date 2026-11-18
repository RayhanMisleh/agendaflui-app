import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Button from "./ui/Button";
import Skeleton from "./ui/Skeleton";
import FormMessage from "./entry/FormMessage";
import { useTheme } from "../utils/ThemeContext";
import { quoteShipping } from "../api/store";
import { toOrderLines, formatCents, shippingDaysLabel } from "../store/order";
import { fonts, radius, type } from "../theme/tokens";

// Frete do carrinho para o endereço escolhido. A cotação é do servidor, assinada, e vale 30 minutos: ao mudar o
// endereço, o carrinho ou `refreshKey`, cota de novo. Avisa `onChange` com a opção marcada (ou null).
export default function FreteSelector({ addressId, items, refreshKey = 0, pickupEnabled = false, onChange }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [state, setState] = useState({ status: "idle", options: [], shippingError: null, message: null });
  const [selected, setSelected] = useState(null);
  const turn = useRef(0);
  const notify = useRef(onChange);
  notify.current = onChange;
  const addressRef = useRef(addressId);
  addressRef.current = addressId;

  const linesKey = JSON.stringify(
    toOrderLines(items)
      .map((line) => [line.productId, line.quantity])
      .sort()
  );

  const choose = useCallback((option) => {
    setSelected(option ? option.serviceCode : null);
    // A cotação vale para o endereço em que foi pedida: a opção sai marcada com ele.
    notify.current(option ? { ...option, addressId: addressRef.current } : null);
  }, []);

  const quote = useCallback(async () => {
    const mine = ++turn.current;
    choose(null);
    if (!addressId || items.length === 0) {
      setState({ status: "idle", options: [], shippingError: null, message: null });
      return;
    }
    setState({ status: "loading", options: [], shippingError: null, message: null });
    try {
      const result = await quoteShipping({ addressId, lines: toOrderLines(items) });
      if (mine !== turn.current) return;
      const options = [...(result.options || [])].sort((a, b) => a.priceCents - b.priceCents);
      setState({ status: "ready", options, shippingError: result.shippingError || null, message: null });
      if (options.length > 0) choose(options[0]);
    } catch (error) {
      if (mine !== turn.current) return;
      setState({ status: "failed", options: [], shippingError: null, message: error.message });
    }
    // `items` entra pela chave das linhas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressId, linesKey, refreshKey, choose]);

  useEffect(() => {
    quote();
  }, [quote]);

  if (!addressId) return <Text style={[styles.note, { color: c.inkMuted }]}>Escolha um endereço para ver o frete.</Text>;
  if (state.status === "loading") return <Skeleton width="100%" height={72} style={{ borderRadius: radius.lg }} />;
  if (state.status === "failed") {
    return (
      <View>
        <FormMessage kind="error">{state.message}</FormMessage>
        <Button title="Tentar de novo" variant="secondary" size="sm" onPress={quote} style={{ alignSelf: "flex-start" }} />
      </View>
    );
  }
  if (state.status === "ready" && state.options.length === 0) {
    return (
      <FormMessage kind="info">
        {`${state.shippingError || "Não há entrega para este endereço."}${pickupEnabled ? " Você pode retirar na loja." : ""}`}
      </FormMessage>
    );
  }

  return (
    <View>
      {state.options.map((option) => {
        const on = option.serviceCode === selected;
        return (
          <TouchableOpacity
            key={option.serviceCode}
            activeOpacity={0.8}
            onPress={() => choose(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.card, { backgroundColor: on ? c.brandTint : c.surface, borderColor: on ? c.brand : c.line }]}
          >
            <View style={[styles.radio, { borderColor: on ? c.brand : c.inkMuted }]}>{on ? <View style={[styles.dot, { backgroundColor: c.brand }]} /> : null}</View>
            <View style={styles.body}>
              <Text style={[styles.name, { color: c.ink }]}>{option.name}</Text>
              <Text style={[styles.days, { color: c.inkMuted }]}>{shippingDaysLabel(option.days)}</Text>
            </View>
            <Text style={[styles.price, { color: c.ink }]}>{formatCents(option.priceCents)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { ...type.small },
  card: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  body: { flex: 1, marginLeft: 12 },
  name: { fontFamily: fonts.textBold, fontSize: 15, lineHeight: 20 },
  days: { ...type.small, marginTop: 2 },
  price: { ...type.time, fontSize: 16 },
});
