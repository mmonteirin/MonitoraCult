import React, { useEffect } from "react";
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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  LinearTransition,
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

  useEffect(() => {
    // Loop infinito seguro e performático para o ícone de faísca/criação da IA
    rotationAnim.value = withRepeat(
      withTiming(360, { duration: 6000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationAnim.value}deg` }],
  }));

  if (!eventos?.length) {
    return null;
  }

  const topReasons = buildTopReasons(eventos, signals);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Recomendado para você"
        subtitle="Sua IA cultural montou esta seleção"
      />

      {/* CARD DE INSIGHT DO MATCH DA IA */}
      <Animated.View layout={LinearTransition.springify()} style={styles.insightCardOuter}>
        <BlurView intensity={30} tint="dark" style={styles.insightCard}>
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.15)", "rgba(16, 19, 31, 0)"]}
            style={styles.insightGlow}
          />

          <View style={styles.insightHeader}>
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={[Colors?.primary || "#7C3AED", "#5B21B6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradientBg}
              />
              <Animated.View style={animatedStyle}>
                <MaterialCommunityIcons
                  name="creation"
                  size={18}
                  color="#FFF"
                />
              </Animated.View>
            </View>

            <View style={styles.insightCopy}>
              <Text style={styles.insightTitle}>Inteligência Cultural</Text>
              <Text style={styles.insightSubtitle}>Baseado nos seus hábitos e buscas recentes</Text>
            </View>
          </View>

          {/* GRID DE JUSTIFICATIVAS DA IA */}
          <View style={styles.reasonGrid}>
            {topReasons.map((reason) => (
              <View key={reason} style={styles.reasonPill}>
                <MaterialCommunityIcons
                  name="sparkles"
                  size={12}
                  color="#C084FC"
                />
                <Text style={styles.reasonText} numberOfLines={1}>
                  {reason}
                </Text>
              </View>
            ))}
          </View>
        </BlurView>
      </Animated.View>

      {/* CARROSSEL HORIZONTAL DE EVENTOS RECOMENDADOS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={266}
      >
        {eventos.map((item, index) => (
          <View key={item?.id || String(index)} style={styles.cardWrap}>
            <EventCard
              item={item}
              index={index}
              compact
              reason={getRecommendationReason(item, signals)}
              onPress={onPress}
            />

            {/* DECORAÇÃO INFERIOR DO MATCH CULTURAL */}
            <View style={styles.recommendationFooter}>
              <View style={styles.matchRow}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={13}
                  color="#FFD166"
                />
                <Text style={styles.matchText}>Match cultural alto</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.ctaButton}
                onPress={() => onPress?.(item)}
              >
                <LinearGradient
                  colors={[Colors?.primary || "#7C3AED", "#5B21B6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>Explorar</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={16}
                    color="#FFF"
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

function buildTopReasons(eventos = [], signals = {}) {
  const reasons = [];
  eventos.slice(0, 6).forEach((evento) => {
    if (!evento) return;
    const reason = getRecommendationReason(evento, signals);
    if (reason && !reasons.includes(reason)) {
      reasons.push(reason);
    }
  });
  return reasons.slice(0, 4);
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  insightCardOuter: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  insightCard: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
  },
  insightGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  insightCopy: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  insightSubtitle: {
    color: Colors?.textSecondary || "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    gap: 6,
  },
  reasonPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  reasonText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  row: {
    paddingHorizontal: 16,
    paddingRight: 24,
  },
  cardWrap: {
    width: 250,
    marginRight: 14,
  },
  recommendationFooter: {
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  matchText: {
    color: Colors?.textSecondary || "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaGradient: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});