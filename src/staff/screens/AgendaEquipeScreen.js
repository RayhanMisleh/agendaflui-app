import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getAgenda, listStaffProfessionals } from "../../api/staff";
import { useBusiness, useTerms } from "../../business/BusinessProvider";
import { useTheme } from "../../utils/ThemeContext";
import { localDateIn, formatDay, dayParts } from "../../utils/time";
import { ROUTES } from "../../navigation/routes";
import { useStaffSession } from "../StaffSessionProvider";
import { agendaRange, agendaDays, agendaTimeline, canFilterProfessionals, shiftDate } from "../agenda";
import StatusBadge from "../../components/ui/StatusBadge";
import ListSkeleton from "../../components/ui/ListSkeleton";
import Button from "../../components/ui/Button";
import Chip from "../../components/ui/Chip";
import Icon from "../../components/ui/Icon";
import FormMessage from "../../components/entry/FormMessage";
import { radius, type } from "../../theme/tokens";

// Agenda da equipe: dia ou semana, voltar e avançar, filtro de profissional (só para quem vê todas as agendas).
export default function AgendaEquipeScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigation = useNavigation();
  const { business } = useBusiness();
  const terms = useTerms();
  const { profile } = useStaffSession();
  const styles = getStyles(theme);
  const timeZone = business && business.timeZone ? business.timeZone : "America/Sao_Paulo";
  const today = localDateIn(timeZone, new Date());

  const [view, setView] = useState("day");
  const [date, setDate] = useState(today);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);

  // Sem view_all_agendas não há filtro: a agenda pede só a própria coluna (o servidor entrega só ela).
  const canFilter = canFilterProfessionals(profile);
  const professionalId = canFilter ? selectedProfessional : null;
  const { from, to } = agendaRange(view, date);

  const load = useCallback(async () => {
    const current = ++request.current;
    try {
      const data = await getAgenda({ from, to, professionalId: professionalId || undefined });
      if (current !== request.current) return;
      setDays(data.days || []);
      setError("");
    } catch (failure) {
      if (current === request.current) setError(failure.message);
    }
  }, [from, to, professionalId]);

  // Mudou o período ou o filtro: mostra o carregando. Voltou de outra tela: atualiza sem piscar.
  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      load();
    }, [load])
  );

  useEffect(() => {
    if (!canFilter) {
      setSelectedProfessional(null);
      setProfessionals([]);
      return undefined;
    }
    let cancelled = false;
    listStaffProfessionals()
      .then((items) => {
        if (!cancelled) setProfessionals(items.filter((p) => !p.archived));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [canFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const rows = useMemo(() => {
    const out = [];
    for (const day of agendaDays(days, { professionalId: professionalId || undefined })) {
      if (view === "week") out.push({ key: `d-${day.date}`, type: "day", day });
      if (day.closed) out.push({ key: `c-${day.date}`, type: "closed", day });
      const timeline = agendaTimeline(day);
      if (!day.closed && timeline.length === 0 && view === "week") out.push({ key: `e-${day.date}`, type: "empty" });
      for (const entry of timeline) out.push({ key: `${entry.kind}-${entry.value.id}`, type: entry.kind, value: entry.value });
    }
    return out;
  }, [days, professionalId, view]);

  const title = date === today && view === "day" ? "Hoje" : view === "week" ? "Semana" : "Dia";
  const subtitle = view === "week" ? `${dayLabel(from)} a ${dayLabel(to)}` : formatDay(date);
  const ownProfessionalId = profile ? profile.professionalId : null;
  const blockProfessional = professionalId || ownProfessionalId || null;

  const header = (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => setDate(shiftDate(view, date, -1))} style={styles.navButton} accessibilityRole="button" accessibilityLabel={view === "week" ? "Semana anterior" : "Dia anterior"}>
          <Icon name="chevron-left" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
        <TouchableOpacity onPress={() => setDate(shiftDate(view, date, 1))} style={styles.navButton} accessibilityRole="button" accessibilityLabel={view === "week" ? "Próxima semana" : "Próximo dia"}>
          <Icon name="chevron-right" size={22} color={c.ink} />
        </TouchableOpacity>
      </View>
      <View style={styles.controls}>
        <Chip label="Dia" size="sm" selected={view === "day"} onPress={() => setView("day")} />
        <Chip label="Semana" size="sm" selected={view === "week"} onPress={() => setView("week")} />
        {date !== today ? <Chip label="Hoje" size="sm" onPress={() => setDate(today)} /> : null}
      </View>
      {canFilter && professionals.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filter} accessibilityLabel={`Filtrar por ${terms.professional.singular.toLowerCase()}`}>
          <Chip label="Todos" size="sm" selected={!selectedProfessional} onPress={() => setSelectedProfessional(null)} />
          {professionals.map((p) => (
            <Chip key={p.id} label={p.name} size="sm" selected={selectedProfessional === p.id} onPress={() => setSelectedProfessional(p.id)} />
          ))}
        </ScrollView>
      ) : null}
      <Button
        title="Bloquear horário"
        variant="secondary"
        size="sm"
        icon={<Icon name="slash" size={16} color={c.ink} />}
        textStyle={{ color: c.ink }}
        onPress={() => navigation.navigate(ROUTES.BloquearHorario, { date, professionalId: blockProfessional })}
        style={styles.blockButton}
      />
      {error ? <FormMessage kind="error">{error}</FormMessage> : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {header}
        <ListSkeleton rows={3} height={72} />
      </View>
    );
  }

  const nothing = rows.length === 0 && !error;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={rows}
      keyExtractor={(row) => row.key}
      ListHeaderComponent={header}
      ListEmptyComponent={nothing ? <Text style={styles.empty}>Nenhum horário marcado neste período.</Text> : null}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item: row }) => {
        if (row.type === "day") {
          return (
            <Text style={styles.dayTitle} accessibilityRole="header">
              {formatDay(row.day.date)}
            </Text>
          );
        }
        if (row.type === "closed") return <FormMessage kind="info">{row.day.closureReason || "A loja não abre neste dia."}</FormMessage>;
        if (row.type === "empty") return <Text style={styles.emptyDay}>Nenhum horário marcado.</Text>;
        if (row.type === "block") {
          const block = row.value;
          return (
            <View style={[styles.card, styles.blockCard]}>
              <Text style={styles.time}>{block.local ? block.local.startTime : ""}</Text>
              <View style={styles.body}>
                <Text style={styles.customer}>Horário bloqueado</Text>
                <Text style={styles.services} numberOfLines={2}>
                  {[block.local ? `Até ${block.local.endTime}` : "", block.reason, block.professionalName].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </View>
          );
        }
        const item = row.value;
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.Atendimento, { appointmentId: item.id })}
            accessibilityRole="button"
            accessibilityLabel={`Atendimento de ${item.customer ? item.customer.name : ""} às ${item.local ? item.local.start : ""}`}
          >
            <Text style={styles.time}>{item.local ? item.local.start : ""}</Text>
            <View style={styles.body}>
              <Text style={styles.customer} numberOfLines={1}>
                {item.customer ? item.customer.name : ""}
              </Text>
              <Text style={styles.services} numberOfLines={2}>
                {(item.items || []).map((service) => service.name).join(", ")}
              </Text>
              {canFilter && item.professional ? (
                <Text style={styles.services} numberOfLines={1}>
                  {item.professional.name}
                </Text>
              ) : null}
              <StatusBadge status={item.status} style={styles.badge} />
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

