import React from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import EventCard from "./EventCard";
import SectionHeader from "./SectionHeader";

import { Colors } from "../../styles/Colors";

import { getRecommendationReason } from "./homeUtils";

export default function RecommendationSection({
  eventos = [],
  signals = {},
  onPress,
}) {
  const rotationAnim = useSharedValue(0);

  React.useEffect(() => {
    rotationAnim.value = withRepeat(
      withTiming(360, {
        duration: 3000,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate:
          interpolate(
            rotationAnim.value,
            [0, 360],
            [0, 360],
            Extrapolate.CLAMP
          ) + "deg",
      },
    ],
  }));

  if (!eventos?.length) {
    return null;
  }

  const topReasons = buildTopReasons(
    eventos,
    signals
  );

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Recomendado para você"
        subtitle="Sua IA cultural montou esta seleção"
      />

      <BlurView
        intensity={22}
        tint="dark"
        style={styles.insightCard}
      >
        <LinearGradient
          colors={[
            "rgba(108,92,231,0.18)",
            "rgba(15,15,20,0)",
          ]}
          style={styles.insightGlow}
        />

        <View style={styles.insightHeader}>
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={[
                Colors.primary,
                Colors.primaryDark,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradientBg}
            />

            <Animated.View style={animatedStyle}>
              <MaterialCommunityIcons
                name="creation"
                size={18}
                color={Colors.textPrimary}
              />
            </Animated.View>
          </View>

          <View style={styles.insightCopy}>
            <Text style={styles.insightTitle}>
              Inteligência Cultural
            </Text>

            <Text style={styles.insightSubtitle}>
              Baseado nos seus hábitos recentes
            </Text>
          </View>
        </View>

        <View style={styles.reasonGrid}>
          {topReasons.map((reason) => (
            <View
              key={reason}
              style={styles.reasonPill}
            >
              <MaterialCommunityIcons
                name="star-box"
                size={12}
                color={Colors.primaryLight}
              />

              <Text
                style={styles.reasonText}
                numberOfLines={1}
              >
                {reason}
              </Text>
            </View>
          ))}
        </View>
      </BlurView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={266}
      >
        {eventos.map((item, index) => (
          <View
            key={item.id}
            style={styles.cardWrap}
          >
            <EventCard
              item={item}
              index={index}
              compact
              reason={getRecommendationReason(
                item,
                signals
              )}
              onPress={onPress}
            />

            <View style={styles.recommendationFooter}>
              <View style={styles.matchRow}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={13}
                  color={Colors.warning}
                />

                <Text style={styles.matchText}>
                  Match cultural alto
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.ctaButton}
                onPress={() => onPress(item)}
              >
                <LinearGradient
                  colors={[
                    Colors.primary,
                    Colors.primaryDark,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>
                    Explorar
                  </Text>

                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={16}
                    color={Colors.textPrimary}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function buildTopReasons(
  eventos = [],
  signals = {}
) {
  const reasons = [];

  eventos.slice(0, 6).forEach((evento) => {
    const reason =
      getRecommendationReason(
        evento,
        signals
      );

    if (
      reason &&
      !reasons.includes(reason)
    ) {
      reasons.push(reason);
    }
  });

  return reasons.slice(0, 4);
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },

  insightCard: {
    marginHorizontal: 18,
    marginBottom: 22,

    borderRadius: 28,
    padding: 18,

    overflow: "hidden",

    backgroundColor: Colors.glass,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  insightGlow: {
    ...StyleSheet.absoluteFillObject,
  },

  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconWrap: {
    width: 44,
    height: 44,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.primary,

    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 8,

    overflow: "visible",
  },

  iconGradientBg: {
    position: "absolute",

    width: 52,
    height: 52,

    borderRadius: 16,

    top: -4,
    left: -4,
  },

  insightCopy: {
    flex: 1,
    marginLeft: 14,
  },

  insightTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },

  insightSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },

  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
  },

  reasonPill: {
    flexDirection: "row",
    alignItems: "center",

    maxWidth: "100%",

    paddingHorizontal: 12,
    paddingVertical: 9,

    borderRadius: 18,

    backgroundColor: Colors.overlayLight,

    borderWidth: 1,
    borderColor: Colors.glassBorder,

    marginRight: 8,
    marginBottom: 8,
  },

  reasonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  row: {
    paddingHorizontal: 18,
    paddingRight: 28,
  },

  cardWrap: {
    width: 250,
    marginRight: 16,
  },

  recommendationFooter: {
    marginTop: -4,
    marginBottom: 4,
    paddingHorizontal: 6,
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  matchText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  ctaButton: {
    borderRadius: 18,
    overflow: "hidden",
  },

  ctaGradient: {
    height: 46,

    borderRadius: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  ctaText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginRight: 6,
  },
});