import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { Colors } from "../styles/Colors";
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

export default function AdmSuporte({ navigation }) {
  const { user, nome, foto } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("todos");

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
      Alert.alert("Erro", error.message || "Não foi possível enviar a resposta.");
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
      Alert.alert("Erro", "Não foi possível atualizar o status.");
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
              name={item.unreadAdmin ? "message-badge-outline" : "lifebuoy"}
              size={22}
              color={statusColor(item.status)}
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
          <View style={[styles.priorityDot, { backgroundColor: priorityColor(item.prioridade) }]} />
          <Text style={styles.priorityText}>{item.prioridade || "normal"}</Text>
          <View style={[styles.statusPill, { borderColor: statusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
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
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
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
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredTickets}
              keyExtractor={(item) => item.id}
              renderItem={renderTicket}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="inbox-outline" size={42} color={Colors.textMuted} />
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
                <View style={[styles.statusPill, { borderColor: statusColor(selectedTicket.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(selectedTicket.status) }]}>
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
                  <ActivityIndicator color={Colors.primary} />
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
                        <Text style={styles.messageAuthor}>
                          {admin ? item.authorName || "Administrador" : item.authorName || "Participante"}
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
                  placeholder="Responder participante..."
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
              <MaterialCommunityIcons name="headset" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Selecione um chamado</Text>
              <Text style={styles.emptyText}>A conversa e ações de atendimento aparecem aqui.</Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={19} color={Colors.primaryLight} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.statusButton, active && styles.statusButtonActive]}
    >
      <Text style={[styles.statusButtonText, active && styles.statusButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900", color: Colors.textPrimary },
  subtitle: { color: Colors.textSecondary, marginTop: 4, lineHeight: 19 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 12,
  },
  statValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: "900", marginTop: 6 },
  statLabel: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  body: { flex: 1, padding: 16 },
  listPanel: { flex: 1 },
  chatPanel: {
    flex: 1.2,
    marginTop: 14,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  filters: { gap: 8, paddingBottom: 12 },
  filterChip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontWeight: "700", fontSize: 12 },
  filterTextActive: { color: "#FFF" },
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
  ticketTitle: { color: Colors.textPrimary, fontWeight: "900", fontSize: 14 },
  ticketMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error, marginLeft: 10 },
  ticketMessage: { color: Colors.textSecondary, marginTop: 12, lineHeight: 19 },
  ticketFooter: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  priorityText: { color: Colors.textMuted, fontSize: 12, textTransform: "capitalize" },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginLeft: "auto" },
  statusText: { fontSize: 11, fontWeight: "900" },
  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  chatHeaderCopy: { flex: 1, paddingRight: 10 },
  chatTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "900" },
  chatSubtitle: { color: Colors.textMuted, marginTop: 3, fontSize: 12 },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusButton: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusButtonText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "800" },
  statusButtonTextActive: { color: "#FFF" },
  messagesList: { flex: 1 },
  messagesContent: { padding: 14 },
  messageBubble: { maxWidth: "88%", padding: 12, borderRadius: 16, marginBottom: 10 },
  adminBubble: { alignSelf: "flex-end", backgroundColor: Colors.primary },
  userBubble: { alignSelf: "flex-start", backgroundColor: Colors.backgroundElevated },
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
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "800", marginTop: 10, textAlign: "center" },
  emptyText: { color: Colors.textSecondary, textAlign: "center", lineHeight: 19, marginTop: 6 },
});
