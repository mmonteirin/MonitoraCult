import { StyleSheet, Dimensions, Platform } from "react-native";
import {
  Colors,
  Gradients,
  Radius,
  Shadows,
  Spacing,
  Typography,
  getShadows,
} from "./Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const shadowFor = (shadow) =>
  Platform.OS === "web" ? shadow.web : shadow.default;

export const createGlobalStyles = (colors) => {
  const shadows = getShadows(colors);

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    screenContent: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: 120,
    },

    headerBand: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
      borderBottomLeftRadius: Radius.xxl,
      borderBottomRightRadius: Radius.xxl,
    },

    glassPanel: {
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: Radius.xl,
      overflow: "hidden",
    },

    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...shadowFor(shadows.card),
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
    },

    title: {
      color: colors.textPrimary,
      fontFamily: Typography.bold,
      fontSize: 24,
    },

    subtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.regular,
      fontSize: 14,
    },

    authContainer: {
      flexGrow: 1,
      backgroundColor: colors.background,
      padding: Spacing.xl,
      justifyContent: "center",
    },

    authTitle: {
      fontSize: 24,
      fontFamily: Typography.bold,
      color: colors.textPrimary,
      marginBottom: 25,
      textAlign: "center",
    },

    authLabel: {
      color: colors.primary,
      marginBottom: 6,
      fontSize: 13,
      fontFamily: Typography.medium,
    },

    authInput: {
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      padding: 14,
      borderRadius: Radius.md,
      marginBottom: 15,
      fontSize: 14,
      fontFamily: Typography.regular,
      borderWidth: 1,
      borderColor: colors.border,
    },

    authButton: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: Radius.md,
      alignItems: "center",
      marginTop: 10,
    },

    authButtonText: {
      color: colors.onPrimary,
      fontFamily: Typography.bold,
    },

    authError: {
      color: colors.error,
      textAlign: "center",
      marginBottom: 15,
      fontSize: 13,
    },

    authLink: {
      color: colors.primary,
      fontFamily: Typography.bold,
    },

    profileContainer: {
      flex: 1,
      backgroundColor: colors.background,
      padding: Spacing.xl,
    },

    profileHeader: {
      alignItems: "center",
      marginBottom: 30,
      backgroundColor: colors.surface,
      padding: Spacing.xl,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },

    profileAvatar: {
      width: 90,
      height: 90,
      borderRadius: 50,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: colors.primary,
    },

    profileName: {
      color: colors.textPrimary,
      fontSize: 18,
      fontFamily: Typography.bold,
    },

    profileEmail: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 3,
    },

    profileLink: {
      color: colors.primary,
      marginTop: 8,
      fontSize: 13,
    },

    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: 15,
      height: 55,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },

    searchInput: {
      marginLeft: 10,
      flex: 1,
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: Typography.regular,
    },

    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      marginBottom: 10,
      marginTop: 10,
      fontFamily: Typography.bold,
    },

    cardCategory: {
      backgroundColor: colors.surface,
      width: "48%",
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: Radius.lg,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    eventCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.xl,
      marginHorizontal: 20,
      marginBottom: 20,
      overflow: "hidden",
    },

    eventTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontFamily: Typography.bold,
    },

    eventInfoText: {
      color: colors.textSecondary,
    },

    button: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: Radius.md,
      alignItems: "center",
    },

    buttonText: {
      color: colors.onPrimary,
      fontFamily: Typography.bold,
    },

    error: {
      color: colors.error,
      textAlign: "center",
      marginBottom: 15,
      fontSize: 13,
    },

    emptyState: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 50,
    },

    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 15,
    },

    loadingSpinner: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },

    telaInicioContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },

    telaInicioCardDestaque: {
      width: SCREEN_WIDTH * 0.68,
      height: 220,
      borderRadius: Radius.lg,
      overflow: "hidden",
      backgroundColor: colors.card,
    },

    telaInicioCardCompacto: {
      width: 130,
      height: 160,
      borderRadius: Radius.md,
      overflow: "hidden",
      backgroundColor: colors.card,
    },
  });
};

/** Estilos estáticos (tema escuro) — prefira `useGlobalStyles()` em telas novas */
const GlobalStyles = createGlobalStyles(Colors);

GlobalStyles.colors = Colors;
GlobalStyles.gradients = Gradients;
GlobalStyles.radius = Radius;
GlobalStyles.spacing = Spacing;
GlobalStyles.typography = Typography;
GlobalStyles.shadows = Shadows;

GlobalStyles.search_container = GlobalStyles.searchContainer;
GlobalStyles.search_input = GlobalStyles.searchInput;
GlobalStyles.event_card = GlobalStyles.eventCard;
GlobalStyles.event_title = GlobalStyles.eventTitle;

export default GlobalStyles;
