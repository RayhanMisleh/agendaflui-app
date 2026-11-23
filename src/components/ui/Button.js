import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { useReduceMotion, pressFeedback } from "../../utils/motion";
import { radius, fonts } from "../../theme/tokens";

const Button = ({
  title,
  onPress,
  variant = "primary", // primary, secondary, outline, ghost
  size = "md", // sm, md, lg
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const reduceMotion = useReduceMotion();

  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondary;
      case "outline":
        return styles.outline;
      case "ghost":
        return styles.ghost;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.textSecondary;
      case "outline":
        return styles.textOutline;
      case "ghost":
        return styles.textGhost;
      default:
        return styles.textPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return styles.sizeSm;
      case "lg":
        return styles.sizeLg;
      default:
        return styles.sizeMd;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case "sm":
        return styles.textSm;
      case "lg":
        return styles.textLg;
      default:
        return styles.textMd;
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
        pressFeedback(pressed, reduceMotion),
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? theme.colors.onBrand : theme.colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={[styles.text, getTextStyle(), getTextSizeStyle(), textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </Pressable>
  );
};

const getStyles = (theme) => StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: theme.colors.brand,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  // Sizes
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sizeMd: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  sizeLg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  // Text styles
  text: {
    fontFamily: fonts.textBold,
  },
  textPrimary: {
    color: theme.colors.onBrand,
  },
  textSecondary: {
    color: theme.colors.textPrimary,
  },
  textOutline: {
    color: theme.colors.primary,
  },
  textGhost: {
    color: theme.colors.primary,
  },
  textSm: {
    fontSize: 14,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 17,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  // Icons
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
