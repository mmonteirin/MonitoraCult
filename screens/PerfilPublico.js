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
} from "react-native";

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
import { Colors } from "../styles/Colors";

const DEFAULT_IMAGE =
  "https://placehold.co/600x400?text=Evento";

export default function PerfilPublico({ navigation, route }) {
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
          {item.eventoData || "Data não informada"}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <LinearGradient
          colors={["#111827", "#1E1B4B", "#070B14"]}
          style={[
            styles.header,
            {
              paddingTop: insets.top + 10,
            },
          ]}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconButton}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color="#FFF"
              />
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

          <BlurView intensity={28} tint="dark" style={styles.stats}>
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
                  color={Colors.textMuted}
                />

                <Text style={styles.emptyText}>
                  Nenhum evento frequentado ainda
                </Text>
              </View>
            }
          />
        </View>

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  loading: {
    flex: 1,
    backgroundColor: "#070B14",
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
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
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
    borderColor: Colors.primary,
  },
  name: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 14,
    textAlign: "center",
  },
  bio: {
    color: Colors.textSecondary,
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
    borderColor: "rgba(255,255,255,0.08)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statValue: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: Colors.textSecondary,
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
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
  },
  sectionCount: {
    color: Colors.textMuted,
    fontWeight: "800",
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
  },
  eventImage: {
    width: 86,
    height: 86,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  eventTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
  eventMeta: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  eventDate: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 36,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
  },
  emptyText: {
    color: Colors.textSecondary,
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
    borderColor: "#070B14",
    marginRight: -8,
    backgroundColor: Colors.surface,
  },
  networkText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
});
