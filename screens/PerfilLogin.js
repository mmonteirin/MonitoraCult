import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";

import AppText from "../components/AppText";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";

export default function PerfilLogin({ navigation }) {
  const styles = useThemedStyles(createThemedScreenStyles);
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    message: "",
    type: "error",
  });

  const showModal = (title, message, type = "error") => {
    setModalData({ title, message, type });
    setModalVisible(true);
  };

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async () => {
    const emptyField = [email, password].some((f) => f.trim() === "");

    if (emptyField) {
      showModal("Campos obrigatórios", "Por favor, preencha seu e-mail e sua senha.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      showModal("E-mail inválido", "Insira um formato de e-mail válido.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.role === "admin") {
          console.log("Organizador logado com sucesso.");
        }
      }
    } catch (error) {
      console.log("Erro ao efetuar login:", error.code, error.message);

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          showModal("Acesso negado", "E-mail ou senha incorretos. Verifique suas credenciais.");
          break;
        case "auth/too-many-requests":
          showModal("Conta bloqueada temporariamente", "Muitas tentativas malsucedidas. Aguarde alguns minutos.");
          break;
        case "auth/user-disabled":
          showModal("Conta desativada", "Este usuário foi suspenso da plataforma.");
          break;
        case "auth/invalid-email":
          showModal("E-mail inválido", "O endereço de e-mail informado é inválido.");
          break;
        default:
          showModal("Falha no login", "Ocorreu um erro interno. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/fundoTelaLogin.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["rgba(0,0,0,0.88)", "rgba(15,15,30,0.72)", "rgba(0,0,0,0.92)"]}
        style={styles.overlay}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={styles.container}
          >
            {/* HEADER */}
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 700 }}
              style={styles.logoContainer}
            >
              <Image
                source={require("../assets/logo/Logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <AppText style={styles.appName}>MonitoraCult</AppText>
              <AppText style={styles.subtitle}>Entre na sua conta</AppText>
            </MotiView>

            {/* CARD FORMULÁRIO */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 850 }}
            >
              <BlurView intensity={65} tint="dark" style={styles.card}>

                {/* EMAIL */}
                <AppText style={styles.label}>Email</AppText>
                <View style={[styles.inputContainer, focusedInput === "email" && styles.inputFocused]}>
                  <Feather name="mail" size={18} color={colors.textMuted} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Digite seu email"
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="next"
                  />
                </View>

                {/* SENHA */}
                <AppText style={styles.label}>Senha</AppText>
                <View style={[styles.inputContainer, focusedInput === "password" && styles.inputFocused]}>
                  <Feather name="lock" size={18} color={colors.textMuted} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Digite sua senha"
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* ESQUECI A SENHA */}
                <TouchableOpacity
                  style={styles.forgot}
                  onPress={() => navigation.navigate("ResetPassword")}
                >
                  <AppText style={styles.link}>Esqueci minha senha</AppText>
                </TouchableOpacity>

                {/* BOTÃO ENTRAR */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={loading}
                  style={styles.buttonWrapper}
                >
                  <LinearGradient
                    colors={[colors.primaryLight, colors.primary]}
                    style={styles.button}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <AppText style={styles.buttonText}>Entrar</AppText>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* REDIRECIONAMENTO DE CADASTRO */}
                <View style={styles.row}>
                  <AppText style={styles.rowText}>Não possui conta?</AppText>
                  <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
                    <AppText style={styles.linkBold}>Criar conta</AppText>
                  </TouchableOpacity>
                </View>

                {/* ORGANIZADOR */}
                <TouchableOpacity
                  style={styles.organizadorButton}
                  onPress={() => navigation.navigate("CadastroAdmin")}
                  activeOpacity={0.8}
                >
                  <Feather name="briefcase" size={16} color={colors.warning} />
                  <AppText style={styles.organizadorText}>
                    Cadastrar como Organizador
                  </AppText>
                </TouchableOpacity>

                {/* FOOTER POLÍTICAS */}
                <AppText style={styles.footer}>
                  Ao continuar você aceita nossos termos e políticas de uso de dados.
                </AppText>
              </BlurView>
            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <ConfirmModal
        visible={modalVisible}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        confirmText="Entendi"
        onConfirm={() => setModalVisible(false)}
      />
    </ImageBackground>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
    background: { flex: 1 },
    overlay: { flex: 1 },
    container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 32 },
    logoContainer: { alignItems: "center", marginBottom: 18 },
    logoImage: { width: 110, height: 110, marginBottom: 8 },
    appName: { fontSize: 24, fontWeight: "bold", color: "#FFF", marginTop: 12 },
    subtitle: { marginTop: 4, color: "rgba(255,255,255,0.72)", fontSize: 13 },
    card: { overflow: "hidden", borderRadius: 26, padding: 18, backgroundColor: "rgba(20,20,20,0.35)", borderWidth: 1, borderColor: c.glassStrong },
    label: { color: "rgba(255,255,255,0.75)", marginBottom: 6, marginLeft: 4, fontSize: 13 },
    inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: c.glass, borderRadius: 16, paddingHorizontal: 12, marginBottom: 14, borderWidth: 1, borderColor: c.glassStrong },
    inputFocused: { borderColor: c.primary },
    icon: { marginRight: 8 },
    input: { flex: 1, color: "#FFF", paddingVertical: 14, fontSize: 14 },
    forgot: { alignSelf: "flex-end" },
    link: { color: c.primary, fontWeight: "600", fontSize: 13 },
    buttonWrapper: { marginTop: 18, borderRadius: 16, overflow: "hidden" },
    button: { paddingVertical: 15, alignItems: "center" },
    buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
    row: { flexDirection: "row", justifyContent: "center", marginTop: 16, gap: 5, flexWrap: "wrap" },
    rowText: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
    linkBold: { color: c.primary, fontWeight: "bold", fontSize: 13 },
    organizadorButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 13, borderRadius: 16, marginTop: 18, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: c.glass },
    organizadorText: { color: c.warning, fontWeight: "bold", fontSize: 13 },
    footer: { marginTop: 18, textAlign: "center", fontSize: 11, lineHeight: 18, color: "rgba(255,255,255,0.45)" },
  });
}