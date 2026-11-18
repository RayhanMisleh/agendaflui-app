import React from "react";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../utils/ThemeContext";

// Ícone de traço (Feather). Cor padrão: texto principal do tema.
export default function Icon({ name, size = 20, color }) {
  const { theme } = useTheme();
  return <Feather name={name} size={size} color={color || theme.colors.textPrimary} />;
}
