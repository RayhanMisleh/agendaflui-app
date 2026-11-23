import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, useWindowDimensions, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../components/ui/Icon";
import Chip from "../components/ui/Chip";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import ProductPrice from "../components/ProductPrice";
import { useTheme } from "../utils/ThemeContext";
import { useBusiness } from "../business/BusinessProvider";
import { listCategories, listProducts } from "../api/store";
import { fonts, radius, type } from "../theme/tokens";

const GAP = 12;
const PADDING = 16;

const ProductsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { slug } = useBusiness();
  const { width } = useWindowDimensions();
  const columns = width >= 768 ? 3 : 2;
  const itemWidth = (Math.min(width, 800) - PADDING * 2 - GAP * (columns - 1)) / columns;

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(null);
  const turn = useRef(0);

  // Categorias da loja (nenhuma lista fixa). Se falhar, a lista de produtos continua valendo.
  useEffect(() => {
    let cancelled = false;
    setCategories([]);
    setCategoryId(null);
    listCategories()
      .then((items) => {
        if (!cancelled) setCategories(items.filter((cat) => cat.productCount > 0));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const load = useCallback(
    async ({ pull = false } = {}) => {
      const mine = ++turn.current;
      if (pull) setRefreshing(true);
      else setLoading(true);
      setFailed(null);
      try {
        const page = await listProducts({ categoryId: categoryId || undefined });
        if (mine !== turn.current) return;
        setProducts(page.items);
        setCursor(page.nextCursor);
      } catch (error) {
        if (mine !== turn.current) return;
        setFailed(error.message);
        setProducts([]);
        setCursor(null);
      } finally {
        if (mine === turn.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [categoryId, slug]
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    const mine = turn.current;
    setLoadingMore(true);
    try {
      const page = await listProducts({ categoryId: categoryId || undefined, cursor });
      if (mine !== turn.current) return;
      setProducts((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } catch (error) {
      setFailed(error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderItem = ({ item }) => {
    const image = item.images && item.images[0] ? item.images[0].url : null;
    return (
      <TouchableOpacity
        style={[styles.card, { width: itemWidth, backgroundColor: c.surface, borderColor: c.line }]}
        onPress={() => navigation.navigate("SingleProduct", { productId: item.id })}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        <View style={[styles.imageBox, { backgroundColor: c.brandTint }]}>
          {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="cover" /> : <Icon name="image" size={32} color={c.brand} />}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: c.ink }]} numberOfLines={2}>{item.name}</Text>
          {item.available ? (
            <ProductPrice product={item} />
          ) : (
            <Text style={[styles.soldOut, { color: c.inkMuted }]}>Esgotado</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const chips = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      <Chip label="Todos" size="sm" selected={categoryId === null} onPress={() => setCategoryId(null)} />
      {categories.map((cat) => (
        <Chip key={cat.id} label={cat.name} size="sm" selected={categoryId === cat.id} onPress={() => setCategoryId(cat.id)} />
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.ground }]} edges={["bottom"]}>
      {categories.length > 0 ? chips : null}
      {loading ? (
        <View style={styles.skeletons} accessibilityRole="progressbar" accessibilityLabel="Carregando">
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={key} width={itemWidth} height={itemWidth + 70} style={{ borderRadius: radius.lg }} />
          ))}
        </View>
      ) : failed && products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.ink }]}>Não deu para carregar a loja</Text>
          <Text style={[styles.emptyText, { color: c.inkMuted }]}>{failed}</Text>
          <Button title="Tentar de novo" onPress={() => load()} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={columns}
          key={columns}
          columnWrapperStyle={columns > 1 ? styles.row : undefined}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ pull: true })} tintColor={c.brand} colors={[c.brand]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: c.ink }]}>Nenhum produto por aqui</Text>
              <Text style={[styles.emptyText, { color: c.inkMuted }]}>
                {categoryId ? "Essa categoria ainda não tem produtos." : "A loja ainda não tem produtos à venda."}
              </Text>
            </View>
          }
          ListFooterComponent={
            cursor ? <Button title="Carregar mais" variant="secondary" onPress={loadMore} loading={loadingMore} style={{ marginTop: 4 }} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  chips: { paddingHorizontal: PADDING, paddingVertical: 12, gap: 8, alignItems: "center" },
  list: { paddingHorizontal: PADDING, paddingBottom: 40, flexGrow: 1 },
  row: { gap: GAP, marginBottom: GAP },
  skeletons: { flexDirection: "row", flexWrap: "wrap", gap: GAP, paddingHorizontal: PADDING, paddingTop: 12 },
  card: { borderWidth: 1, borderRadius: radius.lg, overflow: "hidden" },
  imageBox: { width: "100%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  info: { padding: 12 },
  name: { fontFamily: fonts.textSemi, fontSize: 14, lineHeight: 19, minHeight: 38, marginBottom: 6 },
  soldOut: { fontFamily: fonts.textSemi, fontSize: 14, lineHeight: 22 },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 },
  emptyTitle: { ...type.h2, textAlign: "center" },
  emptyText: { ...type.body, textAlign: "center", marginTop: 8 },
});

export default ProductsScreen;
