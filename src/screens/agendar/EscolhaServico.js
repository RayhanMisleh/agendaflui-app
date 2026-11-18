import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "../../components/ui/Icon";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, radius, type } from "../../theme/tokens";
import { canPickService } from "../../booking/selection";
import { formatCents, durationLabel } from "../../utils/money";
import { earnLabel } from "../../loyalty/prizes";

// Segundo passo: um serviço só. Serviço só do clube fica visível, mas só sócio escolhe.
// `locked` (remarcar): mostra só o serviço do agendamento, sem trocar.
export default function EscolhaServico({ services, selectedId, onSelect, isClubMember, terms, locked }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const data = locked ? services.filter((s) => s.id === selectedId) : services;

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.ink }]}>Serviço</Text>
        <Text style={[styles.subtitle, { color: c.inkMuted }]}>
          {locked ? "Ao trocar o horário, o serviço continua o mesmo." : "O que você precisa?"}
        </Text>
      </View>
      {data.length === 0 ? <Text style={[styles.empty, { color: c.inkMuted }]}>Este profissional ainda não tem serviços.</Text> : null}
      <View style={styles.list}>
        {data.map((service) => {
          const selected = selectedId === service.id;
          const allowed = canPickService(service, isClubMember);
          return (
            <TouchableOpacity
              key={service.id}
              activeOpacity={0.7}
              disabled={!allowed || locked}
              onPress={() => allowed && !locked && onSelect(service.id)}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !allowed }}
              style={[styles.card, { backgroundColor: selected ? c.brandTint : c.surface, borderColor: selected ? c.brand : c.line, opacity: allowed ? 1 : 0.6 }]}
            >
              <View style={styles.row}>
                <Text style={[styles.name, { color: c.ink }]}>{service.name}</Text>
                <Text style={[styles.meta, { color: c.ink }]}>{formatCents(service.priceCents)}</Text>
              </View>
              {service.description ? <Text style={[styles.desc, { color: c.inkMuted }]} numberOfLines={2}>{service.description}</Text> : null}
              <View style={styles.row}>
                <Text style={[styles.sub, { color: c.inkMuted }]}>{durationLabel(service.durationMin)}</Text>
                {service.clubOnly ? (
                  <View style={[styles.tag, { backgroundColor: c.carameloTint }]}>
                    <Icon name="lock" size={12} color={c.ink} />
                    <Text style={[styles.tagText, { color: c.ink }]}>Só para {terms.club}</Text>
                  </View>
                ) : earnLabel(service, terms) ? (
                  <Text style={[styles.sub, { color: c.brandStrong }]}>{earnLabel(service, terms)}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  title: { ...type.h2 },
  subtitle: { ...type.small, marginTop: 2 },
  empty: { ...type.body, paddingHorizontal: 24 },
  list: { paddingHorizontal: 24, gap: 10 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontFamily: fonts.textBold, fontSize: 16, lineHeight: 22, flex: 1, marginRight: 12 },
  meta: { ...type.time },
  desc: { ...type.small, marginTop: 4 },
  sub: { ...type.small, marginTop: 6 },
  tag: { flexDirection: "row", alignItems: "center", borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10, marginTop: 6 },
  tagText: { fontFamily: fonts.textSemi, fontSize: 12, marginLeft: 4 },
});
