import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import Skeleton from "../../components/ui/Skeleton";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, radius, type } from "../../theme/tokens";
import { dayParts } from "../../utils/time";

// Terceiro passo: só os dias com horário livre (`available`), no calendário da loja.
export default function EscolhaData({ days, selectedDate, onSelect, today, loading }) {
  const { theme } = useTheme();
  const c = theme.colors;

  const renderItem = ({ item }) => {
    const selected = selectedDate === item.date;
    const parts = dayParts(item.date);
    const fg = selected ? c.onBrand : c.ink;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelect(item.date)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[styles.chip, { backgroundColor: selected ? c.brand : c.surface, borderColor: selected ? c.brand : c.line }]}
      >
        <Text style={[styles.weekday, { color: selected ? c.onBrand : c.inkMuted }]}>{item.weekday}</Text>
        <Text style={[styles.day, { color: fg }]}>{parts.day}</Text>
        <Text style={[styles.month, { color: selected ? c.onBrand : c.inkMuted }]}>{item.date === today ? "hoje" : parts.month}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.ink }]}>Data</Text>
        <Text style={[styles.subtitle, { color: c.inkMuted }]}>Escolha o melhor dia</Text>
      </View>
      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3, 4, 5].map((key) => (
            <Skeleton key={key} width={64} height={84} style={{ borderRadius: radius.lg, marginRight: 10 }} />
          ))}
        </View>
      ) : days.length === 0 ? (
        <Text style={[styles.empty, { color: c.inkMuted }]}>Não há dia livre nos próximos dias. Tente outro profissional ou volte mais tarde.</Text>
      ) : (
        <FlatList data={days} renderItem={renderItem} keyExtractor={(item) => item.date} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  title: { ...type.h2 },
  subtitle: { ...type.small, marginTop: 2 },
  list: { paddingHorizontal: 24, flexDirection: "row" },
  empty: { ...type.body, paddingHorizontal: 24 },
  chip: { width: 64, height: 84, borderWidth: 1, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", marginRight: 10 },
  weekday: { fontFamily: fonts.textMedium, fontSize: 12, lineHeight: 16 },
  day: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  month: { fontFamily: fonts.textMedium, fontSize: 12, lineHeight: 16 },
});
