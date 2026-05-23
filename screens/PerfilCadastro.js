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
  "password",
  "confirmPassword",
];

export default function PerfilCadastro({ navigation }) {
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
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "email"
          ? value.trim().toLowerCase()
          : value,
    }));
  };

  const focusNext = (field) => {
    const index = FIELD_ORDER.indexOf(field);
    const next = FIELD_ORDER[index + 1];

    if (next && inputRefs.current[next]) {
      setTimeout(() => {
        inputRefs.current[next].focus();
      }, 80);
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

  const handleSendCode = async () => {
    setError("");

    const {
      nome,
      email,
      password,
      confirmPassword,
    } = form;

    if (
      !nome ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError("Preencha todos os campos");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email inválido");
      return;
    }

    if (password.length < 6) {
      setError("Senha muito curta");
      return;
    }

    if (password !== confirmPassword) {
      setError("Senhas não coincidem");
      return;
    }

    setLoading(true);

    const result = await sendVerificationCode(email);

    setLoading(false);

    if (result.success) {
      setShowCodeModal(true);
      setError("");
    } else {
      setError(result.message);
    }
  };

  const handleSubmit = async () => {
    setError("");

    const {
      nome,
      email,
      password,
      confirmPassword,
      verificationCode,
    } = form;

    if (
      !nome ||
      !email ||
      !password ||
      !confirmPassword ||
      !verificationCode
    ) {
      setError("Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("Senhas não coincidem");
      return;
    }

    setLoading(true);

    const codeResult = await verifyCode(
      email,
      verificationCode
    );

    if (!codeResult.success) {
      setError(codeResult.message);
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser({
        nome,
        email,
        password,
      });

      if (response.success) {
        setShowSuccessModal(true);
      } else {
        setError(response.message);
      }
    } catch {
      setError("Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    field,
    label,
    icon,
    options = {}
  ) => {
    const isLast =
      FIELD_ORDER[FIELD_ORDER.length - 1] === field;

    return (
      <View
        key={field}
        onLayout={(e) => {
          fieldYPositions.current[field] =
            e.nativeEvent.layout.y;
        }}
        style={{ marginBottom: 14 }}
      >
        <Text style={styles.label}>{label}</Text>

        <View style={styles.inputBox}>
          <Feather
            name={icon}
            size={16}
            color="rgba(255,255,255,0.6)"
          />

          <TextInput
            ref={(r) => {
              if (r) inputRefs.current[field] = r;
            }}
            value={form[field]}
            onChangeText={(t) =>
              handleChange(field, t)
            }
            placeholder={label}
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            secureTextEntry={
              options.secure && !showPassword
            }
            onFocus={() =>
              handleFieldFocus(field)
            }
            returnKeyType={
              isLast ? "done" : "next"
            }
            onSubmitEditing={() =>
              isLast
                ? handleSubmit()
                : focusNext(field)
            }
          />

          {options.secure && (
            <TouchableOpacity
              onPress={() =>
                setShowPassword((p) => !p)
              }
            >
              <Feather
                name={
                  showPassword
                    ? "eye"
                    : "eye-off"
                }
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
        colors={[
          "rgba(0,0,0,0.9)",
          "rgba(10,10,25,0.7)",
          "rgba(0,0,0,0.95)",
        ]}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather
            name="arrow-left"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={
            Platform.OS === "ios" ? 60 : 20
          }
        >
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.container}
          >
            <MotiView style={styles.header}>
              <LinearGradient
                colors={[
                  colors.primary,
                  "#7B5CFF",
                ]}
                style={styles.logo}
              >
                <Feather
                  name="user-plus"
                  size={28}
                  color="#fff"
                />
              </LinearGradient>

              <View>
                <Text style={styles.title}>
                  Criar Conta
                </Text>

                <Text style={styles.subtitle}>
                  Cadastro protegido por validação
                </Text>
              </View>
            </MotiView>

            <BlurView
              intensity={60}
              tint="dark"
              style={styles.card}
            >
              {renderInput("nome", "Nome", "user")}

              {renderInput(
                "email",
                "Email",
                "mail"
              )}

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.codeBtn}
                  onPress={handleSendCode}
                >
                  <LinearGradient
                    colors={[
                      colors.primary,
                      "#2563EB",
                    ]}
                    style={styles.codeGrad}
                  >
                    <Feather
                      name="send"
                      color="#fff"
                    />
                  </LinearGradient>
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  {renderInput(
                    "verificationCode",
                    "Código",
                    "shield"
                  )}
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  {renderInput(
                    "password",
                    "Senha",
                    "lock",
                    { secure: true }
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  {renderInput(
                    "confirmPassword",
                    "Confirmar",
                    "check-circle",
                    { secure: true }
                  )}
                </View>
              </View>

              {error ? (
                <Text style={styles.error}>
                  {error}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={[
                    colors.primary,
                    "#7B5CFF",
                  ]}
                  style={styles.submit}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      Criar Conta
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* MODAL EMAIL */}
      <ConfirmModal
        visible={showCodeModal}
        title="Código enviado!"
        message={`Verifique sua caixa de entrada em\n${form.email}`}
        type="info"
        confirmText="Entendido"
        onConfirm={() => setShowCodeModal(false)}
      />

      {/* MODAL SUCESSO */}
      <ConfirmModal
        visible={showSuccessModal}
        title="Conta criada!"
        message="Sua conta foi criada com sucesso. Faça login para continuar."
        type="success"
        confirmText="Ir para Login"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.navigate("Login");
        }}
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
  },

  codeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  error: {
    color: "#ff6b6b",
    marginTop: 10,
    textAlign: "center",
  },


});