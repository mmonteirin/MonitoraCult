import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import EventCard from "./EventCard";
import SectionHeader from "./SectionHeader";

import { Colors } from "../../styles/Colors";
import { getRecommendationReason } from "./homeUtils";

export default function RecommendationSection({
  eventos = [],
  signals = {},
  onPress = () => {},
}) {
  if (!Array.isArray(eventos) || eventos.length === 0) {
    return null;
  }

  const categoriesCount = Object.keys(
    signals?.categories || {}
  ).length;

  const placesCount = Object.keys(
    signals?.places || {}
  ).length;

  const likesCount =
    signals?.likedSet?.size || 0;

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Recomendado para você"
        subtitle="IA baseada nos seus gostos, locais e interações"
      />

      <BlurView
        intensity={18}
        tint="dark"
        style={styles.aiBanner}
      >
        <View style={styles.aiHeader}>
          <View style={styles.aiIcon}>
            <MaterialCommunityIcons
              name="creation"
              size={18}
              color={Colors.background}
            />
          </View>

          <View style={styles.aiCopy}>
            <Text style={styles.aiTitle}>
              Recomendação Inteligente
            </Text>

            <Text style={styles.aiSubtitle}>
              Aprendendo com seus eventos favoritos
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.refreshButton}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {categoriesCount}
            </Text>

            <Text style={styles.metricLabel}>
              categorias
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {placesCount}
            </Text>

            <Text style={styles.metricLabel}>
              locais
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {likesCount}
            </Text>

            <Text style={styles.metricLabel}>
              likes
            </Text>
          </View>
        </View>
      </BlurView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {eventos.map((item, index) => (
          <EventCard
            key={item.id}
            item={item}
            index={index}
            compact
            reason={getRecommendationReason(
              item,
              signals
            )}
            onPress={onPress}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="star-circle"
          size={15}
          color={Colors.primaryLight}
        />

        <Text style={styles.footerText}>
          As recomendações melhoram conforme você usa o app
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },

  aiBanner: {
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: 24,
    overflow: "hidden",
    padding: 18,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  aiIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  aiCopy: {
    flex: 1,
    marginLeft: 12,
  },

  aiTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },

  aiSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },

  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.overlayLight,
  },

  metricsRow: {
    flexDirection: "row",
    marginTop: 18,
  },

  metricCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    padding: 14,
    backgroundColor: Colors.overlayLight,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginRight: 10,
  },

  metricValue: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },

  metricLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  row: {
    paddingLeft: 18,
    paddingRight: 6,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    marginTop: 14,
  },

  footerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    fontWeight: "600",
  },
});