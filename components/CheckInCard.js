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

export default function CheckInCard({
  id,
  eventTitle,
  userName,
  userAvatar,
  caption,
  photo,
  createdAt,
  onPress,
  onDelete,
}) {
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
      {/* PHOTO */}
      {photo && (
        <Image
          source={{ uri: photo }}
          style={styles.photo}
        />
      )}

      {!photo && (
        <View style={styles.photoPlaceholder}>
          <MaterialCommunityIcons
            name="camera-off"
            size={40}
            color={Colors.textMuted}
          />
        </View>
      )}

      {/* CONTENT */}
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons
                  name="account"
                  size={18}
                  color={Colors.primary}
                />
              </View>
            )}
            <View>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.timestamp}>
                {formatDate(createdAt)}
              </Text>
            </View>
          </View>

          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={Colors.error}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* EVENT TITLE */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          <MaterialCommunityIcons
            name="map-marker"
            size={13}
            color={Colors.primary}
          />
          {" "}
          {eventTitle}
        </Text>

        {/* CAPTION */}
        {caption && (
          <Text style={styles.caption} numberOfLines={2}>
            {caption}
          </Text>
        )}
      </View>

      {/* BADGE */}
      <View style={styles.badge}>
        <MaterialCommunityIcons
          name="check-circle"
          size={16}
          color={Colors.success}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: 160,
    backgroundColor: Colors.surface,
  },
  photoPlaceholder: {
    width: "100%",
    height: 160,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 6,
  },
  caption: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 12,
    padding: 4,
  },
});
