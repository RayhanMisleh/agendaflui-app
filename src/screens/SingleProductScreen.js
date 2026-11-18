import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import Skeleton from "../components/ui/Skeleton";
import QuantityStepper from "../components/ui/QuantityStepper";
import ProductPrice from "../components/ProductPrice";
import { useAuth } from "../components/AuthProvider";
import { useTheme } from "../utils/ThemeContext";
import { useCart } from "../store/useCart";
import { getProduct } from "../api/store";
import { fonts, radius, type } from "../theme/tokens";

export default function SingleProductScreen({ route, navigation }) {
  const { productId } = route.params;
  const { theme } = useTheme();
  const c = theme.colors;
  const { isAuthenticated } = useAuth();
  const { cart, items } = useCart();
  const { width } = useWindowDimensions();
  const size = Math.min(width, 800);
  const [product, setProduct] = useState(null);
  const [failed, setFailed] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const load = () => {
    setFailed(null);
    setProduct(null);
    getProduct(productId)
      .then(setProduct)
      .catch((error) => setFailed(error.message));
  };

  useEffect(load, [productId]);

  const images = product && Array.isArray(product.images) ? product.images : [];
  const inCart = product ? (items.find((item) => item.productId === product.id) || { quantity: 0 }).quantity : 0;
  const room = product ? Math.max(0, product.maxQuantity - inCart) : 0;

  const add = async () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }
    if (!cart || room < 1) return;
    const qty = Math.min(quantity, room);
    await cart.add(product, qty);
    setQuantity(1);
    Toast.show({ type: "success", text1: "Está no carrinho", text2: `${qty}x ${product.name}`, visibilityTime: 3000 });
  };

  if (failed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.ground }]} edges={["bottom"]}>
        <View style={styles.center}>
          <Text style={[styles.title, { color: c.ink }]}>Não deu para abrir o produto</Text>
          <Text style={[styles.text, { color: c.inkMuted, textAlign: "center" }]}>{failed}</Text>
          <Button title="Tentar de novo" onPress={load} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.ground }]} edges={["bottom"]}>
        <Skeleton width="100%" height={size} style={{ borderRadius: 0 }} />
        <View style={styles.body}>
          <Skeleton width="70%" height={26} style={{ marginBottom: 12 }} />
          <Skeleton width="35%" height={30} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.ground }]} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.gallery, { width: size, height: size, backgroundColor: c.brandTint }]}>
          {images.length === 0 ? (
            <Icon name="image" size={64} color={c.brand} />
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / size);
                setImageIndex(Math.min(Math.max(index, 0), images.length - 1));
              }}
            >
              {images.map((image, index) => (
                <Image key={`${image.url}-${index}`} source={{ uri: image.url }} style={{ width: size, height: size }} resizeMode="cover" accessibilityLabel={product.name} />
              ))}
            </ScrollView>
          )}
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((image, index) => (
                <View key={`dot-${index}`} style={[styles.dot, { backgroundColor: index === imageIndex ? c.brand : c.line }]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: c.ink }]}>{product.name}</Text>
          <View style={{ marginTop: 8 }}>
            <ProductPrice product={product} large />
          </View>
          {product.description ? <Text style={[styles.text, { color: c.inkMuted, marginTop: 16 }]}>{product.description}</Text> : null}

          <View style={[styles.buy, { backgroundColor: c.surface, borderColor: c.line }]}>
            {!product.available ? (
              <Text style={[styles.soldOut, { color: c.ink }]}>Esgotado</Text>
            ) : (
              <>
                <View style={styles.qtyRow}>
                  <Text style={[styles.label, { color: c.ink }]}>Quantidade</Text>
                  <QuantityStepper value={Math.min(quantity, Math.max(room, 1))} max={Math.max(room, 1)} onChange={setQuantity} disabled={room < 1} />
                </View>
                {inCart > 0 ? <Text style={[styles.note, { color: c.inkMuted }]}>Você já tem {inCart} no carrinho.</Text> : null}
                {room < 1 ? <Text style={[styles.note, { color: c.inkMuted }]}>Você já pegou o máximo por pedido.</Text> : null}
                <Button
                  title={isAuthenticated ? "Pôr no carrinho" : "Entrar para comprar"}
                  onPress={add}
                  disabled={isAuthenticated && room < 1}
                  fullWidth
                  size="lg"
                  style={{ marginTop: 16 }}
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  gallery: { alignItems: "center", justifyContent: "center", alignSelf: "center" },
  dots: { position: "absolute", bottom: 12, flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { padding: 20, width: "100%", maxWidth: 800 },
  title: { ...type.h2 },
  text: { ...type.body },
  label: { fontFamily: fonts.textSemi, fontSize: 16 },
  buy: { borderWidth: 1, borderRadius: radius.lg, padding: 16, marginTop: 24 },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  note: { ...type.small, marginTop: 10 },
  soldOut: { fontFamily: fonts.textBold, fontSize: 16, textAlign: "center" },
});
