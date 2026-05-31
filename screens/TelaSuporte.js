import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";

import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
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

function statusColor(status, colors) {
  if (status === "resolvido") return colors.success;
  if (status === "aguardando_usuario") return colors.warning;
  if (status === "em_atendimento") return colors.info;
  return colors.primary;
}

function priorityColor(priority, colors) {
  if (priority === "alta") return colors.error;
  if (priority === "media") return colors.warning;
  return colors.success;
}

export default function TelaSuporte({ navigation }) {
  const { user, nome, foto } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);

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

  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    icon: "",
    iconColor: colors.primary,
    onConfirm: null,
    showCancel: false,
  });

  const blurTint = isDark ? "dark" : "light";

  const exibirMensagem = (title, message, icon = "alert-circle", iconColor = colors.error, onConfirm = () => setShowModal(false), showCancel = false) => {
    setModalConfig({
      title,
      message,
      icon,
      iconColor: iconColor || colors.primary,
      onConfirm,
      showCancel,
    });
    setShowModal(true);
  };

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
      exibirMensagem("Campos obrigatórios", "Escolha uma categoria e descreva o problema.", "alert-circle", colors.warning);
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
      exibirMensagem("Erro", error.message || "Não foi possível abrir o chamado.", "alert-circle", colors.error);
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
      exibirMensagem("Erro", error.message || "Não foi possível enviar a mensagem.", "alert-circle", colors.error);
    } finally {
      setSending(false);
    }
  };

  const renderTicket = ({ item }) => {
    const active = selectedTicket?.id === item.id;
    const ticketStatusColor = statusColor(item.status, colors);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.ticketCard, active && styles.ticketCardActive]}
        onPress={() => setSelectedTicket(item)}
      >
        <View style={styles.ticketTop}>
          <View style={[styles.ticketIcon, { backgroundColor: `${ticketStatusColor}22` }]}>
            <MaterialCommunityIcons
              name={item.unreadUser ? "message-alert-outline" : "lifebuoy"}
              size={22}
              color={ticketStatusColor}
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

          <View style={[styles.statusPill, { borderColor: ticketStatusColor }]}>
            <Text style={[styles.statusText, { color: ticketStatusColor }]}>
              {SUPPORT_STATUS[item.status] || "Aberto"}
            </Text>
          </View>
        </View>

        <Text style={styles.ticketMessage} numberOfLines={2}>
          {item.lastMessage || item.mensagem}
        </Text>

        <View style={styles.ticketFooter}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor(item.prioridade, colors) }]} />
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <LinearGradient colors={[colors.background, colors.surface]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Inicio"))}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
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
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.onPrimary} />
          <Text style={styles.newTicketText}>Novo chamado</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.listPanel}>
          <Text style={styles.sectionTitle}>Meus chamados</Text>

          {ticketsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={tickets}
              keyExtractor={(item) => item.id}
              renderItem={renderTicket}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="headset" size={42} color={colors.textMuted} />
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
                  color={colors.primaryLight}
                />
              </View>

              {messagesLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={colors.primary} />
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
                        <Text style={mine ? styles.messageAuthorMine : styles.messageAuthorOther}>
                          {mine ? "Você" : item.authorName || "Suporte"}
                        </Text>
                        <Text style={mine ? styles.messageTextMine : styles.messageTextOther}>
                          {item.texto}
                        </Text>
                        <Text style={mine ? styles.messageTimeMine : styles.messageTimeOther}>
                          {formatDate(item.createdAt)}
                        </Text>
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
                  placeholderTextColor={colors.textMuted}
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
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <MaterialCommunityIcons name="send" size={19} color={colors.onPrimary} />
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.chatEmpty}>
              <MaterialCommunityIcons name="message-text-outline" size={46} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Selecione um chamado</Text>
              <Text style={styles.emptyText}>As mensagens com a equipe aparecem aqui em tempo real.</Text>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={newTicketVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={resetForm}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={resetForm} />
          <View style={styles.modalCard}>
            <LinearGradient
              colors={[colors.primarySoft, "transparent"]}
              style={styles.modalAccent}
            />
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <View style={styles.modalIconWrap}>
                    <MaterialCommunityIcons name="lifebuoy" size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Novo chamado</Text>
                </View>
                <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Tipo de problema</Text>
              <TouchableOpacity style={styles.select} onPress={() => setCategoryModalVisible(true)}>
                <View style={styles.selectContent}>
                  <MaterialCommunityIcons
                    name={categoriaSelecionada?.icon || "shape-outline"}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.selectText, !categoria && { color: colors.textMuted }]}>
                    {categoriaSelecionada?.label || "Selecione uma categoria"}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={22} color={colors.primary} />
              </TouchableOpacity>

              {categoria ? (
                <View style={styles.priorityCard}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor(prioridade, colors) }]} />
                  <Text style={styles.priorityText}>Prioridade {prioridade}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Mensagem</Text>
              <TextInput
                placeholder="Conte o que aconteceu com o máximo de detalhes..."
                placeholderTextColor={colors.textMuted}
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
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={18} color={colors.onPrimary} />
                    <Text style={styles.submitButtonText}>Abrir chamado</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setCategoryModalVisible(false)}
          />
          <View style={styles.categoryCard}>
            <Text style={styles.modalTitle}>Escolha uma categoria</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.categoryList}>
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
                        color={active ? colors.onPrimary : colors.primary}
                      />
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>
                        {item.label}
                      </Text>
                    </View>
                    {active ? (
                      <MaterialCommunityIcons name="check-circle" size={20} color={colors.onPrimary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setCategoryModalVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Customizado para Avisos/Erros */}
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
          <BlurView intensity={60} tint={blurTint} style={styles.alertModalCard}>
            <LinearGradient
              colors={[`${modalConfig.iconColor || colors.primary}1F`, "transparent"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalIcon}>
                <MaterialCommunityIcons
                  name={modalConfig.icon}
                  size={34}
                  color={modalConfig.iconColor}
                />
              </View>
              <Text style={styles.alertModalTitle}>{modalConfig.title}</Text>
              <Text style={styles.alertModalText}>
                {modalConfig.message}
              </Text>
              <View style={styles.modalButtons}>
                {modalConfig.showCancel && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.cancelBtn}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.confirmBtn}
                  onPress={modalConfig.onConfirm}
                >
                  <LinearGradient
                    colors={[modalConfig.iconColor || colors.primary, `${modalConfig.iconColor || colors.primary}DD`]}
                    style={styles.confirmGradient}
                  >
                    <Text style={styles.confirmText}>
                      {modalConfig.showCancel ? "Confirmar" : "OK"}
                    </Text>
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

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
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
    backgroundColor: c.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 22, fontWeight: "800", color: c.textPrimary },
  subtitle: { color: c.textSecondary, marginTop: 4, lineHeight: 19 },
  newTicketButton: {
    marginTop: 18,
    height: 50,
    borderRadius: 16,
    backgroundColor: c.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  newTicketText: { color: c.onPrimary, fontWeight: "800", fontSize: 15 },
  body: { flex: 1, padding: 16 },
  listPanel: { flex: 1 },
  chatPanel: {
    flex: 1.15,
    marginTop: 14,
    backgroundColor: c.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
  },
  sectionTitle: { color: c.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  ticketCard: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  ticketCardActive: { borderColor: c.primary, backgroundColor: c.backgroundElevated },
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
  ticketTitle: { color: c.textPrimary, fontWeight: "800", fontSize: 14 },
  ticketMeta: { color: c.textMuted, fontSize: 12, marginTop: 3 },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: "800" },
  ticketMessage: { color: c.textSecondary, marginTop: 12, lineHeight: 19 },
  ticketFooter: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  priorityText: { color: c.textMuted, fontSize: 12, textTransform: "capitalize" },
  unreadText: { color: c.primaryLight, fontSize: 12, fontWeight: "800", marginLeft: "auto" },
  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatTitle: { color: c.textPrimary, fontSize: 16, fontWeight: "900" },
  chatSubtitle: { color: c.textMuted, marginTop: 3, fontSize: 12 },
  messagesList: { flex: 1 },
  messagesContent: { padding: 14 },
  messageBubble: { maxWidth: "88%", padding: 12, borderRadius: 16, marginBottom: 10 },
  myBubble: { alignSelf: "flex-end", backgroundColor: c.primary },
  adminBubble: {
    alignSelf: "flex-start",
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
  },
  messageAuthorMine: { color: c.onPrimary, fontSize: 11, fontWeight: "900", marginBottom: 4 },
  messageTextMine: { color: c.onPrimary, fontSize: 14, lineHeight: 19 },
  messageTimeMine: { color: "rgba(255,255,255,0.72)", fontSize: 10, marginTop: 6, alignSelf: "flex-end" },
  messageAuthorOther: { color: c.textMuted, fontSize: 11, fontWeight: "900", marginBottom: 4 },
  messageTextOther: { color: c.textPrimary, fontSize: 14, lineHeight: 19 },
  messageTimeOther: { color: c.textMuted, fontSize: 10, marginTop: 6, alignSelf: "flex-end" },
  replyBar: {
    borderTopWidth: 1,
    borderTopColor: c.border,
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
    backgroundColor: c.background,
    color: c.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: c.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: { opacity: 0.55 },
  loadingBox: { paddingVertical: 40, alignItems: "center", justifyContent: "center" },
  emptyBox: {
    padding: 24,
    backgroundColor: c.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
  },
  chatEmpty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 26 },
  emptyTitle: { color: c.textPrimary, fontSize: 16, fontWeight: "800", marginTop: 10 },
  emptyText: { color: c.textSecondary, textAlign: "center", lineHeight: 19, marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: c.overlayStronger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    width: "100%",
    maxHeight: "88%",
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  modalAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: c.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalTitle: { color: c.textPrimary, fontSize: 20, fontWeight: "900", flex: 1 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.border,
  },
  label: { color: c.textPrimary, marginBottom: 9, marginTop: 8, fontWeight: "700" },
  select: {
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  selectText: { color: c.textPrimary, marginLeft: 10, flex: 1 },
  priorityCard: { marginTop: 12, flexDirection: "row", alignItems: "center" },
  textarea: {
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    color: c.textPrimary,
    minHeight: 150,
    textAlignVertical: "top",
    padding: 14,
    fontSize: 14,
  },
  submitButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    backgroundColor: c.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitButtonText: { color: c.onPrimary, fontWeight: "900" },
  categoryCard: {
    width: "100%",
    maxHeight: "75%",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: c.border,
    padding: 20,
    backgroundColor: c.card,
    shadowColor: c.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  categoryList: {
    maxHeight: 320,
    marginTop: 8,
  },
  option: {
    padding: 14,
    borderRadius: 15,
    marginTop: 10,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionActive: { backgroundColor: c.primary, borderColor: c.primary },
  optionText: { color: c.textPrimary, marginLeft: 10, fontSize: 15 },
  optionTextActive: { color: c.onPrimary },
  cancelButton: {
    marginTop: 14,
    height: 50,
    borderRadius: 15,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: c.textPrimary, fontWeight: "700" },
  alertModalCard: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.glassBorder,
    backgroundColor: c.card,
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
  alertModalTitle: { color: c.textPrimary, fontSize: 20, fontWeight: "bold", textAlign: "center" },
  alertModalText: {
    color: c.textSecondary,
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  modalButtons: { flexDirection: "row", marginTop: 24, width: "100%", gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: c.glass,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: c.glassBorder,
  },
  cancelText: { color: c.textPrimary, fontWeight: "600", fontSize: 14 },
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
