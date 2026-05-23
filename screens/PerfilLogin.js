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
  Modal,
  ScrollView,
} from "react-native";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { MotiView } from "moti";

import AppText from "../components/AppText";
import { Colors } from "../styles/Colors";
import ConfirmModal from "../components/ConfirmModal";

export default function PerfilLogin({ navigation }) {
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

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async () => {
    const emptyField = [email, password].some((f) => f.trim() === "");

    if (emptyField) {
      showModal("Campos obrigatórios", "Preencha email e senha.");
      return;
    }

    if (!isValidEmail(email)) {
      showModal("Email inválido", "Digite um email válido.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        showModal("Login inválido", "Email ou senha incorretos.");
      } else if (error.code === "auth/too-many-requests") {
        showModal("Muitas tentativas", "Aguarde alguns minutos e tente novamente.");
      } else {
        showModal("Erro", "Não foi possível fazer login.");
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
              <LinearGradient
                colors={[Colors.primary, "#7B5CFF"]}
                style={styles.logoCircle}
              >
                <Feather name="zap" size={30} color="#FFF" />
              </LinearGradient>

              <AppText style={styles.appName}>MonitoraCult</AppText>

              <AppText style={styles.subtitle}>Entre na sua conta</AppText>
            </MotiView>

            {/* CARD */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 850 }}
            >
              <BlurView intensity={65} tint="dark" style={styles.card}>
                {/* EMAIL */}
                <AppText style={styles.label}>Email</AppText>

                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "email" && styles.inputFocused,
                  ]}
                >
                  <Feather
                    name="mail"
                    size={18}
                    color={Colors.textMuted}
                    style={styles.icon}
                  />

                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Digite seu email"
                    placeholderTextColor={Colors.textMuted}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="next"
                  />
                </View>

                {/* SENHA */}
                <AppText style={styles.label}>Senha</AppText>

                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "password" && styles.inputFocused,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={18}
                    color={Colors.textMuted}
                    style={styles.icon}
                  />

                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Digite sua senha"
                    placeholderTextColor={Colors.textMuted}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />

                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={18}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* ESQUECI */}
                <TouchableOpacity
                  style={styles.forgot}
                  onPress={() => navigation.navigate("ResetPassword")}
                >
                  <AppText style={styles.link}>Esqueci minha senha</AppText>
                </TouchableOpacity>

                {/* LOGIN */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSubmit}
                  disabled={loading}
                  style={styles.buttonWrapper}
                >
                  <LinearGradient
                    colors={[Colors.primary, "#7B5CFF"]}
                    style={styles.button}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <AppText style={styles.buttonText}>Entrar</AppText>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* CADASTRO */}
                <View style={styles.row}>
                  <AppText style={styles.rowText}>Não possui conta?</AppText>

                  <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
                    <AppText style={styles.linkBold}>Criar conta</AppText>
                  </TouchableOpacity>
                </View>

                {/* DIVIDER */}
                <View style={styles.dividerContainer}>
                  <View style={styles.line} />
                  <AppText style={styles.divider}>ou continue com</AppText>
                  <View style={styles.line} />
                </View>

                {/* SOCIAL */}
                <View style={styles.socialContainer}>
                  <TouchableOpacity style={styles.socialButton}>
                    <Feather name="chrome" size={20} color="#FFF" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton}>
                    <Feather name="facebook" size={20} color="#FFF" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton}>
                    <Feather name="twitter" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {/* ORGANIZADOR */}
                <TouchableOpacity
                  style={styles.organizadorButton}
                  onPress={() => navigation.navigate("CadastroAdmin")}
                >
                  <Feather name="briefcase" size={16} color={Colors.warning} />

                  <AppText style={styles.organizador}>
                    Cadastrar como Organizador
                  </AppText>
                </TouchableOpacity>

                {/* FOOTER */}
                <AppText style={styles.footer}>
                  Ao continuar você aceita nossos termos e políticas.
                </AppText>
              </BlurView>
            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* MODAL */}
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

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },

  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 12,
  },

  subtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
  },

  card: {
    overflow: "hidden",
    borderRadius: 26,
    padding: 18,
    backgroundColor: "rgba(20,20,20,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  label: {
    color: "rgba(255,255,255,0.75)",
    marginBottom: 6,
    marginLeft: 4,
    fontSize: 13,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  inputFocused: {
    borderColor: Colors.primary,
  },

  icon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    color: "#FFF",
    paddingVertical: 14,
    fontSize: 14,
  },

  forgot: {
    alignSelf: "flex-end",
  },

  link: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },

  buttonWrapper: {
    marginTop: 18,
    borderRadius: 16,
    overflow: "hidden",
  },

  button: {
    paddingVertical: 15,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 5,
    flexWrap: "wrap",
  },

  rowText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
  },

  linkBold: {
    color: Colors.primary,
    fontWeight: "bold",
    fontSize: 13,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  divider: {
    marginHorizontal: 10,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },

  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 18,
  },

  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  organizadorButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  organizador: {
    color: Colors.warning,
    fontWeight: "bold",
    fontSize: 13,
  },

  footer: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 18,
    color: "rgba(255,255,255,0.45)",
  },


});
