import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Skeleton from "../../components/ui/Skeleton";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, radius, type } from "../../theme/tokens";

// Quarto passo: o rótulo de cada horário (`label`) vem pronto no fuso da loja.
export default function EscolhaHorario({ slots, selectedStartsAt, onSelect, loading }) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.ink }]}>Horário</Text>
        <Text style={[styles.subtitle, { color: c.inkMuted }]}>Horários livres neste dia</Text>
      </View>
      {loading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((key) => (
            <Skeleton key={key} width={76} height={44} style={{ borderRadius: radius.pill }} />
          ))}
        </View>
      ) : slots.length === 0 ? (
        <Text style={[styles.empty, { color: c.inkMuted }]}>Não há horário livre neste dia. Escolha outro dia.</Text>
      ) : (
        <View style={styles.grid}>
          {slots.map((slot) => {
            const selected = selectedStartsAt === slot.startsAt;
            return (
              <TouchableOpacity
                key={slot.startsAt}
                activeOpacity={0.7}
                onPress={() => onSelect(slot)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.slot, { backgroundColor: selected ? c.brand : c.surface, borderColor: selected ? c.brand : c.line }]}
              >
                <Text style={[styles.label, { color: selected ? c.onBrand : c.ink }]}>{slot.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  title: { ...type.h2 },
  subtitle: { ...type.small, marginTop: 2 },
  empty: { ...type.body, paddingHorizontal: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 24, gap: 10 },
  slot: { minWidth: 76, height: 44, borderWidth: 1, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  label: { ...type.time },
});
