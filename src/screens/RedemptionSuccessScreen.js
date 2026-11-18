import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import { useTerms } from "../business/BusinessProvider";
import { pointsLabel } from "../business/terms";
import { cancelRedemption } from "../api/loyalty";
import { confirmAction, notify } from "../utils/dialog";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import RedemptionBadge from "../components/ui/RedemptionBadge";
import { fonts, type } from "../theme/tokens";

// Recebe { redemption, balance } do resgate feito. O resgate nasce pendente: a pessoa mostra a tela no balcão.
const RedemptionSuccessScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;
  const terms = useTerms();
  const [redemption, setRedemption] = useState(route.params ? route.params.redemption : null);
  const [balance, setBalance] = useState(route.params ? route.params.balance : null);
  const [canceling, setCanceling] = useState(false);

  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [scale, fade]);

  const canceled = redemption && redemption.status === "CANCELED";

  const cancel = async () => {
    if (!redemption || canceling) return;
    const ok = await confirmAction({
      title: "Cancelar resgate",
      message: `Quer cancelar o resgate de ${redemption.prize.name}? Seus ${terms.points.plural} voltam.`,
      confirmText: "Cancelar resgate",
      cancelText: "Manter resgate",
      destructive: true,
    });
    if (!ok) return;
    setCanceling(true);
    try {
      const updated = await cancelRedemption(redemption.id);
      setRedemption(updated);
      if (typeof balance === "number") setBalance(balance + redemption.costPoints);
    } catch (error) {
      notify("Não deu para cancelar", error.message);
    } finally {
      setCanceling(false);
    }
  };

  if (!redemption) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.ground }]}>
        <View style={styles.empty}>
          <Text style={[styles.title, { color: c.ink }]}>Nada por aqui</Text>
          <Button title="Voltar ao início" onPress={() => navigation.navigate("MainTabs")} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: c.ground }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.badge, { backgroundColor: canceled ? c.inkMuted : c.brand, transform: [{ scale }] }]}>
          <Icon name={canceled ? "x" : "gift"} size={48} color={c.onBrand} />
        </Animated.View>

        <Animated.View style={{ opacity: fade, width: "100%", alignItems: "center" }}>
          <Text style={[styles.title, { color: c.ink }]}>{canceled ? "Resgate cancelado" : "Resgate feito"}</Text>
          <Text style={[styles.subtitle, { color: c.inkMuted }]}>
            {canceled ? `Seus ${terms.points.plural} voltaram.` : "Mostre esta tela no balcão."}
          </Text>

          <Card style={styles.card}>
            <Text style={[styles.label, { color: c.inkMuted }]}>Prêmio</Text>
            <Text style={[styles.value, { color: c.ink }]}>{redemption.prize.name}</Text>

            <View style={[styles.divider, { backgroundColor: c.line }]} />
            <Text style={[styles.label, { color: c.inkMuted }]}>Custo</Text>
            <Text style={[styles.value, { color: c.ink }]}>{pointsLabel(redemption.costPoints, terms)}</Text>

            <View style={[styles.divider, { backgroundColor: c.line }]} />
            <Text style={[styles.label, { color: c.inkMuted }]}>Resgatado em</Text>
            <Text style={[styles.value, { color: c.ink }]}>{redemption.createdLabel}</Text>

            <View style={[styles.divider, { backgroundColor: c.line }]} />
            <Text style={[styles.label, { color: c.inkMuted }]}>Situação</Text>
            <RedemptionBadge status={redemption.status} style={{ marginTop: 6 }} />

            {typeof balance === "number" ? (
              <>
                <View style={[styles.divider, { backgroundColor: c.line }]} />
                <Text style={[styles.label, { color: c.inkMuted }]}>Seu saldo</Text>
                <Text style={[styles.value, { color: c.ink }]}>{pointsLabel(balance, terms)}</Text>
              </>
            ) : null}
          </Card>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {redemption.status === "PENDING" ? (
          <Button title="Cancelar resgate" variant="outline" onPress={cancel} loading={canceling} fullWidth style={{ marginBottom: 12, borderColor: c.danger }} textStyle={{ color: c.danger }} />
        ) : null}
        <Button title="Voltar ao início" onPress={() => navigation.navigate("MainTabs")} fullWidth size="lg" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, alignItems: "center", flexGrow: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  badge: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginTop: 32, marginBottom: 28 },
  title: { ...type.title, textAlign: "center" },
  subtitle: { ...type.body, marginTop: 8, textAlign: "center" },
  card: { width: "100%", marginTop: 28, padding: 18 },
  label: { ...type.caption },
  value: { fontFamily: fonts.textBold, fontSize: 17, lineHeight: 24, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  footer: { paddingHorizontal: 24, paddingBottom: 24 },
});

export default RedemptionSuccessScreen;
