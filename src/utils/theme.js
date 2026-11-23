import { Dimensions } from "react-native";
import { colors as brandColors, radius } from "../theme/tokens";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

// Escala mais agressiva para iPad para preencher a tela
const scale = isTablet ? 1.8 : 1;

// Agenda Flui: as chaves antigas de cor apontam para os tokens da marca; as novas (brand, ink, line...) também ficam disponíveis.
export const buildColors = (palette) => ({
  ...palette,
  primary: palette.brand,
  primaryLight: palette.brand,
  primaryDark: palette.brandStrong,
  primaryForeground: palette.onBrand,
  brandText: palette.brandText,
  secondary: palette.ground,
  secondaryForeground: palette.ink,
  background: palette.ground,
  backgroundSecondary: palette.ground,
  foreground: palette.ink,
  textPrimary: palette.ink,
  textSecondary: palette.inkMuted,
  textMuted: palette.inkMuted,
  textLight: palette.inkMuted,
  card: palette.surface,
  cardForeground: palette.ink,
  muted: palette.ground,
  mutedForeground: palette.inkMuted,
  success: palette.success,
  successLight: palette.brandTint,
  successForeground: palette.onBrand,
  warning: palette.caramelo,
  warningLight: palette.carameloTint,
  error: palette.danger,
  errorLight: palette.carameloTint,
  destructive: palette.danger,
  destructiveForeground: "#FFFFFF",
  points: palette.caramelo,
  pointsBackground: palette.carameloTint,
  border: palette.line,
  borderLight: palette.line,
  input: palette.line,
  online: palette.success,
  offline: palette.inkMuted,
  busy: palette.danger,
  overlay: "rgba(15, 42, 39, 0.5)",
  overlayLight: "rgba(15, 42, 39, 0.1)",
  white: "#FFFFFF",
  black: "#000000",
  ring: palette.brand,
  accent: palette.brandTint,
  accentForeground: palette.ink,
});

export const lightColors = buildColors(brandColors.light);
export const darkColors = buildColors(brandColors.dark);

export const theme = {
  isTablet,
  width,
  height,
  colors: lightColors,
  spacing: {
    xs: 4 * scale,
    sm: 8 * scale,
    md: 16 * scale,
    lg: 24 * scale,
    xl: 32 * scale,
    "2xl": 48 * scale,
    "3xl": 64 * scale,
  },
  borderRadius: {
    sm: radius.sm * scale,
    md: 12 * scale,
    lg: radius.lg * scale,
    xl: radius.xl * scale,
    full: radius.pill,
  },
  fontSizes: {
    xs: 11 * scale,
    sm: 13 * scale,
    base: 15 * scale,
    md: 16 * scale,
    lg: 18 * scale,
    xl: 20 * scale,
    "2xl": 24 * scale,
    "3xl": 28 * scale,
    "4xl": 32 * scale,
  },
  fontWeights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  // Cartão tem borda fina e nenhuma sombra; só o que flutua (modal, folha) usa `lg`.
  shadows: {
    sm: {},
    md: {},
    card: {},
    button: {},
    lg: {
      shadowColor: "#0B6E66",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

export const gradients = {
  primary: [lightColors.brand, lightColors.brandStrong],
  primaryReverse: [lightColors.brandStrong, lightColors.brand],
  card: [lightColors.surface, lightColors.ground],
  dark: [lightColors.ink, lightColors.inkMuted],
};

export const createTextStyle = (variant = "body", color = "foreground", themeOverride = null) => {
  const currentTheme = themeOverride || theme;
  const variants = {
    h1: { fontSize: currentTheme.fontSizes["3xl"], fontWeight: currentTheme.fontWeights.bold, lineHeight: currentTheme.fontSizes["3xl"] * 1.2 },
    h2: { fontSize: currentTheme.fontSizes["2xl"], fontWeight: currentTheme.fontWeights.semibold, lineHeight: currentTheme.fontSizes["2xl"] * 1.2 },
    h3: { fontSize: currentTheme.fontSizes.xl, fontWeight: currentTheme.fontWeights.semibold, lineHeight: currentTheme.fontSizes.xl * 1.2 },
    body: { fontSize: currentTheme.fontSizes.base, fontWeight: currentTheme.fontWeights.medium, lineHeight: currentTheme.fontSizes.base * 1.4 },
    small: { fontSize: currentTheme.fontSizes.sm, fontWeight: currentTheme.fontWeights.regular, lineHeight: currentTheme.fontSizes.sm * 1.4 },
    caption: { fontSize: currentTheme.fontSizes.xs, fontWeight: currentTheme.fontWeights.medium, lineHeight: currentTheme.fontSizes.xs * 1.3 },
  };
  const palette = currentTheme.colors[color] || color || currentTheme.colors.textPrimary;
  return { ...(variants[variant] || variants.body), color: palette };
};

export const createButtonStyle = (variant = "primary", size = "md", themeOverride = null) => {
  const currentTheme = themeOverride || theme;
  const sizeScale = {
    sm: { paddingVertical: currentTheme.spacing.sm, paddingHorizontal: currentTheme.spacing.md, borderRadius: currentTheme.borderRadius.md },
    md: { paddingVertical: currentTheme.spacing.md, paddingHorizontal: currentTheme.spacing.lg, borderRadius: currentTheme.borderRadius.lg },
  };
  const variants = {
    primary: { backgroundColor: currentTheme.colors.primary },
    secondary: { backgroundColor: currentTheme.colors.secondary, borderWidth: 1, borderColor: currentTheme.colors.border },
    destructive: { backgroundColor: currentTheme.colors.destructive },
  };
  return { alignItems: "center", justifyContent: "center", ...sizeScale[size], ...(variants[variant] || variants.primary) };
};

export default theme;
