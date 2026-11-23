import React from "react";
import { View, Platform, useWindowDimensions } from "react-native";
import { useTheme } from "../utils/ThemeContext";
import { webFrameStyle } from "../utils/webFrame";

// Só na web; no celular devolve as telas como estão.
export default function WebFrame({ variant = "app", children }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  if (Platform.OS !== "web") return children;
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.backgroundSecondary }}>
      <View style={[webFrameStyle(width, variant), { backgroundColor: theme.colors.background, borderColor: theme.colors.line }]}>{children}</View>
    </View>
  );
}

// Embrulha uma tela de pilha na moldura da web.
export function withWebFrame(Screen, variant) {
  const Framed = (props) => (
    <WebFrame variant={variant}>
      <Screen {...props} />
    </WebFrame>
  );
  Framed.displayName = `WebFrame(${Screen.displayName || Screen.name || "Screen"})`;
  return Framed;
}
