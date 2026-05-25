import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppText from "../components/AppText";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../styles/Colors";

const Row = ({
  icon,
  title,
  subtitle,
  danger,
  onPress,
  right,
  chevron = true,
}) => (
  <TouchableOpacity
    activeOpacity={0.86}
    style={[styles.row, danger && styles.rowDanger]}
    onPress={onPress}
    disabled={!onPress && !right}
  >
    <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={danger ? Colors.error : Colors.primary}
      />
    </View>

    <View style={styles.rowCopy}>
      <AppText style={[styles.rowTitle, danger && styles.rowTitleDanger]}>
        {title}
      </AppText>
      {!!subtitle && <AppText style={styles.rowSubtitle}>{subtitle}</AppText>}
    </View>

    {right || (chevron && (
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color="rgba(255,255,255,0.34)"
      />
    ))}
  </TouchableOpacity>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <AppText style={styles.sectionTitle}>{title}</AppText>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

export default function TelaConfiguracoes({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, nome, foto, role, logout } = useAuth();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const nomeUsuario =
    nome || user?.displayName || user?.email?.split("@")[0] || "Usuário";

  const navigatePerfil = (screen) => {
    navigation.navigate("Perfil", { screen });
  };

  const handleLogout = async () => {
    try {
      setLoadingLogout(true);
      await logout();
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingLogout(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 34 }}
      >
        <LinearGradient
          colors={[Colors.backgroundSecondary, Colors.surface, Colors.background]}
          style={[styles.header, { paddingTop: insets.top + 14 }]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>

            <AppText style={styles.headerTitle}>Configurações</AppText>

            <View style={styles.backBtn} />
          </View>

          <View style={styles.profileCard}>
            <Image
              source={{
                uri: foto || user?.photoURL || "https://i.pravatar.cc/180",
              }}
              style={styles.avatar}
            />
            <View style={styles.profileCopy}>
              <AppText style={styles.profileName} numberOfLines={1}>
                {nomeUsuario}
              </AppText>
              <AppText style={styles.profileEmail} numberOfLines={1}>
                {user?.email || "Sem email"}
              </AppText>
              <View style={styles.roleBadge}>
                <MaterialCommunityIcons
                  name={role === "admin" ? "shield-crown-outline" : "account-circle-outline"}
                  size={14}
                  color="#C4B5FD"
                />
                <AppText style={styles.roleText}>
                  {role === "admin" ? "Organizador" : "Participante"}
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.86}
              style={styles.editBtn}
              onPress={() => navigatePerfil("PerfilEditar")}
            >
              <MaterialCommunityIcons
                name="account-edit-outline"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Section title="Sua conta">
            <Row
              icon="account-edit-outline"
              title="Editar perfil"
              subtitle="Nome, foto, bio, cidade e redes sociais"
              onPress={() => navigatePerfil("PerfilEditar")}
            />
            <Row
              icon="lock-reset"
              title="Senha e segurança"
              subtitle="Altere sua senha de acesso"
              onPress={() => navigatePerfil("ResetPassword")}
            />
            <Row
              icon="map-marker-multiple-outline"
              title="Locais visitados"
              subtitle="Histórico cultural e espaços favoritos"
              onPress={() => navigation.navigate("LocaisVisitados")}
            />
          </Section>

          <Section title="Privacidade">
            <Row
              icon="lock-outline"
              title="Perfil privado"
              subtitle="Controle quem pode ver suas atividades"
              chevron={false}
              right={
                <Switch
                  value={privateProfile}
                  onValueChange={setPrivateProfile}
                  trackColor={{ false: "rgba(255,255,255,0.16)", true: Colors.primary }}
                  thumbColor="#fff"
                />
              }
            />
            <Row
              icon="eye-outline"
              title="Status de atividade"
              subtitle="Mostrar quando você está ativo"
              chevron={false}
              right={
                <Switch
                  value={activityStatus}
                  onValueChange={setActivityStatus}
                  trackColor={{ false: "rgba(255,255,255,0.16)", true: Colors.primary }}
                  thumbColor="#fff"
                />
              }
            />
          </Section>

          <Section title="Notificações">
            <Row
              icon="bell-outline"
              title="Notificações push"
              subtitle="Eventos, mensagens e novidades"
              chevron={false}
              right={
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: "rgba(255,255,255,0.16)", true: Colors.primary }}
                  thumbColor="#fff"
                />
              }
            />
            <Row
              icon="message-text-outline"
              title="Mensagens"
              subtitle="Alertas de conversas diretas"
              onPress={() => navigation.navigate("HomeTabs", {
                screen: "Feed",
                params: { screen: "Feed", params: { initialTab: "mensagens" } },
              })}
            />
          </Section>

          <Section title="Suporte">
            <Row
              icon="lifebuoy"
              title="Central de ajuda"
              subtitle="Fale com o suporte do MonitoraCult"
              onPress={() => navigation.navigate("Suporte")}
            />
            <Row
              icon="information-outline"
              title="Sobre o aplicativo"
              subtitle="MonitoraCult v0.6"
              chevron={false}
            />
          </Section>

          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.logoutRow}
            onPress={() => setShowLogoutModal(true)}
          >
            <MaterialCommunityIcons name="logout" size={22} color={Colors.error} />
            <AppText style={styles.logoutText}>Sair da conta</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowLogoutModal(false)}
          />
          <BlurView intensity={60} tint="dark" style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons name="logout" size={34} color={Colors.error} />
            </View>
            <AppText style={styles.modalTitle}>Sair da conta?</AppText>
            <AppText style={styles.modalText}>
              Você realmente deseja encerrar sua sessão ativa no aplicativo?
            </AppText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <AppText style={styles.cancelText}>Cancelar</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.confirmBtn}
                disabled={loadingLogout}
                onPress={handleLogout}
              >
                <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.confirmGradient}>
                  {loadingLogout ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="logout" size={18} color="#fff" />
                      <AppText style={styles.confirmText}>Sair</AppText>
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
  header: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "800" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  profileCopy: { flex: 1, marginLeft: 13, paddingRight: 10 },
  profileName: { color: Colors.textPrimary, fontSize: 18, fontWeight: "800" },
  profileEmail: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  roleBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 9,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(124,58,237,0.16)",
  },
  roleText: { color: "#C4B5FD", fontSize: 12, fontWeight: "700" },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  content: { paddingHorizontal: 16, paddingTop: 18 },
  section: { marginBottom: 18 },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowDanger: { backgroundColor: "rgba(239,68,68,0.05)" },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.12)",
    marginRight: 13,
  },
  rowIconDanger: { backgroundColor: "rgba(239,68,68,0.12)" },
  rowCopy: { flex: 1, paddingRight: 10 },
  rowTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: "700" },
  rowTitleDanger: { color: Colors.error },
  rowSubtitle: { color: Colors.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  logoutRow: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 20,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.16)",
    marginBottom: 18,
  },
  logoutText: { color: Colors.error, fontSize: 15, fontWeight: "800" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    padding: 24,
    alignItems: "center",
    backgroundColor: "rgba(15,15,25,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    marginBottom: 16,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: "800" },
  modalText: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
  },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%", marginTop: 24 },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  cancelText: { color: Colors.textPrimary, fontWeight: "700" },
  confirmBtn: { flex: 1, height: 52, borderRadius: 17, overflow: "hidden" },
  confirmGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: { color: "#fff", fontWeight: "800" },
});
