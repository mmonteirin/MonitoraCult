import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { createGlobalStyles } from "../styles/GlobalStyles";

/** Estilos globais que acompanham o tema ativo */
export function useGlobalStyles() {
  const { colors, gradients, shadows } = useTheme();

  return useMemo(() => {
    const styles = createGlobalStyles(colors);
    styles.colors = colors;
    styles.gradients = gradients;
    styles.shadows = shadows;
    return styles;
  }, [colors, gradients, shadows]);
}
