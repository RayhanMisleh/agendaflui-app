import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Dimensions, ActivityIndicator, Image } from "react-native";
import { useTheme } from "../utils/ThemeContext";

const { width } = Dimensions.get("window");
const LOGO_WIDTH = Math.min(width * 0.6, 280);

export default function LoadingScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const logo = theme.isDarkMode
    ? require("../../assets/logo-horizontal-negativo.png")
    : require("../../assets/logo-horizontal.png");

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.ground,
    },
    logo: {
      width: LOGO_WIDTH,
      height: LOGO_WIDTH * (256 / 1200),
    },
    loader: {
      marginTop: 32,
    },
  });
