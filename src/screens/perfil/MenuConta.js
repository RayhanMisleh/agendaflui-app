import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from "react-native";
import Icon from "../../components/ui/Icon";
import { useTheme } from "../../utils/ThemeContext";
import { fonts, radius, type } from "../../theme/tokens";
import { config } from "../../config";

export function Secao({ title, children }) {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.inkMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

// Lista de itens: { icon, label, onPress, destructive }. Itens `null` ou falsos são ignorados.
export function MenuLista({ items }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const visible = items.filter(Boolean);
  return (
    <View style={[styles.list, { backgroundColor: c.surface, borderColor: c.line }]}>
      {visible.map((item, index) => (
        <View key={item.label}>
          {index > 0 ? <View style={[styles.separator, { backgroundColor: c.line }]} /> : null}
          <TouchableOpacity style={styles.item} onPress={item.onPress} activeOpacity={0.6} accessibilityRole="button">
            <View style={[styles.iconBox, { backgroundColor: item.destructive ? c.carameloTint : c.brandTint }]}>
              <Icon name={item.icon} size={18} color={item.destructive ? c.danger : c.brand} />
            </View>
            <Text style={[styles.label, { color: item.destructive ? c.danger : c.ink }]}>{item.label}</Text>
            <Icon name="chevron-right" size={20} color={c.inkMuted} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const THEMES = [
  { mode: "light", label: "Claro", icon: "sun" },
  { mode: "dark", label: "Escuro", icon: "moon" },
  { mode: "system", label: "Sistema", icon: "smartphone" },
];

export function SeletorTema() {
  const { theme, themeMode, changeTheme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.themeRow, { backgroundColor: c.surface, borderColor: c.line }]}>
      {THEMES.map((option) => {
        const active = themeMode === option.mode;
        return (
          <TouchableOpacity
            key={option.mode}
            style={[styles.themeOption, active && { backgroundColor: c.brandTint, borderColor: c.brand }]}
            onPress={() => changeTheme(option.mode)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Icon name={option.icon} size={20} color={active ? c.brandStrong : c.inkMuted} />
            <Text style={[styles.themeLabel, { color: active ? c.ink : c.inkMuted }]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Rodapé do perfil: "Feito com Agenda Flui" e o crédito da LRM (empresa do dono).
export function Rodape() {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={() => Linking.openURL(config.siteUrl).catch(() => {})} accessibilityRole="link">
        <Text style={[styles.footerLink, { color: c.ink }]}>Feito com Agenda Flui</Text>
      </TouchableOpacity>
      <Text style={[styles.footerText, { color: c.inkMuted }]}>© 2026 Agenda Flui. Todos os direitos reservados.</Text>
      <Text style={[styles.footerText, { color: c.inkMuted, marginTop: 16 }]}>App desenvolvido por</Text>
      <TouchableOpacity style={styles.brand} onPress={() => Linking.openURL("https://lrmsolutions.com.br").catch(() => {})} accessibilityRole="link">
        <View style={[styles.logoWrap, { backgroundColor: c.line }]}>
          <Image source={require("../../../assets/lrm_logo.png")} style={styles.logo} resizeMode="cover" />
        </View>
        <Text style={[styles.footerLink, { color: c.inkMuted }]}>LRM Software Solutions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionTitle: { ...type.small, fontFamily: fonts.textSemi, marginBottom: 8, marginLeft: 4 },
  list: { borderWidth: 1, borderRadius: radius.lg, overflow: "hidden" },
  separator: { height: 1, marginLeft: 64 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14 },
  iconBox: { width: 36, height: 36, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  label: { ...type.bodyStrong, flex: 1, marginLeft: 14 },
  themeRow: { flexDirection: "row", borderWidth: 1, borderRadius: radius.lg, padding: 6, gap: 6 },
  themeOption: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: "transparent" },
  themeLabel: { ...type.caption, marginTop: 4 },
  footer: { alignItems: "center", marginTop: 32, marginBottom: 16 },
  footerLink: { ...type.small, fontFamily: fonts.textSemi },
  footerText: { ...type.caption, marginTop: 4, textAlign: "center" },
  brand: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  logoWrap: { width: 20, height: 20, borderRadius: 10, overflow: "hidden", marginRight: 8 },
  logo: { width: "100%", height: "100%" },
});
