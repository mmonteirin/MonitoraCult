import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal,
  TextInput, ActivityIndicator, Image, Alert, KeyboardAvoidingView,
  Platform, RefreshControl, StatusBar,
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

const INNER_TABS = [
  { key: "posts", label: "Posts", icon: "view-dashboard-outline" },
  { key: "forum", label: "Fórum", icon: "forum-outline" },
  { key: "sobre", label: "Sobre", icon: "information-outline" },
];

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "Agora";
  if (m < 60) return `${m}m atrás`;
  if (h < 24) return `${h}h atrás`;
  if (d < 7) return `${d}d atrás`;
  return date.toLocaleDateString("pt-BR");
}

function PostCard({ post, onLike, onComment, onDelete, currentUid }) {
  const isLiked = post.likes?.includes(currentUid);
  const isOwner = post.authorId === currentUid;

  return (
    <View style={postStyles.card}>
      {/* AUTHOR */}
      <View style={postStyles.authorRow}>
        <View style={postStyles.avatar}>
          {post.authorPhoto ? (
            <Image source={{ uri: post.authorPhoto }} style={postStyles.avatarImg} />
          ) : (
            <MaterialCommunityIcons name="account" size={22} color={colors.textMuted} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={postStyles.authorName}>{post.authorName || "Usuário"}</Text>
          <Text style={postStyles.postDate}>{formatDate(post.createdAt)}</Text>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={() => Alert.alert("Excluir post?", "", [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: () => onDelete(post.id) },
          ])}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* CONTENT */}
      <Text style={postStyles.content}>{post.content}</Text>

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={postStyles.postImage} resizeMode="cover" />
      )}

      {/* ACTIONS */}
      <View style={postStyles.actions}>
        <TouchableOpacity style={postStyles.actionBtn} onPress={() => onLike(post.id)}>
          <MaterialCommunityIcons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? colors.error : colors.textMuted}
          />
          <Text style={[postStyles.actionText, isLiked && { color: colors.error }]}>
            {post.likesCount || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={postStyles.actionBtn} onPress={() => onComment(post.id)}>
          <MaterialCommunityIcons name="comment-outline" size={20} color={colors.textMuted} />
          <Text style={postStyles.actionText}>{post.commentsCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ThreadCard({ thread, onPress }) {
  return (
    <TouchableOpacity style={threadStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={threadStyles.row}>
        <View style={threadStyles.avatar}>
          <MaterialCommunityIcons name="account" size={18} color={colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={threadStyles.title} numberOfLines={2}>{thread.title}</Text>
          <Text style={threadStyles.meta}>{thread.authorName} · {formatDate(thread.createdAt)}</Text>
        </View>
      </View>
      <Text style={threadStyles.desc} numberOfLines={2}>{thread.description}</Text>
      <View style={threadStyles.stats}>
        <View style={threadStyles.stat}>
          <MaterialCommunityIcons name="comment-outline" size={14} color={colors.textMuted} />
          <Text style={threadStyles.statText}>{thread.repliesCount || 0} respostas</Text>
        </View>
        <View style={threadStyles.stat}>
          <MaterialCommunityIcons name="heart-outline" size={14} color={colors.textMuted} />
          <Text style={threadStyles.statText}>{thread.likesCount || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ComunidadeGrupoDetalhes({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
  const insets = useSafeAreaInsets();
  const { groupId } = route.params;
  const {
    currentGroup, posts, forumThreads, loading,
    loadGroupDetails, loadGroupPosts, loadForumThreads,
    handleJoinGroup, handleLeaveGroup, handleCreatePost, handleLikePost,
    handleDeletePost, handleCreateForumThread,
    checkIsMember, checkIsAdmin, currentUser,
  } = useCommunity();

  const [innerTab, setInnerTab] = useState("posts");
  const [refreshing, setRefreshing] = useState(false);

  // Modais
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);

  const [showThreadModal, setShowThreadModal] = useState(false);
  const [threadData, setThreadData] = useState({ title: "", description: "" });
  const [submittingThread, setSubmittingThread] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [groupId]);

  const loadAllData = async () => {
    await Promise.all([
      loadGroupDetails(groupId),
      loadGroupPosts(groupId),
      loadForumThreads(groupId),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const isMember = checkIsMember(currentGroup);
  const isAdmin = checkIsAdmin(currentGroup);

  const handleJoinLeave = async () => {
    if (isMember) {
      Alert.alert("Sair da comunidade?", "", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair", style: "destructive",
          onPress: async () => {
            try { await handleLeaveGroup(groupId); }
            catch (err) { Alert.alert("Erro", err.message); }
          },
        },
      ]);
    } else {
      try { await handleJoinGroup(groupId); }
      catch (err) { Alert.alert("Erro", err.message); }
    }
  };

  const handleSubmitPost = async () => {
    if (!postContent.trim()) return;
    setSubmittingPost(true);
    try {
      await handleCreatePost(groupId, { content: postContent });
      setPostContent("");
      setShowPostModal(false);
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleSubmitThread = async () => {
    if (!threadData.title.trim() || !threadData.description.trim()) {
      Alert.alert("Preencha título e descrição");
      return;
    }
    setSubmittingThread(true);
    try {
      await handleCreateForumThread(groupId, threadData);
      setThreadData({ title: "", description: "" });
      setShowThreadModal(false);
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setSubmittingThread(false);
    }
  };

  const renderHeader = () => (
    <View>
      {/* CAPA */}
      <LinearGradient colors={[colors.primary, colors.primaryDark, colors.background]} style={styles.cover}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity style={styles.settingsBtn}
            onPress={() => navigation.navigate("ComunidadeGrupoEditar", { groupId })}>
            <MaterialCommunityIcons name="cog-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.coverContent}>
          <View style={styles.groupIcon}>
            <MaterialCommunityIcons name="account-group" size={36} color={colors.primary} />
          </View>
          <Text style={styles.groupName}>{currentGroup?.name || "Carregando..."}</Text>
          {currentGroup?.genre && (
            <View style={styles.genreBadge}>
              <Text style={styles.genreBadgeText}>{currentGroup.genre}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* INFO ROW */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoNum}>{currentGroup?.membersCount || 0}</Text>
          <Text style={styles.infoLabel}>Membros</Text>
        </View>
        <View style={styles.infoDiv} />
        <View style={styles.infoItem}>
          <Text style={styles.infoNum}>{currentGroup?.postsCount || 0}</Text>
          <Text style={styles.infoLabel}>Posts</Text>
        </View>
        <View style={styles.infoDiv} />
        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name={currentGroup?.isPrivate ? "lock-outline" : "earth"}
            size={18}
            color={colors.textMuted}
          />
          <Text style={styles.infoLabel}>{currentGroup?.isPrivate ? "Privado" : "Público"}</Text>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <TouchableOpacity
            style={[styles.joinBtn, isMember && styles.joinBtnMember]}
            onPress={handleJoinLeave}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isMember ? "check" : "plus"}
              size={16}
              color={isMember ? colors.success : "#fff"}
            />
            <Text style={[styles.joinBtnText, isMember && { color: colors.success }]}>
              {isMember ? "Membro" : "Participar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* INNER TABS */}
      <View style={styles.innerTabBar}>
        {INNER_TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.innerTab, innerTab === t.key && styles.innerTabActive]}
            onPress={() => setInnerTab(t.key)}
          >
            <MaterialCommunityIcons
              name={t.icon}
              size={16}
              color={innerTab === t.key ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.innerTabText, innerTab === t.key && styles.innerTabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPostsContent = () => (
    <>
      {isMember && (
        <TouchableOpacity style={styles.composeBox} onPress={() => setShowPostModal(true)} activeOpacity={0.8}>
          <View style={styles.composeAvatar}>
            <MaterialCommunityIcons name="account" size={20} color={colors.textMuted} />
          </View>
          <Text style={styles.composePlaceholder}>Compartilhe algo com a comunidade...</Text>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUid={currentUser?.uid}
          onLike={(id) => handleLikePost(groupId, id)}
          onComment={(id) => navigation.navigate("ComunidadePostComentarios", { groupId, postId: id })}
          onDelete={(id) => handleDeletePost(groupId, id)}
        />
      ))}
      {posts.length === 0 && (
        <View style={styles.emptySection}>
          <MaterialCommunityIcons name="post-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptySectionText}>
            {isMember ? "Seja o primeiro a postar!" : "Entre na comunidade para ver os posts"}
          </Text>
        </View>
      )}
    </>
  );

  const renderForumContent = () => (
    <>
      {isMember && (
        <TouchableOpacity
          style={styles.newThreadBtn}
          onPress={() => setShowThreadModal(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.newThreadBtnText}>Novo Tópico</Text>
        </TouchableOpacity>
      )}
      {forumThreads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          onPress={() => navigation.navigate("ComunidadeForumDetalhes", { groupId, threadId: thread.id })}
        />
      ))}
      {forumThreads.length === 0 && (
        <View style={styles.emptySection}>
          <MaterialCommunityIcons name="forum-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptySectionText}>Nenhum tópico ainda. Inicie a conversa!</Text>
        </View>
      )}
    </>
  );

  const renderSobreContent = () => (
    <View style={styles.sobreBox}>
      <Text style={styles.sobreTitle}>Sobre esta comunidade</Text>
      <Text style={styles.sobreDesc}>{currentGroup?.description || "Sem descrição."}</Text>

      {currentGroup?.tags?.length > 0 && (
        <View style={styles.tagsRow}>
          {currentGroup.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.sobreInfoBox}>
        <View style={styles.sobreInfoRow}>
          <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.textMuted} />
          <Text style={styles.sobreInfoText}>
            Criada em {currentGroup?.createdAt
              ? (currentGroup.createdAt.toDate ? currentGroup.createdAt.toDate() : new Date(currentGroup.createdAt.seconds * 1000)).toLocaleDateString("pt-BR")
              : "—"}
          </Text>
        </View>
        <View style={styles.sobreInfoRow}>
          <MaterialCommunityIcons name="tag-outline" size={18} color={colors.textMuted} />
          <Text style={styles.sobreInfoText}>Categoria: {currentGroup?.genre || "—"}</Text>
        </View>
      </View>
    </View>
  );

  if (loading && !currentGroup) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.FlatList
        entering={FadeIn.duration(700)}
        data={[]}
        keyExtractor={() => "dummy"}
        renderItem={null}
        ListHeaderComponent={
          <Animated.View entering={FadeInDown.duration(700)}>
            {renderHeader()}
          </Animated.View>
        }
        ListFooterComponent={
          <View style={{ paddingBottom: 100 }}>
            {innerTab === "posts" && renderPostsContent()}
            {innerTab === "forum" && renderForumContent()}
            {innerTab === "sobre" && renderSobreContent()}
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
      />

      {/* MODAL: NOVO POST */}
      <Modal visible={showPostModal} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Post</Text>
                <TouchableOpacity onPress={() => setShowPostModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.postInput}
                placeholder="O que você quer compartilhar?"
                placeholderTextColor={colors.textMuted}
                value={postContent}
                onChangeText={setPostContent}
                multiline
                numberOfLines={5}
                maxLength={1000}
                autoFocus
              />
              <Text style={styles.charCount}>{postContent.length}/1000</Text>
              <TouchableOpacity
                style={[styles.submitBtn, (!postContent.trim() || submittingPost) && { opacity: 0.5 }]}
                onPress={handleSubmitPost}
                disabled={!postContent.trim() || submittingPost}
              >
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.submitBtnGradient}>
                  {submittingPost
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.submitBtnText}>Publicar</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: NOVO TÓPICO */}
      <Modal visible={showThreadModal} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Tópico</Text>
                <TouchableOpacity onPress={() => setShowThreadModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Título do tópico"
                placeholderTextColor={colors.textMuted}
                value={threadData.title}
                onChangeText={(v) => setThreadData((d) => ({ ...d, title: v }))}
                maxLength={120}
              />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Descreva seu tópico..."
                placeholderTextColor={colors.textMuted}
                value={threadData.description}
                onChangeText={(v) => setThreadData((d) => ({ ...d, description: v }))}
                multiline
                numberOfLines={4}
                maxLength={600}
              />
              <TouchableOpacity
                style={[styles.submitBtn, submittingThread && { opacity: 0.5 }]}
                onPress={handleSubmitThread}
                disabled={submittingThread}
              >
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.submitBtnGradient}>
                  {submittingThread
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.submitBtnText}>Criar Tópico</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.background },
  cover: { height: 200, padding: 16, justifyContent: "space-between" },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center", alignItems: "center",
  },
  settingsBtn: {
    position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center",
  },
  coverContent: { alignItems: "center", paddingBottom: 8 },
  groupIcon: {
    width: 68, height: 68, borderRadius: 22, backgroundColor: c.surface,
    justifyContent: "center", alignItems: "center", marginBottom: 10,
    borderWidth: 2, borderColor: c.primary,
  },
  groupName: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center" },
  genreBadge: {
    marginTop: 6, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
    backgroundColor: "rgba(108,92,231,0.5)",
  },
  genreBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  infoRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  infoItem: { alignItems: "center", paddingHorizontal: 12 },
  infoNum: { fontSize: 16, fontWeight: "800", color: c.textPrimary },
  infoLabel: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  infoDiv: { width: 1, height: 30, backgroundColor: c.border },
  joinBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: c.primary, borderRadius: 14,
  },
  joinBtnMember: { backgroundColor: "rgba(34,197,94,0.12)", borderWidth: 1, borderColor: c.success },
  joinBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  innerTabBar: {
    flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.border,
    backgroundColor: c.background,
  },
  innerTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12,
  },
  innerTabActive: { borderBottomWidth: 2, borderBottomColor: c.primary },
  innerTabText: { fontSize: 12, color: c.textMuted, fontWeight: "600" },
  innerTabTextActive: { color: c.primary },
  composeBox: {
    flexDirection: "row", alignItems: "center", gap: 10, margin: 16,
    backgroundColor: c.surface, padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: c.border,
  },
  composeAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: c.card,
    justifyContent: "center", alignItems: "center",
  },
  composePlaceholder: { flex: 1, color: c.textMuted, fontSize: 14 },
  emptySection: { alignItems: "center", paddingVertical: 48 },
  emptySectionText: { color: c.textMuted, fontSize: 14, marginTop: 12, textAlign: "center" },
  newThreadBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, margin: 16, padding: 12,
    backgroundColor: c.primary, borderRadius: 14, justifyContent: "center",
  },
  newThreadBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  sobreBox: { padding: 20 },
  sobreTitle: { fontSize: 16, fontWeight: "700", color: c.textPrimary, marginBottom: 10 },
  sobreDesc: { fontSize: 14, color: c.textSecondary, lineHeight: 21 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  tag: { backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { color: c.primary, fontSize: 13, fontWeight: "600" },
  sobreInfoBox: { marginTop: 20, gap: 12 },
  sobreInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sobreInfoText: { color: c.textSecondary, fontSize: 14 },
  // MODALS
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: c.textPrimary },
  postInput: {
    backgroundColor: c.card, borderRadius: 14, padding: 14,
    color: c.textPrimary, fontSize: 15, minHeight: 120, textAlignVertical: "top",
    borderWidth: 1, borderColor: c.border,
  },
  charCount: { fontSize: 11, color: c.textMuted, textAlign: "right", marginTop: 6, marginBottom: 14 },
  textInput: {
    backgroundColor: c.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    color: c.textPrimary, fontSize: 14, borderWidth: 1, borderColor: c.border, marginBottom: 12,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  submitBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  submitBtnGradient: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

const postStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: c.card,
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border,
  },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface,
    justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  avatarImg: { width: 38, height: 38 },
  authorName: { fontSize: 14, fontWeight: "700", color: c.textPrimary },
  postDate: { fontSize: 12, color: c.textMuted, marginTop: 1 },
  content: { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginBottom: 10 },
  postImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 10 },
  actions: { flexDirection: "row", gap: 20, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { color: c.textMuted, fontSize: 13 },
});

const threadStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: c.card,
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: c.surface,
    justifyContent: "center", alignItems: "center",
  },
  title: { fontSize: 14, fontWeight: "700", color: c.textPrimary, flex: 1 },
  meta: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  desc: { fontSize: 13, color: c.textSecondary, lineHeight: 18, marginBottom: 10 },
  stats: { flexDirection: "row", gap: 16, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 8 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, color: c.textMuted },
});
}
