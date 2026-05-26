/**
 * Design tokens — MonitoraCult
 *
 * Uso recomendado em componentes:
 *   const { colors, gradients, shadows, isDark } = useTheme();
 *   // ou: const colors = useColors();
 *
 * Import estático `Colors` permanece como tema escuro (compatibilidade).
 */

// ─── Marca e semântica (iguais em claro/escuro) ─────────────────────────────
export const Brand = {
  primary: "#6C5CE7",
  primaryLight: "#8B7CFF",
  primaryDark: "#5746D6",
  primarySoft: "rgba(108,92,231,0.16)",
  purpleGlow: "rgba(108,92,231,0.35)",
};

export const Status = {
  success: "#22C55E",
  successDark: "#15803D",
  error: "#EF4444",
  errorDark: "#B91C1C",
  warning: "#F59E0B",
  warningDark: "#D97706",
  info: "#38BDF8",
};

export const Accents = {
  accentCyan: "#22D3EE",
  accentPink: "#F472B6",
  accentOrange: "#F97316",
};

/** Cores de métricas / dashboards (substituem hex soltos nas telas) */
export const Metrics = {
  like: "#FF4D6D",
  view: "#60A5FA",
  star: "#FFD166",
  share: "#FF7849",
};

/** Filtros de categoria da comunidade */
export const CategoryColors = {
  musica: "#FF6B6B",
  teatro: "#4ECDC4",
  danca: "#FFE66D",
  artes: "#A8E6CF",
  cinema: "#DDA0DD",
  literatura: "#98D8C8",
  gastronomia: "#F7DC6F",
  outros: "#BB8FCE",
};

const sharedTheme = {
  ...Brand,
  ...Status,
  ...Accents,
  onPrimary: "#FFFFFF",
};

// ─── Tema escuro ────────────────────────────────────────────────────────────
const darkTheme = {
  ...sharedTheme,

  background: "#030712",
  backgroundSecondary: "#0B1020",
  backgroundElevated: "#111827",
  backgroundDeep: "#140F2D",

  surface: "#111827",
  surfaceLight: "#1F2937",
  surfaceMuted: "#0F172A",

  glass: "rgba(255,255,255,0.10)",
  glassBorder: "rgba(255,255,255,0.18)",
  glassStrong: "rgba(255,255,255,0.16)",

  card: "#172033",
  cardHover: "#243047",

  border: "#3A455C",
  borderLight: "rgba(255,255,255,0.18)",
  divider: "#334155",

  textPrimary: "#FFFFFF",
  textSecondary: "#E2E8F0",
  textMuted: "#B6C2D5",

  overlayDark: "rgba(0,0,0,0.55)",
  overlayStronger: "rgba(0,0,0,0.72)",
  overlayLight: "rgba(255,255,255,0.06)",

  shadow: "#000000",
  mapOverlay: "rgba(15,15,20,0.85)",
};

// ─── Tema claro ─────────────────────────────────────────────────────────────
const lightTheme = {
  ...sharedTheme,

  background: "#F1F5F9",
  backgroundSecondary: "#E2E8F0",
  backgroundElevated: "#FFFFFF",
  backgroundDeep: "#CBD5E1",

  surface: "#FFFFFF",
  surfaceLight: "#F8FAFC",
  surfaceMuted: "#E2E8F0",

  glass: "rgba(255,255,255,0.92)",
  glassBorder: "rgba(15,23,42,0.25)",
  glassStrong: "rgba(255,255,255,0.98)",

  card: "#FFFFFF",
  cardHover: "#F1F5F9",

  border: "#94A3B8",
  borderLight: "rgba(15,23,42,0.22)",
  divider: "#E2E8F0",

  textPrimary: "#0F172A",
  textSecondary: "#1E293B",
  textMuted: "#475569",

  overlayDark: "rgba(0,0,0,0.55)",
  overlayStronger: "rgba(0,0,0,0.75)",
  overlayLight: "rgba(0,0,0,0.06)",

  shadow: "#000000",
  mapOverlay: "rgba(255,255,255,0.95)",
};

export const darkThemeColors = darkTheme;
export const lightThemeColors = lightTheme;

/** @deprecated Prefira `useColors()` ou `useTheme().colors` */
export const Colors = darkTheme;

// ─── Gradientes (dependem do tema ativo) ────────────────────────────────────
export const getGradients = (colors, isDark = true) => ({
  app: [colors.background, colors.backgroundSecondary, colors.background],
  header: isDark
    ? ["#0F172A", colors.surfaceMuted, "#1E1B4B"]
    : [colors.backgroundSecondary, colors.background, colors.backgroundElevated],
  primary: [colors.primaryLight, colors.primary, colors.primaryDark],
  primaryButton: [colors.primary, colors.primaryDark],
  surface: isDark
    ? ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]
    : ["rgba(0,0,0,0.04)", "rgba(0,0,0,0.02)"],
  danger: [colors.error, Status.errorDark],
  success: [colors.success, Status.successDark],
  warning: [colors.warning, Status.warningDark],
});

/** Compatibilidade: gradientes do tema escuro */
export const Gradients = getGradients(darkTheme, true);

// ─── Sombras ─────────────────────────────────────────────────────────────────
const nativeShadow = (color, opacity, radius, height, elevation) => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height },
  elevation,
});

const webShadow = (color, opacity, radius, height) => ({
  boxShadow: `0px ${height}px ${radius}px rgba(0,0,0,${opacity})`,
});

const createShadow = (native, web) => ({
  default: native,
  web,
});

export const getShadows = (colors) => ({
  card: createShadow(
    nativeShadow(colors.shadow, 0.22, 18, 10, 8),
    webShadow(colors.shadow, 0.22, 18, 10)
  ),
  glow: createShadow(
    nativeShadow(colors.primary, 0.28, 18, 8, 10),
    webShadow(colors.primary, 0.24, 18, 8)
  ),
});

export const Shadows = getShadows(darkTheme);

// ─── Layout / tipografia ─────────────────────────────────────────────────────
export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  round: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const Typography = {
  regular: "PoppinsRegular",
  medium: "PoppinsMedium",
  semiBold: "PoppinsSemiBold",
  bold: "PoppinsBold",
};

/** Tema React Navigation derivado dos tokens */
export const createNavigationTheme = (colors, isDark) => ({
  dark: isDark,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: Typography.regular, fontWeight: "400" },
    medium: { fontFamily: Typography.medium, fontWeight: "500" },
    bold: { fontFamily: Typography.bold, fontWeight: "700" },
    heavy: { fontFamily: Typography.bold, fontWeight: "900" },
  },
});
