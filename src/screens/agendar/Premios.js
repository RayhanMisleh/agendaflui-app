import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, FlatList, Dimensions } from "react-native";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import PointsIcon from "../../components/ui/PointsIcon";
import Skeleton from "../../components/ui/Skeleton";
import { useTheme } from "../../utils/ThemeContext";
import { listPrizes, redeemPrize } from "../../api/loyalty";
import { isModuleDisabled } from "../../api/errors";
import { pointsLabel } from "../../business/terms";
import { prizeState, missingPoints, createPrizeRedeemer } from "../../loyalty/prizes";
import { confirmAction, notify } from "../../utils/dialog";
import { fonts, radius, type } from "../../theme/tokens";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(220, Math.max(176, width * 0.5));
const CHANGED = ["insufficient_points", "changed"];

// Chave de repetição por intenção de resgate; fora do componente para valer também se a lista for remontada.
const redeemer = createPrizeRedeemer({ send: redeemPrize });

// Lista de prêmios da loja. `balance` é null para visitante (e enquanto o saldo não chegou).
// O resgate é por aqui: confirma, manda com a Idempotency-Key do prêmio e abre a tela de sucesso.
const Premios = ({ navigation, isAuthenticated, balance, terms, reloadKey = 0, onChanged }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const inFlight = useRef(false);
  const [prizes, setPrizes] = useState(null); // null: carregando
  const [failed, setFailed] = useState(null);
  const [off, setOff] = useState(false);
  const [redeeming, setRedeeming] = useState(null);

  const load = useCallback(async () => {
    setFailed(null);
    try {
      const items = await listPrizes();
      setPrizes(Array.isArray(items) ? items : []);
      setOff(false);
    } catch (error) {
      if (isModuleDisabled(error)) {
        setOff(true);
      } else {
        setFailed(error.message);
        setPrizes((current) => current || []);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const redeem = async (prize) => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    if (inFlight.current) return;
    // A confirmação abre uma intenção de resgate (chave aleatória); desistir a descarta.
    redeemer.begin(prize);
    const ok = await confirmAction({
      title: "Resgatar prêmio",
      message: `Resgatar ${prize.name} por ${pointsLabel(prize.costPoints, terms)}?`,
      confirmText: "Resgatar",
      cancelText: "Voltar",
    });
    if (!ok) {
      redeemer.cancel(prize);
      return;
    }
    if (inFlight.current) return;

    inFlight.current = true;
    setRedeeming(prize.id);
    try {
      const result = await redeemer.redeem(prize);
      if (onChanged) onChanged();
      navigation.navigate("RedemptionSuccess", { redemption: result.redemption, balance: result.balance });
    } catch (error) {
      notify("Não deu para resgatar", error.message);
      if (CHANGED.includes(error.reason)) {
        if (onChanged) onChanged();
        else load();
      }
    } finally {
      inFlight.current = false;
      setRedeeming(null);
    }
  };

  if (off) return null;
  if (prizes !== null && prizes.length === 0 && !failed) return null;

  const renderPrize = ({ item }) => {
    const state = !isAuthenticated ? (item.available ? "available" : "unavailable") : balance === null ? "loading" : prizeState(item, balance);
    return (
      <View style={[styles.card, { width: CARD_WIDTH, backgroundColor: c.surface, borderColor: c.line, opacity: state === "unavailable" ? 0.7 : 1 }]}>
        <View style={[styles.imageBox, { backgroundColor: c.brandTint }]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" accessibilityLabel={item.name} />
          ) : (
            <Icon name="gift" size={32} color={c.brand} />
          )}
        </View>
        <Text style={[styles.name, { color: c.ink }]} numberOfLines={2}>{item.name}</Text>
        <View style={styles.cost}>
          <PointsIcon size={16} />
          <Text style={[styles.costText, { color: c.ink }]}>{pointsLabel(item.costPoints, terms)}</Text>
        </View>
        <View style={styles.action}>
          {state === "available" ? (
            <Button title="Resgatar" size="sm" onPress={() => redeem(item)} loading={redeeming === item.id} fullWidth />
          ) : state === "insufficient" ? (
            <Text style={[styles.note, { color: c.inkMuted }]}>Faltam {pointsLabel(missingPoints(item, balance), terms)}</Text>
          ) : state === "unavailable" ? (
            <Text style={[styles.note, { color: c.inkMuted }]}>Esgotado</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.ink }]}>Prêmios</Text>
        <Text style={[styles.subtitle, { color: c.inkMuted }]}>Troque seus {terms.points.plural}</Text>
      </View>
      {prizes === null ? (
        <View style={styles.skeletons}>
          <Skeleton width={CARD_WIDTH} height={230} style={{ borderRadius: radius.lg }} />
          <Skeleton width={CARD_WIDTH} height={230} style={{ borderRadius: radius.lg, marginLeft: 12 }} />
        </View>
      ) : failed && prizes.length === 0 ? (
        <View style={styles.failed}>
          <Text style={[styles.note, { color: c.inkMuted, textAlign: "left" }]}>{failed}</Text>
          <Button title="Tentar de novo" variant="secondary" size="sm" onPress={load} style={{ marginTop: 10, alignSelf: "flex-start" }} />
        </View>
      ) : (
        <FlatList
          data={prizes}
          renderItem={renderPrize}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, marginTop: 16, marginBottom: 12 },
  title: { ...type.h2 },
  subtitle: { ...type.small, marginTop: 2 },
  list: { paddingHorizontal: 24, paddingBottom: 8 },
  skeletons: { flexDirection: "row", paddingHorizontal: 24 },
  failed: { paddingHorizontal: 24 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: 12, marginRight: 12 },
  imageBox: { height: 96, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 10 },
  image: { width: "100%", height: "100%" },
  name: { fontFamily: fonts.textBold, fontSize: 15, lineHeight: 20, minHeight: 40 },
  cost: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  costText: { ...type.small, fontFamily: fonts.textSemi, marginLeft: 4 },
  action: { marginTop: 10, minHeight: 36, justifyContent: "center" },
  note: { ...type.small, textAlign: "center" },
});

export default Premios;
