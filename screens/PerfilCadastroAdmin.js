import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";

import { useCadastro } from "../context/CadastroContext";
import GlobalStyles from "../styles/GlobalStyles";
import ConfirmModal from "../components/ConfirmModal";

const { colors } = GlobalStyles;

const FIELD_ORDER = [
  "nome",
  "email",
  "verificationCode",
  "areaAtuacao",
  "localAtuacao",
  "cnpj",
  "password",
  "confirmPassword",
];

export default function PerfilCadastroAdmin({ navigation }) {
  const { registerUser, sendVerificationCode, verifyCode } = useCadastro();

  const scrollRef = useRef(null);
  const inputRefs = useRef({});
  const fieldYPositions = useRef({});

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
    areaAtuacao: "",
    localAtuacao: "",
    cnpj: "",
  });

  const [error, setError] = useState("");
  const [codeError, setCodeError] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState("form");

  const handleChange = (field, value) => {
    let newValue = value;

    if (field === "email") {
      newValue = value.trim().toLowerCase();
    }

    if (field === "verificationCode") {
      newValue = value.replace(/[^0-9]/g, "").slice(0, 6);
    }

    setForm((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const focusNext = (field) => {
    const index = FIELD_ORDER.indexOf(field);
    const next = FIELD_ORDER[index + 1];

    if (next && inputRefs.current[next]) {
      setTimeout(() => inputRefs.current[next].focus(), 80);
    }
  };

  const handleFieldFocus = (field) => {
    setTimeout(() => {
      const y = fieldYPositions.current[field];

      if (y !== undefined && scrollRef.current) {
        scrollRef.current.scrollTo({
          y: Math.max(0, y - 120),
          animated: true,
        });
      }
    }, 150);
  };

  // ─────────────────────────────────────
  // ENVIAR CÓDIGO
  // ─────────────────────────────────────

  const handleSendCode = async () => {
    setError("");

    if (!form.nome || !form.email) {
      setError("Preencha nome e email");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Email inválido");
      return;
    }

    setLoading(true);

    const result = await sendVerificationCode(form.email);

    setLoading(false);

    if (result.success) {
      setStep("verify");
      setCodeError("");
    } else {
      setError(result.message);
    }
  };

  // ─────────────────────────────────────
  // CRIAR ORGANIZADOR
  // ─────────────────────────────────────

  const handleSubmit = async () => {
    setCodeError("");

    const {
      nome,
      email,
      password,
      confirmPassword,
      verificationCode,
      areaAtuacao,
      localAtuacao,
      cnpj,
    } = form;

    if (
      !nome ||
      !email ||
      !password ||
      !confirmPassword ||
      !verificationCode ||
      !areaAtuacao ||
      !localAtuacao ||
      !cnpj
    ) {
      setCodeError("Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      setCodeError("As senhas não coincidem");
      return;
    }

    setLoadingCode(true);

    const codeResult = await verifyCode(email, verificationCode);

    if (!codeResult.success) {
      setLoadingCode(false);
      setCodeError(codeResult.message);
      return;
    }

    try {
      const response = await registerUser({
        nome,
        email,
        password,
        role: "admin",
        areaAtuacao,
        localAtuacao,
        cnpj,
      });

      setLoadingCode(false);

      if (response.success) {
        setStep("success");
      } else {
        setCodeError(response.message);
      }
    } catch {
      setLoadingCode(false);
      setCodeError("Erro ao criar organizador");
    }
  };

  // ─────────────────────────────────────
  // REENVIAR CÓDIGO
  // ─────────────────────────────────────

  const handleResendCode = async () => {
    setCodeError("");

    setLoadingCode(true);

    const result = await sendVerificationCode(form.email);

    setLoadingCode(false);

    if (!result.success) {
      setCodeError(result.message);
    }
  };

  const renderInput = (field, label, icon, options = {}) => {
    const isLast = FIELD_ORDER[FIELD_ORDER.length - 1] === field;

    return (
      <View
        key={field}
        onLayout={(e) => {
          fieldYPositions.current[field] = e.nativeEvent.layout.y;
        }}
        style={{ marginBottom: 14 }}
      >
        <Text style={styles.label}>{label}</Text>

        <View style={styles.inputBox}>
          <Feather name={icon} size={16} color="rgba(255,255,255,0.6)" />

          <TextInput
            ref={(r) => {
              if (r) inputRefs.current[field] = r;
            }}
            value={form[field]}
            onChangeText={(t) => handleChange(field, t)}
            placeholder={label}
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            secureTextEntry={options.secure && !showPassword}
            onFocus={() => handleFieldFocus(field)}
            returnKeyType={isLast ? "done" : "next"}
            onSubmitEditing={() =>
              isLast ? handleSubmit() : focusNext(field)
            }
          />

          {options.secure && (
            <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../assets/fundoTelaLogin.png")}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["rgba(0,0,0,0.9)", "rgba(10,10,25,0.7)", "rgba(0,0,0,0.95)"]}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
        >
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
            contentContainerStyle={styles.container}
          >
            <MotiView style={styles.header}>
              <LinearGradient
                colors={[colors.primary, "#7B5CFF"]}
                style={styles.logo}
              >
                <Feather name="briefcase" size={28} color="#fff" />
              </LinearGradient>

              <View>
                <Text style={styles.title}>Cadastro de Organizador</Text>

                <Text style={styles.subtitle}>
                  Cadastro protegido por validação
                </Text>
              </View>
            </MotiView>

            <BlurView intensity={60} tint="dark" style={styles.card}>
              {renderInput("nome", "Nome", "user")}
              {renderInput("email", "Email", "mail")}

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.codeBtn}
                  onPress={handleSendCode}
                >
                  <LinearGradient
                    colors={[colors.primary, "#2563EB"]}
                    style={styles.codeGrad}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Feather name="send" color="#fff" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  {renderInput("verificationCode", "Código", "shield")}
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  {renderInput("areaAtuacao", "Área", "grid")}
                </View>

                <View style={{ flex: 1 }}>
                  {renderInput("localAtuacao", "Local", "map-pin")}
                </View>
              </View>

              {renderInput("cnpj", "CNPJ", "file-text")}

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  {renderInput("password", "Senha", "lock", {
                    secure: true,
                  })}
                </View>

                <View style={{ flex: 1 }}>
                  {renderInput("confirmPassword", "Confirmar", "check-circle", {
                    secure: true,
                  })}
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loadingCode}
              >
                <LinearGradient
                  colors={[colors.primary, "#7B5CFF"]}
                  style={styles.submit}
                >
                  {loadingCode ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>
                      Criar Organizador
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* ───────────────── MODAL VERIFICAÇÃO ───────────────── */}
      <Modal visible={step === "verify"} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="dark" style={styles.modalCard}>
            <LinearGradient
              colors={["rgba(108,92,231,0.15)", "rgba(49,46,129,0.05)"]}
              style={styles.modalGradient}
            >
              <View style={[styles.modalIcon, { backgroundColor: "rgba(108,92,231,0.12)" }]}>
                <Feather name="mail" size={34} color="#6C5CE7" />
              </View>

              <Text style={styles.modalTitle}>
                Código enviado!
              </Text>

              <Text style={styles.modalSubtitle}>
                Verifique sua caixa de entrada em{"\n"}
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  {form.email}
                </Text>
              </Text>

              <Text style={styles.modalHint}>
                Digite o código de 6 dígitos para concluir o cadastro.
              </Text>

              <View style={styles.codeInputContainer}>
                <TextInput
                  value={form.verificationCode}
                  onChangeText={(t) =>
                    handleChange("verificationCode", t)
                  }
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={styles.codeInput}
                />
              </View>

              {codeError ? (
                <Text style={styles.error}>{codeError}</Text>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.confirmBtn}
                onPress={handleSubmit}
                disabled={loadingCode}
              >
                <LinearGradient
                  colors={["#6C5CE7", "#5746D6"]}
                  style={styles.confirmGradient}
                >
                  {loadingCode ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Feather name="check" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.confirmText}>
                        Confirmar código
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResendCode}
                disabled={loadingCode}
              >
                <Text style={styles.resendText}>
                  Reenviar código
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setStep("form");
                  setCodeError("");
                }}
              >
                <Text style={styles.changeEmail}>
                  Alterar email
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </View>
      </Modal>

      {/* ───────────────── MODAL SUCESSO ───────────────── */}
      <ConfirmModal
        visible={step === "success"}
        title="Organizador criado!"
        message="O cadastro foi concluído com sucesso."
        type="success"
        confirmText="Ir para Login"
        onConfirm={() => navigation.navigate("Login")}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 60,
    flexGrow: 1,
  },

  backButton: {
    marginLeft: 16,
    marginTop: 12,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 12,
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  subtitle: {
    color: "rgba(255,255,255,0.6)",
  },

  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(20,20,20,0.35)",
    overflow: "hidden",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  input: {
    flex: 1,
    color: "#fff",
    marginLeft: 8,
    paddingVertical: 4,
  },

  label: {
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "nowrap",
  },

  codeBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 22,
  },

  codeGrad: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  submit: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  error: {
    color: "#ff6b6b",
    marginTop: 10,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  modalCard: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  modalGradient: {
    padding: 28,
    alignItems: "center",
    width: "100%",
  },

  modalIcon: {
    width: 78,
    height: 78,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  modalSubtitle: {
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  modalHint: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  codeInputContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 14,
    paddingHorizontal: 18,
  },

  codeInput: {
    color: "#fff",
    fontSize: 28,
    textAlign: "center",
    letterSpacing: 10,
    paddingVertical: 14,
  },

  confirmBtn: {
    width: "100%",
    marginTop: 10,
  },

  confirmGradient: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  confirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  resendText: {
    color: colors.primary,
    marginTop: 18,
    fontWeight: "bold",
  },

  changeEmail: {
    color: "rgba(255,255,255,0.45)",
    marginTop: 14,
    fontSize: 13,
  },
});