import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import { useBusiness, useTerms } from "../business/BusinessProvider";
import { pointsLabel } from "../business/terms";
import { listRedemptions, cancelRedemption } from "../api/loyalty";
import { isModuleDisabled } from "../api/errors";
import { confirmAction, notify } from "../utils/dialog";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import ListSkeleton from "../components/ui/ListSkeleton";
import RedemptionBadge from "../components/ui/RedemptionBadge";
import { fonts, radius, type } from "../theme/tokens";

// Histórico de prêmios: os resgates do cliente, do mais recente ao mais antigo (cursor).
// Só os pendentes cancelam; sem dados de enfeite.
const MinhaJornadaScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { slug } = useBusiness();
  const terms = useTerms();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(null);
  const [off, setOff] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);

  const load = useCallback(async () => {
    setFailed(null);
    try {
      const page = await listRedemptions({});
      setItems(page.items);
      setCursor(page.nextCursor);
      setOff(false);
    } catch (error) {
      if (isModuleDisabled(error)) setOff(true);
      else setFailed(error.message);
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setCursor(null);
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [slug, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listRedemptions({ cursor });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (error) {
      notify("Não deu para carregar mais", error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const cancel = async (item) => {
    const ok = await confirmAction({
      title: "Cancelar resgate",
      message: `Quer cancelar o resgate de ${item.prize.name}? Seus ${terms.points.plural} voltam.`,
      confirmText: "Cancelar resgate",
      cancelText: "Manter resgate",
      destructive: true,
    });
    if (!ok) return;
    setCancelingId(item.id);
    try {
      const updated = await cancelRedemption(item.id);
      setItems((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
      notify("Resgate cancelado.");
    } catch (error) {
      notify("Não deu para cancelar", error.message);
    } finally {
      setCancelingId(null);
    }
  };

  const whenLabel = (item) => {
    if (item.status === "DELIVERED" && item.deliveredLabel) return `Entregue em ${item.deliveredLabel}`;
    if (item.status === "CANCELED" && item.canceledLabel) return `Cancelado em ${item.canceledLabel}`;
    return `Resgatado em ${item.createdLabel}`;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
      <View style={styles.top}>
        <View style={[styles.iconBox, { backgroundColor: c.brandTint }]}>
          <Icon name="gift" size={18} color={c.brand} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: c.ink }]} numberOfLines={2}>{item.prize.name}</Text>
          <Text style={[styles.small, { color: c.inkMuted }]}>{whenLabel(item)}</Text>
        </View>
        <Text style={[styles.cost, { color: c.ink }]}>{pointsLabel(item.costPoints, terms)}</Text>
      </View>
      <RedemptionBadge status={item.status} style={{ marginTop: 10 }} />
      {item.status === "CANCELED" && item.cancelReason ? (
        <Text style={[styles.small, { color: c.inkMuted, marginTop: 8 }]}>{item.cancelReason}</Text>
      ) : null}
      {item.status === "PENDING" ? (
        <Button
          title="Cancelar resgate"
          variant="outline"
          size="sm"
          onPress={() => cancel(item)}
          loading={cancelingId === item.id}
          style={{ borderColor: c.danger, marginTop: 12 }}
          textStyle={{ color: c.danger }}
        />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.ground }]} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Icon name="arrow-left" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.ink }]}>Histórico de prêmios</Text>
        <View style={styles.back} />
      </View>

      {loading ? (
        <ListSkeleton rows={3} height={110} />
      ) : failed ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.ink }]}>Não deu para carregar</Text>
          <Text style={[styles.emptyText, { color: c.inkMuted }]}>{failed}</Text>
          <Button title="Tentar de novo" onPress={onRefresh} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <FlatList
          data={off ? [] : items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.brand]} tintColor={c.brand} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: c.ink }]}>Nenhum resgate ainda</Text>
              <Text style={[styles.emptyText, { color: c.inkMuted }]}>Troque seus {terms.points.plural} por prêmios e eles aparecem aqui.</Text>
            </View>
          }
          ListFooterComponent={
            cursor ? <Button title="Carregar mais" variant="secondary" onPress={loadMore} loading={loadingMore} style={{ marginTop: 4 }} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...type.h2 },
  list: { padding: 20, paddingTop: 8, flexGrow: 1 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: 16, marginBottom: 12 },
  top: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 36, height: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, marginLeft: 12, marginRight: 8 },
  name: { fontFamily: fonts.textBold, fontSize: 16, lineHeight: 22 },
  small: { ...type.small },
  cost: { ...type.time },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { ...type.h2, textAlign: "center" },
  emptyText: { ...type.body, textAlign: "center", marginTop: 8 },
});

export default MinhaJornadaScreen;
