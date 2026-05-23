import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../styles/Colors";
import { useCommunity } from "../hooks/useCommunity";
import CommunityGroupCard from "../components/CommunityGroupCard";
import CreatorHighlight from "../components/CreatorHighlight";
import CommunityNews from "../components/CommunityNews";

const GENEROS = [
  "Todos", "Música", "Dança", "Teatro", "Cinema",
  "Literatura", "Artes Visuais", "Gastronomia", "Fotografia", "Outro",
];

const TABS = [
  { key: "explorar", label: "Explorar", icon: "compass-outline" },
  { key: "meus", label: "Meus Grupos", icon: "account-group-outline" },
  { key: "criadores", label: "Criadores", icon: "star-outline" },
];

export default function TelaComunidade({ navigation }) {
  const {
    groups, myGroups, highlightedCreators, loading, error,
    loadGroups, loadMyGroups, loadHighlightedCreators,
    handleJoinGroup, handleLeaveGroup, checkIsMember,
    currentUser,
  } = useCommunity();

  const [activeTab, setActiveTab] = useState("explorar");
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    name: "", description: "", genre: "Música", isPrivate: false,
  });
  const [creating, setCreating] = useState(false);

  const { handleCreateGroup } = useCommunity();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadGroups(selectedGenre === "Todos" ? null : selectedGenre, searchText || null);
  }, [selectedGenre, searchText]);

  const loadInitialData = async () => {
    await Promise.all([
      loadGroups(),
      loadMyGroups(),
      loadHighlightedCreators(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleCreateCommunity = async () => {
    if (!createData.name.trim() || !createData.description.trim()) {
      Alert.alert("Atenção", "Preencha nome e descrição");
      return;
    }
    setCreating(true);
    try {
      const id = await handleCreateGroup(createData);
      setShowCreateModal(false);
      setCreateData({ name: "", description: "", genre: "Música", isPrivate: false });
      Alert.alert("Sucesso!", "Comunidade criada com sucesso!", [
        { text: "Ver Comunidade", onPress: () => navigation.navigate("ComunidadeGrupoDetalhes", { groupId: id }) },
        { text: "OK" },
      ]);
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleGroupAction = async (group) => {
    const isMember = checkIsMember(group);
    if (isMember) {
      Alert.alert("Sair do grupo?", `Você quer sair de "${group.name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => handleLeaveGroup(group.id) },
      ]);
    } else {
      try {
        await handleJoinGroup(group.id);
      } catch (err) {
        Alert.alert("Erro", err.message);
      }
    }
  };

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar comunidades..."
          placeholderTextColor={Colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)} activeOpacity={0.8}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.createBtnGradient}>
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderExplorarTab = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* GENRE FILTER */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll} contentContainerStyle={styles.genreContent}>
        {GENEROS.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[styles.genreChip, selectedGenre === genre && styles.genreChipActive]}
            onPress={() => setSelectedGenre(genre)}
            activeOpacity={0.7}
          >
            <Text style={[styles.genreChipText, selectedGenre === genre && styles.genreChipTextActive]}>
              {genre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* STATS BANNER */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{groups.length}</Text>
          <Text style={styles.statLabel}>Comunidades</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{groups.reduce((a, g) => a + (g.membersCount || 0), 0)}</Text>
          <Text style={styles.statLabel}>Membros</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{myGroups.length}</Text>
          <Text style={styles.statLabel}>Participando</Text>
        </View>
      </View>

      {/* GROUPS */}
      {loading && !groups.length ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-group-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Nenhuma comunidade encontrada</Text>
          <Text style={styles.emptySubtitle}>Seja o primeiro a criar uma!</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.emptyBtnText}>Criar comunidade</Text>
          </TouchableOpacity>
        </View>
      ) : (
        groups.map((group) => (
          <CommunityGroupCard
            key={group.id}
            {...group}
            isMember={checkIsMember(group)}
            onPress={() => navigation.navigate("ComunidadeGrupoDetalhes", { groupId: group.id })}
            onJoin={() => handleGroupAction(group)}
            onLeave={() => handleGroupAction(group)}
          />
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderMeusGruposTab = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {!currentUser ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-lock-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Faça login para ver seus grupos</Text>
        </View>
      ) : myGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-multiple-plus-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Você não participa de nenhuma comunidade</Text>
          <Text style={styles.emptySubtitle}>Explore e entre em comunidades que te interessam!</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab("explorar")}>
            <Text style={styles.emptyBtnText}>Explorar comunidades</Text>
          </TouchableOpacity>
        </View>
      ) : (
        myGroups.map((group) => (
          <CommunityGroupCard
            key={group.id}
            {...group}
            isMember={true}
            onPress={() => navigation.navigate("ComunidadeGrupoDetalhes", { groupId: group.id })}
            onLeave={() => handleGroupAction(group)}
          />
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderCriadoresTab = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {highlightedCreators.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="star-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Nenhum criador em destaque</Text>
        </View>
      ) : (
        highlightedCreators.map((creator) => (
          <CreatorHighlight
            key={creator.id}
            {...creator}
            onPress={() => navigation.navigate("ComunidadeCriadorDetalhes", { creatorId: creator.id })}
            onFollow={() => {}}
          />
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Comunidade</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* NOME */}
              <Text style={styles.fieldLabel}>Nome da comunidade *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Músicos de Fortaleza"
                placeholderTextColor={Colors.textMuted}
                value={createData.name}
                onChangeText={(v) => setCreateData((d) => ({ ...d, name: v }))}
                maxLength={60}
              />

              {/* DESCRIÇÃO */}
              <Text style={styles.fieldLabel}>Descrição *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Sobre o que é sua comunidade?"
                placeholderTextColor={Colors.textMuted}
                value={createData.description}
                onChangeText={(v) => setCreateData((d) => ({ ...d, description: v }))}
                multiline
                numberOfLines={3}
                maxLength={300}
              />
              <Text style={styles.charCount}>{createData.description.length}/300</Text>

              {/* GÊNERO */}
              <Text style={styles.fieldLabel}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {GENEROS.filter((g) => g !== "Todos").map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genreChip, createData.genre === g && styles.genreChipActive]}
                    onPress={() => setCreateData((d) => ({ ...d, genre: g }))}
                  >
                    <Text style={[styles.genreChipText, createData.genre === g && styles.genreChipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* PRIVACIDADE */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setCreateData((d) => ({ ...d, isPrivate: !d.isPrivate }))}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.toggleLabel}>Comunidade privada</Text>
                  <Text style={styles.toggleSub}>Apenas por convite</Text>
                </View>
                <View style={[styles.toggle, createData.isPrivate && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, createData.isPrivate && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>

              {/* BOTÃO */}
              <TouchableOpacity
                style={[styles.submitBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreateCommunity}
                disabled={creating}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.submitBtnGradient}>
                  {creating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="account-group-outline" size={20} color="#fff" />
                      <Text style={styles.submitBtnText}>Criar Comunidade</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={[Colors.surface, Colors.background]} style={styles.header}>
        <Text style={styles.headerTitle}>Comunidades</Text>
        <Text style={styles.headerSub}>Conecte-se com criadores e apreciadores</Text>
      </LinearGradient>

      {renderSearch()}

      {/* TABS */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT */}
      <View style={{ flex: 1 }}>
        {activeTab === "explorar" && renderExplorarTab()}
        {activeTab === "meus" && renderMeusGruposTab()}
        {activeTab === "criadores" && renderCriadoresTab()}
      </View>

      {renderCreateModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  searchContainer: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  createBtn: { borderRadius: 14, overflow: "hidden" },
  createBtnGradient: { width: 48, height: 48, justifyContent: "center", alignItems: "center", borderRadius: 14 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.background },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  tabLabelActive: { color: Colors.primary },
  genreScroll: { paddingVertical: 12 },
  genreContent: { paddingHorizontal: 16, gap: 8 },
  genreChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginRight: 8,
  },
  genreChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genreChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: "600" },
  genreChipTextActive: { color: "#fff" },
  statsBanner: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800", color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary, marginTop: 16, textAlign: "center" },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 8, textAlign: "center" },
  emptyBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  // MODAL
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: "90%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary, marginBottom: 8 },
  textInput: {
    backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    color: Colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: Colors.textMuted, textAlign: "right", marginTop: -12, marginBottom: 16 },
  toggleRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: Colors.card, padding: 16, borderRadius: 14, marginBottom: 20,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  toggleSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.border, justifyContent: "center", padding: 3 },
  toggleActive: { backgroundColor: Colors.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.textMuted },
  toggleThumbActive: { backgroundColor: "#fff", transform: [{ translateX: 20 }] },
  submitBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8, marginBottom: 16 },
  submitBtnGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, paddingVertical: 16 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
