import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PointsIcon from "./PointsIcon";
import { useTheme } from "../../utils/ThemeContext";
import { fonts } from "../../theme/tokens";

const PointsDisplay = ({
  amount,
  label, // nome dos pontos na conta (vem de quem chama)
  size = "md", // sm, md, lg
  showIcon = true,
  style,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return { fontSize: 13, iconSize: 14 };
      case "lg":
        return { fontSize: 20, iconSize: 22 };
      default:
        return { fontSize: 16, iconSize: 18 };
    }
  };

  const sizeConfig = getSizeStyles();
  const displayAmount = amount !== undefined && amount !== null ? Number(amount).toLocaleString("pt-BR") : "0";

  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <PointsIcon size={sizeConfig.iconSize} style={styles.imageIconContainer} />
      )}
      <Text style={[styles.amount, { fontSize: sizeConfig.fontSize }]}>
        {displayAmount}
      </Text>
      {size === "lg" && !!label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageIconContainer: {
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  amount: {
    fontFamily: fonts.display,
    color: theme.colors.ink,
  },
  label: {
    fontFamily: fonts.textMedium,
    fontSize: 12,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
});

export default PointsDisplay;
