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
  withSpring,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../styles/Colors";
import { getEventos } from "../services/mapaCulturalService";
import { useBuscaGlobal } from "../hooks/useBuscaGlobal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Dimensões calibradas para o efeito de destaque cinema/Netflix
const CARD_WIDTH = SCREEN_WIDTH * 0.76;
const CARD_HEIGHT = 440;
const SPACING = 14;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const DEFAULT_IMAGE = "https://placehold.co/600x400?text=Evento";

/* -------------------------------------------------------------------------- */
/* COMPONENTE CARD ANIMAÇÃO                      */
/* -------------------------------------------------------------------------- */
const SearchHeroCard = React.memo(({ item, index, scrollX, onNavigate, setModalMessage, setModalVisible }) => {
  
  const animatedStyle = useAnimatedStyle(() => {
    const sizeIndex = CARD_WIDTH + SPACING;
    const inputRange = [
      (index - 1) * sizeIndex,
      index * sizeIndex,
      (index + 1) * sizeIndex,
    ];

    // Card centralizado assume escala 1, vizinhos encolhem suavemente para 0.92
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolation.CLAMP
    );

    // Deslocamento vertical sutil para aumentar a percepção tridimensional
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [12, 0, 12],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { scale },
        { translateY },
      ],
    };
  });

  const abrirEvento = () => {
    if (item.origem === "mapaCultural") {
      setModalMessage(
        "Este evento pertence ao Mapa Cultural. Procure mais informações no portal oficial."
      );
      setModalVisible(true);
      return;
    }

    onNavigate?.(item.original);
  };

  return (
    <Animated.View
      entering={Platform.OS !== "web" ? FadeInRight.delay(index * 80).duration(600) : undefined}
      style={[styles.card, animatedStyle]}
    >
      <TouchableOpacity activeOpacity={0.94} style={styles.fill} onPress={abrirEvento}>
        {item.possuiImagem === false ? (
          <ImageBackground
            source={require("../assets/fundoTelaLogin.png")}
            style={styles.cardImage}
            resizeMode="cover"
          >
            <LinearGradient colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.90)"]} style={styles.noImageOverlay}>
              <MaterialCommunityIcons name="image-off-outline" size={42} color="#FFF" />
              <Text style={styles.noImageText}>Imagem não disponível</Text>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <Image source={{ uri: item.imagem }} style={styles.cardImage} />
        )}

        <LinearGradient colors={["transparent", "rgba(16, 19, 31, 0.98)"]} style={styles.overlay} />

        <View style={styles.cardContent}>
          <BlurView intensity={40} tint="dark" style={styles.badge}>
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
              <MaterialCommunityIcons name="map-marker" size={15} color="#FFF" />
              <Text numberOfLines={1} style={styles.location}>
                {item.local}
              </Text>
            </View>

            {item.origem === "app" && (
              <View style={styles.metricsRow}>
                <View style={styles.metricBadge}>
                  <MaterialCommunityIcons name="heart" size={13} color="#FF4D6D" />
                  <Text style={styles.metricText}>{item.likes ?? 0}</Text>
                </View>

                <View style={styles.metricBadge}>
                  <MaterialCommunityIcons name="eye" size={13} color="#60A5FA" />
                  <Text style={styles.metricText}>{item.views ?? 0}</Text>
                </View>

                <View style={styles.metricBadge}>
                  <MaterialCommunityIcons name="star" size={13} color="#FFD166" />
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
});

