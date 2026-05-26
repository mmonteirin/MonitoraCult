import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  Alert, StatusBar, RefreshControl,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { useCommunity } from "../hooks/useCommunity";

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  const diff = Date.now() - date.getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return "Agora";
  if (h < 24) return `${h}h atrás`;
  if (d < 7) return `${d}d atrás`;
  return date.toLocaleDateString("pt-BR");
}

export default function ComunidadeForumDetalhes({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
  const insets = useSafeAreaInsets();
  const { groupId, threadId } = route.params;
  const {
    currentThread, threadReplies, loading,
    loadThreadDetails, handleAddForumReply, checkIsMember, currentGroup, loadGroupDetails,
  } = useCommunity();

  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadThreadDetails(groupId, threadId);
    await loadGroupDetails(groupId);
    setRefreshing(false);
  };

  useEffect(() => {
    loadThreadDetails(groupId, threadId);
    loadGroupDetails(groupId);
  }, [groupId, threadId]);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await handleAddForumReply(groupId, threadId, replyText);
      setReplyText("");
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isMember = checkIsMember(currentGroup);

  const renderReply = ({ item, index }) => (
    <View style={[styles.replyCard, index === 0 && { marginTop: 4 }]}>
      <View style={styles.replyAuthorRow}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={18} color={colors.textMuted} />
        </View>
        <View>
          <Text style={styles.authorName}>{item.authorName || "Usuário"}</Text>
          <Text style={styles.replyDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.replyContent}>{item.content}</Text>
    </View>
  );

  if (loading && !currentThread) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <Animated.View
        entering={FadeInDown.duration(700)}
      >
        <LinearGradient
          colors={[
            colors.backgroundSecondary,
            colors.surface,
            colors.background,
          ]}
          style={[
            styles.header,
            {
              paddingTop: insets.top + 12,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <BlurView
                intensity={35}
                tint={blurTint}
                style={styles.headerBlur}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Fórum</Text>
            <View style={{ width: 52 }} />
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.FlatList
        entering={FadeIn.duration(700)}
        data={threadReplies}
        keyExtractor={(item) => item.id}
        renderItem={renderReply}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.threadCard}>
            {/* THREAD AUTHOR */}
            <View style={styles.threadAuthorRow}>
              <View style={styles.avatarLg}>
                <MaterialCommunityIcons name="account" size={24} color={colors.textMuted} />
              </View>
              <View>
                <Text style={styles.threadAuthorName}>{currentThread?.authorName || "Usuário"}</Text>
                <Text style={styles.threadDate}>{formatDate(currentThread?.createdAt)}</Text>
              </View>
            </View>

            {/* THREAD CONTENT */}
            <Text style={styles.threadTitle}>{currentThread?.title}</Text>
            <Text style={styles.threadDescription}>{currentThread?.description}</Text>

            {/* STATS */}
            <View style={styles.threadStats}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="comment-multiple-outline" size={16} color={colors.textMuted} />
                <Text style={styles.statText}>{threadReplies.length} respostas</Text>
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.repliesLabel}>Respostas</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyReplies}>
            <MaterialCommunityIcons name="comment-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nenhuma resposta ainda. Seja o primeiro!</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {/* INPUT AREA */}
      {isMember ? (
        <View style={styles.inputArea}>
          <TextInput
            style={styles.replyInput}
            placeholder="Escreva sua resposta..."
            placeholderTextColor={colors.textMuted}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={600}
          />
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.sendBtn, (!replyText.trim() || submitting) && { opacity: 0.5 }]}
            onPress={handleSubmitReply}
            disabled={!replyText.trim() || submitting}
          >
            <View style={[styles.sendIconCircle, { backgroundColor: "rgba(108,92,231,0.2)" }]}>
              {submitting
                ? <ActivityIndicator color="#6C5CE7" size="small" />
                : <MaterialCommunityIcons name="send" size={18} color="#6C5CE7" />}
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.joinBanner}>
          <Text style={styles.joinBannerText}>Entre na comunidade para responder</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBlur: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.glassStrong,
    backgroundColor: c.glass,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFF", flex: 1, textAlign: "center" },
  threadCard: { padding: 20 },
  threadAuthorRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatarLg: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: c.surface,
    justifyContent: "center", alignItems: "center",
  },
  threadAuthorName: { fontSize: 14, fontWeight: "700", color: c.textPrimary },
  threadDate: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  threadTitle: { fontSize: 20, fontWeight: "800", color: c.textPrimary, lineHeight: 26, marginBottom: 12 },
  threadDescription: { fontSize: 14, color: c.textSecondary, lineHeight: 21 },
  threadStats: { flexDirection: "row", marginTop: 16, gap: 16 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { color: c.textMuted, fontSize: 13 },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 20 },
  repliesLabel: { fontSize: 15, fontWeight: "700", color: c.textPrimary },
  replyCard: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: c.card,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.border,
  },
  replyAuthorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: c.surface,
    justifyContent: "center", alignItems: "center",
  },
  authorName: { fontSize: 13, fontWeight: "700", color: c.textPrimary },
  replyDate: { fontSize: 11, color: c.textMuted, marginTop: 1 },
  replyContent: { fontSize: 14, color: c.textSecondary, lineHeight: 20 },
  emptyReplies: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: c.textMuted, fontSize: 14, marginTop: 10, textAlign: "center" },
  inputArea: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    padding: 14, paddingBottom: Platform.OS === "ios" ? 30 : 14,
    backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border,
  },
  replyInput: {
    flex: 1, backgroundColor: c.card, borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, color: c.textPrimary, fontSize: 14, maxHeight: 100,
    borderWidth: 1, borderColor: c.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  sendIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBanner: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border, alignItems: "center",
  },
  joinBannerText: { color: c.textMuted, fontSize: 14 },
});
}
