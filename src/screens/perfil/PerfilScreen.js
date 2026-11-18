import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Linking, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Skeleton from "../../components/ui/Skeleton";
import { useAuth } from "../../components/AuthProvider";
import { useBusiness, useTerms } from "../../business/BusinessProvider";
import { useTheme } from "../../utils/ThemeContext";
import { CartService } from "../../services/cartService";
import { unregisterDevice } from "../../services/notificationService";
import { getMe } from "../../api/me";
import { getMyLoyalty } from "../../api/loyalty";
import { config } from "../../config";
import { confirmAction } from "../../utils/dialog";
import CartaoPerfil from "./CartaoPerfil";
import PerfilVisitante from "./PerfilVisitante";
import RankingCard from "./RankingCard";
import { Secao, MenuLista, SeletorTema, Rodape } from "./MenuConta";

const open = (url) => Linking.openURL(url).catch(() => {});

const PerfilScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isAuthenticated, endSession } = useAuth();
  const { business, slug, switchBusiness } = useBusiness();
  const terms = useTerms();
  const [me, setMe] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loyaltyOn = Boolean(business && business.modules && business.modules.loyalty);

  const loadMe = useCallback(async () => {
    try {
      setMe(await getMe());
    } catch (error) {
      Toast.show({ type: "error", text1: "Não deu para carregar o perfil", text2: error.message });
    }
    // Saldo só com o módulo ligado; falha ou módulo desligado = sem saldo no cartão, sem erro.
    try {
      setBalance(loyaltyOn ? (await getMyLoyalty()).balance : null);
    } catch (error) {
      setBalance(null);
    }
  }, [loyaltyOn]);

  useEffect(() => {
    setMe(null);
    setBalance(null);
    if (!isAuthenticated) return;
    setLoading(true);
    loadMe().finally(() => setLoading(false));
  }, [isAuthenticated, slug, loadMe]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isAuthenticated) await loadMe();
    setRefreshing(false);
  };

  const storeName = business ? business.name : "esta loja";

  const changeStore = async () => {
    const ok = await confirmAction({
      title: "Trocar de loja",
      message: isAuthenticated
        ? `Você sai da conta em ${storeName}. Depois é só escolher a outra loja.`
        : `Você deixa ${storeName} e escolhe outra loja.`,
      confirmText: "Trocar",
      cancelText: "Ficar",
    });
    if (ok) await switchBusiness();
  };

  const logout = async () => {
    const ok = await confirmAction({
      title: "Sair da conta",
      message: "Quer sair? Você precisará entrar de novo para agendar.",
      confirmText: "Sair",
      cancelText: "Ficar",
    });
    if (!ok || leaving) return;
    setLeaving(true);
    try {
      await unregisterDevice();
      await endSession();
      await CartService.clearAllCart().catch(() => {}); // a Tarefa 6 troca por clearCartFor
      if (Platform.OS === "web") {
        navigation.reset({ index: 0, routes: [{ name: "Intro" }] });
      } else {
        navigation.navigate("Agendar");
      }
    } finally {
      setLeaving(false);
    }
  };

  const modules = (business && business.modules) || {};

  const body = !isAuthenticated ? (
    <PerfilVisitante navigation={navigation} businessSwitch={changeStore} />
  ) : (
    <View>
      {loading || !me ? (
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <Skeleton width={80} height={80} style={{ borderRadius: 40, marginBottom: 16 }} />
          <Skeleton width={160} height={24} style={{ marginBottom: 8 }} />
          <Skeleton width={200} height={16} />
        </View>
      ) : (
        <CartaoPerfil me={me} storeName={storeName} terms={terms} balance={balance} onSaved={setMe} />
      )}

      {modules.loyalty ? <RankingCard terms={terms} slug={slug} /> : null}

      <Secao title="Conta">
        <MenuLista
          items={[
            { icon: "clock", label: "Histórico de agendamentos", onPress: () => navigation.navigate("HistoricoAgendamentos") },
            modules.store ? { icon: "shopping-bag", label: "Meus pedidos", onPress: () => navigation.navigate("MeusPedidos") } : null,
            modules.loyalty ? { icon: "gift", label: "Histórico de prêmios", onPress: () => navigation.navigate("MinhaJornada") } : null,
            { icon: "lock", label: "Alterar senha", onPress: () => navigation.navigate("AlterarSenha") },
          ]}
        />
      </Secao>

      <Secao title="Informações">
        <MenuLista
          items={[
            { icon: "shield", label: "Política de privacidade", onPress: () => open(config.privacyUrl) },
            { icon: "file-text", label: "Termos de uso", onPress: () => open(config.termsUrl) },
          ]}
        />
      </Secao>

      <Secao title="Aparência">
        <SeletorTema />
      </Secao>

      <Secao title="Zona de perigo">
        <MenuLista items={[{ icon: "trash-2", label: "Excluir conta", destructive: true, onPress: () => navigation.navigate("ConfirmarExclusao") }]} />
      </Secao>

      <Secao title="Loja">
        <MenuLista items={[{ icon: "repeat", label: "Trocar de loja", onPress: changeStore }]} />
      </Secao>

      <View style={styles.logout}>
        <Button
          title="Sair da conta"
          onPress={logout}
          loading={leaving}
          fullWidth
          icon={<Icon name="log-out" size={18} color={c.onBrand} />}
        />
      </View>

      <Rodape />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.ground }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.brand]} tintColor={c.brand} />}
      >
        {body}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, width: "100%", maxWidth: 560, alignSelf: "center" },
  logout: { marginTop: 24 },
});

export default PerfilScreen;
