import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import Animated, { FadeIn } from "react-native-reanimated";

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

  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;
  const isSmallScreen = width < 375;

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
        contentContainerStyle={styles.filterScrollContent}
      >
        {CATEGORY_FILTERS.map((category, index) => {
          const isSelected = selectedCategories.includes(category.key);

          return (
            <Animated.View
              key={category.key}
              entering={FadeIn.delay(index * 50).springify()}
            >
              <TouchableOpacity
                style={[
                  styles.categoryTag,
                  isSelected && styles.categoryTagActive,
                  { 
                    borderColor: isSelected ? category.color : "rgba(255,255,255,0.1)",
                    backgroundColor: isSelected ? category.color + "25" : "rgba(255,255,255,0.03)",
                  },
                ]}
                onPress={() => handlePress(category.key)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={category.icon}
                  size={isTablet ? 18 : 16}
                  color={isSelected ? category.color : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tagLabel,
                    { 
                      color: isSelected ? category.color : colors.textSecondary,
                      fontSize: isSmallScreen ? 11 : isTablet ? 13 : 12,
                    },
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
                      size={isTablet ? 12 : 10}
                      color="#FFF"
                    />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: c.textPrimary,
    letterSpacing: 0.3,
  },
  clearBtn: {
    fontSize: 13,
    fontWeight: "700",
    color: c.primary,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterScrollContent: {
    paddingRight: 20,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    marginRight: 12,
  },
  categoryTagActive: {
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tagLabel: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 2,
  },
  });
}

export { CATEGORY_FILTERS };
