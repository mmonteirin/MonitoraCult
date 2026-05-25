import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from "react-native";

import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolate,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getEventosApp } from "../services/eventosAppService";
import { Colors } from "../styles/Colors";

const { width } = Dimensions.get("window");

// COMPONENTE MEMOIZADO: Card de Categoria
const CategoryCard = memo(({ item, count, onPress }) => (
  <TouchableOpacity
    style={styles.categoryCard}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <LinearGradient
      colors={[item.cor, "rgba(255,255,255,0.02)"]}
      style={styles.categoryIcon}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={26}
        color="#fff"
      />
    </LinearGradient>

    <Text style={styles.categoryText}>{item.nome}</Text>
    <View style={styles.countBadge}>
      <Text style={styles.categoryCount}>
        {count > 0 ? `${count} ${count === 1 ? 'ativo' : 'ativos'}` : "Nenhum ativo"}
      </Text>
    </View>
  </TouchableOpacity>
));

// COMPONENTE MEMOIZADO: Card de Bairro
const BairroCard = memo(({ bairro, count, onPress }) => (
  <TouchableOpacity
    style={styles.bairroCard}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <View style={styles.bairroInfo}>
      <View style={styles.bairroIconWrapper}>
        <MaterialCommunityIcons name="office-building" size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bairroNome}>{bairro}</Text>
        <Text style={styles.bairroDesc}>
          {count > 0 ? `${count} ${count === 1 ? 'evento ativo' : 'eventos ativos'}` : "Nenhum evento ativo"}
        </Text>
      </View>
    </View>
    <View style={styles.chevronWrapper}>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={Colors.primary}
      />
    </View>
  </TouchableOpacity>
));

