import React, { useMemo, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";

import AppText from "../components/AppText";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { Status } from "../styles/Colors";

export default function ResetPassword({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createResetStyles);
  const blurTint = isDark ? "dark" : "light";
  const statusBarStyle = isDark ? "light-content" : "dark-content";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    icon: "",
    type: "info", // info, success, error
  });

  const bgGradient = useMemo(
    () => [colors.backgroundDeep, colors.backgroundSecondary, colors.background],
    [colors]
  );

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setModalConfig({
        title: "Atenção",
        message: "Digite um email válido",
        icon: "alert-circle-outline",
        type: "error",
      });
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setModalConfig({
        title: "Email Enviado!",
        message: "Verifique sua caixa de entrada 📩",
        icon: "email-check-outline",
        type: "success",
      });
      setShowModal(true);
      setTimeout(() => {
        setShowModal(false);
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.log(error);
      if (error.code === "auth/user-not-found") {
        setModalConfig({
          title: "Usuário não encontrado",
          message: "Não encontramos uma conta com este email",
          icon: "account-search-outline",
          type: "error",
        });
        setShowModal(true);
      } else if (error.code === "auth/invalid-email") {
        setModalConfig({
          title: "Email inválido",
          message: "Por favor, insira um email válido",
          icon: "email-alert-outline",
          type: "error",
        });
        setShowModal(true);
      } else {
        setModalConfig({
          title: "Erro ao enviar email",
          message: "Tente novamente mais tarde",
          icon: "alert-circle-outline",
          type: "error",
        });
        setShowModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />

      <LinearGradient colors={bgGradient} style={styles.background} />

      <LinearGradient
        colors={[colors.primarySoft, "transparent"]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.iconGradient}
          >
            <MaterialCommunityIcons
              name="lock-reset"
              size={34}
              color={colors.onPrimary}
            />
          </LinearGradient>
        </View>

        <AppText style={styles.title}>Recuperar Senha</AppText>
        <AppText style={styles.subtitle}>
          Digite seu email para receber{"\n"}o link de redefinição 🔐
        </AppText>
      </LinearGradient>

      <View style={styles.content}>
        <BlurView intensity={40} tint={blurTint} style={styles.card}>
          <AppText style={styles.label}>Seu email</AppText>

          <View style={[styles.inputContainer, focused && styles.inputFocused]}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={focused ? colors.primary : colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seuemail@email.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.primary}
            />
            <AppText style={styles.infoText}>
              Você receberá um email seguro para redefinir sua senha.
            </AppText>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleResetPassword}
            disabled={loading}
            style={[styles.button, loading && { opacity: 0.7 }]}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="send"
                    size={18}
                    color={colors.onPrimary}
                  />
                  <AppText style={styles.buttonText}>Enviar recuperação</AppText>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.footerButton}
          >
            <AppText style={styles.footerText}>Voltar para login</AppText>
          </TouchableOpacity>
        </BlurView>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowModal(false)}
          />
          <BlurView intensity={60} tint={blurTint} style={styles.modalCard}>
            <LinearGradient
              colors={
                modalConfig.type === "success"
                  ? [`${colors.success}1F`, "transparent"]
                  : modalConfig.type === "error"
                  ? [`${colors.error}1F`, "transparent"]
                  : [`${colors.primary}1F`, "transparent"]
              }
              style={styles.modalGradient}
            >
              <View style={styles.modalIcon}>
                <MaterialCommunityIcons
                  name={modalConfig.icon}
                  size={34}
                  color={
                    modalConfig.type === "success"
                      ? colors.success
                      : modalConfig.type === "error"
                      ? colors.error
                      : colors.primary
                  }
                />
              </View>
              <AppText style={styles.modalTitle}>{modalConfig.title}</AppText>
              <AppText style={styles.modalText}>{modalConfig.message}</AppText>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.confirmBtn}
                  onPress={() => setShowModal(false)}
                >
                  <LinearGradient
                    colors={
                      modalConfig.type === "success"
                        ? [Status.success, Status.successDark]
                        : modalConfig.type === "error"
                        ? [Status.error, Status.errorDark]
                        : [colors.primary, colors.primaryLight]
                    }
                    style={styles.confirmGradient}
                  >
                    <AppText style={styles.confirmText}>OK</AppText>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function createResetStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    background: { ...StyleSheet.absoluteFillObject },
    header: {
      paddingHorizontal: 24,
      paddingBottom: 8,
      alignItems: "center",
    },
    backButton: {
      alignSelf: "flex-start",
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.glass,
      marginBottom: 16,
    },
    iconContainer: { marginBottom: 14 },
    iconGradient: {
      width: 72,
      height: 72,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      color: c.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      textAlign: "center",
    },
    subtitle: {
      color: c.textSecondary,
      textAlign: "center",
      marginTop: 6,
      lineHeight: 20,
      fontSize: 13,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: "center",
      marginTop: -10,
    },
    card: {
      borderRadius: 24,
      padding: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.glassBorder,
      backgroundColor: c.glass,
    },
    label: { color: c.textSecondary, marginBottom: 8, fontSize: 12 },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.glass,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 50,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    inputFocused: {
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    input: {
      flex: 1,
      color: c.textPrimary,
      marginLeft: 10,
      fontSize: 14,
    },
    infoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 12,
      padding: 10,
      borderRadius: 12,
      backgroundColor: c.primarySoft,
    },
    infoText: {
      flex: 1,
      color: c.textSecondary,
      marginLeft: 8,
      lineHeight: 18,
      fontSize: 12,
    },
    button: { marginTop: 16, borderRadius: 14, overflow: "hidden" },
    buttonGradient: {
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
    },
    buttonText: {
      color: c.onPrimary,
      fontSize: 14,
      fontWeight: "700",
      marginLeft: 8,
    },
    footerButton: { alignItems: "center", marginTop: 14 },
    footerText: { color: c.primary, fontSize: 13, fontWeight: "600" },
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
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    modalGradient: { padding: 24, alignItems: "center" },
    modalIcon: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.1)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: { color: c.textPrimary, fontSize: 22, fontWeight: "bold" },
    modalText: {
      color: c.textSecondary,
      textAlign: "center",
      marginTop: 10,
      fontSize: 14,
      lineHeight: 22,
      paddingHorizontal: 12,
    },
    modalButtons: { flexDirection: "row", marginTop: 24, width: "100%" },
    confirmBtn: { flex: 1, height: 50, borderRadius: 16, overflow: "hidden" },
    confirmGradient: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    confirmText: { color: c.onPrimary, fontWeight: "bold", fontSize: 14 },
  });
}
