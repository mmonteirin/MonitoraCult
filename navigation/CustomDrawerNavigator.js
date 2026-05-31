import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useColors, useGradients, useTheme } from "../context/ThemeContext";
import { Radius, Status, Typography } from "../styles/Colors";
import { useThemedStyles } from "../hooks/useThemedStyles";
import ThemeToggle from "../components/ThemeToggle";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CustomDrawerContent(props) {
  const insets = useSafeAreaInsets();
  const { user, nome, foto, role, logout } = useAuth();
  const colors = useColors();
  const Gradients = useGradients();
  const { isDark } = useTheme();
  const styles = useThemedStyles(createDrawerStyles);
  const blurTint = isDark ? "dark" : "light";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const [loadingLogout, setLoadingLogout] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const nomeUsuario = nome || user?.displayName || user?.email?.split("@")[0] || "Usuário";

  const executeLogout = async () => {
    try {
      setLoadingLogout(true);
      await logout();
      setShowLogoutModal(false);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingLogout(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER EM GRADIENTE */}
      <LinearGradient 
        colors={[colors.primary, colors.primaryDark, colors.accentCyan]} 
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={[styles.glow, { backgroundColor: colors.primary + "30" }]} />
        <View style={[styles.glow2, { backgroundColor: colors.accentCyan + "20" }]} />
        <TouchableOpacity activeOpacity={0.85} onPress={() => props.navigation.navigate("Perfil")}>
          <Animated.View style={[styles.profileRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: foto || user?.photoURL || "https://i.pravatar.cc/300" }} style={styles.avatar} />
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.nome} numberOfLines={1}>{nomeUsuario}</Text>
              <Text style={styles.email} numberOfLines={1}>{user?.email || "Sem email"}</Text>

              <BlurView intensity={30} tint="dark" style={styles.roleBadge}>
                <MaterialCommunityIcons name={role === "admin" ? "shield-crown" : "account-circle"} size={14} color="#fff" />
                <Text style={styles.roleText}>{role === "admin" ? "Organizador" : "Participante"}</Text>
              </BlurView>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.6)" />
          </Animated.View>
        </TouchableOpacity>
      </LinearGradient>

      {/* ROLAGEM DOS ITENS DO MENU */}
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 6, paddingBottom: 8 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: 8 }}>
          <DrawerItemList {...props} />
        </Animated.View>
      </DrawerContentScrollView>

      {/* FOOTER FIXO */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.supportButton} activeOpacity={0.85} onPress={() => props.navigation.navigate("PainelCidade")}>
          <LinearGradient colors={["rgba(124,58,237,0.15)", "rgba(91,76,240,0.08)"]} style={styles.cityButtonGradient}>
            <View style={styles.cityIconWrapper}>
              <MaterialCommunityIcons name="city-variant-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportText}>Painel da Cidade</Text>
              <Text style={styles.citySubText}>Eventos e ocorrências</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.actionButtonsRow}>
          <View style={styles.themeButton}>
            <ThemeToggle size={20} />
            <Text style={styles.themeText}>Tema</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
            <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>MonitoraCult • v1.0.1</Text>
      </View>

      {/* MODAL PADRONIZADO DE LOGOUT */}
      <Modal visible={showLogoutModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={55} tint={blurTint} style={styles.modalCard}>
            <LinearGradient colors={[Status.error, Status.errorDark]} style={styles.modalIcon}>
              <MaterialCommunityIcons name="logout-variant" size={34} color="#FFF" />
            </LinearGradient>

            <Text style={styles.modalTitle}>Sair da Conta</Text>
            <Text style={styles.modalText}>Deseja realmente sair da sua conta?</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity activeOpacity={0.85} style={styles.cancelButton} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.9} disabled={loadingLogout} onPress={executeLogout} style={{ flex: 1 }}>
                <LinearGradient colors={[Status.error, Status.errorDark]} style={styles.confirmButton}>
                  {loadingLogout ? <ActivityIndicator color="#FFF" /> : (
                    <>
                      <MaterialCommunityIcons name="logout" size={18} color="#FFF" />
                      <Text style={styles.confirmText}>Sair</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

function createDrawerStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      overflow: "hidden",
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    glow: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      top: -70,
      right: -50,
    },
    glow2: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      bottom: 30,
      left: -40,
    },
    profileRow: { flexDirection: "row", alignItems: "center" },
    profileCopy: { flex: 1, paddingHorizontal: 14 },
    avatarWrapper: { position: "relative" },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.3)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    onlineBadge: {
      position: "absolute",
      right: 2,
      bottom: 2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: c.success,
      borderWidth: 3,
      borderColor: c.surfaceMuted,
    },
    nome: {
      color: c.onPrimary,
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    email: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 3, fontWeight: "500" },
    roleBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      overflow: "hidden",
      marginTop: 10,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    roleText: {
      color: c.onPrimary,
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
    supportButton: { borderRadius: Radius.lg, overflow: "hidden", marginBottom: 12 },
    cityButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: Radius.lg,
    },
    cityIconWrapper: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarySoft,
      marginRight: 12,
    },
    supportText: { color: c.textPrimary, fontWeight: "700", fontSize: 14, letterSpacing: 0.2 },
    citySubText: { color: c.textMuted, marginTop: 2, fontSize: 12 },
    actionButtonsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    themeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarySoft,
      paddingVertical: 14,
      borderRadius: Radius.md,
      gap: 8,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    themeText: { color: c.textPrimary, fontWeight: "700", fontSize: 15, letterSpacing: 0.2 },
    logoutButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(239,68,68,0.1)",
      paddingVertical: 14,
      borderRadius: Radius.md,
      gap: 8,
      borderWidth: 1,
      borderColor: "rgba(239,68,68,0.2)",
    },
    logoutText: { color: c.error, fontWeight: "700", fontSize: 15, letterSpacing: 0.2 },
    version: { color: c.textMuted, textAlign: "center", marginTop: 12, fontSize: 12, fontWeight: "600" },
    modalOverlay: {
      flex: 1,
      backgroundColor: c.overlayStronger,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 28,
    },
    modalCard: {
      width: "100%",
      borderRadius: 32,
      overflow: "hidden",
      padding: 28,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.glassBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 12,
    },
    modalIcon: {
      width: 80,
      height: 80,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginBottom: 24,
    },
    modalTitle: {
      color: c.textPrimary,
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      letterSpacing: 0.3,
    },
    modalText: {
      color: c.textSecondary,
      fontSize: 16,
      textAlign: "center",
      lineHeight: 24,
      marginTop: 12,
    },
    modalButtons: { flexDirection: "row", marginTop: 32, gap: 16 },
    cancelButton: {
      flex: 1,
      height: 60,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.glass,
      borderWidth: 1.5,
      borderColor: c.glassBorder,
    },
    cancelText: { color: c.textPrimary, fontWeight: "700", fontSize: 16, letterSpacing: 0.2 },
    confirmButton: {
      height: 60,
      borderRadius: 20,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },
    confirmText: { color: c.onPrimary, fontWeight: "bold", fontSize: 16, letterSpacing: 0.2 },
  });
}
