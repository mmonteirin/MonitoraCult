import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { Colors } from "../styles/Colors";
import {
  createSupportTicket,
  listenSupportMessages,
  listenUserSupportTickets,
  markSupportTicketRead,
  sendSupportMessage,
  SUPPORT_CATEGORIES,
  SUPPORT_STATUS,
  getSupportPriority,
} from "../services/supportService";

function formatDate(value) {
  if (!value) return "Agora";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusColor(status) {
  if (status === "resolvido") return Colors.success;
  if (status === "aguardando_usuario") return Colors.warning;
  if (status === "em_atendimento") return Colors.info;
  return Colors.primary;
}

function priorityColor(priority) {
  if (priority === "alta") return Colors.error;
  if (priority === "media") return Colors.warning;
  return Colors.success;
}

export default function TelaSuporte({ navigation }) {
  const { user, nome, foto } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [categoria, setCategoria] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [reply, setReply] = useState("");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newTicketVisible, setNewTicketVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);

  const categoriaSelecionada = useMemo(
    () => SUPPORT_CATEGORIES.find((item) => item.id === categoria),
    [categoria]
  );

  const prioridade = useMemo(
    () => getSupportPriority(categoria),
    [categoria]
  );

  useEffect(() => {
    if (!user?.uid) {
      setTicketsLoading(false);
      return () => {};
    }

    setTicketsLoading(true);
    const unsubscribe = listenUserSupportTickets(
      user.uid,
      (items) => {
        setTickets(items);
        setTicketsLoading(false);

        setSelectedTicket((current) => {
          if (!current) return current;
          return items.find((item) => item.id === current.id) || current;
        });
      },
      (error) => {
        console.log("Erro ao ouvir chamados:", error);
        setTicketsLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedTicket?.id) {
      setMessages([]);
      return () => {};
    }

    setMessagesLoading(true);
    markSupportTicketRead(selectedTicket.id, "user").catch(() => {});

    const unsubscribe = listenSupportMessages(
      selectedTicket.id,
      (items) => {
        setMessages(items);
        setMessagesLoading(false);
      },
      (error) => {
        console.log("Erro ao ouvir mensagens:", error);
        setMessagesLoading(false);
      }
    );

    return unsubscribe;
  }, [selectedTicket?.id]);

  const resetForm = () => {
    setCategoria(null);
    setMensagem("");
    setNewTicketVisible(false);
  };

  const handleCreateTicket = async () => {
    if (!categoria || !mensagem.trim()) {
      Alert.alert("Campos obrigatórios", "Escolha uma categoria e descreva o problema.");
      return;
    }

    try {
      setSubmitting(true);
      await Haptics.selectionAsync();

      const ticketId = await createSupportTicket({
        uid: user?.uid,
        email: user?.email,
        userName: nome || user?.displayName || "Usuário",
        userPhoto: foto || user?.photoURL || "",
        categoria,
        categoriaLabel: categoriaSelecionada?.label,
        mensagem,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();

      const created = tickets.find((item) => item.id === ticketId);
      if (created) setSelectedTicket(created);
    } catch (error) {
      console.log("Erro ao criar chamado:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", error.message || "Não foi possível abrir o chamado.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket?.id || !reply.trim()) return;

    try {
      setSending(true);

      await sendSupportMessage(selectedTicket.id, {
        texto: reply,
        authorId: user?.uid,
        authorName: nome || user?.displayName || "Usuário",
        authorPhoto: foto || user?.photoURL || "",
        authorRole: "user",
      });

      setReply("");
    } catch (error) {
      console.log("Erro ao responder chamado:", error);
      Alert.alert("Erro", error.message || "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  };

  const renderTicket = ({ item }) => {
    const active = selectedTicket?.id === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.ticketCard, active && styles.ticketCardActive]}
        onPress={() => setSelectedTicket(item)}
      >
        <View style={styles.ticketTop}>
          <View style={[styles.ticketIcon, { backgroundColor: `${statusColor(item.status)}22` }]}>
            <MaterialCommunityIcons
              name={item.unreadUser ? "message-alert-outline" : "lifebuoy"}
              size={22}
              color={statusColor(item.status)}
            />
          </View>

          <View style={styles.ticketInfo}>
            <Text style={styles.ticketTitle} numberOfLines={1}>
              {item.categoriaLabel || "Suporte"}
            </Text>
            <Text style={styles.ticketMeta} numberOfLines={1}>
              {formatDate(item.updatedAt || item.createdAt)}
            </Text>
          </View>

          <View style={[styles.statusPill, { borderColor: statusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
              {SUPPORT_STATUS[item.status] || "Aberto"}
            </Text>
          </View>
        </View>

        <Text style={styles.ticketMessage} numberOfLines={2}>
          {item.lastMessage || item.mensagem}
        </Text>

        <View style={styles.ticketFooter}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor(item.prioridade) }]} />
          <Text style={styles.priorityText}>Prioridade {item.prioridade || "normal"}</Text>
          {item.unreadUser ? <Text style={styles.unreadText}>Nova resposta</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Inicio"))}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={styles.title}>Central de Suporte</Text>
            <Text style={styles.subtitle}>Acompanhe seus chamados e converse com a equipe</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.newTicketButton}
          onPress={() => setNewTicketVisible(true)}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#FFF" />
          <Text style={styles.newTicketText}>Novo chamado</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.listPanel}>
          <Text style={styles.sectionTitle}>Meus chamados</Text>

          {ticketsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={tickets}
              keyExtractor={(item) => item.id}
              renderItem={renderTicket}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="headset" size={42} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>Nenhum chamado aberto</Text>
                  <Text style={styles.emptyText}>Quando precisar, abra um chamado e acompanhe tudo por aqui.</Text>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.chatPanel}>
          {selectedTicket ? (
            <>
              <View style={styles.chatHeader}>
                <View>
                  <Text style={styles.chatTitle}>{selectedTicket.categoriaLabel || "Chamado"}</Text>
                  <Text style={styles.chatSubtitle}>
                    {SUPPORT_STATUS[selectedTicket.status] || "Aberto"} • {formatDate(selectedTicket.createdAt)}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="shield-account-outline"
                  size={26}
                  color={Colors.primaryLight}
                />
              </View>

              {messagesLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={Colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={messages}
                  keyExtractor={(item) => item.id}
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                  renderItem={({ item }) => {
                    const mine = item.authorId === user?.uid;
                    return (
                      <View style={[styles.messageBubble, mine ? styles.myBubble : styles.adminBubble]}>
                        <Text style={styles.messageAuthor}>
                          {mine ? "Você" : item.authorName || "Suporte"}
                        </Text>
                        <Text style={styles.messageText}>{item.texto}</Text>
                        <Text style={styles.messageTime}>{formatDate(item.createdAt)}</Text>
                      </View>
                    );
                  }}
                />
              )}

              <View style={styles.replyBar}>
                <TextInput
                  value={reply}
                  onChangeText={setReply}
                  placeholder="Responder ao suporte..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  style={styles.replyInput}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.sendButton, (!reply.trim() || sending) && styles.disabledButton]}
                  onPress={handleSendReply}
                  disabled={!reply.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <MaterialCommunityIcons name="send" size={19} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.chatEmpty}>
              <MaterialCommunityIcons name="message-text-outline" size={46} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Selecione um chamado</Text>
              <Text style={styles.emptyText}>As mensagens com a equipe aparecem aqui em tempo real.</Text>
            </View>
          )}
        </View>
      </View>

      <Modal visible={newTicketVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="dark" style={styles.modalCard}>
            <LinearGradient colors={["rgba(108,92,231,0.18)", "rgba(15,15,20,0.96)"]} style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo chamado</Text>
                <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Tipo de problema</Text>
              <TouchableOpacity style={styles.select} onPress={() => setCategoryModalVisible(true)}>
                <View style={styles.selectContent}>
                  <MaterialCommunityIcons
                    name={categoriaSelecionada?.icon || "shape-outline"}
                    size={20}
                    color={Colors.primary}
                  />
                  <Text style={[styles.selectText, !categoria && { color: Colors.textMuted }]}>
                    {categoriaSelecionada?.label || "Selecione uma categoria"}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={22} color={Colors.primary} />
              </TouchableOpacity>

              {categoria ? (
                <View style={styles.priorityCard}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor(prioridade) }]} />
                  <Text style={styles.priorityText}>Prioridade {prioridade}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Mensagem</Text>
              <TextInput
                placeholder="Conte o que aconteceu com o máximo de detalhes..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={700}
                value={mensagem}
                onChangeText={setMensagem}
                style={styles.textarea}
              />

              <TouchableOpacity
                onPress={handleCreateTicket}
                disabled={submitting}
                style={[styles.submitButton, submitting && styles.disabledButton]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={18} color="#FFF" />
                    <Text style={styles.submitButtonText}>Abrir chamado</Text>
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={categoryModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="dark" style={styles.categoryCard}>
            <Text style={styles.modalTitle}>Escolha uma categoria</Text>
            {SUPPORT_CATEGORIES.map((item) => {
              const active = categoria === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setCategoria(item.id);
                    setCategoryModalVisible(false);
                  }}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <View style={styles.selectContent}>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={20}
                      color={active ? "#FFF" : Colors.primaryLight}
                    />
                    <Text style={[styles.optionText, active && { color: "#FFF" }]}>
                      {item.label}
                    </Text>
                  </View>
                  {active ? <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" /> : null}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setCategoryModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  subtitle: { color: Colors.textSecondary, marginTop: 4, lineHeight: 19 },
  newTicketButton: {
    marginTop: 18,
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  newTicketText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  body: { flex: 1, padding: 16 },
  listPanel: { flex: 1 },
  chatPanel: {
    flex: 1.15,
    marginTop: 14,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  sectionTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  ticketCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  ticketCardActive: { borderColor: Colors.primary, backgroundColor: Colors.backgroundElevated },
  ticketTop: { flexDirection: "row", alignItems: "center" },
  ticketIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  ticketInfo: { flex: 1 },
  ticketTitle: { color: Colors.textPrimary, fontWeight: "800", fontSize: 14 },
  ticketMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: "800" },
  ticketMessage: { color: Colors.textSecondary, marginTop: 12, lineHeight: 19 },
  ticketFooter: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  priorityText: { color: Colors.textMuted, fontSize: 12, textTransform: "capitalize" },
  unreadText: { color: Colors.primaryLight, fontSize: 12, fontWeight: "800", marginLeft: "auto" },
  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "900" },
  chatSubtitle: { color: Colors.textMuted, marginTop: 3, fontSize: 12 },
  messagesList: { flex: 1 },
  messagesContent: { padding: 14 },
  messageBubble: { maxWidth: "88%", padding: 12, borderRadius: 16, marginBottom: 10 },
  myBubble: { alignSelf: "flex-end", backgroundColor: Colors.primary },
  adminBubble: { alignSelf: "flex-start", backgroundColor: Colors.backgroundElevated },
  messageAuthor: { color: "#FFF", fontSize: 11, fontWeight: "900", marginBottom: 4 },
  messageText: { color: "#FFF", fontSize: 14, lineHeight: 19 },
  messageTime: { color: "rgba(255,255,255,0.62)", fontSize: 10, marginTop: 6, alignSelf: "flex-end" },
  replyBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  replyInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 14,
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: { opacity: 0.55 },
  loadingBox: { paddingVertical: 40, alignItems: "center", justifyContent: "center" },
  emptyBox: {
    padding: 24,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  chatEmpty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 26 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "800", marginTop: 10 },
  emptyText: { color: Colors.textSecondary, textAlign: "center", lineHeight: 19, marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.68)",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  modalGradient: { padding: 20 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  modalTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "900" },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: Colors.glass,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { color: Colors.textPrimary, marginBottom: 9, marginTop: 8, fontWeight: "700" },
  select: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  selectText: { color: Colors.textPrimary, marginLeft: 10, flex: 1 },
  priorityCard: { marginTop: 12, flexDirection: "row", alignItems: "center" },
  textarea: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    minHeight: 150,
    textAlignVertical: "top",
    padding: 14,
    fontSize: 14,
  },
  submitButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitButtonText: { color: "#FFF", fontWeight: "900" },
  categoryCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 20,
    backgroundColor: "rgba(15,15,20,0.92)",
    overflow: "hidden",
  },
  option: {
    padding: 14,
    borderRadius: 15,
    marginTop: 10,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { color: Colors.textPrimary, marginLeft: 10, fontSize: 15 },
  cancelButton: {
    marginTop: 14,
    height: 50,
    borderRadius: 15,
    backgroundColor: Colors.glass,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: "#FFF", fontWeight: "700" },
});