/* -------------------------------------------------------------------------- */
/* COMPONENTE PRINCIPAL                          */
/* -------------------------------------------------------------------------- */
export default function TelaBusca({ navigation }) {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [eventos, setEventos] = useState([]);
  const [categoria, setCategoria] = useState("Todos");
  const [filtroData, setFiltroData] = useState("todos");
  const [filtroPreco, setFiltroPreco] = useState("todos");
  const [localizacao, setLocalizacao] = useState("");
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Shared Value reanimado compartilhado com o manipulador de rolagem do FlatList
  const scrollX = useSharedValue(0);

  const onAnimatedScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    carregarEventosMapa();
  }, []);

  async function carregarEventosMapa() {
    try {
      const response = await getEventos();
      const listaMapa = Array.isArray(response) ? response : response?.data || response?.results || [];

      const tratadosMapa = listaMapa.map((item, index) => {
        const imagem = item?.image?.url || item?.files?.header?.url || null;
        return {
          id: item.id || `mapa-${index}`,
          titulo: item.name || "Evento Público",
          descricao: item?.shortDescription || item?.description || "Evento cultural público.",
          imagem: imagem || DEFAULT_IMAGE,
          local: item?.location?.name || "Local não informado",
          categoria: "Eventos Públicos",
          dataEvento: item?.startDate || item?.dataEvento || null,
          gratuito: true,
          preco: 0,
          likes: 0,
          views: 0,
          score: 70,
          origem: "mapaCultural",
          possuiImagem: !!imagem,
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
  } = useBuscaGlobal({ query, categoria, data: filtroData, localizacao, preco: filtroPreco }, eventos);

  useEffect(() => {
    setLoading(loadingBusca);
  }, [loadingBusca]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      salvarBusca(query, { categoria, data: filtroData, localizacao, preco: filtroPreco });
    }, 650);
    return () => clearTimeout(timeout);
  }, [query, categoria, filtroData, localizacao, filtroPreco, salvarBusca]);

  const categorias = useMemo(() => {
    const lista = [...(eventosFirestore || []), ...(eventos || [])].map((e) => e.categoria);
    return ["Todos", ...new Set(lista)];
  }, [eventos, eventosFirestore]);

  const trending = (eventosFiltrados || []).slice(0, 5);

  const renderSearchItem = useCallback(({ item, index }) => (
    <SearchHeroCard
      item={item}
      index={index}
      scrollX={scrollX}
      setModalMessage={setModalMessage}
      setModalVisible={setModalVisible}
      onNavigate={(originalEvent) => navigation.navigate("Detalhes", { evento: originalEvent })}
    />
  ), [navigation, scrollX]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
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
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#18122B", "#10131F", Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={styles.title}>Descobrir</Text>
          <Text style={styles.subtitle}>Explore experiências únicas e culturais ✨</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View style={styles.searchRow}>
            <BlurView intensity={45} tint="dark" style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={22} color={Colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar eventos ou editais..."
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </BlurView>

            <TouchableOpacity style={styles.filterButton} onPress={() => setFiltrosVisible(true)}>
              <MaterialCommunityIcons name="tune-variant" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* CARROSSEL DE CATEGORIAS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {(categorias || []).map((item) => {
            const ativo = categoria === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.categoryBtn, ativo && styles.categoryBtnActive]}
                onPress={() => setCategoria(item)}
              >
                <Text style={[styles.categoryText, ativo && styles.categoryTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* METRICS ROW */}
        <Animated.View entering={FadeIn.delay(250)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-star" size={22} color={Colors.primary} />
            <Text style={styles.statValue}>{(eventosFiltrados || []).length}</Text>
            <Text style={styles.statLabel}>Resultados</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={22} color="#FF7849" />
            <Text style={styles.statValue}>{(trending || []).length}</Text>
            <Text style={styles.statLabel}>Em alta</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="shape" size={22} color="#8B5CF6" />
            <Text style={styles.statValue}>{Math.max(0, (categorias || []).length - 1)}</Text>
            <Text style={styles.statLabel}>Categorias</Text>
          </View>
        </Animated.View>

        {/* SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Eventos</Text>
            <Text style={styles.sectionSubtitle}>Seleções culturais filtradas em tempo real</Text>
          </View>
          <Text style={styles.sectionCount}>{(eventosFiltrados || []).length} achados</Text>
        </View>

        {/* CARROSSEL HORIZONTAL FORMATO NETFLIX REESTRUTURADO */}
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

      {/* MODAL DE FILTROS */}
      <Modal visible={filtrosVisible} transparent animationType="slide" onRequestClose={() => setFiltrosVisible(false)}>
        <View style={styles.sheetOverlay}>
          <BlurView intensity={70} tint="dark" style={styles.sheet}>
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
                  <TouchableOpacity key={value} style={[styles.sheetChip, ativo && styles.sheetChipActive]} onPress={() => setFiltroData(value)}>
                    <Text style={[styles.sheetChipText, ativo && { color: "#FFF" }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sheetLabel}>Localização geográfica</Text>
            <TextInput
              value={localizacao}
              onChangeText={setLocalizacao}
              placeholder="Ex: Aldeota, Mondubim, Centro..."
              placeholderTextColor={Colors.textMuted}
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
                  <TouchableOpacity key={value} style={[styles.sheetChip, ativo && styles.sheetChipActive]} onPress={() => setFiltroPreco(value)}>
                    <Text style={[styles.sheetChipText, ativo && { color: "#FFF" }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={() => setFiltrosVisible(false)}>
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* MODAL GLOBAIS DE ALERTAS */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modal}>
            <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#FF4D6D" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Informação</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  title: { color: "#FFF", fontSize: 32, fontWeight: "bold" },
  subtitle: { color: Colors.textSecondary, marginTop: 4, fontSize: 14 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 54, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  input: { flex: 1, marginLeft: 10, color: "#FFF", fontSize: 15 },
  filterButton: { width: 54, height: 54, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  
  carouselContainer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 },
  categories: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  categoryBtn: { backgroundColor: Colors.surface, paddingHorizontal: 16, height: 38, justifyContent: "center", borderRadius: 14, marginRight: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  categoryBtnActive: { backgroundColor: Colors.primary },
  categoryText: { color: Colors.textSecondary, fontWeight: "600", fontSize: 13 },
  categoryTextActive: { color: "#FFF", fontWeight: "700" },
  
  statsRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 14, gap: 10 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 20, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
  statValue: { color: "#FFF", fontSize: 20, fontWeight: "bold", marginTop: 6 },
  statLabel: { color: Colors.textSecondary, marginTop: 4, fontSize: 12, fontWeight: "500" },
  
  sectionHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: "#FFF", fontSize: 24, fontWeight: "bold" },
  sectionSubtitle: { color: Colors.textSecondary, marginTop: 2, fontSize: 13 },
  sectionCount: { color: Colors.textMuted, fontSize: 12, fontWeight: "500" },
  
  fill: { flex: 1 },
  card: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 28, overflow: "hidden", marginRight: SPACING, backgroundColor: Colors.surface, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  cardImage: { width: "100%", height: "100%", position: "absolute" },
  noImageOverlay: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  noImageText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
  overlay: { ...StyleSheet.absoluteFillObject },
  cardContent: { position: "absolute", left: 16, right: 16, bottom: 16, zIndex: 10 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, height: 26, justifyContent: "center", borderRadius: 10, overflow: "hidden", marginBottom: 12 },
  badgeText: { color: "#FFF", fontWeight: "700", fontSize: 11 },
  cardTitle: { color: "#FFF", fontSize: 22, fontWeight: "bold", lineHeight: 26 },
  cardDescription: { color: "rgba(255,255,255,0.65)", marginTop: 8, lineHeight: 18, fontSize: 13 },
  footer: { marginTop: 14 },
  locationRow: { flexDirection: "row", alignItems: "center" },
  location: { color: "#FFF", marginLeft: 4, flex: 1, fontSize: 13, fontWeight: "500" },
  metricsRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  metricBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 10, height: 28, borderRadius: 10 },
  metricText: { color: "#FFF", marginLeft: 4, fontSize: 12, fontWeight: "700" },
  
  sheetOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 16 },
  sheetTitle: { color: "#FFF", fontSize: 22, fontWeight: "bold", marginBottom: 18 },
  sheetLabel: { color: "#FFF", fontSize: 14, fontWeight: "700", marginBottom: 10, marginTop: 12 },
  sheetOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sheetChip: { backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 14, height: 38, justifyContent: "center", borderRadius: 14 },
  sheetChipActive: { backgroundColor: Colors.primary },
  sheetChipText: { color: Colors.textSecondary, fontWeight: "600", fontSize: 13 },
  sheetInput: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, paddingHorizontal: 14, height: 48, color: "#FFF", fontSize: 14 },
  applyButton: { backgroundColor: Colors.primary, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginTop: 24 },
  applyButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  
  loadingContainer: { flex: 1, padding: 20, paddingTop: 60 },
  fakeHero: { width: "100%", height: 110, borderRadius: 20, backgroundColor: "#1A1B23", marginBottom: 20 },
  fakeCard: { width: "100%", height: 240, borderRadius: 24, marginBottom: 20, backgroundColor: "#1A1B23" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)", padding: 24 },
  modal: { width: "100%", borderRadius: 24, padding: 24, overflow: "hidden", alignItems: "center" },
  modalTitle: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  modalText: { color: "rgba(255,255,255,0.7)", marginTop: 10, marginBottom: 20, textAlign: "center", lineHeight: 20, fontSize: 14 },
  modalButton: { backgroundColor: Colors.primary, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", width: "100%" },
  modalButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});