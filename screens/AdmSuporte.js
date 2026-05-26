import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import ConfirmModal from "../components/ConfirmModal";
import {
  listenAdminSupportTickets,
  listenSupportMessages,
  markSupportTicketRead,
  sendSupportMessage,
  SUPPORT_STATUS,
  updateSupportTicketStatus,
} from "../services/supportService";

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "aberto", label: "Abertos" },
  { id: "em_atendimento", label: "Atendimento" },
  { id: "aguardando_usuario", label: "Aguardando" },
  { id: "resolvido", label: "Resolvidos" },
];

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

export default function AdmSuporte({ navigation }) {
  const { user, nome, foto } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("todos");
  const [errorModal, setErrorModal] = useState({
    visible: false,
    message: "",
  });

  useEffect(() => {
    setTicketsLoading(true);
    const unsubscribe = listenAdminSupportTickets(
      (items) => {
        setTickets(items);
        setTicketsLoading(false);

        setSelectedTicket((current) => {
          if (!current) return current;
          return items.find((item) => item.id === current.id) || current;
        });
      },
      (error) => {
        console.log("Erro ao ouvir fila de suporte:", error);
        setTicketsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedTicket?.id) {
      setMessages([]);
      return () => {};
    }

    setMessagesLoading(true);
    markSupportTicketRead(selectedTicket.id, "admin").catch(() => {});

    const unsubscribe = listenSupportMessages(
      selectedTicket.id,
      (items) => {
        setMessages(items);
        setMessagesLoading(false);
      },
      (error) => {
        console.log("Erro ao ouvir conversa de suporte:", error);
        setMessagesLoading(false);
      }
    );

    return unsubscribe;
  }, [selectedTicket?.id]);

  const filteredTickets = useMemo(() => {
    if (filter === "todos") return tickets;
    return tickets.filter((item) => item.status === filter);
  }, [filter, tickets]);

  const stats = useMemo(() => {
    return tickets.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] = (acc[item.status] || 0) + 1;
        if (item.unreadAdmin) acc.unread += 1;
        return acc;
      },
      { total: 0, unread: 0 }
    );
  }, [tickets]);

  const handleSendReply = async () => {
    if (!selectedTicket?.id || !reply.trim()) return;

    try {
      setSending(true);

      await sendSupportMessage(selectedTicket.id, {
        texto: reply,
        authorId: user?.uid,
        authorName: nome || user?.displayName || "Administrador",
        authorPhoto: foto || user?.photoURL || "",
        authorRole: "admin",
      });

      setReply("");
    } catch (error) {
      console.log("Erro ao responder chamado:", error);
      setErrorModal({
        visible: true,
        message: error.message || "Não foi possível enviar a resposta.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleStatus = async (status) => {
    if (!selectedTicket?.id) return;

    try {
      await updateSupportTicketStatus(selectedTicket.id, {
        status,
        adminId: user?.uid,
        adminName: nome || user?.displayName || "Administrador",
      });
    } catch (error) {
      console.log("Erro ao atualizar status:", error);
      setErrorModal({
        visible: true,
        message: "Não foi possível atualizar o status.",
      });
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
              name={item.unreadAdmin ? "message-badge-outline" : "lifebuoy"}
              size={22}
              color={ticketStatusColor}
            />
          </View>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketTitle} numberOfLines={1}>
              {item.categoriaLabel || "Suporte"}
            </Text>
            <Text style={styles.ticketMeta} numberOfLines={1}>
              {item.userName || item.email || "Participante"} • {formatDate(item.updatedAt || item.createdAt)}
            </Text>
          </View>
          {item.unreadAdmin ? <View style={styles.unreadDot} /> : null}
        </View>

        <Text style={styles.ticketMessage} numberOfLines={2}>
          {item.lastMessage || item.mensagem}
        </Text>

        <View style={styles.ticketFooter}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor(item.prioridade, colors) }]} />
          <Text style={styles.priorityText}>{item.prioridade || "normal"}</Text>
          <View style={[styles.statusPill, { borderColor: ticketStatusColor }]}>
            <Text style={[styles.statusText, { color: ticketStatusColor }]}>
              {SUPPORT_STATUS[item.status] || "Aberto"}
            </Text>
          </View>
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Atendimento de Suporte</Text>
            <Text style={styles.subtitle}>Fila em tempo real entre participantes e administradores</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} icon="inbox-outline" />
          <StatCard label="Novos" value={stats.unread} icon="message-alert-outline" />
          <StatCard label="Abertos" value={stats.aberto || 0} icon="lifebuoy" />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.listPanel}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => setFilter(item.id)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {ticketsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredTickets}
              keyExtractor={(item) => item.id}
              renderItem={renderTicket}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="inbox-outline" size={42} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Nenhum chamado nesta fila</Text>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.chatPanel}>
          {selectedTicket ? (
            <>
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderCopy}>
                  <Text style={styles.chatTitle}>{selectedTicket.categoriaLabel || "Chamado"}</Text>
                  <Text style={styles.chatSubtitle} numberOfLines={1}>
                    {selectedTicket.userName || selectedTicket.email} • {formatDate(selectedTicket.createdAt)}
                  </Text>
                </View>
                <View style={[styles.statusPill, { borderColor: statusColor(selectedTicket.status, colors) }]}>
                  <Text style={[styles.statusText, { color: statusColor(selectedTicket.status, colors) }]}>
                    {SUPPORT_STATUS[selectedTicket.status] || "Aberto"}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <StatusButton label="Atender" active={selectedTicket.status === "em_atendimento"} onPress={() => handleStatus("em_atendimento")} />
                <StatusButton label="Aguardar" active={selectedTicket.status === "aguardando_usuario"} onPress={() => handleStatus("aguardando_usuario")} />
                <StatusButton label="Resolver" active={selectedTicket.status === "resolvido"} onPress={() => handleStatus("resolvido")} />
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
                    const admin = item.authorRole === "admin";
                    return (
                      <View style={[styles.messageBubble, admin ? styles.adminBubble : styles.userBubble]}>
                        <Text style={admin ? styles.messageAuthorAdmin : styles.messageAuthorUser}>
                          {admin ? item.authorName || "Administrador" : item.authorName || "Participante"}
                        </Text>
                        <Text style={admin ? styles.messageTextAdmin : styles.messageTextUser}>
                          {item.texto}
                        </Text>
                        <Text style={admin ? styles.messageTimeAdmin : styles.messageTimeUser}>
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
                  placeholder="Responder participante..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={styles.replyInput}
                />
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={[styles.sendButton, (!reply.trim() || sending) && styles.disabledButton]}
                  onPress={handleSendReply}
                  disabled={!reply.trim() || sending}
                >
                  <View style={styles.sendIconCircle}>
                    {sending ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <MaterialCommunityIcons name="send" size={18} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.chatEmpty}>
              <MaterialCommunityIcons name="headset" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Selecione um chamado</Text>
              <Text style={styles.emptyText}>A conversa e ações de atendimento aparecem aqui.</Text>
            </View>
          )}
        </View>
      </View>

      <ConfirmModal
        visible={errorModal.visible}
        title="Erro"
        message={errorModal.message}
        confirmText="OK"
        type="error"
        onConfirm={() =>
          setErrorModal({ visible: false, message: "" })
        }
      />
    </KeyboardAvoidingView>
  );
}

