export const Colors = {
  // Backgrounds
  background: "#070B14",
  backgroundSecondary: "#10131F",
  backgroundElevated: "#121826",

  // Surfaces
  surface: "#171B26",
  surfaceLight: "#202635",
  surfaceMuted: "#111827",

  // Glass
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.08)",
  glassStrong: "rgba(255,255,255,0.11)",

  // Cards
  card: "#1B2130",
  cardHover: "#252D3D",

  // Borders
  border: "#2A3142",
  borderLight: "rgba(255,255,255,0.08)",
  divider: "#242B3A",

  // Brand
  primary: "#6C5CE7",
  primaryLight: "#8B7CFF",
  primaryDark: "#5746D6",
  primarySoft: "rgba(108,92,231,0.16)",

  // Accents
  accentCyan: "#22D3EE",
  accentPink: "#F472B6",
  accentOrange: "#F97316",
  purpleGlow: "rgba(108,92,231,0.35)",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#C4C8D4",
  textMuted: "#8B91A6",

  // Status
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#38BDF8",

  // Overlays
  overlayDark: "rgba(0,0,0,0.55)",
  overlayStronger: "rgba(0,0,0,0.72)",
  overlayLight: "rgba(255,255,255,0.06)",

  // Shadows
  shadow: "#000000",

  // Map
  mapOverlay: "rgba(15,15,20,0.85)",
};

export const Gradients = {
  app: [Colors.background, Colors.backgroundSecondary, Colors.background],
  header: ["#0F172A", "#111827", "#1E1B4B"],
  primary: [Colors.primaryLight, Colors.primary, Colors.primaryDark],
  primaryButton: [Colors.primary, Colors.primaryDark],
  surface: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"],
  danger: [Colors.error, "#B91C1C"],
  success: [Colors.success, "#15803D"],
  warning: [Colors.warning, "#D97706"],
};

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

export const Shadows = {
  card: createShadow(
    nativeShadow(Colors.shadow, 0.22, 18, 10, 8),
    webShadow(Colors.shadow, 0.22, 18, 10)
  ),
  glow: createShadow(
    nativeShadow(Colors.primary, 0.28, 18, 8, 10),
    webShadow(Colors.primary, 0.24, 18, 8)
  ),
};
