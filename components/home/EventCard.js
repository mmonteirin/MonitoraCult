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

import { Colors } from "../../styles/Colors";

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
            "rgba(0,0,0,0.18)",
            "rgba(0,0,0,0.94)",
          ]}
          style={styles.overlay}
        />

        <View style={styles.topSignal}>
          <EventSignalPill
            countdown={countdown}
            ticketSignal={ticketSignal}
          />
        </View>

        <BlurView
          intensity={22}
          tint="dark"
          style={styles.footer}
        >
          {!!reason && (
            <View style={styles.reasonContainer}>
              <MaterialCommunityIcons
                name="star-box"
                size={12}
                color={Colors.primaryLight}
              />

              <Text
                style={styles.reason}
                numberOfLines={1}
              >
                {reason}
              </Text>
            </View>
          )}

          <Text
            style={styles.cardTitle}
            numberOfLines={2}
          >
            {item.titulo}
          </Text>

          <Text
            style={styles.cardLocation}
            numberOfLines={1}
          >
            📍 {item.local}
          </Text>

          <View style={styles.cardBottom}>
            <View style={styles.distanceBadge}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={13}
                color={Colors.textSecondary}
              />

              <Text style={styles.distance}>
                {formatarDistancia(item.distancia)}
              </Text>
            </View>

            <View style={styles.rating}>
              <MaterialCommunityIcons
                name="star"
                size={14}
                color={Colors.warning}
              />

              <Text style={styles.ratingText}>
                {totalAvaliacoes > 0
                  ? mediaAvaliacoes.toFixed(1)
                  : Math.round(item.score)}
              </Text>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 250,

    borderRadius: 30,

    overflow: "hidden",

    marginHorizontal: 18,
    marginBottom: 18,

    backgroundColor: Colors.surface,

    shadowColor: Colors.shadow,
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
  },

  footer: {
    position: "absolute",

    left: 12,
    right: 12,
    bottom: 12,

    padding: 16,

    borderRadius: 24,

    overflow: "hidden",

    backgroundColor: Colors.mapOverlay,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  reasonContainer: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 8,
  },

  reason: {
    flex: 1,

    color: Colors.primaryLight,

    fontSize: 11,
    fontWeight: "700",

    marginLeft: 6,
  },

  cardTitle: {
    color: Colors.textPrimary,

    fontSize: 20,
    fontWeight: "800",

    letterSpacing: -0.5,
  },

  cardLocation: {
    color: Colors.textSecondary,

    fontSize: 13,

    marginTop: 7,
  },

  cardBottom: {
    marginTop: 14,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: Colors.overlayLight,

    borderRadius: 14,

    paddingHorizontal: 10,
    paddingVertical: 7,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  distance: {
    color: Colors.textPrimary,

    fontWeight: "700",
    fontSize: 12,

    marginLeft: 5,
  },

  rating: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: Colors.overlayLight,

    paddingHorizontal: 10,
    paddingVertical: 7,

    borderRadius: 14,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  ratingText: {
    color: Colors.textPrimary,

    fontWeight: "800",

    marginLeft: 4,
  },
});
