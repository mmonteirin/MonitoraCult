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
import { Colors, Gradients, Radius, Typography } from "../styles/Colors";

export default function CustomDrawerContent(props) {
  const insets = useSafeAreaInsets();
  const { user, nome, foto, role, logout } = useAuth();

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
      <LinearGradient colors={Gradients?.primary || ["#1E1B4B", "#0F172A"]} style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.glow} />
        <TouchableOpacity activeOpacity={0.85} onPress={() => props.navigation.navigate("Perfil")}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: "center" }}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: foto || user?.photoURL || "https://i.pravatar.cc/300" }} style={styles.avatar} />
              <View style={styles.onlineBadge} />
            </View>

            <Text style={styles.nome}>{nomeUsuario}</Text>
            <Text style={styles.email}>{user?.email || "Sem email"}</Text>

            <BlurView intensity={40} tint="dark" style={styles.roleBadge}>
              <MaterialCommunityIcons name={role === "admin" ? "shield-crown" : "account-circle"} size={14} color="#fff" />
              <Text style={styles.roleText}>{role === "admin" ? "Organizador" : "Participante"}</Text>
            </BlurView>
          </Animated.View>
        </TouchableOpacity>
      </LinearGradient>

      {/* ROLAGEM DOS ITENS DO MENU */}
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: 8 }}>
          <DrawerItemList {...props} />
        </Animated.View>
      </DrawerContentScrollView>

      {/* FOOTER FIXO */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.supportButton} activeOpacity={0.85} onPress={() => props.navigation.navigate("PainelCidade")}>
          <LinearGradient colors={["rgba(124,58,237,0.15)", "rgba(91,76,240,0.08)"]} style={styles.cityButtonGradient}>
            <View style={styles.cityIconWrapper}>
              <MaterialCommunityIcons name="city-variant-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportText}>Painel da Cidade</Text>
              <Text style={styles.citySubText}>Eventos e ocorrências</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
          <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MonitoraCult • v0.6</Text>
      </View>

      {/* MODAL PADRONIZADO DE LOGOUT */}
      <Modal visible={showLogoutModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={55} tint="dark" style={styles.modalCard}>
            <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.modalIcon}>
              <MaterialCommunityIcons name="logout-variant" size={34} color="#FFF" />
            </LinearGradient>

            <Text style={styles.modalTitle}>Sair da Conta</Text>
            <Text style={styles.modalText}>Deseja realmente sair da sua conta?</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity activeOpacity={0.85} style={styles.cancelButton} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.9} disabled={loadingLogout} onPress={executeLogout} style={{ flex: 1 }}>
                <LinearGradient colors={["#EF4444", "#B91C1C"]} style={styles.confirmButton}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 22, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: "hidden", alignItems: "center" },
  glow: { position: "absolute", width: 220, height: 220, borderRadius: Radius?.round || 999, backgroundColor: "rgba(255,255,255,0.08)", top: -70, right: -60 },
  avatarWrapper: { position: "relative", marginBottom: 14 },
  avatar: { width: 100, height: 100, borderRadius: Radius?.round || 50, borderWidth: 3, borderColor: "rgba(255,255,255,0.15)" },
  onlineBadge: { position: "absolute", right: 6, bottom: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.success, borderWidth: 2, borderColor: "#111827" },
  nome: { color: Colors.textPrimary, fontFamily: Typography?.bold || "System", fontSize: 20, fontWeight: "700", marginBottom: 4, textAlign: "center" },
  email: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 14, textAlign: "center" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 30, overflow: "hidden" },
  roleText: { color: Colors.textPrimary, fontFamily: Typography?.bold || "System", fontSize: 12, fontWeight: "600" },
  footer: { padding: 20 },
  supportButton: { borderRadius: Radius?.lg || 16, overflow: "hidden", marginBottom: 14 },
  cityButtonGradient: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16, borderRadius: Radius?.lg || 16 },
  cityIconWrapper: { width: 42, height: 42, borderRadius: Radius?.md || 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,58,237,0.14)", marginRight: 12 },
  supportText: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14 },
  citySubText: { color: Colors.textMuted, marginTop: 2, fontSize: 12 },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239,68,68,0.08)", paddingVertical: 16, borderRadius: Radius?.md || 12 },
  logoutText: { color: Colors.error, fontWeight: "700", marginLeft: 10, fontSize: 15 },
  version: { color: Colors.textMuted, textAlign: "center", marginTop: 16, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  modalCard: { width: "100%", borderRadius: 30, overflow: "hidden", padding: 26, backgroundColor: "rgba(15,15,25,0.92)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  modalIcon: { width: 74, height: 74, borderRadius: 24, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 20 },
  modalTitle: { color: "#FFF", fontSize: 22, fontWeight: "bold", textAlign: "center" },
  modalText: { color: "rgba(255,255,255,0.7)", fontSize: 15, textAlign: "center", lineHeight: 23, marginTop: 10 },
  modalButtons: { flexDirection: "row", marginTop: 28, gap: 14 },
  cancelButton: { flex: 1, height: 56, borderRadius: 18, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  cancelText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  confirmButton: { height: 56, borderRadius: 18, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  confirmText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});