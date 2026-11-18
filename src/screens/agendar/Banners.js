import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Image, TouchableOpacity, Animated, Alert, Linking, Dimensions } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { getBanners } from "../../api/legado";

// Movido de AgendarScreen sem reescrever (a Tarefa 5 refaz com /v1/banners).
const { width } = Dimensions.get("window");

const Banners = () => {
  const { theme } = useTheme();
  const BANNER_WIDTH = theme.isTablet ? width - 80 : width - 48;
  const styles = getStyles(theme);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    getBanners()
      .then((data) => setBanners(data || []))
      .catch(() => setBanners([]));
  }, []);

  const renderBanner = ({ item, index }) => {
    const inputRange = [
      (index - 1) * BANNER_WIDTH,
      index * BANNER_WIDTH,
      (index + 1) * BANNER_WIDTH,
    ];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.95, 1, 0.95],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (item.redirect_url) {
            Linking.openURL(item.redirect_url).catch(() => {
              Alert.alert("Erro", "Não foi possível abrir o link.");
            });
          }
        }}
        style={[styles.bannerContainer, { transform: [{ scale }] }]}
      >
        <Image
          source={{ uri: item.image_url }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        {/* Remover overlay de texto para banners profissionais que já vêm com arte */}
      </TouchableOpacity>
    );
  };


  return (
    <>
        {banners.length > 0 && (
          <View style={[styles.bannersSection, { marginBottom: 0 }]}>
            <Animated.FlatList
              data={banners}
              renderItem={renderBanner}
              keyExtractor={(item) => String(item.banner_id || item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={BANNER_WIDTH + 16}
              decelerationRate="fast"
              contentContainerStyle={styles.bannerList}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true },
              )}
            />
            {/* Indicadores */}
            <View style={styles.indicators}>
              {banners.map((_, index) => {
                const inputRange = [
                  (index - 1) * BANNER_WIDTH,
                  index * BANNER_WIDTH,
                  (index + 1) * BANNER_WIDTH,
                ];
                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: "clamp",
                });
                return (
                  <Animated.View
                    key={index}
                    style={[styles.indicator, { opacity }]}
                  />
                );
              })}
            </View>
          </View>
        )}
    </>
  );
};

const getStyles = (theme) => {
  const BANNER_WIDTH = theme.isTablet ? width - 80 : width - 48;
  return StyleSheet.create({
    bannersSection: {
      marginBottom: 32,
    },
    bannerList: {
      paddingHorizontal: 24,
    },
    bannerContainer: {
      width: BANNER_WIDTH,
      height: theme.isTablet ? 350 : 160,
      marginRight: 16,
      borderRadius: theme.borderRadius.lg,
      overflow: "hidden",
    },
    bannerImage: {
      width: "100%",
      height: "100%",
    },
    bannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
      padding: 20,
    },
    bannerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#FFF",
    },
    bannerSubtitle: {
      fontSize: 14,
      color: "rgba(255,255,255,0.9)",
      marginTop: 4,
    },
    indicators: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 12,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginHorizontal: 4,
    },
  });
};

export default Banners;
