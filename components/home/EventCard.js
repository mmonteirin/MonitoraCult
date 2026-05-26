import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import Animated, {
  FadeInDown,
} from "react-native-reanimated";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";

import EventSignalPill from "./EventSignalPill";

import {
  formatarDistancia,
  getCountdownInfo,
  getTicketSignal,
} from "./homeUtils";

export default function EventCard({
  item,
  index = 0,
  onPress,
  compact = false,
  reason,
}) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";

  const countdown = getCountdownInfo(item);

  const ticketSignal = getTicketSignal(item);
  const mediaAvaliacoes = Number(
    item.avaliacoesResumo?.media ??
      item.mediaAvaliacoes ??
      item.notaMedia ??
      0
  );
  const totalAvaliacoes = Number(
    item.avaliacoesResumo?.total ??
      item.totalAvaliacoes ??
      0
  );

  return (
    <Animated.View
      entering={
        Platform.OS !== "web"
          ? FadeInDown.delay(index * 45).duration(520)
          : undefined
      }
    >
      <TouchableOpacity
        activeOpacity={0.96}
        style={[
          styles.card,
          compact && styles.compactCard,
        ]}
        onPress={() => onPress(item)}
      >
        <Image
          source={item.imagem}
          style={styles.cardImage}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
        />

        <LinearGradient
          colors={[
            "transparent",
            colors.overlayDark,
            "rgba(0,0,0,0.96)",
          ]}
          style={styles.overlay}
        />

        <View style={styles.topSignal}>
          <EventSignalPill
            countdown={countdown}
            ticketSignal={ticketSignal}
            onImage
          />
        </View>

        <View style={styles.cardContent}>
          {!!reason && (
            <BlurView intensity={40} tint={blurTint} style={styles.reasonBadge}>
              <MaterialCommunityIcons
                name="star-box"
                size={12}
                color={colors.primaryLight}
              />
              <Text style={styles.reason} numberOfLines={1}>
                {reason}
              </Text>
            </BlurView>
          )}

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.titulo}
          </Text>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color={colors.onPrimary}
            />
            <Text style={styles.cardLocation} numberOfLines={1}>
              {item.local}
            </Text>
          </View>

          <View style={styles.cardBottom}>
            <View style={styles.metricBadge}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={13}
                color={colors.onPrimary}
              />
              <Text style={styles.metricText}>
                {formatarDistancia(item.distancia)}
              </Text>
            </View>

            <View style={styles.metricBadge}>
              <MaterialCommunityIcons
                name="star"
                size={14}
                color="#FFD166"
              />
              <Text style={styles.metricText}>
                {totalAvaliacoes > 0
                  ? mediaAvaliacoes.toFixed(1)
                  : Math.round(item.score)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  card: {
    height: 250,
    borderRadius: 30,
    overflow: "hidden",
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: c.surface,
    shadowColor: c.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },

  compactCard: {
    width: 250,
    height: 300,
    marginHorizontal: 0,
    marginRight: 14,
  },

  cardImage: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  topSignal: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    zIndex: 2,
  },

  cardContent: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    zIndex: 3,
  },

  reasonBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },

  reason: {
    flex: 1,
    color: c.primaryLight,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 6,
  },

  cardTitle: {
    color: c.onPrimary,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 24,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  cardLocation: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },

  cardBottom: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  metricBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  metricText: {
    color: c.onPrimary,
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 5,
  },
});
}
