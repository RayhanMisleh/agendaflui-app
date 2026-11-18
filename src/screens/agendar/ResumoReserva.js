import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "../../components/ui/Button";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, type } from "../../theme/tokens";
import { formatCents, durationLabel } from "../../utils/money";
import { formatDay } from "../../utils/time";

// Barra fixa com o resumo e o botão de confirmar. Visitante entra para agendar.
export default function ResumoReserva({ service, professionalName, date, slot, totalCents, durationMin, authenticated, rescheduling, submitting, onConfirm }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;
  const title = !authenticated ? "Entrar para agendar" : rescheduling ? "Confirmar novo horário" : "Confirmar agendamento";

  return (
    <View style={[styles.bar, { backgroundColor: c.surface, borderTopColor: c.line, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.summary}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.main, { color: c.ink }]} numberOfLines={1}>{service.name} com {professionalName}</Text>
          <Text style={[styles.sub, { color: c.inkMuted }]} numberOfLines={1}>
            {formatDay(date)}, às {slot.label}
            {durationMin ? ` (${durationLabel(durationMin)})` : ""}
          </Text>
        </View>
        <Text style={[styles.total, { color: c.ink }]}>{formatCents(totalCents)}</Text>
      </View>
      <Button title={title} onPress={onConfirm} fullWidth size="lg" loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 24 },
  summary: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  main: { fontFamily: fonts.textBold, fontSize: 15, lineHeight: 20 },
  sub: { ...type.small },
  total: { ...type.time, fontSize: 17, marginLeft: 12 },
});
