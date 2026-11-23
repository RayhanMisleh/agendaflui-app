import React, { useState } from "react";
import { View, Text, Switch, StyleSheet, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import { useStaffSession } from "../StaffSessionProvider";
import { useBusiness } from "../../business/BusinessProvider";
import { useTheme } from "../../utils/ThemeContext";
import { setNotifyAll } from "../../api/staff";
import { confirmAction } from "../../utils/dialog";
import { config } from "../../config";
import { Secao, MenuLista, Rodape } from "../../screens/perfil/MenuConta";
import { radius, type } from "../../theme/tokens";

// Só quem vê todas as agendas escolhe receber os avisos da loja inteira.
export function canSeeAllAgendas(profile) {
  return Boolean(profile && Array.isArray(profile.capabilities) && profile.capabilities.includes("view_all_agendas"));
}

export default function PerfilEquipeScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { business } = useBusiness();
  const { member, profile, signOut, refreshProfile } = useStaffSession();
  const styles = getStyles(theme);
  const [leaving, setLeaving] = useState(false);
  const [savingNotify, setSavingNotify] = useState(false);
  const [notifyAll, setNotifyAllValue] = useState(null); // null: vale o que veio do servidor

  const name = (profile && profile.name) || (member && member.name) || "";
  const roleLabel = profile ? profile.roleLabel : "";
  const showNotify = canSeeAllAgendas(profile);
  const notifyValue = notifyAll !== null ? notifyAll : Boolean(profile && profile.notifyAllAppointments);

  const toggleNotify = async (value) => {
    if (savingNotify) return;
    setSavingNotify(true);
    setNotifyAllValue(value);
    try {
      await setNotifyAll(value);
      await refreshProfile();
      setNotifyAllValue(null);
    } catch (error) {
      // desfaz: a escolha só vale se o servidor aceitou
      setNotifyAllValue(null);
      Toast.show({ type: "error", text1: "Não deu para salvar", text2: error.message });
    } finally {
      setSavingNotify(false);
    }
  };

  const logout = async () => {
    const ok = await confirmAction({
      title: "Sair da conta",
      message: "Quer sair? Você precisará entrar de novo para ver a agenda.",
      confirmText: "Sair",
      cancelText: "Ficar",
    });
    if (!ok || leaving) return;
    setLeaving(true);
    try {
      await signOut();
    } finally {
      setLeaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.name} accessibilityRole="header">
            {name}
          </Text>
          {roleLabel ? <Text style={styles.role}>{roleLabel}</Text> : null}
          <Text style={styles.store}>{business ? business.name : ""}</Text>
        </View>

        {showNotify ? (
          <Secao title="Avisos">
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Receber avisos de toda a loja</Text>
                <Text style={styles.rowHint}>Você recebe os avisos dos horários de todos os profissionais.</Text>
              </View>
              <Switch
                value={notifyValue}
                onValueChange={toggleNotify}
                disabled={savingNotify}
                trackColor={{ true: c.brand, false: c.line }}
                accessibilityLabel="Receber avisos de toda a loja"
              />
            </View>
          </Secao>
        ) : null}

        <Secao title="Painel">
          <MenuLista
            items={[{ icon: "external-link", label: "Abrir painel completo", onPress: () => Linking.openURL(config.painelUrl).catch(() => {}) }]}
          />
        </Secao>

        <View style={styles.logout}>
          <Button
            title="Sair"
            onPress={logout}
            loading={leaving}
            fullWidth
            icon={<Icon name="log-out" size={18} color={c.onBrand} />}
          />
        </View>

        <Rodape />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.ground },
    content: { padding: 20, paddingBottom: 40, width: "100%", maxWidth: 560, alignSelf: "center" },
    card: {
      padding: 20,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.line,
      backgroundColor: theme.colors.surface,
    },
    name: { ...type.h2, color: theme.colors.ink },
    role: { ...type.bodyStrong, color: theme.colors.ink, marginTop: 4 },
    store: { ...type.small, color: theme.colors.inkMuted, marginTop: 4 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.line,
      backgroundColor: theme.colors.surface,
    },
    rowText: { flex: 1, marginRight: 12 },
    rowTitle: { ...type.bodyStrong, color: theme.colors.ink },
    rowHint: { ...type.caption, color: theme.colors.inkMuted, marginTop: 2 },
    logout: { marginTop: 24 },
  });
