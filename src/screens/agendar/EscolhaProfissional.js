import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import Avatar from "../../components/ui/Avatar";
import Icon from "../../components/ui/Icon";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, radius, type } from "../../theme/tokens";
import { ANY_PROFESSIONAL } from "../../booking/selection";

// Primeiro passo: "Qualquer <profissional>" vem primeiro; o servidor escolhe quem atende.
export default function EscolhaProfissional({ professionals, selectedId, onSelect, title, subtitle, terms }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const data = professionals.length > 0 ? [{ id: ANY_PROFESSIONAL, name: `Qualquer ${terms.professional.singular.toLowerCase()}` }, ...professionals] : [];

  const renderItem = ({ item }) => {
    const selected = selectedId === item.id;
    const isAny = item.id === ANY_PROFESSIONAL;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelect(item.id)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[styles.card, { backgroundColor: selected ? c.brandTint : c.surface, borderColor: selected ? c.brand : c.line }]}
      >
        {isAny ? (
          <View style={[styles.anyIcon, { backgroundColor: c.brandTint }]}>
            <Icon name="users" size={26} color={c.brand} />
          </View>
        ) : (
          <Avatar source={item.avatarUrl} name={item.name} size="lg" />
        )}
        <Text style={[styles.name, { color: c.ink }]} numberOfLines={2}>{item.name}</Text>
        {!isAny && item.bio ? <Text style={[styles.bio, { color: c.inkMuted }]} numberOfLines={2}>{item.bio}</Text> : null}
        {selected ? <Text style={[styles.picked, { color: c.brandText }]}>Escolhido</Text> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.ink }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: c.inkMuted }]}>{subtitle}</Text>
      </View>
      <FlatList data={data} renderItem={renderItem} keyExtractor={(item) => item.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  title: { ...type.h2 },
  subtitle: { ...type.small, marginTop: 2 },
  list: { paddingHorizontal: 24, paddingBottom: 4, gap: 12 },
  card: { width: 148, minHeight: 176, borderWidth: 1, borderRadius: radius.lg, padding: 14, alignItems: "center" },
  anyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.textBold, fontSize: 15, lineHeight: 20, textAlign: "center", marginTop: 10 },
  bio: { ...type.caption, textAlign: "center", marginTop: 4 },
  picked: { fontFamily: fonts.textSemi, fontSize: 12, marginTop: 8 },
});
