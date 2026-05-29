import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

export default function ForumThread({
  id,
  title,
  description,
  authorName,
  repliesCount = 0,
  likesCount = 0,
  createdAt,
  onPress,
  onReply,
}) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Agora";
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons
              name="account-circle"
              size={40}
              color={colors.primary}
            />
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timestamp}>
              {formatDate(createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* TITLE */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* DESCRIPTION */}
      <Text style={styles.description} numberOfLines={3}>
        {description}
      </Text>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="chat-multiple-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.statText}>
              {repliesCount} respostas
            </Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.statText}>
              {likesCount} curtidas
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.replyButton}
          onPress={onReply}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="reply"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.replyButtonText}>Responder</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    backgroundColor: c.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  header: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.surface,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: c.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: c.textSecondary,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(108, 92, 231, 0.2)",
  },
  replyButtonText: {
    fontSize: 12,
    color: c.primary,
    fontWeight: "600",
  },
});
}
