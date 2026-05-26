import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  darkThemeColors,
  lightThemeColors,
  getGradients,
  getShadows,
  createNavigationTheme,
} from "../styles/Colors";

const THEME_KEY = "@monitoracult_theme";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

/** Paleta do tema ativo (cores) */
export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};

/** Gradientes do tema ativo */
export const useGradients = () => {
  const { gradients } = useTheme();
  return gradients;
};

/** Sombras do tema ativo */
export const useShadows = () => {
  const { shadows } = useTheme();
  return shadows;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      }
    } catch (error) {
      console.log("Erro ao carregar preferência de tema:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem(THEME_KEY, newTheme ? "dark" : "light");
    } catch (error) {
      console.log("Erro ao salvar preferência de tema:", error);
    }
  };

  const value = useMemo(() => {
    const colors = isDark ? darkThemeColors : lightThemeColors;
    const gradients = getGradients(colors, isDark);
    const shadows = getShadows(colors);
    const navigationTheme = createNavigationTheme(colors, isDark);

    return {
      isDark,
      isLoading,
      toggleTheme,
      colors,
      /** @deprecated Use `colors` — alias para migração gradual */
      theme: colors,
      gradients,
      shadows,
      navigationTheme,
    };
  }, [isDark, isLoading]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
