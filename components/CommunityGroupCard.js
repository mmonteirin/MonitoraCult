import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

export default function CommunityGroupCard({
  id,
  name,
  genre,
  description,
  membersCount = 0,
  image,
  isMember = false,
  onPress,
  onJoin,
  onLeave,
}) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
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
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.card}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {/* BACKGROUND IMAGE COM GRADIENT */}
          {image && (
            <Image source={{ uri: image }} style={styles.cardImage} />
          )}

          {!image && (
            <View style={styles.placeholderImage}>
              <MaterialCommunityIcons
                name="account-group"
                size={60}
                color={colors.textMuted}
              />
            </View>
          )}

          <LinearGradient
            colors={[
              "rgba(0, 0, 0, 0.2)",
              "rgba(0, 0, 0, 0.5)",
              colors.primary + "0.8",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* DECORATIVE GLOWS */}
            <View style={[styles.glow, { backgroundColor: colors.primary + "30" }]} />
            <View style={[styles.glow2, { backgroundColor: colors.accentCyan + "20" }]} />

            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.genreTag}>
                <MaterialCommunityIcons name="tag" size={12} color={colors.textPrimary} />
                <Text style={styles.genreTagText}>{genre}</Text>
              </View>
              {isMember && (
                <View style={styles.memberBadge}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                  <Text style={styles.memberBadgeText}>Membro</Text>
                </View>
              )}
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>
                {name}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {description}
              </Text>

              {/* MEMBERS */}
              <View style={styles.membersRow}>
                <MaterialCommunityIcons
                  name="account-multiple"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.membersText}>
                  {formatNumber(membersCount)} membros
                </Text>
              </View>
            </View>

            {/* BUTTON */}
            <TouchableOpacity
              style={[
                styles.button,
                isMember && styles.buttonActive,
              ]}
              onPress={isMember ? onLeave : onJoin}
              activeOpacity={0.8}
            >
              <BlurView intensity={20} tint="dark" style={styles.buttonBlur}>
                <MaterialCommunityIcons
                  name={isMember ? "check" : "plus"}
                  size={18}
                  color={isMember ? colors.success : colors.primary}
                />
                <Text
                  style={[
                    styles.buttonText,
                    isMember && styles.buttonActiveText,
                  ]}
                >
                  {isMember ? "Membro" : "Entrar"}
                </Text>
              </BlurView>
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    height: 220,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  cardImage: {
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
  gradient: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
  glow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -40,
    right: -40,
  },
  glow2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: 40,
    left: -40,
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
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  memberBadgeText: {
    color: c.success,
    fontSize: 11,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: c.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 13,
    color: c.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  membersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  membersText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonActive: {
    borderColor: c.success + "40",
  },
  buttonText: {
    color: c.textPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  buttonActiveText: {
    color: c.textPrimary,
  },
});
}
