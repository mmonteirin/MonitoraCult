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

export default function ResetPassword({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createResetStyles);
  const blurTint = isDark ? "dark" : "light";
  const statusBarStyle = isDark ? "light-content" : "dark-content";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const bgGradient = useMemo(
    () => [colors.backgroundDeep, colors.backgroundSecondary, colors.background],
    [colors]
  );

  const handleResetPassword = async () => {
    if (!email.trim()) {
      alert("Digite um email válido");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      alert("Email enviado! Verifique sua caixa 📩");
      navigation.goBack();
    } catch (error) {
      console.log(error);
      if (error.code === "auth/user-not-found") {
        alert("Usuário não encontrado");
      } else if (error.code === "auth/invalid-email") {
        alert("Email inválido");
      } else {
        alert("Erro ao enviar email");
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
    </KeyboardAvoidingView>
  );
}

function createResetStyles(c) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    background: { ...StyleSheet.absoluteFillObject },
    header: {
      paddingHorizontal: 24,
      paddingBottom: 10,
      alignItems: "center",
    },
    backButton: {
      alignSelf: "flex-start",
      width: 42,
      height: 42,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.glass,
      marginBottom: 30,
    },
    iconContainer: { marginBottom: 22 },
    iconGradient: {
      width: 88,
      height: 88,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      color: c.textPrimary,
      fontSize: 28,
      fontWeight: "800",
      textAlign: "center",
    },
    subtitle: {
      color: c.textSecondary,
      textAlign: "center",
      marginTop: 10,
      lineHeight: 22,
      fontSize: 14,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: "center",
      marginTop: -20,
    },
    card: {
      borderRadius: 28,
      padding: 22,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.glassBorder,
      backgroundColor: c.glass,
    },
    label: { color: c.textSecondary, marginBottom: 12, fontSize: 13 },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.glass,
      borderRadius: 18,
      paddingHorizontal: 16,
      height: 58,
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
      marginLeft: 12,
      fontSize: 15,
    },
    infoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 18,
      padding: 14,
      borderRadius: 16,
      backgroundColor: c.primarySoft,
    },
    infoText: {
      flex: 1,
      color: c.textSecondary,
      marginLeft: 10,
      lineHeight: 20,
      fontSize: 13,
    },
    button: { marginTop: 24, borderRadius: 18, overflow: "hidden" },
    buttonGradient: {
      height: 58,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
    },
    buttonText: {
      color: c.onPrimary,
      fontSize: 15,
      fontWeight: "700",
      marginLeft: 10,
    },
    footerButton: { alignItems: "center", marginTop: 22 },
    footerText: { color: c.primary, fontSize: 14, fontWeight: "600" },
  });
}
