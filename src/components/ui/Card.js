import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../utils/ThemeContext";
import { useReduceMotion, pressFeedback } from "../../utils/motion";
import { radius } from "../../theme/tokens";

const Card = ({
  children,
  style,
  variant = "elevated", // elevated, outlined, flat
  padding = "md", // none, sm, md, lg
  onPress,
  ...rest
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const reduceMotion = useReduceMotion();

  const getVariantStyle = () => {
    switch (variant) {
      case "outlined":
        return styles.outlined;
      case "flat":
        return styles.flat;
      default:
        return styles.elevated;
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case "none":
        return styles.paddingNone;
      case "sm":
        return styles.paddingSm;
      case "lg":
        return styles.paddingLg;
      default:
        return styles.paddingMd;
    }
  };

  const base = [styles.base, getVariantStyle(), getPaddingStyle(), style];

  // Cartão tocável: responde ao toque. Sem onPress, continua só uma caixa.
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [...base, pressFeedback(pressed, reduceMotion)]} {...rest}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={base} {...rest}>
      {children}
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: radius.lg,
  },
  // Variants
  elevated: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  outlined: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  flat: {
    backgroundColor: theme.colors.brandTint,
  },
  // Padding
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: theme.spacing.sm,
  },
  paddingMd: {
    padding: theme.spacing.md,
  },
  paddingLg: {
    padding: theme.spacing.lg,
  },
});

export default Card;
