import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { getStaffAppointment, confirmAppointment, completeAppointment, markNoShow, cancelStaffAppointment } from "../../api/staff";
import { useTerms } from "../../business/BusinessProvider";
import { useTheme } from "../../utils/ThemeContext";
import { formatDay } from "../../utils/time";
import { formatCents, durationLabel } from "../../utils/money";
import { ROUTES } from "../../navigation/routes";
import { appointmentActions } from "../agenda";
import ScreenHeader from "../components/ScreenHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import Skeleton from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Field from "../../components/entry/Field";
import FormMessage from "../../components/entry/FormMessage";
import { radius, type } from "../../theme/tokens";

const DONE_MESSAGES = {
  confirm: "Atendimento confirmado.",
  complete: "Atendimento concluído.",
  no_show: "Falta registrada.",
  cancel: "Atendimento cancelado.",
};

// Um atendimento: horário, cliente, serviços e as ações que a situação permite.
export default function AtendimentoScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const navigation = useNavigation();
  const { params } = useRoute();
  const appointmentId = params ? params.appointmentId : null;
  const terms = useTerms();
  const styles = getStyles(theme);

  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      setAppt(await getStaffAppointment(appointmentId));
      setError("");
    } catch (failure) {
      // 403 (não é seu) e 404 (não existe mais) viram mensagem na tela
      setError(failure.message);
    }
  }, [appointmentId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Voltou da remarcação: busca o atendimento de novo.
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

  const run = async (action) => {
    if (busy) return;
    setBusy(action);
    setError("");
    try {
      let result;
      if (action === "confirm") result = await confirmAppointment(appointmentId);
      else if (action === "complete") result = await completeAppointment(appointmentId);
      else if (action === "no_show") result = await markNoShow(appointmentId);
      else result = await cancelStaffAppointment(appointmentId, reason.trim());
      setCancelling(false);
      setReason("");
      if (result && result.status) setAppt(result);
      else await load();
      Toast.show({ type: "success", text1: DONE_MESSAGES[action] });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(null);
    }
  };

  const actions = appt ? appointmentActions(appt, new Date().toISOString()) : [];
  const customerLabel = terms.customer.singular;

  const body = () => {
    if (loading) {
      return (
        <View style={styles.content}>
          <Skeleton height={96} style={styles.skeleton} />
          <Skeleton height={96} style={styles.skeleton} />
        </View>
      );
    }
    if (!appt) {
      return (
        <View style={styles.content}>
          <FormMessage kind="error">{error || "Não deu para abrir este atendimento."}</FormMessage>
          <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <FormMessage kind="error">{error}</FormMessage> : null}

        <View style={styles.card}>
          <StatusBadge status={appt.status} />
          <Text style={styles.when}>{appt.local ? formatDay(appt.local.date) : ""}</Text>
          <Text style={styles.hours}>{appt.local ? `${appt.local.start} às ${appt.local.end}` : ""}</Text>
          {appt.professional ? (
            <Text style={styles.muted}>{`${terms.professional.singular}: ${appt.professional.name}`}</Text>
          ) : null}
        </View>

        {appt.customer ? (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.ClienteEquipe, { customerId: appt.customer.id })}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ficha de ${appt.customer.name}`}
          >
            <Text style={styles.label}>{customerLabel}</Text>
            <View style={styles.customerRow}>
              <View style={styles.flex}>
                <Text style={styles.customer}>{appt.customer.name}</Text>
                {appt.customer.phoneLabel ? <Text style={styles.muted}>{appt.customer.phoneLabel}</Text> : null}
              </View>
              <Icon name="chevron-right" size={20} color={c.inkMuted} />
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Serviços</Text>
          {(appt.items || []).map((service) => (
            <View key={service.serviceId} style={styles.serviceRow}>
              <View style={styles.flex}>
                <Text style={styles.service}>{service.name}</Text>
                {durationLabel(service.durationMin) ? <Text style={styles.muted}>{durationLabel(service.durationMin)}</Text> : null}
              </View>
              <Text style={styles.service}>{formatCents(service.priceCents)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.total}>{formatCents(appt.totalCents)}</Text>
          </View>
        </View>

        {appt.customerNote ? (
          <View style={styles.card}>
            <Text style={styles.label}>Pedido do {customerLabel.toLowerCase()}</Text>
            <Text style={styles.text}>{appt.customerNote}</Text>
          </View>
        ) : null}
        {appt.notes ? (
          <View style={styles.card}>
            <Text style={styles.label}>Anotação interna</Text>
            <Text style={styles.text}>{appt.notes}</Text>
          </View>
        ) : null}

        {cancelling ? (
          <View style={styles.card}>
            <Text style={[styles.service, styles.cancelHint]}>Cancelar este atendimento?</Text>
            <Field label="Motivo (opcional)" value={reason} onChangeText={setReason} maxLength={200} multiline />
            <Button
              title="Cancelar atendimento"
              variant="secondary"
              loading={busy === "cancel"}
              disabled={Boolean(busy)}
              onPress={() => run("cancel")}
              style={[styles.action, { borderColor: c.danger }]}
              textStyle={{ color: c.danger }}
            />
            <Button title="Voltar" variant="ghost" disabled={Boolean(busy)} onPress={() => setCancelling(false)} style={styles.action} />
          </View>
        ) : (
          actions.map((action) => (
            <Button
              key={action}
              title={ACTION_LABELS[action]}
              variant={action === "confirm" || action === "complete" ? "primary" : "secondary"}
              loading={busy === action}
              disabled={Boolean(busy)}
              onPress={() => (action === "cancel" ? setCancelling(true) : action === "reschedule" ? navigation.navigate(ROUTES.Remarcar, { appointmentId }) : run(action))}
              style={styles.action}
              textStyle={action === "cancel" ? { color: c.danger } : undefined}
            />
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Atendimento" />
      {body()}
    </View>
  );
}

const ACTION_LABELS = {
  confirm: "Confirmar",
  complete: "Concluir atendimento",
  no_show: "Marcar falta",
  cancel: "Cancelar atendimento",
  reschedule: "Remarcar",
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.ground },
    content: { padding: 20, paddingBottom: 40 },
    skeleton: { marginBottom: 12 },
    flex: { flex: 1 },
    card: {
      padding: 16,
      marginBottom: 12,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.line,
      backgroundColor: theme.colors.surface,
    },
    when: { ...type.bodyStrong, color: theme.colors.ink, textTransform: "capitalize", marginTop: 12 },
    hours: { ...type.time, color: theme.colors.ink, marginTop: 2 },
    label: { ...type.caption, color: theme.colors.inkMuted, marginBottom: 6 },
    muted: { ...type.small, color: theme.colors.inkMuted, marginTop: 2 },
    customerRow: { flexDirection: "row", alignItems: "center" },
    customer: { ...type.bodyStrong, color: theme.colors.ink },
    serviceRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, gap: 12 },
    service: { ...type.bodyStrong, color: theme.colors.ink },
    totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 12, marginTop: 4 },
    total: { ...type.bodyStrong, color: theme.colors.ink },
    text: { ...type.body, color: theme.colors.ink },
    cancelHint: { marginBottom: 16 },
    action: { marginTop: 8 },
  });
