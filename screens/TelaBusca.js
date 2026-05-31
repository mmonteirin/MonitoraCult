import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
  ScrollView,
  TextInput,
  StatusBar,
  ImageBackground,
  FlatList,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getCategoriaMapaCultural,
  getDescricaoMapaCultural,
  getEventos,
  getTituloMapaCultural,
} from "../services/mapaCulturalService";
import { useBuscaGlobal } from "../hooks/useBuscaGlobal";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { Metrics } from "../styles/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const extrairDataDaDescricao = (descricao) => {
  if (!descricao) return null;

  const padroes = [
    /(\d{2})\/(\d{2})\/(\d{4})/g,
    /(\d{2})\/(\d{2})\/(\d{2})/g,
    /(\d{1,2})\sde\s(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\sde\s(\d{4})/gi,
  ];

  for (const padrao of padroes) {
    const match = padrao.exec(descricao);
    if (match) {
      if (match.length === 4) {
        const [, dia, mes, ano] = match;
        const meses = {
          janeiro: "01",
          fevereiro: "02",
          março: "03",
          abril: "04",
          maio: "05",
          junho: "06",
          julho: "07",
          agosto: "08",
          setembro: "09",
          outubro: "10",
          novembro: "11",
          dezembro: "12",
        };
        const mesNum = meses[mes.toLowerCase()] || mes;
        const anoCompleto = ano.length === 2 ? `20${ano}` : ano;
        return new Date(`${anoCompleto}-${mesNum}-${dia}`);
      }
    }
  }

  return null;
};

const getImagemPorCategoria = (categoria) => {
  const imagensPorCategoria = {
    Música: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200",
    Shows: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1200",
    Concerto: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200",
    Jazz: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1200",
    Rock: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=1200",
    Samba: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200",
    Forró: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200",
    MPB: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200",
    Clássica: "https://images.unsplash.com/photo-1507838153414-b4b713384ebd?q=80&w=1200",
    Eletrônica: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1200",
    Teatro: "https://images.unsplash.com/photo-1503095392237-43e8e5df8a7f?q=80&w=1200",
    Cinema: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200",
    Dança: "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?q=80&w=1200",
    Literatura: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200",
    Fotografia: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1200",
    Gastronomia: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200",
    Arte: "https://images.unsplash.com/photo-1578926288207-a90a5366759d?q=80&w=1200",
    Esporte: "https://images.unsplash.com/photo-1461896836934-voices-8b1f6a6?q=80&w=1200",
    Festival: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200",
    Exposição: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=1200",
    Cultura: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200",
    "Eventos Públicos": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200",
  };

  for (const [key, url] of Object.entries(imagensPorCategoria)) {
    if (categoria && categoria.toLowerCase().includes(key.toLowerCase())) {
      return url;
    }
  }

  return imagensPorCategoria.Cultura;
};

const CARD_WIDTH = SCREEN_WIDTH * 0.76;
const CARD_HEIGHT = 440;
const SPACING = 14;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200";

