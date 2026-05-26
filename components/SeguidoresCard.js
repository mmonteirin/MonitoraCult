/**
 * 👥 COMPONENTE: CARD DO CRIADOR/SEGUIDOR
 * Mostra informações do criador e opção de seguir
 */

import React, { memo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFollow } from "../hooks/useFollow";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";


// ✅ Component
const SeguidoresCard = memo(({ creator, onNavigateProfile }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const { user } = useAuth();
  const targetUserId =
    creator?.targetUserId ||
    creator?.followerId ||
    creator?.uid ||
    creator?.userId ||
    creator?.id;
  const targetUserData = {
    displayName:
      creator?.targetName ||
      creator?.followerName ||
      creator?.nome ||
      creator?.displayName ||
      "Usuário",
    photoURL:
      creator?.targetPhoto ||
      creator?.followerPhoto ||
      creator?.foto ||
      creator?.photoURL ||
      "",
  };
  const { isFollowing, loading, toggleFollow } = useFollow(
    targetUserId,
    targetUserData
  );
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    setIsOwnProfile(user?.uid === targetUserId);
  }, [user?.uid, targetUserId]);

  const handleFollowToggle = async () => {
    if (isOwnProfile) {
      onNavigateProfile?.();
      return;
    }

    await toggleFollow();
  };

  const seguidorCount = creator?.seguidores || creator?.followers || 0;
  const postCount = creator?.posts || 0;

  return (
    <Pressable
      style={styles.container}
      onPress={() => onNavigateProfile?.()}
    >
      <LinearGradient
        colors={[colors.surface, colors.surface + "dd"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.content}
      >
        {/* AVATAR */}
        <Image
          source={{
            uri:
              creator?.targetPhoto ||
              creator?.followerPhoto ||
              creator?.foto ||
              creator?.photoURL ||
              `https://i.pravatar.cc/150?u=${targetUserId}`,
          }}
          style={styles.avatar}
        />

        {/* INFO PRINCIPAL */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {targetUserData.displayName}
          </Text>

          {creator?.categoria && (
            <Text style={styles.categoria} numberOfLines={1}>
              📍 {creator.categoria}
            </Text>
          )}

          {creator?.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {creator.bio}
            </Text>
          )}

          {/* STATS */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{postCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.stat}>
              <Text style={styles.statValue}>{seguidorCount}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
          </View>
        </View>

        {/* BADGE VERIFICADO */}
        {creator?.verificado && (
          <View style={styles.verificadoBadge}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={18}
              color={colors.primary}
            />
          </View>
        )}
      </LinearGradient>

      {/* BOTÃO AÇÃO */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleFollowToggle}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : isOwnProfile ? (
          <>
            <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Editar Perfil</Text>
          </>
        ) : isFollowing ? (
          <>
            <MaterialCommunityIcons
              name="check"
              size={16}
              color="#fff"
            />
            <Text style={styles.actionButtonText}>Seguindo</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Seguir</Text>
          </>
        )}
      </TouchableOpacity>
    </Pressable>
  );
});

// ✅ Componente com suporte a múltiplos seguindo/seguidores
const SeguindoList = memo(({ usuarios, title, onNavigateProfile }) => {
  if (!usuarios || usuarios.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="account-multiple-outline"
          size={40}
          color={colors.textMuted}
        />
        <Text style={styles.emptyText}>{title} vazio</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <Text style={styles.listTitle}>{title}</Text>
      {usuarios.slice(0, 5).map((user) => (
        <SeguidoresCard
          key={user.id || user.userId || user.targetUserId || user.followerId}
          creator={user}
          onNavigateProfile={() => onNavigateProfile?.(user)}
        />
      ))}
      {usuarios.length > 5 && (
        <TouchableOpacity style={styles.viewMoreButton}>
          <Text style={styles.viewMoreText}>
            Ver todos ({usuarios.length})
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    marginBottom: 12,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: c.primary + "33",
  },

  info: {
    flex: 1,
  },

  name: {
    fontSize: 14,
    fontWeight: "700",
    color: c.textPrimary,
  },

  categoria: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2,
  },

  bio: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },

  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },

  stat: {
    alignItems: "center",
  },

  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: c.primary,
  },

  statLabel: {
    fontSize: 10,
    color: c.textMuted,
    marginTop: 2,
  },

  divider: {
    width: 1,
    height: 24,
    backgroundColor: c.border,
  },

  verificadoBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: c.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },

  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  // LIST
  listContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 12,
  },

  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },

  viewMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: c.primary,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
    marginHorizontal: 16,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: c.textMuted,
  },
  });
}

export { SeguidoresCard, SeguindoList };
export default SeguidoresCard;