export default function TelaExploreCidade({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const routeEventos = route.params?.eventos;

  const [eventos, setEventos] = useState(routeEventos || []);
  const [loading, setLoading] = useState(!routeEventos);

  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const borderOpacity = interpolate(
      scrollY.value,
      [0, 50],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      borderBottomColor: interpolateColor(
        borderOpacity,
        [0, 1],
        ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.08)"]
      ),
    };
  });

  const blurStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  const categorias = useMemo(() => [
    {
      nome: "Música",
      icon: "music",
      cor: "#8B5CF6",
    },
    {
      nome: "Gastronomia",
      icon: "silverware-fork-knife",
      cor: "#F59E0B",
    },
    {
      nome: "Teatro",
      icon: "drama-masks",
      cor: "#06B6D4",
    },
    {
      nome: "Exposições",
      icon: "palette",
      cor: "#EC4899",
    },
  ], []);

  const bairros = useMemo(() => [
    "Praia de Iracema",
    "Benfica",
    "Aldeota",
    "Centro",
  ], []);

  useEffect(() => {
    async function carregarEventos() {
      try {
        const lista = await getEventosApp();
        setEventos(lista);
      } catch (e) {
        console.log("Erro ao carregar eventos no explorador:", e);
      } finally {
        setLoading(false);
      }
    }
    carregarEventos();
  }, []);

  // OTIMIZAÇÃO: Cálculo de contagem em O(N) com HashMap unificado para evitar buscas O(N^2) no render
  const counts = useMemo(() => {
    const categoriaCounts = {};
    const bairroCounts = {};

    eventos.forEach((e) => {
      // Contagem de categoria
      const cat = (e.categoria || "").toLowerCase();
      categorias.forEach((c) => {
        const cNomeLower = c.nome.toLowerCase();
        if (cat.includes(cNomeLower)) {
          categoriaCounts[c.nome] = (categoriaCounts[c.nome] || 0) + 1;
        }
      });

      // Contagem de bairro
      const local = (e.localEvento || e.nomeLocal || e.local || "").toLowerCase();
      bairros.forEach((b) => {
        const bLower = b.toLowerCase();
        if (local.includes(bLower)) {
          bairroCounts[b] = (bairroCounts[b] || 0) + 1;
        }
      });
    });

    return { categoriaCounts, bairroCounts };
  }, [eventos, categorias, bairros]);

  const stats = useMemo(() => {
    const topCategory = Object.entries(counts.categoriaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Cultura";
    const vibe = topCategory.toLowerCase().includes("show") || topCategory.toLowerCase().includes("festival")
      ? "Fortaleza em modo palco 🎸"
      : "Cidade em descoberta cultural 🎨";

    return {
      topCategory,
      vibe,
      clima: "29°C"
    };
  }, [counts.categoriaCounts]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleNavigateCategory = useCallback((nomeCat) => {
    navigation.navigate("Busca", {
      screen: "BuscaHome",
      params: {
        categoria: nomeCat,
        localizacao: "",
        query: "",
      }
    });
  }, [navigation]);

  const handleNavigateBairro = useCallback((nomeBairro) => {
    navigation.navigate("Busca", {
      screen: "BuscaHome",
      params: {
        categoria: "Todos",
        localizacao: nomeBairro,
        query: "",
      }
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Mapeando pulso urbano...</Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.ambientGlow} />

      {/* HEADER STICKY GLASSMORPHIC (ALINHADO E ANIMADO COM TELA INICIO) */}
      <Animated.View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top + 12 },
          headerStyle,
        ]}
      >
        {/* Camada absoluta de Blur que aparece com scroll */}
        <Animated.View style={[StyleSheet.absoluteFill, blurStyle]}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[Colors.backgroundSecondary, "rgba(7, 11, 20, 0.85)"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={handleBack}
          >
            <BlurView intensity={35} tint="dark" style={styles.headerBlur}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color="#fff"
              />
            </BlurView>
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Fortaleza Hoje</Text>
            <Text style={styles.title}>Explorar a Cidade</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 88,
          paddingBottom: 60,
        }}
      >
        {/* CARD DE VISÃO GERAL GLASSMORPHIC (ANIMADO E ALINHADO COM TELA INICIO) */}
        <Animated.View
          entering={FadeInUp.delay(100).springify().damping(15)}
          style={styles.overviewCardOuter}
        >
          <BlurView intensity={25} tint="dark" style={styles.overviewCard}>
            <View style={styles.overviewTop}>
              <View>
                <Text style={styles.overviewLabel}>SUA REGIÃO</Text>
                <Text style={styles.overviewTitle}>Fortaleza</Text>
                <Text style={styles.overviewSub}>Ceará • Brasil</Text>
              </View>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>ATUALIZADO</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="weather-partly-cloudy" size={18} color="#A855F7" />
                <Text style={styles.statNumber}>{stats.clima}</Text>
                <Text style={styles.statLabel}>Clima</Text>
              </View>
              
              <View style={styles.statItemDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="calendar-star" size={18} color="#A855F7" />
                <Text style={styles.statNumber}>{eventos.length}</Text>
                <Text style={styles.statLabel}>Eventos</Text>
              </View>

              <View style={styles.statItemDivider} />

              <View style={styles.statItem}>
                <MaterialCommunityIcons name="music-circle" size={18} color="#A855F7" />
                <Text style={styles.statNumber} numberOfLines={1}>{stats.topCategory}</Text>
                <Text style={styles.statLabel}>Vibe</Text>
              </View>
            </View>

            <View style={styles.vibeContainer}>
              <MaterialCommunityIcons name="heart-pulse" size={16} color="#A855F7" />
              <Text style={styles.vibeText}>{stats.vibe}</Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* CATEGORIAS */}
        <Animated.Text
          entering={FadeInLeft.delay(200).springify()}
          style={styles.sectionTitle}
        >
          Categorias
        </Animated.Text>
        
        <View style={styles.grid}>
          {categorias.map((item, index) => (
            <Animated.View
              key={item.nome}
              entering={FadeInUp.delay(250 + index * 100).springify().damping(16)}
              style={{ width: "48%" }}
            >
              <CategoryCard
                item={item}
                count={counts.categoriaCounts[item.nome] || 0}
                onPress={() => handleNavigateCategory(item.nome)}
              />
            </Animated.View>
          ))}
        </View>

        {/* BAIRROS */}
        <Animated.Text
          entering={FadeInLeft.delay(350).springify()}
          style={styles.sectionTitle}
        >
          Explore Bairros
        </Animated.Text>
        
        {bairros.map((bairro, index) => (
          <Animated.View
            key={bairro}
            entering={FadeInUp.delay(400 + index * 100).springify().damping(16)}
          >
            <BairroCard
              bairro={bairro}
              count={counts.bairroCounts[bairro] || 0}
              onPress={() => handleNavigateBairro(bairro)}
            />
          </Animated.View>
        ))}
      </Animated.ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  ambientGlow: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(168, 85, 247, 0.08)",
    pointerEvents: "none",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 14,
  },
  headerBlur: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  headerCopy: {
    flex: 1,
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
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  overviewCardOuter: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.01)",
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 10,
  },
  overviewCard: {
    padding: 20,
  },
  overviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  overviewLabel: {
    color: "#A855F7",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  overviewTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 2,
  },
  overviewSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginTop: 2,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(168,85,247,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A855F7",
  },
  liveText: {
    color: "#A855F7",
    fontWeight: "800",
    fontSize: 10,
    marginLeft: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingVertical: 12,
    borderRadius: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 5,
  },
  statItemDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  statNumber: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  vibeContainer: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  vibeText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  categoryCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryText: {
    color: Colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  countBadge: {
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryCount: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  bairroCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bairroInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bairroIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(108,92,231,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bairroNome: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  bairroDesc: {
    color: Colors.textMuted,
    marginTop: 3,
    fontSize: 12,
    fontWeight: "500",
  },
  chevronWrapper: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(108,92,231,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
});