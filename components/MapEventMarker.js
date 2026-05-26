import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { formatarDistancia } from "../services/mapaVivoService";

export default function MapEventMarker({
  id,
  title,
  genre,
  distance,
  checkInsCount = 0,
  likesCount = 0,
  onPress,
  isSelected = false,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* ICON WRAPPER */}
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons
          name="map-marker"
          size={32}
          color={Colors.textPrimary}
        />
      </View>

      {/* CONTENT CALLOUT */}
      {isSelected && (
        <View style={styles.callout}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          
          <View style={styles.genreTag}>
            <Text style={styles.genreText}>{genre}</Text>
          </View>

          {/* STATS */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="map-distance"
                size={12}
                color={Colors.textSecondary}
              />
              <Text style={styles.statText}>
                {formatarDistancia(distance)}
              </Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="check-circle"
                size={12}
                color={Colors.textSecondary}
              />
              <Text style={styles.statText}>{checkInsCount}</Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  containerSelected: {
    zIndex: 1000,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  callout: {
    position: "absolute",
    top: -120,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 10,
    width: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  genreTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  genreText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
  },
  stats: {
    flexDirection: "row",
    gap: 10,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