function dayLabel(date) {
  const parts = dayParts(date);
  return `${parts.day} ${parts.month}`;
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.ground },
    list: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 8 },
    title: { ...type.title, color: theme.colors.ink },
    nav: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 12 },
    navButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    subtitle: { ...type.body, color: theme.colors.inkMuted, textTransform: "capitalize", flex: 1, textAlign: "center" },
    controls: { flexDirection: "row", gap: 8, marginBottom: 12 },
    filter: { gap: 8, paddingBottom: 12 },
    blockButton: { alignSelf: "flex-start", marginBottom: 16 },
    dayTitle: { ...type.bodyStrong, color: theme.colors.ink, textTransform: "capitalize", marginTop: 8, marginBottom: 12 },
    empty: { ...type.body, color: theme.colors.inkMuted, textAlign: "center", marginTop: 24 },
    emptyDay: { ...type.small, color: theme.colors.inkMuted, marginBottom: 12 },
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
    blockCard: { backgroundColor: theme.colors.ground, borderStyle: "dashed" },
    time: { ...type.time, color: theme.colors.ink, width: 56 },
    body: { flex: 1 },
    customer: { ...type.bodyStrong, color: theme.colors.ink },
    services: { ...type.small, color: theme.colors.inkMuted, marginTop: 2 },
    badge: { marginTop: 8 },
  });
