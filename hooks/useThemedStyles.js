import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

/**
 * Cria StyleSheet dinâmico que reage ao tema claro/escuro.
 *
 * @example
 * const styles = useThemedStyles((colors) => ({
 *   container: { flex: 1, backgroundColor: colors.background },
 *   title: { color: colors.textPrimary },
 * }));
 */
export function useThemedStyles(factory, extraDeps = []) {
  const { colors, isDark } = useTheme();
  return useMemo(() => factory(colors, isDark), [colors, isDark, ...extraDeps]);
}
