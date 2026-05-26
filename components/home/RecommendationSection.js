/**
 * RecommendationSection  —  Seção "Para você" na Home
 *
 * Alterações v2:
 *  • Estado vazio elegante quando o perfil ainda não tem dados suficientes
 *  • Pills de afinidade dinâmicos (top categorias + locais do usuário)
 *  • Fallback gracioso para popularidade quando profileStrength < 20
 *  • Match score visual proporcional à afinidade calculada
 *  • Animação de entrada escalonada por card (stagger)
 */

import React, { useEffect, useMemo } from "react";
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
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import EventCard from "./EventCard";
import SectionHeader from "./SectionHeader";
import { useTheme } from "../../context/ThemeContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import {
  getProfileStrength,
  getRecommendationReason,
  getTopAffinities,
} from "./homeUtils";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RecommendationSection({
  eventos = [],
  signals = {},
  loading = false,
  onPress,
}) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";

  const rotationAnim = useSharedValue(0);

  useEffect(() => {
    rotationAnim.value = withRepeat(
      withTiming(360, { duration: 6000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationAnim.value}deg` }],
  }));

  // Quão rico é o perfil do usuário (0-100)
  const profileStrength = useMemo(
    () => getProfileStrength(signals),
    [signals]
  );

  // Top affinidades para os pills
  const { topCategorias, topLocais } = useMemo(
    () => getTopAffinities(signals, 3),
    [signals]
  );

  // Pills de insight construídos dinamicamente
  const insightPills = useMemo(() => {
    const pills = [];
    topCategorias.forEach((cat) => pills.push(`✦ ${cat}`));
    topLocais.slice(0, 1).forEach((local) => pills.push(`📍 ${local}`));
    if (signals.likedSet?.size > 0)
      pills.push(`♥ ${signals.likedSet.size} curtidas`);
    return pills.slice(0, 4);
  }, [topCategorias, topLocais, signals]);

  // Estado de loading
  if (loading) {
    return <RecommendationSkeleton />;
  }

  // Perfil sem dados: não exibe a seção (evita recomendação genérica com rótulo personalizado)
  if (!eventos?.length || profileStrength < 15) {
    return <EmptyProfileState profileStrength={profileStrength} />;
  }

  const subtitleText =
    profileStrength >= 50
      ? "Baseado no seu histórico e preferências"
      : "Baseado nas suas interações recentes";

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Para você"
        subtitle={subtitleText}
      />

      {/* CARD DE INSIGHT DO PERFIL */}
      <Animated.View
        layout={LinearTransition.springify()}
        style={styles.insightCardOuter}
        entering={FadeInDown.delay(100).springify()}
      >
        <BlurView intensity={30} tint={blurTint} style={styles.insightCard}>
          <LinearGradient
            colors={[`${colors.primary}26`, "transparent"]}
            style={styles.insightGlow}
          />

          <View style={styles.insightHeader}>
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradientBg}
              />
              <Animated.View style={animatedStyle}>
                <MaterialCommunityIcons name="creation" size={18} color="#FFF" />
              </Animated.View>
            </View>

            <View style={styles.insightCopy}>
              <Text style={styles.insightTitle}>Inteligência Cultural</Text>
              <Text style={styles.insightSubtitle}>
                {signals.historySummary || subtitleText}
              </Text>
            </View>

            {/* Indicador de força do perfil */}
            <ProfileStrengthBadge strength={profileStrength} />
          </View>

          {/* PILLS DE AFINIDADE DO USUÁRIO */}
          {insightPills.length > 0 && (
            <View style={styles.reasonGrid}>
              {insightPills.map((pill) => (
                <View key={pill} style={styles.reasonPill}>
                  <Text style={styles.reasonText} numberOfLines={1}>
                    {pill}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </BlurView>
      </Animated.View>

      {/* CARROSSEL HORIZONTAL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={266}
      >
        {eventos.map((item, index) => {
          const reason = getRecommendationReason(item, signals);
          const matchScore = calcMatchPercent(item, signals);

          return (
            <Animated.View
              key={item?.id || String(index)}
              style={styles.cardWrap}
              entering={FadeInDown.delay(index * 60).springify()}
            >
              <EventCard
                item={item}
                index={index}
                compact
                reason={reason}
                onPress={onPress}
              />

              {/* RODAPÉ DO CARD COM MATCH CULTURAL */}
              <View style={styles.recommendationFooter}>
                <View style={styles.matchRow}>
                  <MatchBar percent={matchScore} />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.ctaButton}
                  onPress={() => onPress?.(item)}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
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
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ProfileStrengthBadge({ strength }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);

  const label = strength >= 70 ? "Perfil rico" : strength >= 40 ? "Em evolução" : "Novo";
  const color = strength >= 70 ? colors.success : colors.warning;

  return (
    <View style={[styles.strengthBadge, { borderColor: color }]}>
      <Text style={[styles.strengthText, { color }]}>{label}</Text>
    </View>
  );
}

function MatchBar({ percent }) {
  const styles = useThemedStyles(createThemedScreenStyles);
  const filled = Math.round((percent / 100) * 5);
  return (
    <View style={styles.matchBarRow}>
      <MaterialCommunityIcons name="lightning-bolt" size={13} color="#FFD166" />
      <Text style={styles.matchLabel}>Match</Text>
      <View style={styles.matchDots}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.matchDot,
              i < filled && styles.matchDotFilled,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function RecommendationSkeleton() {
  const styles = useThemedStyles(createThemedScreenStyles);

  return (
    <View style={styles.container}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonCard} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.cardWrap, styles.skeletonItem]} />
        ))}
      </ScrollView>
    </View>
  );
}

function EmptyProfileState({ profileStrength }) {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";

  // Perfil zerado: não renderiza nada (a seção de Destaques já cobre)
  if (profileStrength === 0) return null;

  // Perfil com algum dado mas abaixo do threshold: mostra dica
  return (
    <Animated.View
      style={styles.emptyContainer}
      entering={FadeInDown.springify()}
    >
      <BlurView intensity={20} tint={blurTint} style={styles.emptyCard}>
        <MaterialCommunityIcons name="creation" size={28} color="#8B5CF6" />
        <Text style={styles.emptyTitle}>Descubra sua curadoria pessoal</Text>
        <Text style={styles.emptySubtitle}>
          Curta eventos e explore a cidade para ativar recomendações personalizadas só para você.
        </Text>
      </BlurView>
    </Animated.View>
  );
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Converte a afinidade do evento em um percentual de 0-100 para a barra de match.
 * Não usa scoreRecommendation para evitar recalcular o sort — apenas a afinidade direta.
 */
function calcMatchPercent(evento, signals) {
  if (!signals) return 20;

  const cat = signals.categories?.[evento.categoria] || 0;
  const place = signals.places?.[evento.local] || 0;
  const liked = signals.likedSet?.has(evento.id) ? 15 : 0;
  const trending = evento.trending ? 10 : 0;

  // Normaliza para 0-100 (teto empírico de ~50 pontos de afinidade)
  const raw = cat * 3 + place * 2 + liked + trending;
  return Math.min(100, Math.round((raw / 50) * 100));
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    marginTop: 24,
  },
  insightCardOuter: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.glassBorder,
  },
  insightCard: {
    padding: 16,
    backgroundColor: c.glass,
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
    color: c.textPrimary,
    fontSize: 17,
    fontWeight: "bold",
  },
  insightSubtitle: {
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: "700",
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
    backgroundColor: c.overlayLight,
    borderWidth: 1,
    borderColor: c.glassBorder,
  },
  reasonText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: "600",
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
    marginBottom: 10,
  },
  matchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  matchLabel: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  matchDots: {
    flexDirection: "row",
    gap: 3,
    marginLeft: 4,
  },
  matchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  matchDotFilled: {
    backgroundColor: "#FFD166",
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
    color: c.onPrimary,
    fontSize: 14,
    fontWeight: "bold",
  },
  // Empty state
  emptyContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  emptyTitle: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    color: c.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
  // Skeleton
  skeletonHeader: {
    height: 20,
    width: 160,
    borderRadius: 10,
    backgroundColor: c.glass,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  skeletonCard: {
    height: 90,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: c.overlayLight,
    marginBottom: 16,
  },
  skeletonItem: {
    height: 240,
    borderRadius: 20,
    backgroundColor: c.overlayLight,
  },
});
}
