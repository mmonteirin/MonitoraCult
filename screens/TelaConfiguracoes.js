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
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { Status } from "../styles/Colors";

export default function TelaConfiguracoes({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, nome, foto, role, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createConfiguracoesStyles);
  const blurTint = isDark ? "dark" : "light";

  const [pushEnabled, setPushEnabled] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const nomeUsuario =
    nome || user?.displayName || user?.email?.split("@")[0] || "Usuário";

  const switchTrack = {
    false: colors.glassStrong,
    true: colors.primary,
  };

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
          color={danger ? colors.error : colors.primary}
        />
      </View>

      <View style={styles.rowCopy}>
        <AppText style={[styles.rowTitle, danger && styles.rowTitleDanger]}>
          {title}
        </AppText>
        {!!subtitle && <AppText style={styles.rowSubtitle}>{subtitle}</AppText>}
      </View>

      {right ||
        (chevron && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.textMuted}
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

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 34 }}
      >
        <LinearGradient
          colors={[
            colors.backgroundSecondary,
            colors.surface,
            colors.background,
          ]}
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
                color={colors.textPrimary}
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
                  name={
                    role === "admin"
                      ? "shield-crown-outline"
                      : "account-circle-outline"
                  }
                  size={14}
                  color={colors.primaryLight}
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
                color={colors.onPrimary}
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
                  trackColor={switchTrack}
                  thumbColor={colors.onPrimary}
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
                  trackColor={switchTrack}
                  thumbColor={colors.onPrimary}
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
                  trackColor={switchTrack}
                  thumbColor={colors.onPrimary}
                />
              }
            />
            <Row
              icon="message-text-outline"
              title="Mensagens"
              subtitle="Alertas de conversas diretas"
              onPress={() =>
                navigation.navigate("HomeTabs", {
                  screen: "Feed",
                  params: { screen: "Feed", params: { initialTab: "mensagens" } },
                })
              }
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
              subtitle="MonitoraCult v1.0.1"
              onPress={() => setShowAboutModal(true)}
            />
          </Section>

          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.logoutRow}
            onPress={() => setShowLogoutModal(true)}
          >
            <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
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
          <BlurView intensity={60} tint={blurTint} style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons
                name="logout"
                size={34}
                color={colors.error}
              />
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
                <LinearGradient
                  colors={[Status.error, Status.errorDark]}
                  style={styles.confirmGradient}
                >
                  {loadingLogout ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="logout"
                        size={18}
                        color={colors.onPrimary}
                      />
                      <AppText style={styles.confirmText}>Sair</AppText>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      <Modal
        visible={showAboutModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.aboutModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowAboutModal(false)}
          />
          <BlurView intensity={60} tint={blurTint} style={styles.aboutModalCard}>
            <View style={styles.aboutModalHeader}>
              <AppText style={styles.aboutModalTitle}>MonitoraCult v1.0.1</AppText>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.aboutModalContent} showsVerticalScrollIndicator={false}>
              <AppText style={styles.aboutModalText}>
                O setor cultural brasileiro enfrenta um desafio estrutural: a ausência de uma plataforma centralizada que conecte de forma eficiente os produtores culturais, os espaços de cultura e o público consumidor. Na cidade de Fortaleza e em todo o estado do Ceará, manifestações artísticas, exposições, espetáculos teatrais, shows e eventos independentes ocorrem diariamente, mas carecem de visibilidade e de ferramentas modernas de gestão e divulgação.
              </AppText>

              <AppText style={styles.aboutModalText}>
                O MonitoraCult surge como resposta a essa lacuna, oferecendo uma plataforma mobile completa voltada para a descoberta, divulgação e gestão de experiências culturais. O aplicativo integra dados da API pública do Mapa Cultural do Ceará (mapacultural.secult.ce.gov.br), mantida pela Secretaria da Cultura do Estado (SECULT), com funcionalidades sociais e de engajamento, permitindo ao usuário não apenas encontrar eventos, mas vivenciá-los em comunidade.
              </AppText>

              <AppText style={styles.aboutModalText}>
                O público-alvo inclui produtores e criadores culturais independentes, gestores de espaços culturais e o público geral interessado em arte e cultura. A oportunidade de negócio reside na digitalização de toda a jornada cultural — da descoberta ao check-in, da avaliação ao relacionamento com a comunidade —, agregando valor tanto ao consumidor quanto ao produtor cultural.
              </AppText>
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

function createConfiguracoesStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
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
      backgroundColor: c.glass,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    headerTitle: { color: c.textPrimary, fontSize: 20, fontWeight: "800" },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 24,
      backgroundColor: c.glass,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 2,
      borderColor: c.primary,
      backgroundColor: c.card,
    },
    profileCopy: { flex: 1, marginLeft: 13, paddingRight: 10 },
    profileName: { color: c.textPrimary, fontSize: 18, fontWeight: "800" },
    profileEmail: { color: c.textMuted, fontSize: 12, marginTop: 3 },
    roleBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 9,
      paddingHorizontal: 10,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.primarySoft,
    },
    roleText: { color: c.primaryLight, fontSize: 12, fontWeight: "700" },
    editBtn: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primary,
    },
    content: { paddingHorizontal: 16, paddingTop: 18 },
    section: { marginBottom: 18 },
    sectionTitle: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      marginBottom: 10,
      marginLeft: 4,
    },
    sectionCard: {
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    row: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    rowDanger: { backgroundColor: "rgba(239,68,68,0.05)" },
    rowIcon: {
      width: 44,
      height: 44,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primarySoft,
      marginRight: 13,
    },
    rowIconDanger: { backgroundColor: "rgba(239,68,68,0.12)" },
    rowCopy: { flex: 1, paddingRight: 10 },
    rowTitle: { color: c.textPrimary, fontSize: 15, fontWeight: "700" },
    rowTitleDanger: { color: c.error },
    rowSubtitle: {
      color: c.textMuted,
      fontSize: 12,
      marginTop: 3,
      lineHeight: 17,
    },
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
    logoutText: { color: c.error, fontSize: 15, fontWeight: "800" },
    modalOverlay: {
      flex: 1,
      backgroundColor: c.overlayStronger,
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
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.glassBorder,
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
    modalTitle: { color: c.textPrimary, fontSize: 22, fontWeight: "800" },
    modalText: {
      color: c.textSecondary,
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
      backgroundColor: c.glass,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    cancelText: { color: c.textPrimary, fontWeight: "700" },
    confirmBtn: { flex: 1, height: 52, borderRadius: 17, overflow: "hidden" },
    confirmGradient: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    confirmText: { color: c.onPrimary, fontWeight: "800" },
    aboutModalOverlay: {
      flex: 1,
      backgroundColor: c.overlayStronger,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    aboutModalCard: {
      width: "100%",
      maxHeight: "80%",
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    aboutModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    aboutModalTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: "800",
    },
    aboutModalContent: {
      padding: 20,
    },
    aboutModalText: {
      color: c.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 16,
    },
  });
}
