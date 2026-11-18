import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Icon from "./Icon";
import { useTheme } from "../../utils/ThemeContext";

// Selo dos pontos: círculo caramelo com estrela de traço em tinta (caramelo nunca é cor de texto).
const PointsIcon = ({ size = 20, style }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.caramelo },
        style,
      ]}
    >
      <Icon name="star" size={Math.round(size * 0.6)} color={theme.colors.ink} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
});

export default memo(PointsIcon);
