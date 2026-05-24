import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../styles/Colors";
import { useCommunity } from "../hooks/useCommunity";
import CommunityGroupCard from "../components/CommunityGroupCard";
import CreatorHighlight from "../components/CreatorHighlight";

const GENEROS = [
  "Todos", "Música", "Dança", "Teatro", "Cinema",
  "Literatura", "Artes Visuais", "Gastronomia", "Fotografia", "Outro",
];

// Unificado com o design real da sua imagem (Grupos, Criadores, Notícias)
const TABS = [
  { key: "explorar", label: "grupos", icon: "account-group-outline" },
  { key: "criadores", label: "criadores", icon: "star-outline" },
  { key: "meus", label: "meus grupos", icon: "bookmark-outline" },
];

export default function TelaComunidade({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const embedded = !!route?.params?.embedded;
  const {
    groups, myGroups, highlightedCreators, loading,
    loadGroups, loadMyGroups, loadHighlightedCreators,
    handleJoinGroup, handleLeaveGroup, checkIsMember,
    currentUser,
    handleCreateGroup,
  } = useCommunity();

  const [activeTab, setActiveTab] = useState("explorar");
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const [createData, setCreateData] = useState({
    name: "", description: "", genre: "Música", isPrivate: false,
  });
  const [creating, setCreating] = useState(false);
  const HeaderContainer = embedded ? View : LinearGradient;
  const headerContainerProps = embedded
    ? {}
    : {
        colors: [
          Colors?.backgroundSecondary || "#18122B",
          Colors?.surface || "#10131F",
          Colors?.background || "#10131F",
        ],
      };

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
      Alert.alert("Atenção", "Preencha nome e descrição obrigatórios.");
      return;
    }
    setCreating(true);
    try {
      const id = await handleCreateGroup(createData);
      setShowCreateModal(false);
      setCreateData({ name: "", description: "", genre: "Música", isPrivate: false });
      Alert.alert("Sucesso! 🎉", "Sua nova comunidade foi aberta com sucesso!", [
        { text: "Ver Grupo", onPress: () => navigation.navigate("ComunidadeGrupoDetalhes", { groupId: id }) },
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
      Alert.alert("Sair do grupo?", `Você deseja deixar a comunidade "${group.name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair do Grupo", style: "destructive", onPress: () => handleLeaveGroup(group.id) },
      ]);
    } else {
      try {
        await handleJoinGroup(group.id);
      } catch (err) {
        Alert.alert("Erro", err.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      {!embedded && <StatusBar barStyle="light-content" />}

      {/* HEADER DE COMUNIDADES NOVO LAYOUT */}
      <HeaderContainer
        {...headerContainerProps}
        style={[
          styles.header,
          embedded ? styles.headerEmbedded : { paddingTop: insets.top + 12 },
        ]}
      >
        {!embedded && (
          <View style={styles.headerTopRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Comunidade</Text>
              <Text style={styles.headerSub}>Descubra grupos, criadores e cultura viva perto de você.</Text>
            </View>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
              <MaterialCommunityIcons name="bell-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* BARRA DE BUSCA PREMIUM INTEGRADA */}
        <View style={styles.searchContainer}>
          <BlurView intensity={40} tint="dark" style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={Colors?.textMuted || "#64748B"} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar grupos ou interesses..."
              placeholderTextColor={Colors?.textMuted || "#64748B"}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <MaterialCommunityIcons name="close-circle" size={18} color={Colors?.textMuted || "#64748B"} />
              </TouchableOpacity>
            )}
          </BlurView>

          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)} activeOpacity={0.85}>
            <LinearGradient colors={[Colors?.primary || "#7C3AED", "#5B21B6"]} style={styles.createBtnGradient}>
              <MaterialCommunityIcons name="plus" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </HeaderContainer>

      {/* TABS EM FORMATO DE PÍLULA CENTRALIZADA (IGUAL À SUA IMAGEM) */}
      <View style={styles.tabContainerOuter}>
        <BlurView intensity={30} tint="dark" style={styles.tabBarPill}>
          {TABS.map((tab) => {
            const ativo = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtnItem, ativo && styles.tabBtnItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabLabelText, ativo && styles.tabLabelTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>

      {/* CONTEÚDO DINÂMICO COMPATÍVEL */}
      <View style={{ flex: 1 }}>
        {activeTab === "explorar" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors?.primary} />}
          >
            {/* CARROSSEL HORIZONTAL DE GÊNEROS (CANTOS ARREDONDADOS DA FOTO) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll} contentContainerStyle={styles.genreContent}>
              {GENEROS.map((genre) => {
                const ativo = selectedGenre === genre;
                return (
                  <TouchableOpacity
                    key={genre}
                    style={[styles.genreChip, ativo && styles.genreChipActive]}
                    onPress={() => setSelectedGenre(genre)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.genreChipText, ativo && styles.genreChipTextActive]}>
                      {genre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* BANNER DE MÉTRICAS TRANSLÚCIDO */}
            <BlurView intensity={20} tint="dark" style={styles.statsBanner}>
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
            </BlurView>

            {/* FEED DE PRODUTOS/GRUPOS */}
            {loading && !groups.length ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={Colors?.primary || "#7C3AED"} />
              </View>
            ) : groups.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group-outline" size={56} color={Colors?.textMuted || "#64748B"} />
                <Text style={styles.emptyTitle}>Nenhum grupo encontrado</Text>
                <Text style={styles.emptySubtitle}>Seja o pioneiro e comece essa comunidade agora!</Text>
              </View>
            ) : (
              <View style={styles.listPadding}>
                {groups.map((group) => (
                  <CommunityGroupCard
                    key={group.id}
                    {...group}
                    isMember={checkIsMember(group)}
                    onPress={() => navigation.navigate("ComunidadeGrupoDetalhes", { groupId: group.id })}
                    onJoin={() => handleGroupAction(group)}
                    onLeave={() => handleGroupAction(group)}
                  />
                ))}
              </View>
            )}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {activeTab === "meus" && renderMeusGruposTab()}
        {activeTab === "criadores" && renderCriadoresTab()}
      </View>

      {renderCreateModal()}
    </View>
  );

  // Sub-blocos auxiliares organizados mantendo performance estável
  function renderMeusGruposTab() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors?.primary} />}
        contentContainerStyle={styles.listPadding}
      >
        {!currentUser ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-lock-outline" size={56} color={Colors?.textMuted} />
            <Text style={styles.emptyTitle}>Faça login para ver sua agenda</Text>
          </View>
        ) : myGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-multiple-plus-outline" size={56} color={Colors?.textMuted} />
            <Text style={styles.emptyTitle}>Você não se uniu a nenhum grupo</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab("explorar")}>
              <Text style={styles.emptyBtnText}>Explorar Comunidades</Text>
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
        <View style={{ height: 120 }} />
      </ScrollView>
    );
  }

  function renderCriadoresTab() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors?.primary} />}
        contentContainerStyle={styles.listPadding}
      >
        {highlightedCreators.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="star-outline" size={56} color={Colors?.textMuted} />
            <Text style={styles.emptyTitle}>Nenhum produtor em destaque</Text>
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
        <View style={{ height: 120 }} />
      </ScrollView>
    );
  }

  function renderCreateModal() {
    return (
      <Modal visible={showCreateModal} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nova Comunidade</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Nome da Comunidade *</Text>
                <TextInput
                  style={[styles.textInput, focusedField === "name" && styles.inputFocused]}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ex: Coletivo Audiovisual Mondubim"
                  placeholderTextColor={Colors?.textMuted || "#64748B"}
                  value={createData.name}
                  onChangeText={(v) => setCreateData((d) => ({ ...d, name: v }))}
                  maxLength={60}
                />

                <Text style={styles.fieldLabel}>Descrição de Objetivos *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, focusedField === "desc" && styles.inputFocused]}
                  onFocus={() => setFocusedField("desc")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Explique quais os temas centrais abordados nas reuniões..."
                  placeholderTextColor={Colors?.textMuted || "#64748B"}
                  value={createData.description}
                  onChangeText={(v) => setCreateData((d) => ({ ...d, description: v }))}
                  multiline
                  numberOfLines={4}
                  maxLength={300}
                />
                <Text style={styles.charCount}>{createData.description.length}/300</Text>

                <Text style={styles.fieldLabel}>Segmento Artístico principal</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {GENEROS.filter((g) => g !== "Todos").map((g) => {
                    const ativo = createData.genre === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genreChip, ativo && styles.genreChipActive]}
                        onPress={() => setCreateData((d) => ({ ...d, genre: g }))}
                      >
                        <Text style={[styles.genreChipText, ativo && styles.genreChipTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setCreateData((d) => ({ ...d, isPrivate: !d.isPrivate }))}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.toggleLabel}>Restringir Entrada</Text>
                    <Text style={styles.toggleSub}>Novos membros necessitam de aprovação</Text>
                  </View>
                  <View style={[styles.toggle, createData.isPrivate && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, createData.isPrivate && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, creating && { opacity: 0.6 }]}
                  onPress={handleCreateCommunity}
                  disabled={creating}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[Colors?.primary || "#7C3AED", "#5B21B6"]} style={styles.submitBtnGradient}>
                    {creating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="account-group" size={20} color="#fff" />
                        <Text style={styles.submitBtnText}>Inaugurar Comunidade</Text>
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
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors?.background || "#10131F" },
  header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors?.background || "#10131F" },
  headerEmbedded: { paddingTop: 12, paddingBottom: 8 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerCopy: { flex: 1, paddingRight: 14 },
  headerTitle: { fontSize: 32, fontWeight: "800", color: "#FFF" },
  headerSub: { fontSize: 13, color: Colors?.textSecondary || "#94A3B8", marginTop: 4, paddingRight: 40, lineHeight: 18 },
  bellButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  searchContainer: { flexDirection: "row", gap: 12, marginTop: 14 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  searchInput: { flex: 1, color: "#FFF", fontSize: 15 },
  createBtn: { borderRadius: 18, overflow: "hidden" },
  createBtnGradient: { width: 54, height: 54, justifyContent: "center", alignItems: "center" },
  
  // Customização de abas unificada com a foto real da interface
  tabContainerOuter: { paddingHorizontal: 20, marginVertical: 12 },
  tabBarPill: { flexDirection: "row", padding: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", overflow: "hidden" },
  tabBtnItem: { flex: 1, paddingVertical: 10, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  tabBtnItemActive: { backgroundColor: Colors?.primary || "#7C3AED" },
  tabLabelText: { fontSize: 13, color: Colors?.textSecondary || "#94A3B8", fontWeight: "700", textTransform: "lowercase" },
  tabLabelTextActive: { color: "#FFF" },

  genreScroll: { marginVertical: 8 },
  genreContent: { paddingHorizontal: 20, gap: 8 },
  genreChip: { paddingHorizontal: 18, height: 38, justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  genreChipActive: { backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" },
  genreChipText: { color: Colors?.textSecondary || "#94A3B8", fontSize: 13, fontWeight: "600" },
  genreChipTextActive: { color: "#fff", fontWeight: "700" },

  statsBanner: { flexDirection: "row", marginHorizontal: 20, marginVertical: 16, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", overflow: "hidden" },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", color: Colors?.primary || "#7C3AED" },
  statLabel: { fontSize: 11, color: Colors?.textMuted || "#64748B", marginTop: 4, fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 },
  listPadding: { paddingHorizontal: 20 },
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#FFF", marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: Colors?.textSecondary, marginTop: 6, textAlign: "center", lineHeight: 20 },
  emptyBtn: { marginTop: 18, backgroundColor: Colors?.primary, paddingHorizontal: 20, height: 44, justifyContent: "center", borderRadius: 14 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  
  // MODAL CONFIGS
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#111827", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#FFF" },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center" },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: Colors?.textSecondary || "#94A3B8", marginBottom: 8, marginTop: 10 },
  textInput: { backgroundColor: Colors?.surface || "#18122B", borderRadius: 16, paddingHorizontal: 16, height: 54, color: "#FFF", fontSize: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 16 },
  inputFocused: { borderColor: Colors?.primary || "#7C3AED", backgroundColor: "rgba(124, 58, 237, 0.02)" },
  textArea: { minHeight: 100, paddingTop: 14, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: Colors?.textMuted || "#64748B", textAlign: "right", marginTop: -12, marginBottom: 16, fontWeight: "500" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  toggleSub: { fontSize: 12, color: Colors?.textMuted || "#64748B", marginTop: 3 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", padding: 3 },
  toggleActive: { backgroundColor: Colors?.primary || "#7C3AED" },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#64748B" },
  toggleThumbActive: { backgroundColor: "#fff", transform: [{ translateX: 20 }] },
  submitBtn: { borderRadius: 18, overflow: "hidden", marginTop: 10, marginBottom: 20 },
  submitBtnGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, height: 56 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
