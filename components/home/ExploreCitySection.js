import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors } from "../../styles/Colors";

function buildCityStats(eventos) {
  const bairros = {};

  const categories = {};

  eventos.forEach((evento) => {
    if (evento.bairro) {
      bairros[evento.bairro] =
        (bairros[evento.bairro] || 0) + 1;
    }

    if (evento.categoria) {
      categories[evento.categoria] =
        (categories[evento.categoria] || 0) + 1;
    }
  });

  const topBairros = Object.entries(bairros)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const topCategory =
    Object.entries(categories).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "Cultura";

  return {
    topBairros: topBairros.length
      ? topBairros
      : ["Praia de Iracema", "Benfica", "Centro"],

    topCategory,

    vibe:
      topCategory.toLowerCase().includes("show") ||
      topCategory.toLowerCase().includes("festival")
        ? "Cidade em modo palco"
        : "Cidade em descoberta cultural",
  };
}

export default function ExploreCitySection({
  eventos,
  onPress,
}) {
  const stats = useMemo(
    () => buildCityStats(eventos),
    [eventos]
  );

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      style={styles.wrap}
      onPress={onPress}
    >
      <LinearGradient
        colors={[
          Colors.primaryDark,
          Colors.backgroundSecondary,
          Colors.background,
        ]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={styles.card}
      >
        <View style={styles.glow} />

        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>
              Fortaleza Hoje
            </Text>

            <Text style={styles.title}>
              Explorar cidade
            </Text>
          </View>

          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="weather-partly-cloudy"
              size={28}
              color={Colors.textPrimary}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="thermometer"
              size={16}
              color={Colors.primaryLight}
            />

            <Text style={styles.statValue}>
              29°C
            </Text>

            <Text style={styles.statLabel}>
              clima
            </Text>
          </View>

          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="calendar-star"
              size={16}
              color={Colors.primaryLight}
            />

            <Text style={styles.statValue}>
              {eventos.length}
            </Text>

            <Text style={styles.statLabel}>
              eventos
            </Text>
          </View>

          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="music-circle"
              size={16}
              color={Colors.primaryLight}
            />

            <Text
              style={styles.statValue}
              numberOfLines={1}
            >
              {stats.topCategory}
            </Text>

            <Text style={styles.statLabel}>
              vibe
            </Text>
          </View>
        </View>

        <View style={styles.vibeContainer}>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={16}
            color={Colors.primaryLight}
          />

          <Text style={styles.vibe}>
            {stats.vibe}
          </Text>
        </View>

        <View style={styles.bairros}>
          {stats.topBairros.map((bairro) => (
            <View
              key={bairro}
              style={styles.bairro}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={12}
                color={Colors.primaryLight}
              />

              <Text
                style={styles.bairroText}
                numberOfLines={1}
              >
                {bairro}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ver mapa cultural completo
          </Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={Colors.textPrimary}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 18,
    marginTop: 28,
  },

  card: {
    borderRadius: 30,

    padding: 22,

    overflow: "hidden",

    borderWidth: 1,
    borderColor: Colors.glassBorder,

    backgroundColor: Colors.surface,
  },

  glow: {
    position: "absolute",

    width: 220,
    height: 220,

    borderRadius: 110,

    backgroundColor: Colors.purpleGlow,

    top: -80,
    right: -70,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    zIndex: 2,
  },

  kicker: {
    color: Colors.textSecondary,

    fontSize: 12,
    fontWeight: "800",

    textTransform: "uppercase",

    letterSpacing: 1,
  },

  title: {
    color: Colors.textPrimary,

    fontSize: 26,
    fontWeight: "800",

    marginTop: 6,

    letterSpacing: -0.8,
  },

  iconContainer: {
    width: 54,
    height: 54,

    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.glass,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  statsRow: {
    flexDirection: "row",

    marginTop: 22,
  },

  stat: {
    flex: 1,

    minHeight: 78,

    borderRadius: 20,

    backgroundColor: Colors.overlayLight,

    padding: 14,

    marginRight: 10,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  statValue: {
    color: Colors.textPrimary,

    fontSize: 18,
    fontWeight: "800",

    marginTop: 8,
  },

  statLabel: {
    color: Colors.textMuted,

    fontSize: 11,

    marginTop: 5,

    textTransform: "uppercase",

    letterSpacing: 0.5,
  },

  vibeContainer: {
    marginTop: 18,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: Colors.overlayLight,

    borderRadius: 18,

    paddingHorizontal: 14,
    paddingVertical: 14,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  vibe: {
    flex: 1,

    color: Colors.textPrimary,

    fontSize: 15,
    fontWeight: "700",

    marginLeft: 10,
  },

  bairros: {
    flexDirection: "row",
    flexWrap: "wrap",

    marginTop: 16,
  },

  bairro: {
    flexDirection: "row",
    alignItems: "center",

    maxWidth: "100%",

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 16,

    backgroundColor: Colors.glass,

    borderWidth: 1,
    borderColor: Colors.glassBorder,

    marginRight: 8,
    marginBottom: 8,
  },

  bairroText: {
    color: Colors.textPrimary,

    fontSize: 12,
    fontWeight: "700",

    marginLeft: 5,
  },

  footer: {
    marginTop: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerText: {
    color: Colors.textSecondary,

    fontSize: 13,
    fontWeight: "700",
  },
});