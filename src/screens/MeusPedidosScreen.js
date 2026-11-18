import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import Skeleton from "../components/ui/Skeleton";
import OrderStatusBadge from "../components/ui/OrderStatusBadge";
import { useBusiness } from "../business/BusinessProvider";
import { useTheme } from "../utils/ThemeContext";
import { listOrders } from "../api/store";
import { formatCents } from "../store/order";
import { fonts, radius, type } from "../theme/tokens";

const MeusPedidosScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { slug } = useBusiness();
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(null);
  const turn = useRef(0);

  const load = useCallback(async ({ pull = false } = {}) => {
    const mine = ++turn.current;
    if (pull) setRefreshing(true);
    else setLoading(true);
    setFailed(null);
    try {
      const page = await listOrders({});
      if (mine !== turn.current) return;
      setOrders(page.items);
      setCursor(page.nextCursor);
    } catch (error) {
      if (mine !== turn.current) return;
      setFailed(error.message);
      setOrders([]);
      setCursor(null);
    } finally {
      if (mine === turn.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // A lista volta a ser buscada ao entrar na tela (o pagamento pode ter acontecido enquanto isso).
  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener("focus", () => load({ pull: true }));
    return unsubscribe;
  }, [slug, load, navigation]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    const mine = turn.current;
    setLoadingMore(true);
    try {
      const page = await listOrders({ cursor });
      if (mine !== turn.current) return;
      setOrders((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch (error) {
      setFailed(error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderItem = ({ item }) => {
    const count = item.items.reduce((sum, line) => sum + line.quantity, 0);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate("PedidoDetalhes", { orderId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`Pedido ${item.number}`}
        style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}
      >
        <View style={styles.top}>
          <Text style={[styles.number, { color: c.ink }]}>Pedido {item.number}</Text>
          <Text style={[styles.total, { color: c.ink }]}>{formatCents(item.totalCents)}</Text>
        </View>
        <Text style={[styles.small, { color: c.inkMuted }]}>{item.createdLabel} · {count} {count === 1 ? "item" : "itens"}</Text>
        <OrderStatusBadge order={item} style={{ marginTop: 10 }} />
        {item.status === "AWAITING_PAYMENT" ? <Text style={[styles.small, { color: c.inkMuted, marginTop: 8 }]}>Pague até {item.expiresLabel}.</Text> : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.ground }]} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.getParent()?.goBack())} accessibilityRole="button" accessibilityLabel="Voltar">
          <Icon name="arrow-left" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.ink }]}>Meus pedidos</Text>
        <View style={styles.back} />
      </View>

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} width="100%" height={110} style={{ borderRadius: radius.lg, marginBottom: 12 }} />
          ))}
        </View>
      ) : failed && orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.ink }]}>Não deu para carregar</Text>
          <Text style={[styles.emptyText, { color: c.inkMuted }]}>{failed}</Text>
          <Button title="Tentar de novo" onPress={() => load()} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} tintColor={c.brand} colors={[c.brand]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: c.ink }]}>Nenhum pedido ainda</Text>
              <Text style={[styles.emptyText, { color: c.inkMuted }]}>Seus pedidos da loja aparecem aqui.</Text>
            </View>
          }
          ListFooterComponent={cursor ? <Button title="Carregar mais" variant="secondary" onPress={loadMore} loading={loadingMore} style={{ marginTop: 4 }} /> : null}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...type.h2 },
  list: { padding: 20, paddingTop: 8, flexGrow: 1 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: 16, marginBottom: 12 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  number: { fontFamily: fonts.textBold, fontSize: 16 },
  total: { ...type.time, fontSize: 17 },
  small: { ...type.small, marginTop: 2 },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { ...type.h2, textAlign: "center" },
  emptyText: { ...type.body, textAlign: "center", marginTop: 8 },
});

export default MeusPedidosScreen;