const SearchHeroCard = React.memo(
  ({ item, index, scrollX, onNavigate, styles, colors, blurTint }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const sizeIndex = CARD_WIDTH + SPACING;
      const inputRange = [
        (index - 1) * sizeIndex,
        index * sizeIndex,
        (index + 1) * sizeIndex,
      ];

      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.92, 1, 0.92],
        Extrapolation.CLAMP
      );

      const translateY = interpolate(
        scrollX.value,
        inputRange,
        [12, 0, 12],
        Extrapolation.CLAMP
      );

      return {
        transform: [{ scale }, { translateY }],
      };
    });

    const abrirEvento = () => {
      if (item.origem === "mapaCultural") {
        onNavigate?.({ evento: item.original, isPublico: true });
        return;
      }
      onNavigate?.(item.original);
    };

    return (
      <Animated.View
        entering={
          Platform.OS !== "web"
            ? FadeInRight.delay(index * 80).duration(600)
            : undefined
        }
        style={[styles.card, animatedStyle]}
      >
        <TouchableOpacity
          activeOpacity={0.94}
          style={styles.fill}
          onPress={abrirEvento}
        >
          <ImageBackground
            source={{ uri: item.imagem || DEFAULT_IMAGE }}
            style={styles.cardImage}
          >
            <LinearGradient
              colors={[colors.purpleGlow, "transparent"]}
              style={styles.glow}
            />
            <LinearGradient
              colors={["transparent", colors.overlayDark, "rgba(0,0,0,0.96)"]}
              style={styles.overlayCard}
            />
          </ImageBackground>

          <View style={styles.cardContent}>
            <BlurView intensity={40} tint={blurTint} style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.origem !== "app"
                  ? item.categoria
                  : item.gratuito
                  ? `${item.categoria} • Gratuito`
                  : `${item.categoria} • Pago`}
              </Text>
            </BlurView>

            <Text numberOfLines={2} style={styles.cardTitle}>
              {item.titulo}
            </Text>

            <Text numberOfLines={2} style={styles.cardDescription}>
              {item.descricao}
            </Text>

            <View style={styles.footer}>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={15}
                  color={colors.onPrimary}
                />
                <Text numberOfLines={1} style={styles.location}>
                  {item.local}
                </Text>
              </View>

              {item.origem === "app" && (
                <View style={styles.metricsRow}>
                  <View style={styles.metricBadge}>
                    <MaterialCommunityIcons
                      name="heart"
                      size={13}
                      color={Metrics.like}
                    />
                    <Text style={styles.metricText}>{item.likes ?? 0}</Text>
                  </View>

                  <View style={styles.metricBadge}>
                    <MaterialCommunityIcons
                      name="eye"
                      size={13}
                      color={Metrics.view}
                    />
                    <Text style={styles.metricText}>{item.views ?? 0}</Text>
                  </View>

                  <View style={styles.metricBadge}>
                    <MaterialCommunityIcons
                      name="star"
                      size={13}
                      color={Metrics.star}
                    />
                    <Text style={styles.metricText}>
                      {item.totalAvaliacoes && item.totalAvaliacoes > 0
                        ? Number(item.mediaAvaliacoes || 0).toFixed(1)
                        : Math.round(item.score || 0)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

export default function TelaBusca({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createBuscaStyles);
  const blurTint = isDark ? "dark" : "light";
  const statusBarStyle = isDark ? "light-content" : "dark-content";

  const params = route?.params;

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params?.query || "");
  const [eventos, setEventos] = useState([]);
  const [categoria, setCategoria] = useState(params?.categoria || "Todos");
  const [filtroData, setFiltroData] = useState("todos");
  const [filtroPreco, setFiltroPreco] = useState("todos");
  const [localizacao, setLocalizacao] = useState(params?.localizacao || "");
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    if (params) {
      if (params.query !== undefined) setQuery(params.query);
      if (params.categoria !== undefined) setCategoria(params.categoria);
      if (params.localizacao !== undefined) setLocalizacao(params.localizacao);
    }
  }, [params]);

  const scrollX = useSharedValue(0);

  const onAnimatedScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    setEventos([]);
    carregarEventosMapa();
  }, []);

  async function carregarEventosMapa() {
    try {
      const response = await getEventos();
      const listaMapa = Array.isArray(response)
        ? response
        : response?.data || response?.results || [];

      const tratadosMapa = listaMapa.map((item, index) => {
        const occurrence = item?.occurrences?.[0];
        const inicio =
          occurrence?.startDate ||
          occurrence?.startsOn ||
          occurrence?.start;
        let dataEvento = inicio ? new Date(inicio) : null;

        if (!dataEvento || isNaN(dataEvento.getTime())) {
          dataEvento = extrairDataDaDescricao(
            item?.shortDescription || item?.description
          );
        }

        const cat = getCategoriaMapaCultural(item);

        const imagemFinal = getImagemPorCategoria(cat);

        return {
          id: item.id || `mapa-${index}`,
          titulo: getTituloMapaCultural(item, "Evento público"),
          descricao: getDescricaoMapaCultural(item, "Evento cultural público."),
          imagem: imagemFinal,
          local: item?.location?.name || "Local não informado",
          categoria: cat,
          dataEvento,
          data: dataEvento
            ? dataEvento.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Em breve",
          gratuito: true,
          preco: 0,
          likes: 0,
          views: 0,
          score: 70,
          origem: "mapaCultural",
          original: item,
        };
      });

      setEventos(tratadosMapa);
    } catch (error) {
      console.log(error);
      setModalMessage("Erro ao carregar eventos públicos remotos.");
      setModalVisible(true);
    }
  }

  const {
    resultados: eventosFiltrados,
    eventosFirestore,
    loading: loadingBusca,
    salvarBusca,
  } = useBuscaGlobal(
    { query, categoria, data: filtroData, localizacao, preco: filtroPreco },
    eventos
  );

  useEffect(() => {
    setLoading(loadingBusca);
  }, [loadingBusca]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      salvarBusca(query, {
        categoria,
        data: filtroData,
        localizacao,
        preco: filtroPreco,
      });
    }, 650);
    return () => clearTimeout(timeout);
  }, [query, categoria, filtroData, localizacao, filtroPreco, salvarBusca]);

  const categorias = useMemo(() => {
    const lista = [...(eventosFirestore || []), ...(eventos || [])].map(
      (e) => e.categoria
    );
    return ["Todos", ...new Set(lista)];
  }, [eventos, eventosFirestore]);

  const trending = (eventosFiltrados || []).slice(0, 5);

  const headerGradient = useMemo(
    () => [colors.backgroundDeep, colors.backgroundSecondary, colors.background],
    [colors]
  );

  const renderSearchItem = useCallback(
    ({ item, index }) => (
      <SearchHeroCard
        item={item}
        index={index}
        scrollX={scrollX}
        styles={styles}
        colors={colors}
        blurTint={blurTint}
        onNavigate={(data) => {
          if (data.isPublico) {
            navigation.navigate("EventoDetalhesPublico", { evento: data.evento });
          } else {
            navigation.navigate("Detalhes", { evento: data });
          }
        }}
      />
    ),
    [navigation, scrollX, styles, colors, blurTint]
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={statusBarStyle} />
        <View style={styles.loadingContainer}>
          <View style={styles.fakeHero} />
          <View style={styles.fakeCard} />
          <View style={styles.fakeCard} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBarStyle} />

      <LinearGradient
        colors={headerGradient}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={styles.title}>Descobrir</Text>
          <Text style={styles.subtitle}>
            Explore experiências únicas e culturais ✨
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View style={styles.searchRow}>
            <BlurView intensity={45} tint={blurTint} style={styles.searchBox}>
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color={colors.textMuted}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar eventos ou editais..."
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </BlurView>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFiltrosVisible(true)}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={22}
                color={colors.onPrimary}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {(categorias || []).map((item) => {
            const ativo = categoria === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.categoryBtn, ativo && styles.categoryBtnActive]}
                onPress={() => setCategoria(item)}
              >
                <Text
                  style={[styles.categoryText, ativo && styles.categoryTextActive]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Animated.View entering={FadeIn.delay(250)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="calendar-star"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.statValue}>{(eventosFiltrados || []).length}</Text>
            <Text style={styles.statLabel}>Resultados</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="fire"
              size={22}
              color={Metrics.share}
            />
            <Text style={styles.statValue}>{(trending || []).length}</Text>
            <Text style={styles.statLabel}>Em alta</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="shape"
              size={22}
              color={colors.primaryLight}
            />
            <Text style={styles.statValue}>
              {Math.max(0, (categorias || []).length - 1)}
            </Text>
            <Text style={styles.statLabel}>Categorias</Text>
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Eventos</Text>
            <Text style={styles.sectionSubtitle}>
              Seleções culturais filtradas em tempo real
            </Text>
          </View>
          <Text style={styles.sectionCount}>
            {(eventosFiltrados || []).length} achados
          </Text>
        </View>

        <AnimatedFlatList
          data={eventosFiltrados || []}
          horizontal
          renderItem={renderSearchItem}
          keyExtractor={(item) => String(item.id)}
          onScroll={onAnimatedScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          disableIntervalMomentum
          overScrollMode="never"
          removeClippedSubviews
          initialNumToRender={3}
          contentContainerStyle={styles.carouselContainer}
          getItemLayout={(_, index) => ({
            length: CARD_WIDTH + SPACING,
            offset: (CARD_WIDTH + SPACING) * index,
            index,
          })}
        />
      </ScrollView>

      <Modal
        visible={filtrosVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltrosVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <BlurView intensity={70} tint={blurTint} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filtros Avançados</Text>

            <Text style={styles.sheetLabel}>Data cronológica</Text>
            <View style={styles.sheetOptions}>
              {[
                ["todos", "Qualquer data"],
                ["hoje", "Hoje"],
                ["proximos", "Próximos dias"],
                ["fimDeSemana", "Fim de semana"],
              ].map(([value, label]) => {
                const ativo = filtroData === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.sheetChip, ativo && styles.sheetChipActive]}
                    onPress={() => setFiltroData(value)}
                  >
                    <Text
                      style={[
                        styles.sheetChipText,
                        ativo && styles.sheetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sheetLabel}>Localização geográfica</Text>
            <TextInput
              value={localizacao}
              onChangeText={setLocalizacao}
              placeholder="Ex: Aldeota, Mondubim, Centro..."
              placeholderTextColor={colors.textMuted}
              style={styles.sheetInput}
            />

            <Text style={styles.sheetLabel}>Ingresso / Custo</Text>
            <View style={styles.sheetOptions}>
              {[
                ["todos", "Todos"],
                ["gratuito", "Apenas Grátis"],
                ["pago", "Eventos Pagos"],
              ].map(([value, label]) => {
                const ativo = filtroPreco === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.sheetChip, ativo && styles.sheetChipActive]}
                    onPress={() => setFiltroPreco(value)}
                  >
                    <Text
                      style={[
                        styles.sheetChipText,
                        ativo && styles.sheetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setFiltrosVisible(false)}
            >
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint={blurTint} style={styles.modal}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={44}
              color={Metrics.like}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.modalTitle}>Informação</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

function createBuscaStyles(c) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    title: {
      color: c.textPrimary,
      fontSize: 32,
      fontWeight: "bold",
    },
    subtitle: {
      color: c.textSecondary,
      marginTop: 4,
      fontSize: 14,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 20,
    },
    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      height: 54,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    input: {
      flex: 1,
      marginLeft: 10,
      color: c.textPrimary,
      fontSize: 15,
    },
    filterButton: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: c.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    carouselContainer: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      paddingTop: 4,
    },
    categories: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    categoryBtn: {
      backgroundColor: c.surface,
      paddingHorizontal: 16,
      height: 38,
      justifyContent: "center",
      borderRadius: 14,
      marginRight: 8,
      borderWidth: 1,
      borderColor: c.borderLight,
    },
    categoryBtnActive: {
      backgroundColor: c.primary,
    },
    categoryText: {
      color: c.textSecondary,
      fontWeight: "600",
      fontSize: 13,
    },
    categoryTextActive: {
      color: c.onPrimary,
      fontWeight: "700",
    },

    statsRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      marginTop: 14,
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingVertical: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.borderLight,
    },
    statValue: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 6,
    },
    statLabel: {
      color: c.textSecondary,
      marginTop: 4,
      fontSize: 12,
      fontWeight: "500",
    },

    sectionHeader: {
      paddingHorizontal: 20,
      marginTop: 24,
      marginBottom: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 24,
      fontWeight: "bold",
    },
    sectionSubtitle: {
      color: c.textSecondary,
      marginTop: 2,
      fontSize: 13,
    },
    sectionCount: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: "500",
    },

    fill: { flex: 1 },
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 28,
      overflow: "hidden",
      marginRight: SPACING,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    cardImage: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    glow: { ...StyleSheet.absoluteFillObject },
    overlayCard: {
      flex: 1,
      justifyContent: "space-between",
      padding: 18,
    },
    cardContent: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 16,
      zIndex: 10,
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      height: 26,
      justifyContent: "center",
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 12,
    },
    badgeText: {
      color: c.onPrimary,
      fontWeight: "700",
      fontSize: 11,
    },
    cardTitle: {
      color: c.onPrimary,
      fontSize: 22,
      fontWeight: "bold",
      lineHeight: 26,
    },
    cardDescription: {
      color: "rgba(255,255,255,0.65)",
      marginTop: 8,
      lineHeight: 18,
      fontSize: 13,
    },
    footer: { marginTop: 14 },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    location: {
      color: c.onPrimary,
      marginLeft: 4,
      flex: 1,
      fontSize: 13,
      fontWeight: "500",
    },
    metricsRow: {
      flexDirection: "row",
      marginTop: 12,
      gap: 8,
    },
    metricBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.glass,
      paddingHorizontal: 10,
      height: 28,
      borderRadius: 10,
    },
    metricText: {
      color: c.onPrimary,
      marginLeft: 4,
      fontSize: 12,
      fontWeight: "700",
    },

    sheetOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: c.overlayDark,
    },
    sheet: {
      padding: 24,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: "hidden",
    },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.glassStrong,
      alignSelf: "center",
      marginBottom: 16,
    },
    sheetTitle: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 18,
    },
    sheetLabel: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 10,
      marginTop: 12,
    },
    sheetOptions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    sheetChip: {
      backgroundColor: c.glass,
      paddingHorizontal: 14,
      height: 38,
      justifyContent: "center",
      borderRadius: 14,
    },
    sheetChipActive: {
      backgroundColor: c.primary,
    },
    sheetChipText: {
      color: c.textSecondary,
      fontWeight: "600",
      fontSize: 13,
    },
    sheetChipTextActive: {
      color: c.onPrimary,
    },
    sheetInput: {
      backgroundColor: c.glass,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 48,
      color: c.textPrimary,
      fontSize: 14,
    },
    applyButton: {
      backgroundColor: c.primary,
      height: 52,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 24,
    },
    applyButtonText: {
      color: c.onPrimary,
      fontWeight: "bold",
      fontSize: 15,
    },

    loadingContainer: {
      flex: 1,
      padding: 20,
      paddingTop: 60,
    },
    fakeHero: {
      width: "100%",
      height: 110,
      borderRadius: 20,
      backgroundColor: c.surface,
      marginBottom: 20,
    },
    fakeCard: {
      width: "100%",
      height: 240,
      borderRadius: 24,
      marginBottom: 20,
      backgroundColor: c.surface,
    },

    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.overlayStronger,
      padding: 24,
    },
    modal: {
      width: "100%",
      borderRadius: 24,
      padding: 24,
      overflow: "hidden",
      alignItems: "center",
    },
    modalTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: "bold",
    },
    modalText: {
      color: c.textSecondary,
      marginTop: 10,
      marginBottom: 20,
      textAlign: "center",
      lineHeight: 20,
      fontSize: 14,
    },
    modalButton: {
      backgroundColor: c.primary,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    modalButtonText: {
      color: c.onPrimary,
      fontWeight: "bold",
      fontSize: 15,
    },
  });
}
