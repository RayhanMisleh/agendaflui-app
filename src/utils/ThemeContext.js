import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme as baseTheme, lightColors, darkColors } from "./theme";

const ThemeContext = createContext();

export { lightColors, darkColors };

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState("light"); // 'light', 'dark', 'system'

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("themeMode");
        if (savedTheme) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        // sem preferência salva: segue o claro da marca
      }
    };

    loadTheme();
  }, []);

  const changeTheme = useCallback(async (mode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem("themeMode", mode);
    } catch (error) {
      // a escolha vale nesta sessão mesmo sem gravar
    }
  }, []);

  const isDarkMode = themeMode === "system" ? systemColorScheme === "dark" : themeMode === "dark";

  const currentTheme = useMemo(
    () => ({
      ...baseTheme,
      colors: isDarkMode ? darkColors : lightColors,
      isDarkMode,
      themeMode,
    }),
    [isDarkMode, themeMode]
  );

  const value = useMemo(
    () => ({ theme: currentTheme, changeTheme, themeMode }),
    [currentTheme, changeTheme, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
