import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../utils/ThemeContext";
import BrandLogo from "./ui/BrandLogo";
import Icon from "./ui/Icon";
import CarrinhoComponent from "./CarrinhoComponent";
import { useAuth } from "./AuthProvider";
import { useCart } from "../store/useCart";
import { fonts, radius } from "../theme/tokens";

// Topo da Loja: voltar, logo da loja e o carrinho (ou "Entrar" para visitante).
const CustomHeader = () => {
  const [showCart, setShowCart] = useState(false);
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { count } = useCart();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  return (
    <>
      <View
        style={[
          styles.header,
          { paddingTop: (insets.top || (Platform.OS === "ios" ? 44 : 20)) + 6, backgroundColor: c.ground, borderBottomColor: c.line },
        ]}
      >
        <View style={styles.side}>
          {navigation.canGoBack() ? (
            <TouchableOpacity
              style={[styles.round, { borderColor: c.line, backgroundColor: c.surface }]}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Icon name="arrow-left" size={20} color={c.ink} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.logoBox}>
          <BrandLogo style={styles.logo} />
        </View>

        <View style={[styles.side, { alignItems: "flex-end" }]}>
          {isAuthenticated ? (
            <TouchableOpacity
              style={[styles.round, { borderColor: c.line, backgroundColor: c.surface }]}
              onPress={() => setShowCart(true)}
              accessibilityRole="button"
              accessibilityLabel={count > 0 ? `Carrinho, ${count} ${count === 1 ? "item" : "itens"}` : "Carrinho"}
            >
              <Icon name="shopping-cart" size={20} color={c.ink} />
              {count > 0 ? (
                <View style={[styles.badge, { backgroundColor: c.brand, borderColor: c.ground }]}>
                  <Text style={[styles.badgeText, { color: c.onBrand }]}>{count > 99 ? "99+" : count}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.login, { backgroundColor: c.brand }]}
              onPress={() => navigation.navigate("Login")}
              accessibilityRole="button"
            >
              <Text style={[styles.loginText, { color: c.onBrand }]}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isAuthenticated ? (
        <CarrinhoComponent
          visible={showCart}
          onClose={() => setShowCart(false)}
          onGoToCart={() => {
            setShowCart(false);
            navigation.navigate("Carrinho");
          }}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  side: { width: 64, justifyContent: "center" },
  round: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  logoBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { width: 140, height: 30 },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: fonts.textBold, fontSize: 10 },
  login: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill },
  loginText: { fontFamily: fonts.textBold, fontSize: 14 },
});

export default CustomHeader;
