import React, { memo, useCallback, useMemo } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Extrapolation,
  FadeInRight,
  interpolate,
  useAnimatedScrollHandler,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Ajuste estratégico das dimensões mantendo proporção ideal de cinema/Netflix
const CARD_WIDTH = SCREEN_WIDTH * 0.76; 
const CARD_HEIGHT = 400;
const SPACING = 14;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const OVERLAY_COLORS = [
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0.3)",
  "rgba(16, 19, 31, 1)", // Corresponde ao fundo dark da sua identidade
];

const GLOW_COLORS = [
  "rgba(124, 58, 237, 0.15)",
  "transparent",
  "rgba(0,0,0,0.2)",
];

/* -------------------------------------------------------------------------- */
/* BADGES                                   */
/* -------------------------------------------------------------------------- */

const ScoreBadge = memo(({ score }) => (
  <View style={styles.scoreBadge}>
    <MaterialCommunityIcons name="trending-up" size={14} color="#FFF" />
    <Text style={styles.scoreText}>{Math.round(score ?? 0)}</Text>
  </View>
));

const CategoryBadge = memo(({ category }) => (
  <View style={styles.categoryBadge}>
    <Text style={styles.categoryText}>{category}</Text>
  </View>
));

const DistanceBadge = memo(({ distance }) => {
  if (!distance) return null;
  return (
    <View style={styles.distanceBadge}>
      <MaterialCommunityIcons name="map-marker" size={12} color="#C084FC" />
      <Text style={styles.distanceText}>{formatarDistancia(distance)}</Text>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* HERO CARD                                 */
/* -------------------------------------------------------------------------- */

const HeroCard = memo(function HeroCard({ item, index, scrollX, onPress }) {
  
  // MOTOR DE ANIMAÇÃO NETFLIX: Escala sutil e elevação centralizada
  const animatedStyle = useAnimatedStyle(() => {
    const sizeIndex = CARD_WIDTH + SPACING;
    const inputRange = [
      (index - 1) * sizeIndex,
      index * sizeIndex,
      (index + 1) * sizeIndex,
    ];

    // O card ativo fica em escala 1, os adjacentes encolhem sutilmente para 0.9
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP
    );

    // Ajuste fino para manter a linha de base reta sem achatar elementos
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [10, 0, 10],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { scale },
        { translateY }
      ],
    };
  });

  // Efeito parallax na imagem de fundo ao rolar lateralmente
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const sizeIndex = CARD_WIDTH + SPACING;
    const inputRange = [
      (index - 1) * sizeIndex,
      index * sizeIndex,
      (index + 1) * sizeIndex,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [1.1, 1, 1.1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  const countdown = useMemo(() => getCountdownInfo(item), [item]);
  const ticketSignal = useMemo(() => getTicketSignal(item), [item]);

  return (
    <Animated.View
      entering={Platform.OS !== "web" ? FadeInRight.delay(index * 100).duration(600) : undefined}
      style={[styles.heroCard, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.fill}
        onPress={() => onPress?.(item)}
      >
        <Animated.View style={[styles.imageWrapper, imageAnimatedStyle]}>
          <Image
            source={item?.imagem || item?.imagemEvento}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        </Animated.View>

        <LinearGradient colors={OVERLAY_COLORS} style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={GLOW_COLORS} style={StyleSheet.absoluteFillObject} />

        {/* TOP AREA */}
        <View style={styles.topArea}>
          <EventSignalPill countdown={countdown} ticketSignal={ticketSignal} />
          <ScoreBadge score={item?.score || item?.likes} />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <CategoryBadge category={item?.categoria || "Cultura"} />
            <DistanceBadge distance={item?.distancia} />
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {item?.titulo || item?.tituloEvento}
          </Text>

          <Text style={styles.location} numberOfLines={1}>
            {item?.local || item?.localEvento}
          </Text>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Em alta agora</Text>
            </View>

            <View style={styles.arrowButton}>
              <MaterialCommunityIcons name="arrow-top-right" size={20} color="#FFF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function TrendingCarousel({ eventos = [], scrollX, onPress }) {
  const onAnimatedScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderItem = useCallback(
    ({ item, index }) => (
      <HeroCard item={item} index={index} scrollX={scrollX} onPress={onPress} />
    ),
    [onPress, scrollX]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  if (!eventos?.length) return null;

  return (
    <View style={styles.wrapper}>
      <AnimatedFlatList
        data={eventos}
        horizontal
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onScroll={onAnimatedScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        disableIntervalMomentum
        overScrollMode="never"
        removeClippedSubviews
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        contentContainerStyle={styles.container}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + SPACING,
          offset: (CARD_WIDTH + SPACING) * index,
          index,
        })}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                  */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  wrapper: { marginTop: 4 },
  container: { paddingHorizontal: 20, paddingBottom: 16 },
  heroCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: SPACING,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: Colors?.surface || "#18122B",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  fill: { flex: 1 },
  imageWrapper: { width: "100%", height: "100%", position: "absolute" },
  heroImage: { width: "100%", height: "100%", backgroundColor: "#10131F" },
  topArea: { position: "absolute", top: 16, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 10 },
  content: { position: "absolute", left: 20, right: 20, bottom: 20, zIndex: 10 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { color: "#FFF", fontSize: 24, lineHeight: 28, fontWeight: "900", letterSpacing: -0.5 },
  location: { marginTop: 6, color: "rgba(255, 255, 255, 0.6)", fontSize: 13, fontWeight: "600" },
  footer: { marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveRow: { flexDirection: "row", alignItems: "center" },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginRight: 6 },
  liveText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  arrowButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  
  // BADGES REESTILIZADAS
  scoreBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 34, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  scoreText: { marginLeft: 5, color: "#FFF", fontSize: 12, fontWeight: "900" },
  categoryBadge: { paddingHorizontal: 12, height: 34, justifyContent: "center", borderRadius: 12, backgroundColor: "rgba(124, 58, 237, 0.2)", borderWidth: 1, borderColor: "rgba(124, 58, 237, 0.3)" },
  categoryText: { color: "#FFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.3 },
  distanceBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 34, borderRadius: 12, backgroundColor: "rgba(15,15,20,0.85)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  distanceText: { marginLeft: 4, color: "#FFF", fontSize: 11, fontWeight: "800" },
});