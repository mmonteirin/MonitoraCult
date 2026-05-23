import React from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import Animated, {
  FadeInRight,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import EventSignalPill from "./EventSignalPill";
import { Colors } from "../../styles/Colors";
import {
  formatarDistancia,
  getCountdownInfo,
  getTicketSignal,
} from "./homeUtils";

const windowWidth = Dimensions.get("window").width;

function HeroCard({ item, index, scrollX, onPress }) {
  const animatedStyle = useAnimatedStyle(() => {
    const size = windowWidth - 52;

    const input = [
      (index - 1) * size,
      index * size,
      (index + 1) * size,
    ];

    const scale = interpolate(
      scrollX.value,
      input,
      [0.94, 1, 0.94],
      "clamp"
    );

    const translateY = interpolate(
      scrollX.value,
      input,
      [14, 0, 14],
      "clamp"
    );

    const rotate = interpolate(
      scrollX.value,
      input,
      [-1.5, 0, 1.5],
      "clamp"
    );

    return {
      transform: [
        { scale },
        { translateY },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <Animated.View
      entering={
        Platform.OS !== "web"
          ? FadeInRight.delay(index * 70).duration(620)
          : undefined
      }
      style={[styles.heroCard, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.96}
        style={styles.fill}
        onPress={() => onPress(item)}
      >
        <Image
          source={item.imagem}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
        />

        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0.22)",
            "rgba(0,0,0,0.94)",
          ]}
          style={styles.overlay}
        />

        <LinearGradient
          colors={[
            "rgba(108,92,231,0.20)",
            "transparent",
            "rgba(0,0,0,0.15)",
          ]}
          style={styles.glowOverlay}
        />

        <View style={styles.signal}>
          <EventSignalPill
            countdown={getCountdownInfo(item)}
            ticketSignal={getTicketSignal(item)}
          />
        </View>

        <View style={styles.topRight}>
          <View style={styles.scoreBadge}>
            <MaterialCommunityIcons
              name="trending-up"
              size={13}
              color={Colors.textPrimary}
            />

            <Text style={styles.scoreText}>
              {Math.round(item.score || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.categoria}
              </Text>
            </View>

            {!!item.distancia && (
              <View style={styles.distanceBadge}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={12}
                  color={Colors.primaryLight}
                />

                <Text style={styles.distanceText}>
                  {formatarDistancia(item.distancia)}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            {item.titulo}
          </Text>

          <Text style={styles.heroLocation} numberOfLines={1}>
            {item.local}
          </Text>

          <View style={styles.bottomRow}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                Em alta agora
              </Text>
            </View>

            <MaterialCommunityIcons
              name="arrow-top-right"
              size={22}
              color={Colors.textPrimary}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TrendingCarousel({
  eventos = [],
  scrollX,
  onScroll,
  onPress,
}) {
  if (!eventos?.length) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={windowWidth - 52}
        decelerationRate={0.92}
        disableIntervalMomentum
        overScrollMode="never"
        contentContainerStyle={styles.container}
      >
        {eventos.map((item, index) => (
          <HeroCard
            key={item.id}
            item={item}
            index={index}
            scrollX={scrollX}
            onPress={onPress}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 4,
  },

  container: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },

  heroCard: {
    width: windowWidth - 52,
    height: 270,
    borderRadius: 34,
    overflow: "hidden",
    marginRight: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,

    shadowColor: Colors.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 10,
  },

  fill: {
    flex: 1,
  },

  heroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.backgroundSecondary,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  signal: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
  },

  topRight: {
    position: "absolute",
    top: 16,
    right: 16,
  },

  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  scoreText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },

  heroContent: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 22,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  badgeText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(15,15,20,0.75)",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: Colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  distanceText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
  },

  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
  },

  heroLocation: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
    fontWeight: "500",
  },

  bottomRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  liveRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 7,
  },

  liveText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
});