function StatCard({ icon, label, value }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);

  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={19} color={colors.primaryLight} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusButton({ label, active, onPress }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.statusButton, active && styles.statusButtonActive]}
    >
      <View style={[styles.statusIconCircle, { backgroundColor: active ? colors.primarySoft : colors.glass }]}>
        <MaterialCommunityIcons
          name={active ? "check-circle" : "circle-outline"}
          size={18}
          color={active ? colors.primary : colors.textMuted}
        />
      </View>
      <Text style={[styles.statusLabel, active && styles.statusLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900", color: c.textPrimary },
  subtitle: { color: c.textSecondary, marginTop: 4, lineHeight: 19 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glassBorder,
    padding: 12,
  },
  statValue: { color: c.textPrimary, fontSize: 20, fontWeight: "900", marginTop: 6 },
  statLabel: { color: c.textSecondary, fontSize: 11, marginTop: 2 },
  body: { flex: 1, padding: 16 },
  listPanel: { flex: 1 },
  chatPanel: {
    flex: 1.2,
    marginTop: 14,
    backgroundColor: c.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
  },
  filters: { gap: 8, paddingBottom: 12 },
  filterChip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    justifyContent: "center",
  },
  filterChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  filterText: { color: c.textSecondary, fontWeight: "700", fontSize: 12 },
  filterTextActive: { color: c.onPrimary },
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
  ticketTitle: { color: c.textPrimary, fontWeight: "900", fontSize: 14 },
  ticketMeta: { color: c.textMuted, fontSize: 12, marginTop: 3 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.error, marginLeft: 10 },
  ticketMessage: { color: c.textSecondary, marginTop: 12, lineHeight: 19 },
  ticketFooter: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  priorityText: { color: c.textMuted, fontSize: 12, textTransform: "capitalize" },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginLeft: "auto" },
  statusText: { fontSize: 11, fontWeight: "900" },
  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    flexDirection: "row",
    alignItems: "center",
  },
  chatHeaderCopy: { flex: 1, paddingRight: 10 },
  chatTitle: { color: c.textPrimary, fontSize: 16, fontWeight: "900" },
  chatSubtitle: { color: c.textMuted, marginTop: 3, fontSize: 12 },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    gap: 8,
  },
  statusButtonActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
  statusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: c.textSecondary,
  },
  statusLabelActive: { color: c.textPrimary },
  messagesList: { flex: 1 },
  messagesContent: { padding: 14 },
  messageBubble: { maxWidth: "88%", padding: 12, borderRadius: 16, marginBottom: 10 },
  adminBubble: { alignSelf: "flex-end", backgroundColor: c.primary },
  userBubble: {
    alignSelf: "flex-start",
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
  },
  messageAuthorAdmin: { color: c.onPrimary, fontSize: 11, fontWeight: "900", marginBottom: 4 },
  messageTextAdmin: { color: c.onPrimary, fontSize: 14, lineHeight: 19 },
  messageTimeAdmin: { color: "rgba(255,255,255,0.72)", fontSize: 10, marginTop: 6, alignSelf: "flex-end" },
  messageAuthorUser: { color: c.textMuted, fontSize: 11, fontWeight: "900", marginBottom: 4 },
  messageTextUser: { color: c.textPrimary, fontSize: 14, lineHeight: 19 },
  messageTimeUser: { color: c.textMuted, fontSize: 10, marginTop: 6, alignSelf: "flex-end" },
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primarySoft,
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
  emptyTitle: { color: c.textPrimary, fontSize: 16, fontWeight: "800", marginTop: 10, textAlign: "center" },
  emptyText: { color: c.textSecondary, textAlign: "center", lineHeight: 19, marginTop: 6 },
});
}
