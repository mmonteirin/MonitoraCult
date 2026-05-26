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

const CATEGORY_FILTERS = [
  {
    key: "shows",
    label: "Shows",
    icon: "music-note-outline",
    color: "#FF6B6B",
  },
  {
    key: "teatro",
    label: "Teatro",
    icon: "drama-masks",
    color: "#4ECDC4",
  },
  {
    key: "gastronomia",
    label: "Gastronomia",
    icon: "silverware-fork-knife",
    color: "#FFE66D",
  },
  {
    key: "cinema",
    label: "Cinema",
    icon: "film-outline",
    color: "#95E1D3",
  },
  {
    key: "musica",
    label: "Música",
    icon: "music-box-outline",
    color: "#C7CEEA",
  },
  {
    key: "danca",
    label: "Dança",
    icon: "human-female-dance",
    color: "#FF8FB1",
  },
  {
    key: "exposicao",
    label: "Exposição",
    icon: "palette-outline",
    color: "#A8E6CF",
  },
  {
    key: "artes",
    label: "Artes",
    icon: "brush",
    color: "#FFD3B6",
  },
];

export default function CommunityCategoryFilter({
  selectedCategories = [],
  onCategoryToggle,
  allowMultiple = true,
}) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";

  const handlePress = (categoryKey) => {
    if (allowMultiple) {
      const newSelected = selectedCategories.includes(categoryKey)
        ? selectedCategories.filter((c) => c !== categoryKey)
        : [...selectedCategories, categoryKey];
      onCategoryToggle?.(newSelected);
    } else {
      onCategoryToggle?.([categoryKey]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filtrar por Interesse</Text>
        {selectedCategories.length > 0 && (
          <TouchableOpacity onPress={() => onCategoryToggle?.([])}>
            <Text style={styles.clearBtn}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {CATEGORY_FILTERS.map((category) => {
          const isSelected = selectedCategories.includes(category.key);

          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryTag,
                isSelected && styles.categoryTagActive,
                { borderColor: isSelected ? category.color : "rgba(255,255,255,0.1)" },
                { backgroundColor: isSelected ? category.color + "20" : "transparent" },
              ]}
              onPress={() => handlePress(category.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={category.icon}
                size={16}
                color={isSelected ? category.color : colors.textMuted}
              />
              <Text
                style={[
                  styles.tagLabel,
                  { color: isSelected ? category.color : colors.textSecondary },
                ]}
              >
                {category.label}
              </Text>
              {isSelected && (
                <View
                  style={[styles.checkmark, { backgroundColor: category.color }]}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={10}
                    color="#FFF"
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textPrimary,
  },
  clearBtn: {
    fontSize: 12,
    fontWeight: "600",
    color: c.primary,
  },
  filterScroll: {
    flexGrow: 0,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  categoryTagActive: {
    borderWidth: 2,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  checkmark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 2,
  },
  });
}

export { CATEGORY_FILTERS };
