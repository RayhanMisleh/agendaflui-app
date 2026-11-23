import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import StatusBadge from "../../components/ui/StatusBadge";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, type } from "../../theme/tokens";
import { formatDay } from "../../utils/time";

// Próximo agendamento (v1). Data e hora vêm prontas no fuso da loja (`local`).
export default function ProximoHorario({ appointment, busy, onCancel, onReschedule }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const open = appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const services = appointment.items.map((item) => item.name).join(", ");
  const change = appointment.change;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: c.ink }]}>Seu próximo horário</Text>
      <Card style={styles.card}>
        <View style={styles.top}>
          <StatusBadge status={appointment.status} />
        </View>
        <View style={styles.row}>
          <Avatar name={appointment.professional.name} size="md" />
          <View style={styles.info}>
            <Text style={[styles.service, { color: c.ink }]} numberOfLines={2}>{services}</Text>
            <Text style={[styles.sub, { color: c.inkMuted }]}>com {appointment.professional.name}</Text>
          </View>
        </View>
        <View style={[styles.when, { backgroundColor: c.brandTint }]}>
          <Icon name="clock" size={18} color={c.brandText} />
          <Text style={[styles.whenText, { color: c.ink }]}>
            {formatDay(appointment.local.date)}, às {appointment.local.start}
          </Text>
        </View>
      </Card>

      {open && change.allowed ? (
        <View style={styles.actions}>
          <Button title="Trocar horário" onPress={onReschedule} disabled={busy} icon={<Icon name="repeat" size={18} color={c.onBrand} />} />
          <Button title="Cancelar agendamento" variant="outline" onPress={onCancel} loading={busy} style={{ borderColor: c.danger }} textStyle={{ color: c.danger }} />
          {change.untilLabel ? <Text style={[styles.note, { color: c.inkMuted }]}>Você pode trocar ou cancelar até {change.untilLabel}.</Text> : null}
        </View>
      ) : open && change.untilLabel ? (
        <Text style={[styles.note, { color: c.inkMuted }]}>O prazo para trocar ou cancelar acabou em {change.untilLabel}.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 24, marginTop: 16 },
  title: { ...type.h2, marginBottom: 12 },
  card: { padding: 16 },
  top: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  service: { fontFamily: fonts.textBold, fontSize: 17, lineHeight: 22 },
  sub: { ...type.small, marginTop: 2 },
  when: { flexDirection: "row", alignItems: "center", marginTop: 14, padding: 12, borderRadius: 10 },
  whenText: { ...type.bodyStrong, marginLeft: 8, flex: 1, fontSize: 15, lineHeight: 20 },
  actions: { marginTop: 12, gap: 10 },
  note: { ...type.small, marginTop: 10 },
});
