import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

const GENRES = [
  { label: "Todos", icon: "compass", value: null },
  { label: "Música", icon: "music", value: "Música" },
  { label: "Dança", icon: "dance-ballroom", value: "Dança" },
  { label: "Teatro", icon: "theater", value: "Teatro" },
  { label: "Cinema", icon: "movie", value: "Cinema" },
  { label: "Artes", icon: "palette", value: "Artes Visuais" },
  { label: "Literatura", icon: "book", value: "Literatura" },
  { label: "Gastronomia", icon: "chef-hat", value: "Gastronomia" },
];

export default function MapFilter({
  selectedGenre,
  onGenreChange,
  showHeatmap,
  onHeatmapToggle,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  return (
    <View style={styles.container}>
      {/* FILTER SCROLL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {GENRES.map((genre) => (
          <TouchableOpacity
            key={genre.value}
            style={[
              styles.filterButton,
              selectedGenre === genre.value && styles.filterButtonActive,
            ]}
            onPress={() => onGenreChange(genre.value)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={genre.icon}
              size={18}
              color={
                selectedGenre === genre.value
                  ? colors.textPrimary
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterText,
                selectedGenre === genre.value &&
                  styles.filterTextActive,
              ]}
            >
              {genre.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* HEATMAP TOGGLE */}
      <TouchableOpacity
        style={[
          styles.heatmapButton,
          showHeatmap && styles.heatmapButtonActive,
        ]}
        onPress={onHeatmapToggle}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={showHeatmap ? "fire" : "fire-off"}
          size={18}
          color={
            showHeatmap ? colors.error : colors.textSecondary
          }
        />
        <Text
          style={[
            styles.heatmapText,
            showHeatmap && styles.heatmapTextActive,
          ]}
        >
          Calor
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  filterButtonActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textSecondary,
  },
  filterTextActive: {
    color: c.textPrimary,
  },
  heatmapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  heatmapButtonActive: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderColor: c.error,
  },
  heatmapText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textSecondary,
  },
  heatmapTextActive: {
    color: c.error,
  },
});
}
