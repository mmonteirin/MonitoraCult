import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Dimensions,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";

import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
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

const SUGGESTIONS = [
  "Música ao vivo",
  "Cinema",
  "Eventos gratuitos",
  "Fotografia",
  "Teatro",
];

const normalizeFilterText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function TelaComunidade({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
  const insets = useSafeAreaInsets();

  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;
  const isSmallScreen = width < 375;

  const embedded = !!route?.params?.embedded;
  const scrollY = route?.params?.scrollY;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) {
        scrollY.value = event.contentOffset.y;
      }
    },
  });

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

  const loadInitialData = useCallback(async () => {
    await Promise.all([
      loadGroups(),
      loadMyGroups(),
      loadHighlightedCreators(),
    ]);
  }, [loadGroups, loadMyGroups, loadHighlightedCreators]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [loadInitialData]);

  const filteredGroups = useMemo(() => {
    let filtered = groups;

    if (selectedGenre !== "Todos") {
      const genreFilter = normalizeFilterText(selectedGenre);
      filtered = filtered.filter(
        (g) => normalizeFilterText(g.genre) === genreFilter
      );
    }

    if (selectedCategories.length > 0) {
      const categoryFilters = selectedCategories.map(normalizeFilterText);

      filtered = filtered.filter((g) => {
        const genre = normalizeFilterText(g.genre);

        return categoryFilters.some((cat) =>
          genre.includes(cat)
        );
      });
    }

    if (searchText.trim()) {
      const term = normalizeFilterText(searchText);

      filtered = filtered.filter((g) => {
        const searchable = [
          g.name,
          g.description,
          g.genre,
          ...(Array.isArray(g.tags) ? g.tags : []),
        ]
          .map(normalizeFilterText)
          .join(" ");

        return searchable.includes(term);
      });
    }

    return filtered;
  }, [groups, selectedGenre, selectedCategories, searchText]);

  const groupedByCategory = useMemo(() => {
    const grouped = {};

    filteredGroups.forEach((group) => {
      const genre = group.genre || "Outro";

      if (!grouped[genre]) {
        grouped[genre] = [];
      }

      grouped[genre].push(group);
    });

    return grouped;
  }, [filteredGroups]);

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

  const handleGroupAction = useCallback(async (group) => {
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
  }, [checkIsMember, handleJoinGroup, handleLeaveGroup]);

  const HeaderContainer = useMemo(() => embedded ? View : LinearGradient, [embedded]);

  const headerContainerProps = useMemo(() => embedded ? {} : {
    colors: [
      colors.backgroundSecondary,
      colors.surface,
      colors.background,
    ],
  }, [embedded, colors.backgroundSecondary, colors.surface, colors.background]);

  const navigateToGroup = useCallback(
    (group) => {
      navigation.navigate("ComunidadeGrupoDetalhes", {
        groupId: group.id,
      });
    },
    [navigation]
  );

  const renderEmbeddedExplorar = useCallback(() => {
    if (loading && !groups.length) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!filteredGroups.length) {
      return (
        <View style={styles.emptyStateEmbedded}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text style={styles.emptyTitle}>Nenhuma comunidade encontrada</Text>
          <Text style={styles.emptySubtitleEmbedded}>
            Tente outro termo ou crie um novo grupo.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.embeddedGroupsList}>
        {filteredGroups.map((group) => (
          <View key={group.id} style={styles.embeddedCardWrap}>
            <CommunityGroupCard
              {...group}
              isMember={checkIsMember(group)}
              onPress={() => navigateToGroup(group)}
              onJoin={() => handleGroupAction(group)}
              onLeave={() => handleGroupAction(group)}
            />
          </View>
        ))}
      </View>
    );
  }, [loading, groups.length, filteredGroups, colors.primary, colors.textMuted, checkIsMember, navigateToGroup, handleGroupAction]);

  const renderEmbeddedMeus = useCallback(() => {
    if (!currentUser) {
      return (
        <View style={styles.emptyStateEmbedded}>
          <Text style={styles.emptyTitle}>Faça login para acessar</Text>
        </View>
      );
    }

    if (myGroups.length === 0) {
      return (
        <View style={styles.emptyStateEmbedded}>
          <Text style={styles.emptyTitle}>
            Você ainda não participa de nenhuma comunidade
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.embeddedGroupsList}>
        {myGroups.map((group) => (
          <View key={group.id} style={styles.embeddedCardWrap}>
            <CommunityGroupCard
              {...group}
              isMember
              onPress={() => navigateToGroup(group)}
              onLeave={() => handleGroupAction(group)}
            />
          </View>
        ))}
      </View>
    );
  }, [currentUser, myGroups, navigateToGroup, handleGroupAction]);

  const renderEmbeddedCriadores = useCallback(() => {
    if (highlightedCreators.length === 0) {
      return (
        <View style={styles.emptyStateEmbedded}>
          <Text style={styles.emptyTitle}>Nenhum criador em destaque</Text>
        </View>
      );
    }

    return (
      <View style={styles.embeddedCreatorsList}>
        {highlightedCreators.map((creator) => (
          <CreatorHighlight
            key={creator.id}
            {...creator}
            onPress={() =>
              navigation.navigate("ComunidadeCriadorDetalhes", {
                creatorId: creator.id,
              })
            }
          />
        ))}
      </View>
    );
  }, [highlightedCreators, navigation]);

  if (embedded) {
    return (
      <View style={styles.containerEmbedded}>
        <View style={styles.embeddedToolbar}>
          <View style={styles.embeddedSearchBox}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={colors.primary}
            />
            <TextInput
              style={styles.embeddedSearchInput}
              placeholder="Buscar comunidades..."
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.embeddedCreateBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.embeddedCreateBtnGradient}
            >
              <MaterialCommunityIcons name="plus" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.innerTabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.innerTab, active && styles.innerTabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={16}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.innerTabText,
                    active && styles.innerTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === "explorar" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.embeddedGenreScroll}
            contentContainerStyle={styles.embeddedGenreRow}
          >
            {GENEROS.map((genre) => {
              const active = selectedGenre === genre;
              return (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.embeddedGenreChip,
                    active && styles.embeddedGenreChipActive,
                  ]}
                  onPress={() => setSelectedGenre(genre)}
                >
                  <Text
                    style={[
                      styles.embeddedGenreText,
                      active && styles.embeddedGenreTextActive,
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Animated.ScrollView
          style={styles.embeddedScrollView}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.embeddedScrollContent}
        >
          {activeTab === "explorar" && renderEmbeddedExplorar()}
          {activeTab === "meus" && renderEmbeddedMeus()}
          {activeTab === "criadores" && renderEmbeddedCriadores()}
        </Animated.ScrollView>

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent
          statusBarTranslucent
          onRequestClose={() => setShowCreateModal(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Nova Comunidade</Text>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setShowCreateModal(false)}
                  >
                    <MaterialCommunityIcons name="close" size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome da comunidade"
                  placeholderTextColor={colors.textMuted}
                  value={createData.name}
                  onChangeText={(v) =>
                    setCreateData((d) => ({ ...d, name: v }))
                  }
                />

                <Text style={styles.fieldLabel}>Descrição</Text>
                <TextInput
                  multiline
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva os objetivos da comunidade"
                  placeholderTextColor={colors.textMuted}
                  value={createData.description}
                  onChangeText={(v) =>
                    setCreateData((d) => ({ ...d, description: v }))
                  }
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreateCommunity}
                  disabled={creating}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.submitGradient}
                  >
                    {creating ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.submitText}>Criar comunidade</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

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
                paddingTop: insets.top + 12,
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
            tint={blurTint}
            style={[
              styles.heroSearch,
              embedded && styles.heroSearchEmbedded,
            ]}
          >
            <View style={styles.searchIconWrap}>
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color="#A78BFA"
              />
            </View>

            <TextInput
              style={[
                styles.searchInput,
                embedded && styles.searchInputEmbedded,
              ]}
              placeholder={
                embedded
                  ? "Buscar comunidades..."
                  : "Música, dança, cinema..."
              }
              placeholderTextColor="#64748B"
              value={searchText}
              onChangeText={setSearchText}
            />

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
              colors={[colors.primary, colors.primaryDark]}
              style={[
                styles.createButtonGradient,
                embedded && styles.createButtonGradientEmbedded,
              ]}
            >
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color="#FFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {!embedded && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionRow}
          >
            {SUGGESTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.suggestionChip}
                onPress={() => setSearchText(item)}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </HeaderContainer>

      {/* TABS */}
      <View style={styles.tabsWrapper}>
        <BlurView
          intensity={30}
          tint={blurTint}
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
                tintColor={colors.primary}
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
                tintColor={colors.primary}
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
                tintColor={colors.primary}
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
              tint={blurTint}
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
                        ? colors.primary
                        : colors.textMuted
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
                      colors.primary,
                      colors.primaryDark,
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
      tint={blurTint}
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

function createThemedScreenStyles(c) {
  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;
  const isSmallScreen = width < 375;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },

  containerEmbedded: {
    flex: 1,
    backgroundColor: c.background,
  },

  embeddedToolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: isTablet ? 12 : 10,
    paddingHorizontal: isTablet ? 16 : 14,
    paddingTop: isTablet ? 6 : 4,
    paddingBottom: isTablet ? 12 : 10,
  },

  embeddedSearchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },

  embeddedSearchInput: {
    flex: 1,
    color: c.textPrimary,
    fontSize: 14,
    padding: 0,
  },

  embeddedCreateBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },

  embeddedCreateBtnGradient: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  innerTabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor: c.background,
  },

  innerTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },

  innerTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: c.primary,
  },

  innerTabText: {
    fontSize: 12,
    color: c.textMuted,
    fontWeight: "600",
  },

  innerTabTextActive: {
    color: c.primary,
  },

  embeddedGenreRow: {
    paddingHorizontal: isTablet ? 24 : 20,
    paddingVertical: isTablet ? 12 : 10,
    gap: isTablet ? 14 : 12,
  },

  embeddedGenreScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: isTablet ? 64 : 56,
  },

  embeddedGenreChip: {
    height: isTablet ? 40 : 36,
    paddingHorizontal: isTablet ? 20 : 18,
    borderRadius: 999,
    backgroundColor: c.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: c.border,
  },

  embeddedGenreChipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },

  embeddedGenreText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: c.textMuted,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  embeddedGenreTextActive: {
    color: "#FFF",
  },

  embeddedScrollView: {
    flex: 1,
  },

  embeddedScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 120,
  },

  embeddedGroupsList: {
    gap: 12,
    paddingTop: 8,
  },

  embeddedCardWrap: {
    width: "100%",
  },

  embeddedCreatorsList: {
    gap: 12,
    paddingTop: 8,
  },

  emptyStateEmbedded: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },

  emptySubtitleEmbedded: {
    color: c.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
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
    paddingHorizontal: isTablet ? 24 : 20,
    paddingBottom: isTablet ? 14 : 18,
  },

  headerEmbedded: {
    paddingTop: isTablet ? 6 : 4,
    paddingBottom: isTablet ? 12 : 10,
    paddingHorizontal: isTablet ? 16 : 14,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: isTablet ? 16 : 20,
  },

  headerTitle: {
    color: "#FFF",
    fontSize: isTablet ? 22 : 20,
    fontWeight: "800",
  },

  headerSub: {
    color: "#94A3B8",
    fontSize: isSmallScreen ? 13 : 14,
    marginTop: 6,
    lineHeight: 22,
    paddingRight: 30,
  },

  notificationBtn: {
    width: isTablet ? 52 : 48,
    height: isTablet ? 52 : 48,
    borderRadius: isTablet ? 20 : 18,
    backgroundColor:
      "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor:
      c.glass,
  },

  heroSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: isTablet ? 14 : 12,
  },

  heroSearch: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: isTablet ? 22 : 20,
    paddingHorizontal: isTablet ? 14 : 12,
    height: isTablet ? 80 : 72,
    overflow: "hidden",
    borderWidth: 1,
    borderColor:
      c.glass,
  },

  heroSearchEmbedded: {
    height: isTablet ? 52 : 48,
    borderRadius: isTablet ? 18 : 16,
  },

  searchIconWrap: {
    width: isTablet ? 46 : 42,
    height: isTablet ? 46 : 42,
    borderRadius: isTablet ? 16 : 14,
    backgroundColor:
      "rgba(139,92,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: isTablet ? 14 : 12,
  },

  searchLabel: {
    color: "#A78BFA",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },

  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: isTablet ? 18 : 16,
    padding: 0,
  },

  searchInputEmbedded: {
    fontSize: isSmallScreen ? 13 : 14,
  },

  createButton: {
    borderRadius: isTablet ? 24 : 22,
    overflow: "hidden",
  },

  createButtonGradient: {
    width: isTablet ? 72 : 68,
    height: isTablet ? 72 : 68,
    justifyContent: "center",
    alignItems: "center",
  },

  createButtonGradientEmbedded: {
    width: isTablet ? 52 : 48,
    height: isTablet ? 52 : 48,
    borderRadius: isTablet ? 18 : 16,
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
    paddingHorizontal: isTablet ? 24 : 20,
    marginBottom: isTablet ? 10 : 12,
  },

  tabsContainer: {
    flexDirection: "row",
    borderRadius: isTablet ? 24 : 22,
    padding: isTablet ? 6 : 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor:
      c.glass,
  },

  tabButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: isTablet ? 10 : 8,
    height: isTablet ? 52 : 48,
    borderRadius: isTablet ? 18 : 16,
  },

  tabButtonActive: {
    backgroundColor: c.primary,
  },

  tabText: {
    color: c.textMuted,
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: "700",
  },

  tabTextActive: {
    color: c.onPrimary,
  },

  stickyFilters: {
    paddingTop: isTablet ? 8 : 6,
    paddingBottom: isTablet ? 16 : 14,
    backgroundColor: c.background,
    borderBottomWidth: 1,
    borderBottomColor: c.glass,
  },

  genreRow: {
    paddingHorizontal: isTablet ? 24 : 20,
    gap: isTablet ? 14 : 12,
  },

  genreChip: {
    height: isTablet ? 44 : 40,
    paddingHorizontal: isTablet ? 22 : 20,
    borderRadius: 999,
    backgroundColor: c.glass,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },

  genreChipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },

  genreText: {
    color: c.textMuted,
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  genreTextActive: {
    color: "#FFF",
  },

  quickStatsRow: {
    paddingHorizontal: isTablet ? 24 : 20,
    gap: isTablet ? 16 : 14,
    paddingBottom: isTablet ? 24 : 20,
  },

  quickStatCard: {
    width: isTablet ? 160 : 130,
    borderRadius: isTablet ? 28 : 24,
    padding: isTablet ? 20 : 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.glass,
  },

  quickStatValue: {
    color: "#FFF",
    fontSize: isTablet ? 28 : 24,
    fontWeight: "800",
    marginTop: isTablet ? 16 : 12,
  },

  quickStatLabel: {
    color: c.textMuted,
    fontSize: isSmallScreen ? 11 : isTablet ? 13 : 12,
    marginTop: 4,
    fontWeight: "600",
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
    backgroundColor: c.surfaceMuted,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor:
      c.glass,
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
      c.glass,
    paddingHorizontal: 16,
    color: "#FFF",
    borderWidth: 1,
    borderColor:
      c.glass,
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
}
