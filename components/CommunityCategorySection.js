import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { LinearGradient } from "expo-linear-gradient";

export default function CommunityCategorySection({
  category,
  icon,
  description,
  groups = [],
  onGroupPress,
  onSeeAll,
  isMember,
  checkIsMember,
}) {
  const [expanded, setExpanded] = useState(true);
  const displayedGroups = expanded ? groups : groups.slice(0, 2);

  const getCategoryColor = (categoryKey) => {
    const colorMap = {
      shows: "#FF6B6B",
      teatro: "#4ECDC4",
      gastronomia: "#FFE66D",
      cinema: "#95E1D3",
      musica: "#C7CEEA",
      danca: "#FF8FB1",
      exposicao: "#A8E6CF",
      artes: "#FFD3B6",
      literatur: "#FFAAA5",
      fotografia: "#B4E7FF",
    };
    return colorMap[categoryKey?.toLowerCase()] || Colors.primary;
  };

  const categoryColor = getCategoryColor(category);

  return (
    <View style={styles.sectionContainer}>
      {/* HEADER DA SEÇÃO */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerContent}>
          <View
            style={[styles.categoryIcon, { backgroundColor: categoryColor }]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color="#FFF"
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {description && (
              <Text style={styles.categoryDesc}>{description}</Text>
            )}
          </View>
        </View>
        {groups.length > 2 && (
          <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* GRUPOS DA CATEGORIA */}
      {groups.length > 0 ? (
        <View style={styles.groupsList}>
          {displayedGroups.map((group, index) => (
            <TouchableOpacity
              key={group.id || index}
              style={[
                styles.groupItem,
                index === displayedGroups.length - 1 &&
                  styles.groupItemLast,
              ]}
              onPress={() => onGroupPress?.(group)}
              activeOpacity={0.6}
            >
              <View style={styles.groupItemContent}>
                <View style={styles.groupItemHeader}>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {group.name}
                  </Text>
                  <View
                    style={[
                      styles.membersBadge,
                      { backgroundColor: categoryColor + "20" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-multiple"
                      size={14}
                      color={categoryColor}
                    />
                    <Text
                      style={[styles.membersCount, { color: categoryColor }]}
                    >
                      {group.membersCount || 0}
                    </Text>
                  </View>
                </View>
                <Text style={styles.groupDesc} numberOfLines={2}>
                  {group.description}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.joinBtn,
                  checkIsMember(group) && styles.joinBtnActive,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={checkIsMember(group) ? "check-circle" : "plus-circle"}
                  size={20}
                  color={checkIsMember(group) ? "#10B981" : categoryColor}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {/* BOTÃO VER TUDO SE HOUVER MAIS GRUPOS */}
          {!expanded && groups.length > 2 && (
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => {
                setExpanded(true);
                onSeeAll?.();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>
                Ver {groups.length - 2} mais grupos
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color={Colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyCategory}>
          <MaterialCommunityIcons
            name="folder-open-outline"
            size={32}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyCategoryText}>
            Nenhum grupo nesta categoria
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    textTransform: "capitalize",
  },
  categoryDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  groupsList: {
    padding: 8,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  groupItemLast: {
    marginBottom: 0,
  },
  groupItemContent: {
    flex: 1,
    marginRight: 12,
  },
  groupItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  groupName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  membersBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  membersCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  groupDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  joinBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  joinBtnActive: {
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  emptyCategory: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyCategoryText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
});
