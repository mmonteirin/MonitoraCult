import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
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
import { getCreatorDetails, incrementCreatorViews } from "../services/communityService";

export default function ComunidadeCriadorDetalhes({
  route,
  navigation,
}) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
  const insets = useSafeAreaInsets();
  const { creatorId } = route.params;
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCreatorData();
  }, [creatorId]);

  const loadCreatorData = async () => {
    try {
      setLoading(true);
      const creatorData = await getCreatorDetails(creatorId);
      setCreator(creatorData);
      if (creatorData) {
        await incrementCreatorViews(creatorId);
      }
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar criador:", error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCreatorData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BlurView
            intensity={35}
            tint={blurTint}
            style={styles.headerBlur}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color="#FFF"
            />
          </BlurView>
        </TouchableOpacity>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <TouchableOpacity
              onPress={() => navigation.goBack()}
            >
              <BlurView
                intensity={35}
                tint={blurTint}
                style={styles.headerBlur}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={28}
                  color="#FFF"
                />
              </BlurView>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Criador</Text>

            <TouchableOpacity style={styles.moreButton}>
              <BlurView
                intensity={35}
                tint={blurTint}
                style={styles.headerBlur}
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={24}
                  color="#FFF"
                />
              </BlurView>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* PROFILE SECTION */}
        <Animated.View
          entering={FadeInUp.delay(120).springify()}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeader}
          >
          <View style={styles.profileImage}>
            {creator?.photoURL ? (
              <Image source={{ uri: creator.photoURL }} style={styles.profileImage} />
            ) : (
              <MaterialCommunityIcons
                name="account"
                size={80}
                color={colors.textPrimary}
              />
            )}
          </View>
          <Text style={styles.creatorName}>{creator?.name || "Criador"}</Text>
          <Text style={styles.creatorGenre}>{creator?.genre || "Artista"}</Text>

          {/* STATS */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{creator?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{creator?.worksCount || 0}</Text>
              <Text style={styles.statLabel}>Obras</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{creator?.likesCount || 0}</Text>
              <Text style={styles.statLabel}>Curtidas</Text>
            </View>
          </View>

          {/* BUTTONS */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.followButton}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.followButtonText}>Seguir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageButton}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="message-outline"
                size={20}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ABOUT SECTION */}
        <Animated.View
          entering={FadeInUp.delay(180).springify()}
        >
          <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.sectionContent}>
            {creator?.bio || "Sem descrição disponível."}
          </Text>
          </View>
        </Animated.View>

        {/* PORTFOLIO SECTION */}
        <Animated.View
          entering={FadeInUp.delay(240).springify()}
        >
          <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Portfólio</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver Tudo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.portfolioGrid}>
            {creator?.portfolio?.length > 0 ? (
              creator.portfolio.map((item, index) => (
                <View
                  key={index}
                  style={styles.portfolioItem}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.portfolioItem} />
                  ) : (
                    <View style={styles.portfolioPlaceholder}>
                      <MaterialCommunityIcons
                        name="image"
                        size={32}
                        color={colors.textMuted}
                      />
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.portfolioPlaceholder}>
                <MaterialCommunityIcons
                  name="image-outline"
                  size={40}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyText}>Sem portfólio</Text>
              </View>
            )}
            </View>
          </View>
        </Animated.View>

        {/* RECENT WORKS */}
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
        >
          <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Obras Recentes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver Tudo</Text>
            </TouchableOpacity>
          </View>
          {creator?.works?.length > 0 ? (
            creator.works.map((work, index) => (
              <TouchableOpacity
                key={index}
                style={styles.workItem}
                activeOpacity={0.7}
              >
                <View style={styles.workImage}>
                  {work.imageUrl ? (
                    <Image source={{ uri: work.imageUrl }} style={styles.workImage} />
                  ) : (
                    <MaterialCommunityIcons
                      name="image"
                      size={40}
                      color={colors.textMuted}
                    />
                  )}
                </View>
                <View style={styles.workInfo}>
                  <Text style={styles.workTitle}>{work.title || "Obra"}</Text>
                  <Text style={styles.workDate}>{work.date || "Recente"}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="image-outline"
                size={40}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>Sem obras recentes</Text>
            </View>
          )}
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
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
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    flex: 1,
    textAlign: "center",
  },
  moreButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  creatorName: {
    fontSize: 24,
    fontWeight: "700",
    color: c.textPrimary,
  },
  creatorGenre: {
    fontSize: 14,
    color: c.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 20,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: c.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  followButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.textPrimary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  followButtonText: {
    color: c.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  messageButton: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.textPrimary,
  },
  seeAll: {
    fontSize: 12,
    color: c.primary,
    fontWeight: "600",
  },
  sectionContent: {
    fontSize: 13,
    color: c.textSecondary,
    lineHeight: 18,
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  portfolioItem: {
    width: "48%",
    aspectRatio: 1,
  },
  portfolioPlaceholder: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: c.border,
  },
  workItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.border,
  },
  workImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: c.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  workInfo: {
    flex: 1,
  },
  workTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary,
  },
  workDate: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: c.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});
}
