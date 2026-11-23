import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import { listAppointments, cancelAppointment } from "../api/agenda";
import { useBusiness } from "../business/BusinessProvider";
import Avatar from "../components/ui/Avatar";
import Icon from "../components/ui/Icon";
import Chip from "../components/ui/Chip";
import Button from "../components/ui/Button";
import ListSkeleton from "../components/ui/ListSkeleton";
import StatusBadge from "../components/ui/StatusBadge";
import { fonts, radius, type } from "../theme/tokens";
import { formatDay } from "../utils/time";
import { formatCents } from "../utils/money";
import { confirmAction, notify } from "../utils/dialog";

const EMPTY = { items: [], cursor: null, loaded: false };
const OPEN = ["PENDING", "CONFIRMED"];

// Filtros de sempre: "Todos" (próximos e depois anteriores), "Próximos" e "Anteriores".
const HistoricoAgendamentosScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { slug } = useBusiness();
  const [filter, setFilter] = useState("all");
  const [lists, setLists] = useState({ upcoming: EMPTY, past: EMPTY });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);

  const fetchScope = useCallback(async (scope, cursor) => {
    const page = await listAppointments({ scope, cursor });
    setLists((prev) => ({
      ...prev,
      [scope]: { items: cursor ? [...prev[scope].items, ...page.items] : page.items, cursor: page.nextCursor, loaded: true },
    }));
  }, []);

  const scopesFor = (value) => (value === "all" ? ["upcoming", "past"] : [value]);

  const load = useCallback(
    async (value, { pull = false } = {}) => {
      // Esqueleto só no primeiro carregamento; puxar para atualizar mostra o indicador do sistema.
      if (pull) setRefreshing(true);
      else setLoading(true);
      setFailed(null);
      try {
        await Promise.all(scopesFor(value).map((scope) => fetchScope(scope, null)));
      } catch (error) {
        setFailed(error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchScope]
  );

  useEffect(() => {
    setLists({ upcoming: EMPTY, past: EMPTY });
    load(filter);
  }, [slug, filter, load]);

  const shown = scopesFor(filter).flatMap((scope) => lists[scope].items);
  const moreScope = scopesFor(filter).find((scope) => lists[scope].cursor);

  const loadMore = async () => {
    if (!moreScope || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchScope(moreScope, lists[moreScope].cursor);
    } catch (error) {
      notify("Não deu para carregar mais", error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const cancel = async (item) => {
    const name = item.items.map((i) => i.name).join(", ");
    const ok = await confirmAction({
      title: "Cancelar agendamento",
      message: `Quer cancelar ${name} em ${formatDay(item.local.date)}, às ${item.local.start}?`,
      confirmText: "Cancelar horário",
      cancelText: "Manter horário",
      destructive: true,
    });
    if (!ok) return;
    setCancelingId(item.id);
    try {
      const updated = await cancelAppointment(item.id);
      setLists((prev) => ({
        upcoming: { ...prev.upcoming, items: prev.upcoming.items.map((a) => (a.id === item.id ? updated : a)) },
        past: { ...prev.past, items: prev.past.items.map((a) => (a.id === item.id ? updated : a)) },
      }));
      notify("Agendamento cancelado.");
    } catch (error) {
      notify("Não deu para cancelar", error.message);
    } finally {
      setCancelingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const open = OPEN.includes(item.status);
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
        <View style={styles.top}>
          <Avatar name={item.professional.name} size="md" />
          <View style={styles.info}>
            <Text style={[styles.service, { color: c.ink }]} numberOfLines={2}>{item.items.map((i) => i.name).join(", ")}</Text>
            <Text style={[styles.small, { color: c.inkMuted }]}>com {item.professional.name}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} style={{ marginTop: 10 }} />
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <View style={styles.detail}>
              <Icon name="calendar" size={14} color={c.inkMuted} />
              <Text style={[styles.small, styles.detailText, { color: c.ink }]}>{formatDay(item.local.date)}</Text>
            </View>
            <View style={styles.detail}>
              <Icon name="clock" size={14} color={c.inkMuted} />
              <Text style={[styles.small, styles.detailText, styles.time, { color: c.ink }]}>{item.local.start}</Text>
            </View>
          </View>
          <Text style={[styles.price, { color: c.ink }]}>{formatCents(item.totalCents)}</Text>
        </View>
        {open && item.change.allowed ? (
          <Button
            title="Cancelar horário"
            variant="outline"
            size="sm"
            onPress={() => cancel(item)}
            loading={cancelingId === item.id}
            style={{ borderColor: c.danger, marginTop: 12 }}
            textStyle={{ color: c.danger }}
          />
        ) : open && item.change.untilLabel ? (
          <Text style={[styles.small, { color: c.inkMuted, marginTop: 10 }]}>O prazo para trocar ou cancelar acabou em {item.change.untilLabel}.</Text>
        ) : null}
      </View>
    );
  };

  const emptyText =
    filter === "upcoming" ? "Você não tem agendamentos futuros." : filter === "past" ? "Você ainda não tem agendamentos anteriores." : "Seus agendamentos aparecem aqui.";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.ground }]} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Icon name="arrow-left" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.ink }]}>Agendamentos</Text>
        <View style={styles.back} />
      </View>

      <View style={styles.filters}>
        <Chip label="Todos" selected={filter === "all"} onPress={() => setFilter("all")} size="sm" />
        <Chip label="Próximos" selected={filter === "upcoming"} onPress={() => setFilter("upcoming")} size="sm" />
        <Chip label="Anteriores" selected={filter === "past"} onPress={() => setFilter("past")} size="sm" />
      </View>

      {loading ? (
        <ListSkeleton rows={3} height={150} />
      ) : failed ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.ink }]}>Não deu para carregar</Text>
          <Text style={[styles.emptyText, { color: c.inkMuted }]}>{failed}</Text>
          <Button title="Tentar de novo" onPress={() => load(filter)} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(filter, { pull: true })} tintColor={c.brand} colors={[c.brand]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: c.ink }]}>Nenhum agendamento</Text>
              <Text style={[styles.emptyText, { color: c.inkMuted }]}>{emptyText}</Text>
            </View>
          }
          ListFooterComponent={
            moreScope ? <Button title="Carregar mais" variant="secondary" onPress={loadMore} loading={loadingMore} style={{ marginTop: 4 }} /> : null
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
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingBottom: 8 },
  list: { padding: 20, paddingTop: 8, flexGrow: 1 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: 16, marginBottom: 12 },
  top: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  service: { fontFamily: fonts.textBold, fontSize: 16, lineHeight: 22 },
  small: { ...type.small },
  footer: { flexDirection: "row", alignItems: "flex-end", marginTop: 12 },
  detail: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  detailText: { marginLeft: 6 },
  time: { fontVariant: ["tabular-nums"] },
  price: { ...type.time, fontSize: 17 },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { ...type.h2, textAlign: "center" },
  emptyText: { ...type.body, textAlign: "center", marginTop: 8 },
});

export default HistoricoAgendamentosScreen;
