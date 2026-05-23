import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { useCommunity } from "../hooks/useCommunity";
import CommunityGroupCard from "../components/CommunityGroupCard";
import ForumThread from "../components/ForumThread";
import CreatorHighlight from "../components/CreatorHighlight";
import CommunityNews from "../components/CommunityNews";

const GENEROS = [
  "Todos",
  "Música",
  "Dança",
  "Teatro",
  "Cinema",
  "Literatura",
  "Artes Visuais",
  "Gastronomia",
];

export default function TelaComunidade({ navigation }) {
  const {
    groups,
    forumThreads,
    highlightedCreators,
    communityNews,
    loading,
    error,
    loadGroups,
    loadHighlightedCreators,
    loadCommunityNews,
  } = useCommunity();

  const [activeTab, setActiveTab] = useState("grupos");
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGenre === "Todos") {
      loadGroups();
    } else {
      loadGroups(selectedGenre);
    }
  }, [selectedGenre]);

  const loadInitialData = async () => {
    await Promise.all([
      loadGroups(),
      loadHighlightedCreators(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const renderGruposTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* GENRE FILTER */}
      <View style={styles.genreFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.genreScroll}
        >
          {GENEROS.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.genreFilter,
                selectedGenre === genre && styles.genreFilterActive,
              ]}
              onPress={() => setSelectedGenre(genre)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.genreFilterText,
                  selectedGenre === genre && styles.genreFilterTextActive,
                ]}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* GROUPS LIST */}
      {loading && !groups.length ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyStateText}>Carregando grupos...</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="inbox-multiple"
            size={60}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyStateText}>
            Nenhum grupo encontrado
          </Text>
        </View>
      ) : (
        groups.map((group) => (
          <CommunityGroupCard
            key={group.id}
            {...group}
            onPress={() => {
              navigation.navigate("ComunidadeGrupoDetalhes", { groupId: group.id });
            }}
            onJoin={() => {}}
            onLeave={() => {}}
          />
        ))
      )}
    </ScrollView>
  );

  const renderCriadoresTab = () => (
    <FlatList
      data={highlightedCreators}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CreatorHighlight
          {...item}
          onPress={() => {
            navigation.navigate("ComunidadeCriadorDetalhes", {
              creatorId: item.id,
            });
          }}
          onFollow={() => {}}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="star-outline"
            size={60}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyStateText}>
            Nenhum criador em destaque
          </Text>
        </View>
      }
      scrollEnabled={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );

  const renderNoticiasTab = () => (
    <FlatList
      data={communityNews}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CommunityNews
          {...item}
          onPress={() => {
            navigation.navigate("ComunidadeNoticiaDetalhes", {
              newsId: item.id,
            });
          }}
          onLike={() => {}}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="newspaper"
            size={60}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyStateText}>
            Nenhuma notícia disponível
          </Text>
        </View>
      }
      scrollEnabled={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Comunidade</Text>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* TAB NAVIGATION */}
      <View style={styles.tabNavigation}>
        {["grupos", "criadores", "noticias"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab && styles.tabLabelActive,
              ]}
            >
              {tab === "grupos" && "Grupos"}
              {tab === "criadores" && "Criadores"}
              {tab === "noticias" && "Notícias"}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* TAB CONTENT */}
      {activeTab === "grupos" && renderGruposTab()}
      {activeTab === "criadores" && renderCriadoresTab()}
      {activeTab === "noticias" && renderNoticiasTab()}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  tabNavigation: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {},
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  tabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tabContent: {
    flex: 1,
    paddingTop: 12,
  },
  genreFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  genreScroll: {
    flexGrow: 0,
  },
  genreFilter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genreFilterActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genreFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  genreFilterTextActive: {
    color: Colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
