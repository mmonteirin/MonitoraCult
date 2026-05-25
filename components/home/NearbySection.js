import React from "react";

import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import EventCard from "./EventCard";
import SectionHeader from "./SectionHeader";

import { Colors } from "../../styles/Colors";

export default function NearbySection({
  eventos = [],
  onPress,
  onViewAll,
}) {
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
        <BlurView intensity={24} tint="dark" style={styles.insightCard}>
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={[
                `${Colors.primary}40`,
                `${Colors.primaryLight}12`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            />

            <View style={styles.insightIcon}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={18}
                color={Colors.primaryLight}
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
        </BlurView>

        <BlurView intensity={24} tint="dark" style={styles.insightCard}>
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={[
                "rgba(34,197,94,0.35)",
                "rgba(34,197,94,0.08)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            />

            <View
              style={[
                styles.insightIcon,
                styles.liveIcon,
              ]}
            >
              <MaterialCommunityIcons
                name="access-point"
                size={18}
                color={Colors.success}
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
        </BlurView>
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
            Colors.primary,
            Colors.primaryDark,
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
            color={Colors.textPrimary}
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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

    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,

    overflow: "hidden",
  },

  iconWrapper: {
    position: "relative",
  },

  iconGradient: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 16,
    top: -4,
    left: -4,
  },

  insightIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.overlayLight,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  liveIcon: {
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  insightContent: {
    flex: 1,
    marginLeft: 12,
  },

  insightValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  insightLabel: {
    color: Colors.textSecondary,
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

    shadowColor: Colors.primary,
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
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    marginRight: 8,
  },
});