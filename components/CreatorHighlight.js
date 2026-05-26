import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { LinearGradient } from "expo-linear-gradient";

export default function CreatorHighlight({
  id,
  name,
  genre,
  description,
  profileImage,
  viewsCount = 0,
  followersCount = 0,
  onPress,
  onFollow,
}) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* PROFILE IMAGE */}
        {profileImage && (
          <Image
            source={{ uri: profileImage }}
            style={styles.profileImage}
          />
        )}
        
        {!profileImage && (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons
              name="account"
              size={60}
              color={Colors.textPrimary}
            />
          </View>
        )}

        {/* OVERLAY */}
        <View style={styles.overlay} />

        {/* CONTENT */}
        <View style={styles.content}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.genreTag}>
              <Text style={styles.genreTagText}>{genre}</Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons
                name="star"
                size={16}
                color="#FFD700"
              />
              <Text style={styles.badgeText}>Destaque</Text>
            </View>
          </View>

          {/* NAME AND DESCRIPTION */}
          <View style={styles.infoSection}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text
              style={styles.description}
              numberOfLines={2}
            >
              {description}
            </Text>
          </View>

          {/* STATS */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="eye"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.statText}>
                {viewsCount > 999 ? `${(viewsCount / 1000).toFixed(1)}k` : viewsCount} visualizações
              </Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="account-multiple"
                size={14}
                color={Colors.textSecondary}
              />
              <Text style={styles.statText}>
                {followersCount > 999 ? `${(followersCount / 1000).toFixed(1)}k` : followersCount} seguidores
              </Text>
            </View>
          </View>

          {/* FOLLOW BUTTON */}
          <TouchableOpacity
            style={styles.followButton}
            onPress={onFollow}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.followButtonText}>Seguir</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    justifyContent: "flex-end",
  },
  profileImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  genreTag: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  genreTagText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "700",
  },
  infoSection: {
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  stats: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.textPrimary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  followButtonText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
