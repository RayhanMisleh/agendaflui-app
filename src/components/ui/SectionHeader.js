import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { fonts } from "../../theme/tokens";

const SectionHeader = ({
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actionText && (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={styles.action}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  action: {
    fontFamily: fonts.textSemi,
    fontSize: 14,
    color: theme.colors.brand,
  },
});

export default SectionHeader;
