/**
 * TelaLocaisVisitados.js
 *
 * Tela do histórico de locais visitados. Acessada via PerfilStack.
 *
 * Seções:
 *  1. Header com stats (total locais, visitas, categoria favorita)
 *  2. Podium dos 3 locais mais frequentados
 *  3. Filtros e ordenação
 *  4. Lista completa com opção de remover
 *
 * Melhorias implementadas:
 *  - Pull to refresh
 *  - Filtro por categoria
 *  - Ordenação (visitas, data, nome)
 *  - Busca por nome
 *  - Toggle favoritos
 *  - Melhor empty state
 */

import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, Layout } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { auth } from "../firebaseConfig";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { removerLocalVisitado } from "../services/localVisitadoService";
import useLocaisVisitados from "../hooks/useLocaisVisitados";

// ─── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { id: "all", label: "Todos", icon: "apps" },
  { id: "show", label: "Shows", icon: "music" },
  { id: "teatro", label: "Teatro", icon: "drama-masks" },
  { id: "arte", label: "Arte", icon: "palette" },
  { id: "gastro", label: "Gastro", icon: "food-fork-drink" },
  { id: "festival", label: "Festival", icon: "party-popper" },
  { id: "esporte", label: "Esporte", icon: "run" },
];

const ORDENACOES = [
  { id: "visitas", label: "Mais Visitados", icon: "sort-descending" },
  { id: "data", label: "Mais Recentes", icon: "calendar-sort-descending" },
  { id: "nome", label: "A-Z", icon: "sort-alphabetical-ascending" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(valor) {
  if (!valor) return "—";
  const date = valor?.toDate ? valor.toDate() : new Date(valor);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" });
}

function iconeCategoria(categoria = "") {
  const c = categoria.toLowerCase();
  if (c.includes("show") || c.includes("música")) return "music";
  if (c.includes("teatro")) return "drama-masks";
  if (c.includes("arte") || c.includes("expo")) return "palette";
  if (c.includes("gastro") || c.includes("comida")) return "food-fork-drink";
  if (c.includes("festival")) return "party-popper";
  if (c.includes("esporte")) return "run";
  return "map-marker";
}

function confirmar(mensagem, callback) {
  if (Platform.OS === "web") {
    if (window.confirm(mensagem)) callback();
  } else {
    Alert.alert("Confirmar", mensagem, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: callback },
    ]);
  }
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function StatCard({ icon, valor, label, color, styles, themeColors, blurTint }) {
  const accent = color ?? themeColors.primary;
  return (
    <BlurView intensity={30} tint={blurTint} style={styles.statCard}>
      <LinearGradient
        colors={[`${accent}22`, "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <MaterialCommunityIcons name={icon} size={20} color={accent} />
      <Text style={styles.statValor}>{valor ?? "—"}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </BlurView>
  );
}

function PodiumCard({ local, posicao, styles, themeColors, blurTint }) {
  const medalColors = ["#FFD166", "#C4C8D4", "#CD7F32"];
  const color = medalColors[posicao] || themeColors.primary;
  const icon = iconeCategoria(local.categoria);

  return (
    <Animated.View
      entering={FadeInDown.delay(posicao * 100).springify()}
      style={styles.podiumCard}
    >
      <BlurView intensity={35} tint={blurTint} style={styles.podiumInner}>
        <LinearGradient
          colors={[`${color}18`, "transparent"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.podiumBadge, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
          <Text style={[styles.podiumPos, { color }]}>#{posicao + 1}</Text>
        </View>
        <View style={[styles.podiumIconCircle, { backgroundColor: `${color}18` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.podiumNome} numberOfLines={2}>
          {local.nome}
        </Text>
        {local.bairro ? (
          <Text style={styles.podiumBairro} numberOfLines={1}>
            {local.bairro}
          </Text>
        ) : null}
        <View style={styles.podiumVisitas}>
          <MaterialCommunityIcons
            name="ticket-confirmation-outline"
            size={13}
            color={color}
          />
          <Text style={[styles.podiumVisitasText, { color }]}>
            {local.visitas}x
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

function LocalCard({ item, index, onRemover, styles, themeColors, blurTint }) {
  const icon = iconeCategoria(item.categoria);
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()} layout={Layout.springify()}>
      <BlurView intensity={30} tint={blurTint} style={styles.card}>
        <LinearGradient
          colors={["rgba(124,58,237,0.10)", "transparent"]}
          style={styles.cardGlow}
        />

        <View style={styles.cardMain}>
          {/* Ícone */}
          <View style={[styles.cardIconWrap, { backgroundColor: `${themeColors.primary}22` }]}>
            <MaterialCommunityIcons name={icon} size={20} color={themeColors.primary} />
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardNome} numberOfLines={2}>
              {item.nome}
            </Text>
            <View style={styles.cardMeta}>
              {item.bairro && (
                <View style={styles.cardMetaBadge}>
                  <MaterialCommunityIcons name="map-marker" size={10} color={themeColors.textMuted} />
                  <Text style={styles.cardMetaText}>{item.bairro}</Text>
                </View>
              )}
              {item.categoria && (
                <View style={styles.cardMetaBadge}>
                  <Text style={styles.cardMetaText}>{item.categoria}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Delete */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() =>
              confirmar("Remover este local do histórico?", () =>
                onRemover(item.id)
              )
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color={themeColors.error}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.cardVisitasBadge}>
            <MaterialCommunityIcons
              name="repeat"
              size={12}
              color={themeColors.primaryLight || "#8B7CFF"}
            />
            <Text style={styles.cardVisitasText}>
              {item.visitas} {item.visitas === 1 ? "visita" : "visitas"}
            </Text>
          </View>

          <Text style={styles.cardData}>
            Última: {formatarData(item.ultimaVisita)}
          </Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

function FilterChip({ label, icon, isActive, onPress, styles, themeColors }) {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        isActive && { backgroundColor: `${themeColors.primary}15`, borderColor: themeColors.primary }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color={isActive ? themeColors.primary : themeColors.textMuted}
      />
      <Text
        style={[
          styles.filterChipText,
          isActive && { color: themeColors.primary, fontWeight: "700" }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SortButton({ label, icon, isActive, onPress, styles, themeColors }) {
  return (
    <TouchableOpacity
      style={[
        styles.sortBtn,
        isActive && { backgroundColor: `${themeColors.primary}15`, borderColor: themeColors.primary }
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color={isActive ? themeColors.primary : themeColors.textMuted}
      />
      <Text
        style={[
          styles.sortBtnText,
          isActive && { color: themeColors.primary, fontWeight: "600" }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function TelaLocaisVisitados() {
  const { colors: themeColors, isDark } = useTheme();
  const styles = useThemedStyles((c) => createThemedScreenStyles(c, isDark));
  const blurTint = isDark ? "dark" : "light";
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;

  const { locais, favoritos, stats, loading, refresh } = useLocaisVisitados(uid);
  const [removendo, setRemovendoId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("all");
  const [ordenacao, setOrdenacao] = useState("visitas");
  const [showFilters, setShowFilters] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleRemover = async (localId) => {
    setRemovendoId(localId);
    await removerLocalVisitado(uid, localId);
    await refresh();
    setRemovendoId(null);
  };

  // Filtrar e ordenar locais
  const locaisFiltrados = useMemo(() => {
    let filtrados = [...locais];

    // Filtro por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtrados = filtrados.filter(
        (item) =>
          item.nome.toLowerCase().includes(query) ||
          (item.bairro && item.bairro.toLowerCase().includes(query)) ||
          (item.categoria && item.categoria.toLowerCase().includes(query))
      );
    }

    // Filtro por categoria
    if (categoriaFiltro !== "all") {
      filtrados = filtrados.filter(
        (item) =>
          item.categoria &&
          item.categoria.toLowerCase().includes(categoriaFiltro.toLowerCase())
      );
    }

    // Ordenação
    filtrados.sort((a, b) => {
      switch (ordenacao) {
        case "visitas":
          return b.visitas - a.visitas;
        case "data":
          const dateA = a.ultimaVisita?.toDate?.() || new Date(a.ultimaVisita || 0);
          const dateB = b.ultimaVisita?.toDate?.() || new Date(b.ultimaVisita || 0);
          return dateB - dateA;
        case "nome":
          return a.nome.localeCompare(b.nome);
        default:
          return 0;
      }
    });

    return filtrados;
  }, [locais, searchQuery, categoriaFiltro, ordenacao]);

  // Favorites from filtered list
  const favoritosFiltrados = useMemo(() => {
    if (categoriaFiltro === "all" && !searchQuery) {
      return favoritos;
    }
    return favoritos.filter(f =>
      locaisFiltrados.some(l => l.id === f.id)
    ).slice(0, 3);
  }, [favoritos, locaisFiltrados, categoriaFiltro, searchQuery]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── HEADER ── */}
      <LinearGradient
        colors={isDark 
          ? [themeColors.surfaceMuted, themeColors.background] 
          : [themeColors.backgroundSecondary, themeColors.background]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Locais Visitados</Text>
            <Text style={styles.subtitle}>Sua jornada cultural</Text>
          </View>

          <TouchableOpacity
            style={styles.filterToggleBtn}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons
              name={showFilters ? "filter-off" : "filter-variant"}
              size={22}
              color={themeColors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatCard
            icon="map-marker-multiple"
            valor={stats.totalLocais}
            label="Locais"
            color={themeColors.primary}
            styles={styles}
            themeColors={themeColors}
            blurTint={blurTint}
          />
          <StatCard
            icon="ticket-confirmation-outline"
            valor={stats.totalVisitas}
            label="Visitas"
            color={themeColors.accentCyan}
            styles={styles}
            themeColors={themeColors}
            blurTint={blurTint}
          />
          <StatCard
            icon="star"
            valor={stats.categoriaMaisVisitada || "—"}
            label="Categoria fav."
            color="#FFD166"
            styles={styles}
            themeColors={themeColors}
            blurTint={blurTint}
          />
          <StatCard
            icon="home-city"
            valor={stats.bairroFavorito || "—"}
            label="Bairro fav."
            color={themeColors.success}
            styles={styles}
            themeColors={themeColors}
            blurTint={blurTint}
          />
        </View>

        {/* FILTERS */}
        {showFilters && (
          <Animated.View entering={FadeInUp} style={styles.filtersContainer}>
            {/* Search */}
            <View style={styles.searchRow}>
              <View style={styles.searchInputWrap}>
                <MaterialCommunityIcons name="magnify" size={18} color={themeColors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar local..."
                  placeholderTextColor={themeColors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={themeColors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Category Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {CATEGORIAS.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  isActive={categoriaFiltro === cat.id}
                  onPress={() => setCategoriaFiltro(cat.id)}
                  styles={styles}
                  themeColors={themeColors}
                />
              ))}
            </ScrollView>

            {/* Sort Options */}
            <View style={styles.sortRow}>
              {ORDENACOES.map((ord) => (
                <SortButton
                  key={ord.id}
                  label={ord.label}
                  icon={ord.icon}
                  isActive={ordenacao === ord.id}
                  onPress={() => setOrdenacao(ord.id)}
                  styles={styles}
                  themeColors={themeColors}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </LinearGradient>

      {/* ── CONTEÚDO ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Carregando locais...</Text>
        </View>
      ) : locais.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <LinearGradient
              colors={[`${themeColors.primary}22`, `${themeColors.primary}08`]}
              style={styles.emptyIconGradient}
            >
              <MaterialCommunityIcons
                name="map-marker-off-outline"
                size={48}
                color={themeColors.primary}
              />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>Nenhum local ainda</Text>
          <Text style={styles.emptyText}>
            Seus locais visitados aparecerão aqui conforme você frequentar eventos e espaços culturais.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyBtnText}>Explorar Eventos</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : locaisFiltrados.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="map-search"
              size={48}
              color={themeColors.textMuted}
            />
          </View>
          <Text style={styles.emptyTitle}>Nenhum resultado</Text>
          <Text style={styles.emptyText}>
            Tente ajustar os filtros ou buscar por outro termo.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtnSecondary}
            onPress={() => {
              setSearchQuery("");
              setCategoriaFiltro("all");
            }}
          >
            <Text style={styles.emptyBtnSecondaryText}>Limpar Filtros</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={locaisFiltrados}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 80 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={themeColors.primary}
              colors={[themeColors.primary]}
            />
          }
          ListHeaderComponent={
            favoritosFiltrados.length >= 1 ? (
              <View style={styles.podiumSection}>
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={16}
                    color="#FFD166"
                  />
                  <Text style={styles.sectionTitle}>Seus favoritos</Text>
                  <Text style={styles.sectionCount}>
                    {favoritosFiltrados.length} local{favoritosFiltrados.length > 1 ? "ais" : ""}
                  </Text>
                </View>
                <View style={styles.podiumRow}>
                  {favoritosFiltrados.map((local, i) => (
                    <PodiumCard
                      key={local.id}
                      local={local}
                      posicao={i}
                      styles={styles}
                      themeColors={themeColors}
                      blurTint={blurTint}
                    />
                  ))}
                </View>
                <View style={styles.sectionDivider} />
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons
                    name="map-marker-radius"
                    size={16}
                    color={themeColors.textMuted}
                  />
                  <Text style={styles.sectionTitle2}>
                    Todos os locais ({locaisFiltrados.length})
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={16}
                  color={themeColors.textMuted}
                />
                <Text style={styles.sectionTitle2}>
                  {locaisFiltrados.length} local{locaisFiltrados.length > 1 ? "ais" : ""} encontrado{locaisFiltrados.length > 1 ? "s" : ""}
                </Text>
              </View>
            )
          }
          renderItem={({ item, index }) => (
            <LocalCard
              item={item}
              index={index}
              onRemover={handleRemover}
              styles={styles}
              themeColors={themeColors}
              blurTint={blurTint}
            />
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {locaisFiltrados.length} local{locaisFiltrados.length > 1 ? "ais" : ""} no total
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

function createThemedScreenStyles(c, isDark) {
	return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.glassStrong,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  filterToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.glassStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: c.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: isDark ? "rgba(255,255,255,0.55)" : c.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.glass,
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : c.surface,
  },
  statValor: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  statLabel: {
    color: isDark ? "rgba(255,255,255,0.45)" : c.textMuted,
    fontSize: 9,
    marginTop: 1,
    textAlign: "center",
  },

  // Filters
  filtersContainer: {
    marginTop: 16,
  },
  searchRow: {
    marginBottom: 12,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : c.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: c.glass,
  },
  searchInput: {
    flex: 1,
    color: c.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : c.surface,
    borderWidth: 1,
    borderColor: c.glass,
  },
  filterChipText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : c.surface,
    borderWidth: 1,
    borderColor: c.glass,
  },
  sortBtnText: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },

  // Lista
  list: {
    padding: 16,
  },

  // Pódio
  podiumSection: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#FFD166",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionCount: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: "500",
    marginLeft: "auto",
  },
  podiumRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  podiumCard: {
    flex: 1,
  },
  podiumInner: {
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.glass,
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : c.surface,
  },
  podiumBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  podiumPos: {
    fontSize: 10,
    fontWeight: "800",
  },
  podiumIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  podiumNome: {
    color: c.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 15,
  },
  podiumBairro: {
    color: isDark ? "rgba(255,255,255,0.45)" : c.textMuted,
    fontSize: 9,
    marginTop: 2,
    textAlign: "center",
  },
  podiumVisitas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 8,
  },
  podiumVisitasText: {
    fontSize: 11,
    fontWeight: "800",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: c.glass,
    marginVertical: 12,
  },
  sectionTitle2: {
    color: isDark ? "rgba(255,255,255,0.65)" : c.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },

  // Cards da lista
  card: {
    borderRadius: 22,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.glass,
    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : c.card,
    shadowColor: c.shadow,
    shadowOpacity: isDark ? 0.12 : 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: isDark ? 2 : 1,
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    opacity: isDark ? 0.8 : 0.25,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  cardNome: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 4,
  },
  cardMetaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cardMetaText: {
    color: isDark ? "rgba(255,255,255,0.45)" : c.textMuted,
    fontSize: 11,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: c.glass,
  },
  cardVisitasBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: isDark ? "rgba(108,92,231,0.12)" : "rgba(108,92,231,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardVisitasText: {
    color: c.primaryLight || "#8B7CFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cardData: {
    color: isDark ? "rgba(255,255,255,0.35)" : c.textMuted,
    fontSize: 10,
  },

  // Loading / Empty
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: c.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    color: c.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    color: isDark ? "rgba(255,255,255,0.55)" : c.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyBtnSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.glass,
    backgroundColor: isDark ? "rgba(255,255,255,0.04)" : c.surface,
  },
  emptyBtnSecondaryText: {
    color: c.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    color: c.textMuted,
    fontSize: 12,
  },
});
}