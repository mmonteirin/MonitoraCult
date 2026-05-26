import React from "react";

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import EventCard from "./EventCard";
import SectionHeader from "./SectionHeader";

import { useTheme } from "../../context/ThemeContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function NearbySection({
  eventos = [],
  onPress,
  onViewAll,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  if (!eventos?.length) {
    return null;
  }

  const proximosAgora = eventos.filter(
    (evento) =>
      typeof evento.distancia === "number" &&
      evento.distancia <= 5
  );

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Próximos de você"
        subtitle="Eventos acontecendo perto agora"
      />

      <View style={styles.insightsRow}>
        <View style={[styles.insightCard, styles.insightCardPrimary]}>
          <View style={styles.iconWrapper}>
            <View style={[styles.insightIcon, styles.insightIconPrimary]}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={18}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.insightContent}>
            <Text style={styles.insightValue}>
              {proximosAgora.length}
            </Text>

            <Text style={styles.insightLabel}>
              eventos perto agora
            </Text>
          </View>
        </View>

        <View style={[styles.insightCard, styles.insightCardLive]}>
          <View style={styles.iconWrapper}>
            <View style={[styles.insightIcon, styles.liveIcon]}>
              <MaterialCommunityIcons
                name="access-point"
                size={18}
                color={colors.success}
              />
            </View>
          </View>

          <View style={styles.insightContent}>
            <Text style={styles.insightValue}>
              Ao vivo
            </Text>

            <Text style={styles.insightLabel}>
              radar cultural ativo
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        horizontal
        data={eventos}
        keyExtractor={(item, index) =>
          item?.id?.toString?.() || index.toString()
        }
        renderItem={({ item, index }) => (
          <EventCard
            item={item}
            index={index}
            onPress={onPress}
            compact
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        decelerationRate="fast"
        snapToAlignment="start"
      />

      <TouchableOpacity
        activeOpacity={0.94}
        style={styles.footerButton}
        onPress={onViewAll}
      >
        <LinearGradient
          colors={[
            colors.primary,
            colors.primaryDark,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.footerGradient}
        >
          <Text style={styles.footerButtonText}>
            Explorar mais eventos próximos
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={colors.onPrimary}
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 10,
  },

  insightsRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginBottom: 18,
  },

  insightCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginRight: 10,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },

  insightCardPrimary: {
    backgroundColor: c.primarySoft,
    borderColor: c.primary,
  },

  insightCardLive: {
    backgroundColor: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.35)",
    marginRight: 0,
  },

  iconWrapper: {
    position: "relative",
  },

  insightIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
  },

  insightIconPrimary: {
    borderColor: c.primary,
  },

  liveIcon: {
    backgroundColor: "rgba(34,197,94,0.14)",
    borderColor: "rgba(34,197,94,0.35)",
  },

  insightContent: {
    flex: 1,
    marginLeft: 12,
  },

  insightValue: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  insightLabel: {
    color: c.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 8,
  },

  footerButton: {
    marginHorizontal: 18,
    marginTop: 20,

    borderRadius: 22,

    shadowColor: c.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 10,

    overflow: "hidden",
  },

  footerGradient: {
    paddingVertical: 17,
    paddingHorizontal: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  footerButtonText: {
    color: c.onPrimary,
    fontSize: 15,
    fontWeight: "800",
    marginRight: 8,
  },
});
}