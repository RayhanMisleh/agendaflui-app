import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { getStaffCustomer, listCustomerAppointments } from "../../api/staff";
import { useTerms } from "../../business/BusinessProvider";
import { useTheme } from "../../utils/ThemeContext";
import { ROUTES } from "../../navigation/routes";
import { contactLinks } from "../forms";
import ScreenHeader from "../components/ScreenHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import Skeleton from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import FormMessage from "../../components/entry/FormMessage";
import { radius, type } from "../../theme/tokens";

// Lista paginada por cursor de um recorte ("upcoming" ou "past") dos atendimentos do cliente.
function useAppointments(customerId, scope) {
  const [state, setState] = useState({ items: [], nextCursor: null, loading: true, error: "" });

  const load = useCallback(
    async (cursor) => {
      setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const page = await listCustomerAppointments(customerId, { scope, cursor });
        setState((s) => ({ items: cursor ? [...s.items, ...page.items] : page.items, nextCursor: page.nextCursor || null, loading: false, error: "" }));
      } catch (failure) {
        setState((s) => ({ ...s, loading: false, error: failure.message }));
      }
    },
    [customerId, scope]
  );

  useEffect(() => {
    load(null);
  }, [load]);

  return { ...state, more: () => state.nextCursor && !state.loading && load(state.nextCursor) };
}

function AppointmentList({ title, list, emptyText, styles, chevronColor, onOpen }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {list.error ? <FormMessage kind="error">{list.error}</FormMessage> : null}
      {list.items.map((item) => (
        <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.8} onPress={() => onOpen(item.id)} accessibilityRole="button">
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>{item.local ? `${item.local.date.split("-").reverse().join("/")} às ${item.local.start}` : ""}</Text>
            <Text style={styles.muted} numberOfLines={2}>
              {(item.items || []).map((service) => service.name).join(", ")}
            </Text>
            <StatusBadge status={item.status} style={styles.badge} />
          </View>
          <Icon name="chevron-right" size={20} color={chevronColor} />
        </TouchableOpacity>
      ))}
      {list.loading ? <Skeleton height={64} style={styles.skeleton} /> : null}
      {!list.loading && !list.error && list.items.length === 0 ? <Text style={styles.muted}>{emptyText}</Text> : null}
      {list.nextCursor && !list.loading ? <Button title="Ver mais" variant="secondary" size="sm" onPress={list.more} style={styles.more} /> : null}
    </View>
  );
}

// Ficha do cliente para a equipe: contato, anotação interna e atendimentos com a loja.
export default function ClienteEquipeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { params } = useRoute();
  const customerId = params ? params.customerId : null;
  const terms = useTerms();
  const styles = getStyles(theme);

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const upcoming = useAppointments(customerId, "upcoming");
  const past = useAppointments(customerId, "past");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStaffCustomer(customerId)
      .then((data) => {
        if (!cancelled) setCustomer(data);
      })
      .catch((failure) => {
        // 403 (sem permissão) e 404 viram mensagem na tela
        if (!cancelled) setError(failure.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const open = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (failure) {
      Toast.show({ type: "error", text1: "Não deu para abrir", text2: "Este aparelho não consegue abrir o contato." });
    }
  };

  const openAppointment = (appointmentId) => navigation.navigate(ROUTES.Atendimento, { appointmentId });
  const links = contactLinks(customer);

  const body = () => {
    if (loading) {
      return (
        <View style={styles.content}>
          <Skeleton height={96} style={styles.skeleton} />
        </View>
      );
    }
    if (!customer) {
      return (
        <View style={styles.content}>
          <FormMessage kind="error">{error || "Não deu para abrir esta ficha."}</FormMessage>
          <Button title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      );
    }
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <Text style={styles.name} accessibilityRole="header">
            {customer.name}
          </Text>
          {customer.isClubMember ? (
            <View style={styles.tag}>
              <Icon name="award" size={14} color={theme.colors.ink} />
              <Text style={styles.tagText}>{`${terms.customer.singular} do ${terms.club}`}</Text>
            </View>
          ) : null}
        </View>

        {links.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Contato
            </Text>
            {links.map((link) => (
              <TouchableOpacity key={link.kind} style={styles.card} activeOpacity={0.8} onPress={() => open(link.url)} accessibilityRole="link" accessibilityLabel={`${link.kind === "phone" ? "Ligar para" : "Escrever para"} ${link.label}`}>
                <Icon name={link.kind === "phone" ? "phone" : "mail"} size={20} color={theme.colors.ink} />
                <Text style={[styles.cardTitle, styles.contact]}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {customer.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Anotação interna
            </Text>
            <View style={styles.card}>
              <Text style={styles.text}>{customer.notes}</Text>
            </View>
          </View>
        ) : null}

        <AppointmentList title="Próximos" list={upcoming} emptyText="Nenhum atendimento marcado." styles={styles} chevronColor={theme.colors.inkMuted} onOpen={openAppointment} />
        <AppointmentList title="Histórico" list={past} emptyText="Nenhum atendimento anterior." styles={styles} chevronColor={theme.colors.inkMuted} onOpen={openAppointment} />
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={terms.customer.singular} />
      {body()}
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.ground },
    content: { padding: 20, paddingBottom: 40 },
    flex: { flex: 1 },
    profile: { marginBottom: 20 },
    name: { ...type.title, color: theme.colors.ink },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      marginTop: 8,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.line,
      backgroundColor: theme.colors.brandTint,
    },
    tagText: { ...type.caption, color: theme.colors.ink },
    section: { marginBottom: 20 },
    sectionTitle: { ...type.h2, color: theme.colors.ink, marginBottom: 12 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      marginBottom: 12,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.line,
      backgroundColor: theme.colors.surface,
    },
    cardTitle: { ...type.bodyStrong, color: theme.colors.ink },
    contact: { marginLeft: 12 },
    text: { ...type.body, color: theme.colors.ink, flex: 1 },
    muted: { ...type.small, color: theme.colors.inkMuted, marginTop: 2 },
    badge: { marginTop: 8 },
    skeleton: { marginBottom: 12 },
    more: { alignSelf: "flex-start" },
  });
