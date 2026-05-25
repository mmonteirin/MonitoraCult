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
import { Colors } from "../styles/Colors";

export default function ComunidadeNoticiaDetalhes({ route, navigation }) {
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
            tint="dark"
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
          <ActivityIndicator size="large" color={Colors.primary} />
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
            Colors.backgroundSecondary,
            Colors.surface,
            Colors.background,
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
                tint="dark"
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
                tint="dark"
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
            tintColor={Colors.primary}
          />
        }
      >
        {/* FEATURED IMAGE */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name="newspaper"
              size={80}
              color={Colors.primary}
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
                  color={Colors.primary}
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
                color={Colors.textSecondary}
              />
              <Text style={styles.statText}>0 visualizações</Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="heart"
                size={16}
                color={Colors.textSecondary}
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
                color={isLiked ? Colors.error : Colors.textSecondary}
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
                color={Colors.textSecondary}
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
                color={Colors.textSecondary}
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
                    color={Colors.textMuted}
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
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
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
    backgroundColor: Colors.surface,
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
    color: Colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
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
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  publishDate: {
    fontSize: 11,
    color: Colors.textMuted,
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
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  articleContent: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
  },
  actionButtonActive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  actionButtonTextActive: {
    color: Colors.error,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  relatedNewsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  relatedNewsImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  relatedNewsInfo: {
    flex: 1,
  },
  relatedNewsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  relatedNewsDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
