// Tokens da marca Agenda Flui (../branding/AgendaFlui-Marca/design-tokens/agenda-flui-tokens.json).
export const colors = {
  light: {
    brand: "#0B6E66",
    brandStrong: "#08534D",
    brandTint: "#D7EFEB",
    onBrand: "#FFFFFF",
    caramelo: "#F2A93B",
    carameloTint: "#FCEBD0",
    ground: "#F3F8F6",
    surface: "#FFFFFF",
    ink: "#0F2A27",
    inkMuted: "#4A615D",
    line: "#D3E2DE",
    success: "#1E8A4C",
    danger: "#C8412F",
  },
  dark: {
    brand: "#3CC4B4",
    brandStrong: "#6EDBCD",
    brandTint: "#12403B",
    onBrand: "#062421",
    caramelo: "#F5B85A",
    carameloTint: "#4A3514",
    ground: "#0C1A18",
    surface: "#13241F",
    ink: "#E8F2EF",
    inkMuted: "#9DB3AE",
    line: "#24403A",
    success: "#4CC47E",
    danger: "#F07A68",
  },
};

export const radius = { sm: 10, lg: 16, xl: 28, pill: 999 };

export const space = { 1: 4, 2: 8, 3: 16, 4: 24, 5: 40 };

export const fonts = {
  display: "BricolageGrotesque_700Bold",
  displaySemi: "BricolageGrotesque_600SemiBold",
  text: "Figtree_400Regular",
  textMedium: "Figtree_500Medium",
  textSemi: "Figtree_600SemiBold",
  textBold: "Figtree_700Bold",
};

export const type = {
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.displaySemi, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: fonts.text, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.textSemi, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.textMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.textMedium, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.textBold, fontSize: 16, lineHeight: 20 },
  time: { fontFamily: fonts.textSemi, fontSize: 15, lineHeight: 20, fontVariant: ["tabular-nums"] },
};
