import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../styles/Colors";
import { useCommunity } from "../hooks/useCommunity";
import { getGroupDetails } from "../services/communityService";
import ForumThread from "../components/ForumThread";

export default function ComunidadeGrupoDetalhes({ route, navigation }) {
  const { groupId } = route.params;
  const {
    forumThreads,
    loadForumThreads,
    handleCreateForumThread,
  } = useCommunity();

  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThreadData, setNewThreadData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    loadGroupData();
  }, []);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const details = await getGroupDetails(groupId);
      setGroupDetails(details);
      await loadForumThreads(groupId);
    } catch (error) {
      console.error("Erro ao carregar grupo:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  };

  const handleCreateThread = async () => {
    if (!newThreadData.title.trim() || !newThreadData.description.trim()) {
      alert("Preencha título e descrição");
      return;
    }

    try {
      await handleCreateForumThread(groupId, newThreadData);
      setNewThreadData({ title: "", description: "" });
      setShowNewThreadModal(false);
      alert("Tópico criado com sucesso!");
    } catch (error) {
      alert("Erro ao criar tópico: " + error.message);
    }
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

  if (!groupDetails) {
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Grupo não encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER COM BACK BUTTON */}
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
        <Text style={styles.headerTitle}>{groupDetails.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={forumThreads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ForumThread
            {...item}
            onPress={() => {
              navigation.navigate("ComunidadeForumDetalhes", {
                groupId,
                threadId: item.id,
              });
            }}
            onReply={() => {
              navigation.navigate("ComunidadeForumDetalhes", {
                groupId,
                threadId: item.id,
              });
            }}
          />
        )}
        ListHeaderComponent={
          <View style={styles.groupHeader}>
            {groupDetails.image && (
              <Image
                source={{ uri: groupDetails.image }}
                style={styles.groupImage}
              />
            )}
            <LinearGradient
              colors={[
                "rgba(0, 0, 0, 0.3)",
                "rgba(108, 92, 231, 0.6)",
              ]}
              style={styles.groupOverlay}
            >
              <View style={styles.groupInfo}>
                <View style={styles.genreTag}>
                  <Text style={styles.genreTagText}>
                    {groupDetails.genre}
                  </Text>
                </View>
                <Text style={styles.groupName}>
                  {groupDetails.name}
                </Text>
                <Text style={styles.groupDescription}>
                  {groupDetails.description}
                </Text>

                {/* STATS */}
                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons
                      name="account-multiple"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.statText}>
                      {groupDetails.membersCount} membros
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons
                      name="chat-multiple-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.statText}>
                      {forumThreads.length} tópicos
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={60}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyStateText}>
              Nenhum tópico no fórum ainda
            </Text>
            <Text style={styles.emptyStateSubText}>
              Seja o primeiro a criar um tópico!
            </Text>
          </View>
        }
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />

      {/* FLOATING ACTION BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNewThreadModal(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="plus"
          size={28}
          color={Colors.textPrimary}
        />
      </TouchableOpacity>

      {/* NEW THREAD MODAL */}
      <Modal
        visible={showNewThreadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewThreadModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowNewThreadModal(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={28}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Novo Tópico</Text>
              <TouchableOpacity
                onPress={handleCreateThread}
                disabled={
                  !newThreadData.title.trim() ||
                  !newThreadData.description.trim()
                }
              >
                <MaterialCommunityIcons
                  name="check"
                  size={28}
                  color={
                    newThreadData.title.trim() &&
                    newThreadData.description.trim()
                      ? Colors.success
                      : Colors.textMuted
                  }
                />
              </TouchableOpacity>
            </View>

            {/* MODAL CONTENT */}
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o título do tópico"
                placeholderTextColor={Colors.textMuted}
                value={newThreadData.title}
                onChangeText={(text) =>
                  setNewThreadData({ ...newThreadData, title: text })
                }
              />

              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Digite a descrição do tópico"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={newThreadData.description}
                onChangeText={(text) =>
                  setNewThreadData({
                    ...newThreadData,
                    description: text,
                  })
                }
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  groupHeader: {
    height: 220,
    marginBottom: 12,
  },
  groupImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  groupOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  groupInfo: {
    gap: 8,
  },
  genreTag: {
    backgroundColor: "rgba(108, 92, 231, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  genreTagText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  groupName: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  groupDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  stats: {
    flexDirection: "row",
    gap: 20,
    marginTop: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
  emptyStateSubText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textMuted,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalContent: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  descriptionInput: {
    height: 120,
  },
});
