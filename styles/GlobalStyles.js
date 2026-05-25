import { StyleSheet, Dimensions, Platform } from "react-native";
import {
  Colors,
  Gradients,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "./Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const shadowFor = (shadow) =>
  Platform.OS === "web" ? shadow.web : shadow.default;

const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...shadowFor(Shadows.card),
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    color: Colors.textPrimary,
    fontFamily: Typography.bold,
    fontSize: 24,
  },

  subtitle: {
    color: Colors.textSecondary,
    fontFamily: Typography.regular,
    fontSize: 14,
  },

  authContainer: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    justifyContent: "center",
  },

  authTitle: {
    fontSize: 24,
    fontFamily: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 25,
    textAlign: "center",
  },

  authLabel: {
    color: Colors.primary,
    marginBottom: 6,
    fontSize: 13,
    fontFamily: Typography.medium,
  },

  authInput: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    padding: 14,
    borderRadius: Radius.md,
    marginBottom: 15,
    fontSize: 14,
    fontFamily: Typography.regular,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  authButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: Radius.md,
    alignItems: "center",
    marginTop: 10,
  },

  authButtonText: {
    color: "#fff",
    fontFamily: Typography.bold,
  },

  authError: {
    color: Colors.error,
    textAlign: "center",
    marginBottom: 15,
    fontSize: 13,
  },

  authLink: {
    color: Colors.primary,
    fontFamily: Typography.bold,
  },

  profileContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },

  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  profileName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontFamily: Typography.bold,
  },

  profileEmail: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },

  profileLink: {
    color: Colors.primary,
    marginTop: 8,
    fontSize: 13,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  searchInput: {
    marginLeft: 10,
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: Typography.regular,
  },

  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    marginBottom: 10,
    marginTop: 10,
    fontFamily: Typography.bold,
  },

  cardCategory: {
    backgroundColor: Colors.surface,
    width: "48%",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
  },

  eventTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontFamily: Typography.bold,
  },

  eventInfoText: {
    color: Colors.textSecondary,
  },

  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontFamily: Typography.bold,
  },

  error: {
    color: Colors.error,
    textAlign: "center",
    marginBottom: 15,
    fontSize: 13,
  },

  emptyState: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 50,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 15,
  },

  loadingSpinner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  telaInicioContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  telaInicioCardDestaque: {
    width: SCREEN_WIDTH * 0.68,
    height: 220,
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.card,
  },

  telaInicioCardCompacto: {
    width: 130,
    height: 160,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.card,
  },
});

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
