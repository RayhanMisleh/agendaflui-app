import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Animated, Linking, Dimensions } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { listBanners } from "../../api/banners";
import { notify } from "../../utils/dialog";
import { radius } from "../../theme/tokens";

const { width } = Dimensions.get("window");

// Só endereço https:// abre no navegador; rota do app (por exemplo /servicos) não leva a lugar nenhum.
function isWebLink(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

// Carrossel dos banners no ar hoje. Sem banner, sem módulo ou com falha: a seção some, sem erro na tela.
const Banners = ({ reloadKey = 0 }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const bannerWidth = theme.isTablet ? width - 80 : width - 48;
  const scrollX = useRef(new Animated.Value(0)).current;
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listBanners()
      .then((items) => {
        if (!cancelled) setBanners(Array.isArray(items) ? items.filter((b) => b && b.imageUrl) : []);
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (banners.length === 0) return null;

  const open = (url) => {
    Linking.openURL(url).catch(() => notify("Não deu para abrir o link"));
  };

  const range = (index) => [(index - 1) * bannerWidth, index * bannerWidth, (index + 1) * bannerWidth];

  const renderBanner = ({ item, index }) => {
    const scale = scrollX.interpolate({ inputRange: range(index), outputRange: [0.95, 1, 0.95], extrapolate: "clamp" });
    const linked = isWebLink(item.linkUrl);
    return (
      <Animated.View style={[styles.banner, { width: bannerWidth, height: theme.isTablet ? 350 : 160, borderColor: c.line, transform: [{ scale }] }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!linked}
          onPress={() => open(item.linkUrl)}
          accessibilityRole={linked ? "link" : "image"}
          accessibilityLabel={item.title}
          style={styles.fill}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.fill} resizeMode="cover" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.section}>
      <Animated.FlatList
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={bannerWidth + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
      />
      {banners.length > 1 ? (
        <View style={styles.indicators}>
          {banners.map((banner, index) => {
            const opacity = scrollX.interpolate({ inputRange: range(index), outputRange: [0.3, 1, 0.3], extrapolate: "clamp" });
            return <Animated.View key={banner.id} style={[styles.indicator, { backgroundColor: c.brand, opacity }]} />;
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 8 },
  list: { paddingHorizontal: 24 },
  banner: { marginRight: 16, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  fill: { width: "100%", height: "100%" },
  indicators: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  indicator: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
});

export default Banners;
