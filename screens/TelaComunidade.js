import React, { useState, useEffect, useMemo } from "react";
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
import CommunityCategorySection from "../components/CommunityCategorySection";
import CommunityCategoryFilter from "../components/CommunityCategoryFilter";

const GENEROS = [
  "Todos",
  "Música",
  "Dança",
  "Teatro",
  "Cinema",
  "Literatura",
  "Artes Visuais",
  "Gastronomia",
  "Fotografia",
  "Outro",
];

const TABS = [
  {
    key: "explorar",
    label: "Explorar",
    icon: "compass-outline",
  },
  {
    key: "criadores",
    label: "Criadores",
    icon: "star-outline",
  },
  {
    key: "meus",
    label: "Meus",
    icon: "account-group-outline",
  },
];

export default function TelaComunidade({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const embedded = !!route?.params?.embedded;

  const {
    groups,
    myGroups,
    highlightedCreators,
    loading,
    loadGroups,
    loadMyGroups,
    loadHighlightedCreators,
    handleJoinGroup,
    handleLeaveGroup,
    checkIsMember,
    currentUser,
    handleCreateGroup,
  } = useCommunity();

  const [activeTab, setActiveTab] = useState("explorar");
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createData, setCreateData] = useState({
    name: "",
    description: "",
    genre: "Música",
    isPrivate: false,
  });

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadGroups(
      selectedGenre === "Todos" ? null : selectedGenre,
      searchText || null
    );
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

  const groupedByCategory = useMemo(() => {
    let filtered = groups;

    if (selectedGenre !== "Todos") {
      filtered = filtered.filter(
        (g) => g.genre === selectedGenre
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((g) => {
        const genre = g.genre?.toLowerCase() || "";

        return selectedCategories.some((cat) =>
          genre.includes(cat)
        );
      });
    }

    const grouped = {};

    filtered.forEach((group) => {
      const genre = group.genre || "Outro";

      if (!grouped[genre]) {
        grouped[genre] = [];
      }

      grouped[genre].push(group);
    });

    return grouped;
  }, [groups, selectedGenre, selectedCategories]);

  const handleCreateCommunity = async () => {
    if (
      !createData.name.trim() ||
      !createData.description.trim()
    ) {
      Alert.alert(
        "Atenção",
        "Preencha os campos obrigatórios."
      );

      return;
    }

    setCreating(true);

    try {
      const id = await handleCreateGroup(createData);

      setShowCreateModal(false);

      setCreateData({
        name: "",
        description: "",
        genre: "Música",
        isPrivate: false,
      });

      Alert.alert(
        "Comunidade criada 🎉",
        "Sua comunidade foi inaugurada com sucesso.",
        [
          {
            text: "Abrir",
            onPress: () =>
              navigation.navigate(
                "ComunidadeGrupoDetalhes",
                {
                  groupId: id,
                }
              ),
          },
          {
            text: "OK",
          },
        ]
      );
    } catch (err) {
      Alert.alert("Erro", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleGroupAction = async (group) => {
    const isMember = checkIsMember(group);

    if (isMember) {
      Alert.alert(
        "Sair da comunidade?",
        `Deseja sair de "${group.name}"?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Sair",
            style: "destructive",
            onPress: () =>
              handleLeaveGroup(group.id),
          },
        ]
      );

      return;
    }

    try {
      await handleJoinGroup(group.id);
    } catch (err) {
      Alert.alert("Erro", err.message);
    }
  };

  const HeaderContainer = embedded
    ? View
    : LinearGradient;

  const headerContainerProps = embedded
    ? {}
    : {
        colors: [
          "#18122B",
          "#111827",
          "#0B1020",
        ],
      };

  const suggestions = [
    "Música ao vivo",
    "Cinema",
    "Eventos gratuitos",
    "Fotografia",
    "Teatro",
  ];

  return (
    <View style={styles.container}>
      {!embedded && (
        <StatusBar barStyle="light-content" />
      )}

      {/* BACKGROUND GLOW */}
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      {/* HEADER */}
      <HeaderContainer
        {...headerContainerProps}
        style={[
          styles.header,
          embedded
            ? styles.headerEmbedded
            : {
                paddingTop: insets.top + 10,
              },
        ]}
      >
        {!embedded && (
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                Comunidades
              </Text>

              <Text style={styles.headerSub}>
                Descubra grupos culturais,
                criadores e pessoas com os
                mesmos interesses.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.notificationBtn}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={22}
                color="#FFF"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* HERO SEARCH */}
        <View style={styles.heroSearchWrapper}>
          <BlurView
            intensity={40}
            tint="dark"
            style={styles.heroSearch}
          >
            <View style={styles.searchIconWrap}>
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color="#A78BFA"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.searchLabel}>
                Explorar comunidades
              </Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Música, dança, cinema..."
                placeholderTextColor="#64748B"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  setSearchText("")
                }
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            )}
          </BlurView>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.createButton}
            onPress={() =>
              setShowCreateModal(true)
            }
          >
            <LinearGradient
              colors={["#8B5CF6", "#6D28D9"]}
              style={styles.createButtonGradient}
            >
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color="#FFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* SUGESTÕES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.suggestionRow
          }
        >
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.suggestionChip}
            >
              <Text
                style={styles.suggestionText}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </HeaderContainer>

      {/* TABS */}
      <View style={styles.tabsWrapper}>
        <BlurView
          intensity={30}
          tint="dark"
          style={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const active =
              activeTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                style={[
                  styles.tabButton,
                  active &&
                    styles.tabButtonActive,
                ]}
                onPress={() =>
                  setActiveTab(tab.key)
                }
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={18}
                  color={
                    active
                      ? "#FFF"
                      : "#94A3B8"
                  }
                />

                <Text
                  style={[
                    styles.tabText,
                    active &&
                      styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>

      {/* CONTEÚDO */}
      <View style={{ flex: 1 }}>
        {activeTab === "explorar" && (
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            stickyHeaderIndices={[0]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#8B5CF6"
              />
            }
          >
            {/* FILTROS */}
            <View style={styles.stickyFilters}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.genreRow
                }
              >
                {GENEROS.map((genre) => {
                  const active =
                    selectedGenre ===
                    genre;

                  return (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.genreChip,
                        active &&
                          styles.genreChipActive,
                      ]}
                      onPress={() =>
                        setSelectedGenre(
                          genre
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.genreText,
                          active &&
                            styles.genreTextActive,
                        ]}
                      >
                        {genre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* QUICK STATS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.quickStatsRow
              }
            >
              <QuickStat
                icon="account-group"
                label="Comunidades"
                value={groups.length}
              />

              <QuickStat
                icon="star-four-points"
                label="Criadores"
                value={
                  highlightedCreators.length
                }
              />

              <QuickStat
                icon="bookmark-check"
                label="Participando"
                value={myGroups.length}
              />
            </ScrollView>

            {/* CATEGORY FILTER */}
            <CommunityCategoryFilter
              selectedCategories={
                selectedCategories
              }
              onCategoryToggle={
                setSelectedCategories
              }
              allowMultiple
            />

            {/* RESULTADOS */}
            {loading && !groups.length ? (
              <View style={styles.centerBox}>
                <ActivityIndicator
                  size="large"
                  color="#8B5CF6"
                />
              </View>
            ) : Object.keys(
                groupedByCategory
              ).length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={64}
                  color="#64748B"
                />

                <Text style={styles.emptyTitle}>
                  Nenhuma comunidade
                  encontrada
                </Text>

                <Text
                  style={styles.emptySubtitle}
                >
                  Tente pesquisar outro
                  tema ou inaugure uma nova
                  comunidade.
                </Text>
              </View>
            ) : (
              <View>
                {Object.entries(
                  groupedByCategory
                ).map(
                  ([
                    category,
                    categoryGroups,
                  ]) => (
                    <CommunityCategorySection
                      key={category}
                      category={category}
                      icon="shape-outline"
                      description={`${categoryGroups.length} comunidades`}
                      groups={categoryGroups}
                      onGroupPress={(
                        group
                      ) =>
                        navigation.navigate(
                          "ComunidadeGrupoDetalhes",
                          {
                            groupId:
                              group.id,
                          }
                        )
                      }
                      checkIsMember={
                        checkIsMember
                      }
                    />
                  )
                )}

                <View
                  style={{ height: 140 }}
                />
              </View>
            )}
          </ScrollView>
        )}

        {/* MEUS GRUPOS */}
        {activeTab === "meus" && (
          <ScrollView
            contentContainerStyle={
              styles.contentPadding
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#8B5CF6"
              />
            }
          >
            {!currentUser ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-lock-outline"
                  size={60}
                  color="#64748B"
                />

                <Text style={styles.emptyTitle}>
                  Faça login para acessar
                </Text>
              </View>
            ) : myGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={60}
                  color="#64748B"
                />

                <Text style={styles.emptyTitle}>
                  Você ainda não participa
                  de nenhuma comunidade
                </Text>
              </View>
            ) : (
              myGroups.map((group) => (
                <CommunityGroupCard
                  key={group.id}
                  {...group}
                  isMember
                  onPress={() =>
                    navigation.navigate(
                      "ComunidadeGrupoDetalhes",
                      {
                        groupId:
                          group.id,
                      }
                    )
                  }
                  onLeave={() =>
                    handleGroupAction(group)
                  }
                />
              ))
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* CRIADORES */}
        {activeTab === "criadores" && (
          <ScrollView
            contentContainerStyle={
              styles.contentPadding
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#8B5CF6"
              />
            }
          >
            {highlightedCreators.length ===
            0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="star-outline"
                  size={60}
                  color="#64748B"
                />

                <Text style={styles.emptyTitle}>
                  Nenhum criador em
                  destaque
                </Text>
              </View>
            ) : (
              highlightedCreators.map(
                (creator) => (
                  <CreatorHighlight
                    key={creator.id}
                    {...creator}
                    onPress={() =>
                      navigation.navigate(
                        "ComunidadeCriadorDetalhes",
                        {
                          creatorId:
                            creator.id,
                        }
                      )
                    }
                  />
                )
              )
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        )}
      </View>

      {/* MODAL */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View style={styles.modalOverlay}>
            <BlurView
              intensity={40}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text
                  style={styles.modalTitle}
                >
                  Nova Comunidade
                </Text>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color="#FFF"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
              >
                <Text
                  style={styles.fieldLabel}
                >
                  Nome
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Nome da comunidade"
                  placeholderTextColor="#64748B"
                  value={createData.name}
                  onChangeText={(v) =>
                    setCreateData((d) => ({
                      ...d,
                      name: v,
                    }))
                  }
                />

                <Text
                  style={styles.fieldLabel}
                >
                  Descrição
                </Text>

                <TextInput
                  multiline
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                  placeholder="Descreva os objetivos da comunidade"
                  placeholderTextColor="#64748B"
                  value={
                    createData.description
                  }
                  onChangeText={(v) =>
                    setCreateData((d) => ({
                      ...d,
                      description: v,
                    }))
                  }
                />

                <TouchableOpacity
                  style={
                    styles.privateToggle
                  }
                  onPress={() =>
                    setCreateData((d) => ({
                      ...d,
                      isPrivate:
                        !d.isPrivate,
                    }))
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.privateTitle
                      }
                    >
                      Comunidade privada
                    </Text>

                    <Text
                      style={
                        styles.privateSub
                      }
                    >
                      Aprovar entrada de
                      membros
                    </Text>
                  </View>

                  <MaterialCommunityIcons
                    name={
                      createData.isPrivate
                        ? "toggle-switch"
                        : "toggle-switch-off-outline"
                    }
                    size={52}
                    color={
                      createData.isPrivate
                        ? "#8B5CF6"
                        : "#64748B"
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.submitButton
                  }
                  onPress={
                    handleCreateCommunity
                  }
                >
                  <LinearGradient
                    colors={[
                      "#8B5CF6",
                      "#6D28D9",
                    ]}
                    style={
                      styles.submitGradient
                    }
                  >
                    {creating ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="rocket-launch-outline"
                          size={20}
                          color="#FFF"
                        />

                        <Text
                          style={
                            styles.submitText
                          }
                        >
                          Criar comunidade
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function QuickStat({
  icon,
  label,
  value,
}) {
  return (
    <BlurView
      intensity={25}
      tint="dark"
      style={styles.quickStatCard}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color="#A78BFA"
      />

      <Text style={styles.quickStatValue}>
        {value}
      </Text>

      <Text style={styles.quickStatLabel}>
        {label}
      </Text>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1020",
  },

  glowOne: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor:
      "rgba(139,92,246,0.18)",
  },

  glowTwo: {
    position: "absolute",
    bottom: 100,
    left: -120,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor:
      "rgba(59,130,246,0.08)",
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },

  headerEmbedded: {
    paddingTop: 12,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "800",
  },

  headerSub: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 22,
    paddingRight: 30,
  },

  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor:
      "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.06)",
  },

  heroSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  heroSearch: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    paddingHorizontal: 14,
    height: 72,
    overflow: "hidden",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.06)",
  },

  searchIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      "rgba(139,92,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  searchLabel: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },

  searchInput: {
    color: "#FFF",
    fontSize: 16,
    padding: 0,
  },

  createButton: {
    borderRadius: 22,
    overflow: "hidden",
  },

  createButtonGradient: {
    width: 68,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
  },

  suggestionRow: {
    paddingTop: 16,
    gap: 10,
  },

  suggestionChip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor:
      "rgba(255,255,255,0.05)",
    justifyContent: "center",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.05)",
  },

  suggestionText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },

  tabsWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  tabsContainer: {
    flexDirection: "row",
    borderRadius: 22,
    padding: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.06)",
  },

  tabButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: 48,
    borderRadius: 16,
  },

  tabButtonActive: {
    backgroundColor: "#8B5CF6",
  },

  tabText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },

  tabTextActive: {
    color: "#FFF",
  },

  stickyFilters: {
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: "#0B1020",
  },

  genreRow: {
    paddingHorizontal: 20,
    gap: 10,
  },

  genreChip: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor:
      "rgba(255,255,255,0.04)",
    justifyContent: "center",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.05)",
  },

  genreChipActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },

  genreText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },

  genreTextActive: {
    color: "#FFF",
  },

  quickStatsRow: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 18,
  },

  quickStatCard: {
    width: 120,
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.06)",
  },

  quickStatValue: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 12,
  },

  quickStatLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
  },

  centerBox: {
    paddingVertical: 80,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyState: {
    paddingHorizontal: 30,
    paddingVertical: 80,
    alignItems: "center",
  },

  emptyTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
  },

  emptySubtitle: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
  },

  contentPadding: {
    paddingHorizontal: 20,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.06)",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
  },

  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor:
      "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },

  fieldLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },

  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor:
      "rgba(255,255,255,0.04)",
    paddingHorizontal: 16,
    color: "#FFF",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.06)",
    marginBottom: 18,
  },

  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 16,
  },

  privateToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },

  privateTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },

  privateSub: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
  },

  submitButton: {
    overflow: "hidden",
    borderRadius: 22,
    marginBottom: 20,
  },

  submitGradient: {
    height: 58,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  submitText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});