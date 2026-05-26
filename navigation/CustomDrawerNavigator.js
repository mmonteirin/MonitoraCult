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
      <LinearGradient colors={Gradients?.primary || ["#1E1B4B", "#0F172A"]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.glow} />
        <TouchableOpacity activeOpacity={0.85} onPress={() => props.navigation.navigate("Perfil")}>
          <Animated.View style={[styles.profileRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: foto || user?.photoURL || "https://i.pravatar.cc/300" }} style={styles.avatar} />
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.nome} numberOfLines={1}>{nomeUsuario}</Text>
              <Text style={styles.email} numberOfLines={1}>{user?.email || "Sem email"}</Text>

              <BlurView intensity={35} tint="dark" style={styles.roleBadge}>
                <MaterialCommunityIcons name={role === "admin" ? "shield-crown" : "account-circle"} size={13} color="#fff" />
                <Text style={styles.roleText}>{role === "admin" ? "Organizador" : "Participante"}</Text>
              </BlurView>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.55)" />
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

        <Text style={styles.version}>MonitoraCult • v0.6</Text>
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
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 22,
      overflow: "hidden",
    },
    glow: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: Radius.round,
      backgroundColor: c.glassStrong,
      top: -62,
      right: -46,
    },
    profileRow: { flexDirection: "row", alignItems: "center" },
    profileCopy: { flex: 1, paddingHorizontal: 12 },
    avatarWrapper: { position: "relative" },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 2,
      borderColor: c.glassBorder,
    },
    onlineBadge: {
      position: "absolute",
      right: 1,
      bottom: 1,
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: c.success,
      borderWidth: 2,
      borderColor: c.surfaceMuted,
    },
    nome: {
      color: c.onPrimary,
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: "800",
    },
    email: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 2 },
    roleBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 30,
      overflow: "hidden",
      marginTop: 7,
    },
    roleText: {
      color: c.onPrimary,
      fontFamily: Typography.bold,
      fontSize: 12,
      fontWeight: "600",
    },
    footer: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 },
    supportButton: { borderRadius: Radius.md, overflow: "hidden", marginBottom: 10 },
    cityButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: Radius.md,
    },
    cityIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarySoft,
      marginRight: 10,
    },
    supportText: { color: c.textPrimary, fontWeight: "700", fontSize: 13 },
    citySubText: { color: c.textMuted, marginTop: 1, fontSize: 11 },
    actionButtonsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    themeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarySoft,
      paddingVertical: 12,
      borderRadius: Radius.sm,
      gap: 6,
    },
    themeText: { color: c.textPrimary, fontWeight: "700", fontSize: 14 },
    logoutButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(239,68,68,0.08)",
      paddingVertical: 12,
      borderRadius: Radius.sm,
      gap: 6,
    },
    logoutText: { color: c.error, fontWeight: "700", fontSize: 14 },
    version: { color: c.textMuted, textAlign: "center", marginTop: 10, fontSize: 11 },
    modalOverlay: {
      flex: 1,
      backgroundColor: c.overlayStronger,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    modalCard: {
      width: "100%",
      borderRadius: 30,
      overflow: "hidden",
      padding: 26,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    modalIcon: {
      width: 74,
      height: 74,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      marginBottom: 20,
    },
    modalTitle: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
    },
    modalText: {
      color: c.textSecondary,
      fontSize: 15,
      textAlign: "center",
      lineHeight: 23,
      marginTop: 10,
    },
    modalButtons: { flexDirection: "row", marginTop: 28, gap: 14 },
    cancelButton: {
      flex: 1,
      height: 56,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.glass,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    cancelText: { color: c.textPrimary, fontWeight: "700", fontSize: 15 },
    confirmButton: {
      height: 56,
      borderRadius: 18,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    confirmText: { color: c.onPrimary, fontWeight: "bold", fontSize: 15 },
  });
}
