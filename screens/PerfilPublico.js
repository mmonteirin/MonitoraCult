import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { FollowButton } from "../components/FollowButton";
import { SeguindoList } from "../components/SeguidoresCard";
import { getFollowers, getFollowing } from "../services/followService";
import {
  getAttendedEvents,
  getPublicProfile,
} from "../services/profileService";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

const DEFAULT_IMAGE =
  "https://placehold.co/600x400?text=Evento";

export default function PerfilPublico({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const targetUserId =
    route?.params?.userId ||
    route?.params?.uid ||
    route?.params?.usuario?.uid;

  const [profile, setProfile] = useState(
    route?.params?.usuario || null
  );
  const [eventos, setEventos] = useState([]);
  const [seguidores, setSeguidores] = useState([]);
  const [seguindo, setSeguindo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = user?.uid && user.uid === targetUserId;

  const carregarRede = useCallback(async () => {
    if (!targetUserId) return;

    const [followersList, followingList] = await Promise.all([
      getFollowers(targetUserId),
      getFollowing(targetUserId),
    ]);

    setSeguidores(followersList);
    setSeguindo(followingList);
  }, [targetUserId]);

  const abrirPerfilUsuario = useCallback(
    (item) => {
      const userId =
        item?.targetUserId ||
        item?.followerId ||
        item?.uid ||
        item?.userId ||
        item?.id;

      if (!userId) return;

      navigation.push("PerfilPublico", {
        userId,
        usuario: {
          uid: userId,
          nome:
            item?.targetName ||
            item?.followerName ||
            item?.nome ||
            item?.displayName,
          displayName:
            item?.targetName ||
            item?.followerName ||
            item?.nome ||
            item?.displayName,
          foto:
            item?.targetPhoto ||
            item?.followerPhoto ||
            item?.foto ||
            item?.photoURL,
          photoURL:
            item?.targetPhoto ||
            item?.followerPhoto ||
            item?.foto ||
            item?.photoURL,
        },
      });
    },
    [navigation]
  );

  const handleFollowChange = useCallback(
    async (nextState) => {
      if (typeof nextState === "boolean") {
        setProfile((current) =>
          current
            ? {
                ...current,
                followers: Math.max(
                  0,
                  (current.followers || seguidores.length || 0) +
                    (nextState ? 1 : -1)
                ),
              }
            : current
        );
      }

      await carregarRede();
    },
    [carregarRede, seguidores.length]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarRede();
    setRefreshing(false);
  }, [carregarRede]);

  useEffect(() => {
    let mounted = true;

    const carregar = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [perfil, frequentados] =
          await Promise.all([
            getPublicProfile(targetUserId),
            getAttendedEvents(targetUserId),
          ]);

        if (!mounted) return;

        setProfile(perfil);
        setEventos(frequentados);
        await carregarRede();
      } catch (error) {
        console.log("Erro ao carregar perfil público:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    carregar();

    return () => {
      mounted = false;
    };
  }, [carregarRede, targetUserId]);

  const targetUserData = useMemo(
    () => ({
      displayName:
        profile?.displayName ||
        profile?.nome ||
        "Usuário",
      photoURL:
        profile?.photoURL ||
        profile?.foto ||
        "https://i.pravatar.cc/100",
    }),
    [profile]
  );

  const renderEvento = ({ item }) => (
    <View style={styles.eventCard}>
      <Image
        source={{
          uri: item.eventoFoto || DEFAULT_IMAGE,
        }}
        style={styles.eventImage}
      />

      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.eventoNome || "Evento"}
        </Text>

        <Text style={styles.eventMeta} numberOfLines={1}>
          {item.eventoLocal || "Local não informado"}
        </Text>

        <Text style={styles.eventDate}>
          {item.eventoDataStr || "Data não informada"}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loading}>
        <Text style={styles.emptyText}>Perfil não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        entering={FadeIn.duration(700)}
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
            <View style={styles.topRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.iconButton}
              >
                <BlurView
                  intensity={35}
                  tint={blurTint}
                  style={styles.headerBlur}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={22}
                    color="#FFF"
                  />
                </BlurView>
              </TouchableOpacity>

              {!isOwnProfile && (
                <FollowButton
                  targetUserId={targetUserId}
                  targetUserData={targetUserData}
                  onFollowChange={handleFollowChange}
                />
              )}
            </View>

            <View style={styles.profileBlock}>
              <Image
                source={{
                  uri:
                    profile.photoURL ||
                    profile.foto ||
                    "https://i.pravatar.cc/150",
                }}
                style={styles.avatar}
              />

              <Text style={styles.name}>
                {profile.displayName || profile.nome || "Usuário"}
              </Text>

              {!!profile.bio && (
                <Text style={styles.bio}>{profile.bio}</Text>
              )}
            </View>

            <BlurView intensity={28} tint={blurTint} style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{eventos.length}</Text>
              <Text style={styles.statLabel}>eventos</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile.followers || seguidores.length}
              </Text>
              <Text style={styles.statLabel}>seguidores</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile.following || seguindo.length}
              </Text>
              <Text style={styles.statLabel}>seguindo</Text>
            </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>

        {/* EVENTOS SECTION */}
        <Animated.View
          entering={FadeInUp.delay(180).springify()}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Eventos frequentados</Text>
              <Text style={styles.sectionCount}>{eventos.length}</Text>
            </View>

            <FlatList
              data={eventos}
              keyExtractor={(item) => item.id}
              renderItem={renderEvento}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons
                    name="ticket-confirmation-outline"
                    size={42}
                    color={colors.textMuted}
                  />

                  <Text style={styles.emptyText}>
                    Nenhum evento frequentado ainda
                  </Text>
                </View>
              }
            />
          </View>
        </Animated.View>

        {/* REDE SECTION */}
        <Animated.View
          entering={FadeInUp.delay(260).springify()}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rede</Text>

            <View style={styles.peopleRow}>
              {seguidores.slice(0, 6).map((item) => (
                <Image
                  key={item.id}
                  source={{
                    uri:
                      item.followerPhoto ||
                      "https://i.pravatar.cc/100",
                  }}
                  style={styles.smallAvatar}
                />
              ))}
            </View>

            <Text style={styles.networkText}>
              {seguidores.length} seguidores e {seguindo.length} seguindo
            </Text>

            <SeguindoList
              title="Seguidores"
              usuarios={seguidores}
              onNavigateProfile={abrirPerfilUsuario}
            />

            <SeguindoList
              title="Seguindo"
              usuarios={seguindo}
              onNavigateProfile={abrirPerfilUsuario}
            />
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
  loading: {
    flex: 1,
    backgroundColor: c.background,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
  profileBlock: {
    alignItems: "center",
    marginTop: 16,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: c.primary,
  },
  name: {
    color: c.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 14,
    textAlign: "center",
  },
  bio: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  stats: {
    flexDirection: "row",
    marginTop: 22,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.glassStrong,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statValue: {
    color: c.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 18,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  sectionCount: {
    color: c.textMuted,
    fontWeight: "800",
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glass,
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
  },
  eventImage: {
    width: 86,
    height: 86,
    borderRadius: 16,
    backgroundColor: c.surface,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  eventTitle: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  eventMeta: {
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  eventDate: {
    color: c.primaryLight,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 36,
    backgroundColor: c.glass,
    borderRadius: 20,
  },
  emptyText: {
    color: c.textSecondary,
    marginTop: 10,
    textAlign: "center",
  },
  peopleRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  smallAvatar: {
    width: 42,
    height: 42,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: c.background,
    marginRight: -8,
    backgroundColor: c.surface,
  },
  networkText: {
    color: c.textSecondary,
    marginTop: 12,
  },
});
}
