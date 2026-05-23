import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { getForumReplies, addForumReply } from "../services/communityService";
import { auth } from "../firebaseConfig";

export default function ComunidadeForumDetalhes({ route, navigation }) {
  const { groupId, threadId } = route.params;

  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadForumData();
  }, []);

  const loadForumData = async () => {
    try {
      setLoading(true);
      const repliesData = await getForumReplies(groupId, threadId);
      setReplies(repliesData);
      // Aqui você precisaria buscar os detalhes do thread também
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar fórum:", error);
      setLoading(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim()) {
      alert("Digite uma resposta");
      return;
    }

    setSubmitting(true);
    try {
      await addForumReply(groupId, threadId, {
        content: replyText,
      });
      setReplyText("");
      await loadForumData();
      alert("Resposta adicionada com sucesso!");
    } catch (error) {
      alert("Erro ao adicionar resposta: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Agora";
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discussão</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={replies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.replyContainer}>
            <View style={styles.replyHeader}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={36}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.replyInfo}>
                <Text style={styles.authorName}>
                  {item.authorName || "Usuário"}
                </Text>
                <Text style={styles.timestamp}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
            <Text style={styles.replyContent}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="message-outline"
              size={60}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyStateText}>
              Nenhuma resposta ainda
            </Text>
            <Text style={styles.emptyStateSubText}>
              Seja o primeiro a responder!
            </Text>
          </View>
        }
        scrollEnabled={true}
      />

      {/* REPLY INPUT */}
      <View style={styles.replyInputContainer}>
        <TextInput
          style={styles.replyInput}
          placeholder="Escreva uma resposta..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          value={replyText}
          onChangeText={setReplyText}
          editable={!submitting}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!replyText.trim() || submitting) && styles.sendButtonDisabled,
          ]}
          onPress={handleAddReply}
          disabled={!replyText.trim() || submitting}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="send"
            size={20}
            color={
              replyText.trim() && !submitting
                ? Colors.primary
                : Colors.textMuted
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  replyContainer: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  replyInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  replyContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginLeft: 46,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  emptyStateSubText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textMuted,
  },
  replyInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    padding: 10,
    borderRadius: 12,
    fontSize: 13,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
