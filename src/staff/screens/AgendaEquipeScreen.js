import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { getAgenda } from "../../api/staff";
import { useBusiness } from "../../business/BusinessProvider";
import { useTheme } from "../../utils/ThemeContext";
import { localDateIn, formatDay } from "../../utils/time";
import StatusBadge from "../../components/ui/StatusBadge";
import Skeleton from "../../components/ui/Skeleton";
import FormMessage from "../../components/entry/FormMessage";
import { fonts, radius, type } from "../../theme/tokens";

// Atendimentos de todas as colunas do dia, em ordem de início (a Task 6 troca por agendaDays).
function dayItems(day) {
  if (!day) return [];
  const all = [];
  for (const column of day.professionals || []) all.push(...(column.appointments || []));
  return all.sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
}

// Agenda do dia da equipe: hora, cliente, serviços e situação.
export default function AgendaEquipeScreen() {
  const { theme } = useTheme();
  const { business } = useBusiness();
  const styles = getStyles(theme);
  const timeZone = business && business.timeZone ? business.timeZone : "America/Sao_Paulo";
  const today = localDateIn(timeZone, new Date());

  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { days } = await getAgenda({ from: today, to: today });
      setDay(days && days[0] ? days[0] : null);
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }, [today]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const items = dayItems(day);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        Hoje
      </Text>
      <Text style={styles.date}>{formatDay(today)}</Text>
      {error ? <FormMessage kind="error">{error}</FormMessage> : null}
      {day && day.closed ? <FormMessage kind="info">{day.closureReason || "A loja não abre hoje."}</FormMessage> : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.list}>
          <Skeleton height={72} style={styles.skeleton} />
          <Skeleton height={72} style={styles.skeleton} />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={!error && !(day && day.closed) ? <Text style={styles.empty}>Nenhum horário marcado para hoje.</Text> : null}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.time}>{item.local ? item.local.start : ""}</Text>
          <View style={styles.body}>
            <Text style={styles.customer} numberOfLines={1}>
              {item.customer ? item.customer.name : ""}
            </Text>
            <Text style={styles.services} numberOfLines={2}>
              {(item.items || []).map((service) => service.name).join(", ")}
            </Text>
            <StatusBadge status={item.status} style={styles.badge} />
          </View>
        </View>
      )}
    />
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.ground },
    list: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 16 },
    title: { ...type.title, color: theme.colors.ink },
    date: { ...type.body, color: theme.colors.inkMuted, textTransform: "capitalize", marginBottom: 16 },
    empty: { ...type.body, color: theme.colors.inkMuted, textAlign: "center", marginTop: 24 },
    skeleton: { marginBottom: 12 },
    card: {
      flexDirection: "row",
      padding: 16,
      marginBottom: 12,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.line,
      backgroundColor: theme.colors.surface,
    },
    time: { ...type.time, color: theme.colors.ink, width: 56 },
    body: { flex: 1 },
    customer: { ...type.bodyStrong, color: theme.colors.ink },
    services: { ...type.small, color: theme.colors.inkMuted, marginTop: 2 },
    badge: { marginTop: 8 },
  });
