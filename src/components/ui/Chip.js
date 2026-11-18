import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { radius, fonts } from "../../theme/tokens";

const Chip = ({
  label,
  selected = false,
  onPress,
  icon,
  size = "md", // sm, md
  style,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <TouchableOpacity
      style={[
        styles.base,
        size === "sm" ? styles.sizeSm : styles.sizeMd,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const getStyles = (theme) => StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 32,
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  selected: {
    backgroundColor: theme.colors.brandTint,
    borderWidth: 1,
    borderColor: theme.colors.brand,
  },
  unselected: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.textMedium,
    color: theme.colors.inkMuted,
  },
  labelSelected: {
    color: theme.colors.ink,
    fontFamily: fonts.textSemi,
  },
  icon: {
    marginRight: 6,
  },
});

export default Chip;
