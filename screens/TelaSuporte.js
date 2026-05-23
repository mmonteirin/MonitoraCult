import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import * as Haptics from "expo-haptics";

import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../styles/Colors";

export default function TelaSuporte({ navigation }) {
  const { user } = useAuth();

  const [categoria, setCategoria] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const categorias = [
    {
      id: "login",
      label: "Problema com Login",
      icon: "account-alert-outline",
    },
    {
      id: "evento",
      label: "Problema com Evento",
      icon: "calendar-alert",
    },
    {
      id: "pagamento",
      label: "Pagamento",
      icon: "credit-card-outline",
    },
    {
      id: "bug",
      label: "Bug no App",
      icon: "bug-outline",
    },
    {
      id: "outro",
      label: "Outro",
      icon: "help-circle-outline",
    },
  ];

  const categoriaSelecionada = useMemo(() => {
    return categorias.find((item) => item.id === categoria);
  }, [categoria]);

  const prioridade = useMemo(() => {
    if (categoria === "pagamento") return "alta";
    if (categoria === "bug") return "media";

    return "normal";
  }, [categoria]);

  const handleSubmit = async () => {
    if (!categoria || !mensagem.trim()) {
      Alert.alert(
        "Campos obrigatórios",
        "Preencha categoria e mensagem."
      );

      return;
    }

    try {
      setLoading(true);

      await Haptics.selectionAsync();

      await addDoc(collection(db, "supportTickets"), {
        uid: user?.uid || null,
        email: user?.email || null,

        categoria,
        categoriaLabel: categoriaSelecionada?.label,

        mensagem: mensagem.trim(),

        status: "aberto",
        prioridade,

        respostaAdmin: "",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      Alert.alert(
        "Solicitação enviada 🎉",
        "Nossa equipe irá analisar seu chamado."
      );

      setCategoria(null);
      setMensagem("");
    } catch (error) {
      console.log(error);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

      Alert.alert(
        "Erro",
        "Não foi possível enviar sua solicitação."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("Inicio");
              }
            }}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>

          <View>
            <Text style={styles.title}>
              Central de Suporte
            </Text>

            <Text style={styles.subtitle}>
              Nossa equipe está pronta para ajudar
            </Text>
          </View>
        </View>

        {/* CARD INFO */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={24}
            color={Colors.primary}
          />

          <View style={{ marginLeft: 12 }}>
            <Text style={styles.infoTitle}>
              Tempo médio de resposta
            </Text>

            <Text style={styles.infoText}>
              Aproximadamente 2 horas
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ */}
        <Text style={styles.sectionTitle}>
          Perguntas Frequentes
        </Text>

        <View style={styles.faqContainer}>
          <FaqItem
            icon="account-lock-outline"
            text="Não consigo acessar minha conta"
          />

          <FaqItem
            icon="ticket-confirmation-outline"
            text="Como cancelar minha inscrição?"
          />

          <FaqItem
            icon="cash-refund"
            text="Como solicitar reembolso?"
          />
        </View>

        {/* CATEGORIA */}
        <Text style={styles.label}>
          Tipo de problema
        </Text>

        <TouchableOpacity
          style={styles.select}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.selectContent}>
            <MaterialCommunityIcons
              name={
                categoriaSelecionada?.icon ||
                "shape-outline"
              }
              size={20}
              color={Colors.primary}
            />

            <Text
              style={{
                color: categoria
                  ? Colors.textPrimary
                  : Colors.textMuted,
                marginLeft: 10,
              }}
            >
              {categoriaSelecionada?.label ||
                "Selecione uma categoria"}
            </Text>
          </View>

          <MaterialCommunityIcons
            name="chevron-down"
            size={22}
            color={Colors.primary}
          />
        </TouchableOpacity>

        {/* PRIORIDADE */}
        {categoria && (
          <View style={styles.priorityCard}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color={
                prioridade === "alta"
                  ? Colors.error
                  : prioridade === "media"
                  ? "#f1c40f"
                  : Colors.success
              }
            />

            <Text style={styles.priorityText}>
              Prioridade: {prioridade}
            </Text>
          </View>
        )}

        {/* MENSAGEM */}
        <Text style={styles.label}>
          Descreva o problema
        </Text>

        <View
          style={[
            styles.textareaContainer,
            focused && {
              borderColor: Colors.primary,
            },
          ]}
        >
          <TextInput
            placeholder="Digite aqui todos os detalhes..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            value={mensagem}
            onChangeText={setMensagem}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.textarea}
          />

          <Text style={styles.counter}>
            {mensagem.length}/500
          </Text>
        </View>

        {/* BOTÃO */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[
            styles.button,
            loading && { opacity: 0.7 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="send"
                size={18}
                color="#fff"
              />

              <Text style={styles.buttonText}>
                Enviar solicitação
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="dark" style={styles.modalCard}>
            <LinearGradient
              colors={["rgba(108,92,231,0.15)", "rgba(49,46,129,0.05)"]}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>
                Escolha uma categoria
              </Text>

              {categorias.map((item) => {
                const ativo = categoria === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setCategoria(item.id);
                      setModalVisible(false);
                    }}
                    style={[
                      styles.option,
                      ativo && styles.optionActive,
                    ]}
                  >
                    <View style={styles.optionContent}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={ativo ? "#fff" : Colors.primaryLight}
                      />

                      <Text
                        style={[
                          styles.optionText,
                          ativo && styles.optionTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>

                    {ativo && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color="#fff"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* FAQ */
function FaqItem({ icon, text }) {
  return (
    <TouchableOpacity style={styles.faqItem}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={Colors.primary}
      />

      <Text style={styles.faqText}>
        {text}
      </Text>

      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={Colors.textMuted}
      />
    </TouchableOpacity>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },

  subtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },

  infoCard: {
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  infoTitle: {
    color: Colors.textPrimary,
    fontWeight: "bold",
  },

  infoText: {
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },

  content: {
    padding: 20,
  },

  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  faqContainer: {
    marginBottom: 25,
  },

  faqItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  faqText: {
    flex: 1,
    color: Colors.textPrimary,
    marginLeft: 12,
  },

  label: {
    color: Colors.textPrimary,
    marginBottom: 10,
    fontWeight: "600",
  },

  select: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  priorityCard: {
    marginTop: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  priorityText: {
    color: Colors.textSecondary,
    marginLeft: 8,
    textTransform: "capitalize",
  },

  textareaContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    minHeight: 170,
  },

  textarea: {
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 15,
  },

  counter: {
    color: Colors.textMuted,
    alignSelf: "flex-end",
    marginTop: 10,
    fontSize: 12,
  },

  button: {
    marginTop: 25,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
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
    padding: 24,
  },

  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
  },

  option: {
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  optionText: {
    color: Colors.textPrimary,
    marginLeft: 10,
    fontSize: 15,
  },

  optionTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },

  cancelBtn: {
    marginTop: 14,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});