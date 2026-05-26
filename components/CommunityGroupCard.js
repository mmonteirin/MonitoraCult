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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* BACKGROUND IMAGE COM GRADIENT */}
        {image && (
          <Image source={{ uri: image }} style={styles.cardImage} />
        )}
        
        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.3)",
            "rgba(108, 92, 231, 0.5)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.genreTag}>
              <Text style={styles.genreTagText}>{genre}</Text>
            </View>
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
                {membersCount} membros
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
            <MaterialCommunityIcons
              name={isMember ? "check" : "plus"}
              size={20}
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
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  genreTag: {
    backgroundColor: "rgba(108, 92, 231, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  genreTagText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: c.textSecondary,
    marginBottom: 12,
  },
  membersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  membersText: {
    color: c.textSecondary,
    fontSize: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(108, 92, 231, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  buttonActive: {
    backgroundColor: "rgba(34, 197, 94, 0.9)",
  },
  buttonText: {
    color: c.textPrimary,
    fontWeight: "600",
    fontSize: 13,
  },
  buttonActiveText: {
    color: c.textPrimary,
  },
});
}
