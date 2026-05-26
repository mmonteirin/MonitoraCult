import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
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

export default function ComunidadeNoticiaDetalhes({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
  const insets = useSafeAreaInsets();
  const { newsId } = route.params;
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNewsData();
  }, []);

  const loadNewsData = async () => {
    try {
      setLoading(true);
      // Aqui você carregaria os detalhes da notícia
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar notícia:", error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNewsData();
    setRefreshing(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Confira essa notícia interessante no MonitoraCult!",
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
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
            <Text style={styles.headerTitle}>Notícia</Text>
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
        entering={FadeIn.duration(700)}
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
        {/* FEATURED IMAGE */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name="newspaper"
              size={80}
              color={colors.primary}
            />
          </View>
        </View>

        {/* NEWS CONTENT */}
        <View style={styles.contentWrapper}>
          {/* CATEGORY */}
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>Notícia Importante</Text>
          </View>

          {/* TITLE */}
          <Text style={styles.title}>
            Título da Notícia Destacada
          </Text>

          {/* METADATA */}
          <View style={styles.metadata}>
            <View style={styles.author}>
              <View style={styles.authorAvatar}>
                <MaterialCommunityIcons
                  name="account"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={styles.authorName}>Nome do Autor</Text>
                <Text style={styles.publishDate}>
                  Publicado há 2 dias
                </Text>
              </View>
            </View>
          </View>

          {/* STATS */}
          <View style={styles.statsBar}>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="eye"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>0 visualizações</Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="heart"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.statText}>0 curtidas</Text>
            </View>
          </View>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* ARTICLE CONTENT */}
          <Text style={styles.articleContent}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
            enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat.
            {"\n\n"}
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
            {"\n\n"}
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium.
          </Text>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* ACTION BUTTONS */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isLiked && styles.actionButtonActive,
              ]}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? colors.error : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  isLiked && styles.actionButtonTextActive,
                ]}
              >
                Curtir
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="share-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.actionButtonText}>
                Compartilhar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="bookmark-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.actionButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* RELATED NEWS */}
          <View>
            <Text style={styles.relatedTitle}>
              Notícias Relacionadas
            </Text>
            {[1, 2, 3].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.relatedNewsItem}
                activeOpacity={0.7}
              >
                <View style={styles.relatedNewsImage}>
                  <MaterialCommunityIcons
                    name="newspaper"
                    size={24}
                    color={colors.textMuted}
                  />
                </View>
                <View style={styles.relatedNewsInfo}>
                  <Text
                    style={styles.relatedNewsTitle}
                    numberOfLines={2}
                  >
                    Notícia Relacionada {item}
                  </Text>
                  <Text style={styles.relatedNewsDate}>
                    Há {item} dias
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  imageContainer: {
    height: 220,
    backgroundColor: c.surface,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapper: {
    padding: 16,
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: c.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 16,
    lineHeight: 28,
  },
  metadata: {
    marginBottom: 16,
  },
  author: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary,
  },
  publishDate: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: c.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: c.border,
    marginVertical: 16,
  },
  articleContent: {
    fontSize: 14,
    color: c.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: c.surface,
  },
  actionButtonActive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textSecondary,
  },
  actionButtonTextActive: {
    color: c.error,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 12,
  },
  relatedNewsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  relatedNewsImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: c.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  relatedNewsInfo: {
    flex: 1,
  },
  relatedNewsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textPrimary,
  },
  relatedNewsDate: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 4,
  },
});
}
