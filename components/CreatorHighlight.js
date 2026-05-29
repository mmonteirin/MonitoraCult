import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

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
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark, colors.accentCyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* DECORATIVE GLOWS */}
          <View style={[styles.glow, { backgroundColor: colors.primary + "30" }]} />
          <View style={[styles.glow2, { backgroundColor: colors.accentCyan + "20" }]} />

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
                size={70}
                color={colors.textPrimary}
              />
            </View>
          )}

          {/* OVERLAY */}
          <LinearGradient
            colors={["transparent", "rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.7)"]}
            style={styles.overlay}
          />

          {/* CONTENT */}
          <View style={styles.content}>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.genreTag}>
                <MaterialCommunityIcons name="tag" size={12} color={colors.textPrimary} />
                <Text style={styles.genreTagText}>{genre}</Text>
              </View>
              <View style={styles.badge}>
                <MaterialCommunityIcons
                  name="star"
                  size={14}
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
                  color={colors.textSecondary}
                />
                <Text style={styles.statText}>
                  {formatNumber(viewsCount)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <MaterialCommunityIcons
                  name="account-multiple"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.statText}>
                  {formatNumber(followersCount)}
                </Text>
              </View>
            </View>

            {/* FOLLOW BUTTON */}
            <TouchableOpacity
              style={styles.followButton}
              onPress={onFollow}
              activeOpacity={0.8}
            >
              <BlurView intensity={20} tint="dark" style={styles.followButtonBlur}>
                <MaterialCommunityIcons
                  name="plus"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.followButtonText}>Seguir</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    height: 300,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    justifyContent: "flex-end",
  },
  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -50,
    right: -50,
  },
  glow2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: 50,
    left: -50,
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
    backgroundColor: c.surface,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  genreTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  genreTagText: {
    color: c.textPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
  },
  badgeText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "700",
  },
  infoSection: {
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: c.textPrimary,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 13,
    color: c.textSecondary,
    lineHeight: 18,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  statText: {
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: "600",
  },
  followButton: {
    marginTop: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  followButtonBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  followButtonText: {
    color: c.primary,
    fontWeight: "700",
    fontSize: 14,
  },
});
}
