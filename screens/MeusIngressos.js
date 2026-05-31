/**
 * 🎫 TELA: MEUS INGRESSOS
 *
 * Layout no padrão TelaPainelCidade:
 *  - Header LinearGradient com glows decorativos e parallax
 *  - Stat cards animados (FadeInUp)
 *  - Sticky bar BlurView
 *  - Filtros em pill horizontal
 *  - Cards de ingresso com QR Code em Modal
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Modal,
  Dimensions,
  Share,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInLeft,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  withSpring,
} from "react-native-reanimated";
import QRCode from "react-native-qrcode-svg";
import captureRef from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { useAuth } from "../context/AuthContext";
import { useIngressos } from "../hooks/useIngressos";
import { useTheme, useGradients } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

// ── helpers ──────────────────────────────────────────────────────────────────

const parseDateBR = (value) => {
  if (!value) return new Date(0);
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  const br = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const [, d, m, y] = br;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const iso = new Date(value);
  return isNaN(iso.getTime()) ? new Date(0) : iso;
};

const statusConfig = (colors) => ({
  confirmado: { label: "Ativo", color: "#22C55E", icon: "check-circle" },
  utilizado:  { label: "Usado",  color: colors.textMuted, icon: "history"  },
  cancelado:  { label: "Cancelado", color: colors.error, icon: "close-circle" },
});

// ── QR Modal ──────────────────────────────────────────────────────────────────

const QRModal = memo(({ visible, ingresso, compra, onClose, colors, styles }) => {
  if (!ingresso) return null;

  const qrRef = useRef(null);
  const cfg = statusConfig(colors)[ingresso.status] ?? statusConfig(colors).confirmado;
  // QR Code com formato JSON consistente: { c: codigoIngresso, e: eventoId, t: tipo }
  const qrValue = JSON.stringify({
    c: ingresso.codigoIngresso || ingresso.id || "sem-codigo",
    e: compra?.eventoId || "",
    t: ingresso.tipo || "inteira",
  });
  const tipoLabel = ingresso.tipo
    ? ingresso.tipo.charAt(0).toUpperCase() + ingresso.tipo.slice(1).toLowerCase()
    : "Ingresso";

  const handleShare = async () => {
    try {
      if (qrRef.current) {
        const uri = await captureRef(qrRef.current, {
          format: "png",
          quality: 1,
        });
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Compartilhar Ingresso",
        });
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      // Fallback para compartilhar texto se falhar
      try {
        await Share.share({
          message: `🎫 Meu ingresso para ${compra?.eventoNome}\nCódigo: ${qrValue}\nData: ${compra?.eventoDataStr || ""}`,
        });
      } catch (_) {}
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
        <Animated.View entering={FadeInDown.springify()} style={styles.modalCard}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Evento */}
          <Text style={styles.modalEventoNome} numberOfLines={2}>
            {compra?.eventoNome}
          </Text>
          <Text style={styles.modalEventoData}>
            {compra?.eventoDataStr}
            {compra?.eventoLocal ? `  •  ${compra.eventoLocal}` : ""}
          </Text>

          {/* Status pill */}
          <View style={[styles.modalStatusPill, { backgroundColor: cfg.color + "18" }]}>
            <View style={[styles.modalStatusDot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.modalStatusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrWrapper} ref={qrRef} collapsable={false}>
            <LinearGradient
              colors={["rgba(108,92,231,0.18)", "rgba(34,211,238,0.10)"]}
              style={styles.qrGlow}
            />
            <View style={styles.qrBox}>
              <QRCode
                value={qrValue}
                size={200}
                color="#FFFFFF"
                backgroundColor="transparent"
                enableLinearGradient
                linearGradient={["#A78BFA", "#22D3EE"]}
                logoSize={36}
              />
            </View>
          </View>

          {/* Código */}
          <View style={styles.codigoRow}>
            <MaterialCommunityIcons name="barcode" size={16} color={colors.textMuted} />
            <Text style={styles.codigoText} numberOfLines={1} ellipsizeMode="middle">
              {qrValue}
            </Text>
          </View>

          {/* Tipo */}
          <View style={styles.modalInfoRow}>
            <View style={styles.modalInfoChip}>
              <MaterialCommunityIcons name="ticket-outline" size={14} color={colors.primary} />
              <Text style={styles.modalInfoChipText}>{tipoLabel}</Text>
            </View>
            {ingresso.precoUnitario != null && (
              <View style={styles.modalInfoChip}>
                <MaterialCommunityIcons name="currency-brl" size={14} color={colors.accentCyan} />
                <Text style={[styles.modalInfoChipText, { color: colors.accentCyan }]}>
                  {ingresso.precoUnitario === 0
                    ? "Gratuito"
                    : `R$ ${Number(ingresso.precoUnitario).toFixed(2)}`}
                </Text>
              </View>
            )}
          </View>

          {/* Ações */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnShare} onPress={handleShare} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtnGradient}
              >
                <MaterialCommunityIcons name="share-variant" size={18} color="#FFF" />
                <Text style={styles.modalBtnText}>Compartilhar</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalBtnClose} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.modalBtnCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
});

// ── IngressoCard ──────────────────────────────────────────────────────────────

const IngressoCard = memo(({ ingresso, compra, index, onPress, colors, styles }) => {
  const cfg = statusConfig(colors)[ingresso.status] ?? statusConfig(colors).confirmado;
  const tipoLabel = ingresso.tipo
    ? ingresso.tipo.charAt(0).toUpperCase() + ingresso.tipo.slice(1).toLowerCase()
    : "Ingresso";
  const isFuturo = parseDateBR(compra?.eventoDataStr) > new Date();
  const isAtivo = ingresso.status === "confirmado" && isFuturo;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <TouchableOpacity
        style={[styles.ingressoCard, !isAtivo && styles.ingressoCardDimmed]}
        onPress={() => onPress(ingresso, compra)}
        activeOpacity={0.82}
      >
        {/* Glow lateral */}
        <View style={[styles.ingressoAccent, { backgroundColor: cfg.color }]} />

        <View style={styles.ingressoBody}>
          {/* Top */}
          <View style={styles.ingressoTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ingressoEvento} numberOfLines={1}>
                {compra?.eventoNome}
              </Text>
              <View style={styles.ingressoMetaRow}>
                <MaterialCommunityIcons name="calendar" size={12} color={colors.textMuted} />
                <Text style={styles.ingressoMetaText}>{compra?.eventoDataStr}</Text>
                {compra?.eventoLocal ? (
                  <>
                    <Text style={styles.ingressoMetaDot}>·</Text>
                    <MaterialCommunityIcons name="map-marker" size={12} color={colors.textMuted} />
                    <Text style={styles.ingressoMetaText} numberOfLines={1}>{compra.eventoLocal}</Text>
                  </>
                ) : null}
              </View>
            </View>

            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: cfg.color + "18" }]}>
              <MaterialCommunityIcons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Divider pontilhado */}
          <View style={styles.dashedDivider} />

          {/* Bottom */}
          <View style={styles.ingressoBottom}>
            <View style={styles.ingressoChips}>
              <View style={styles.chip}>
                <MaterialCommunityIcons name="ticket-outline" size={13} color={colors.primary} />
                <Text style={styles.chipText}>{tipoLabel}</Text>
              </View>
              {ingresso.precoUnitario != null && (
                <View style={[styles.chip, { backgroundColor: colors.accentCyan + "14" }]}>
                  <Text style={[styles.chipText, { color: colors.accentCyan }]}>
                    {ingresso.precoUnitario === 0
                      ? "Gratuito"
                      : `R$ ${Number(ingresso.precoUnitario).toFixed(2)}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.qrPreviewBtn}>
              <MaterialCommunityIcons name="qrcode" size={20} color={colors.primary} />
              <Text style={styles.qrPreviewText}>Ver QR</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MeusIngressos({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { ingressos, carregarIngressos, loading } = useIngressos();
  const { colors, isDark } = useTheme();
  const gradients = useGradients();

  const [filtro, setFiltro] = useState("todos");
  const [refreshing, setRefreshing] = useState(false);
  const [modalIngresso, setModalIngresso] = useState(null); // { ingresso, compra }

  const styles = createStyles(colors, isDark);

  // parallax scroll
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, 120], [0, -30], "clamp") }],
    opacity: interpolate(scrollY.value, [0, 100], [1, 0.92], "clamp"),
  }));
  const stickyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [60, 100], [0, 1], "clamp"),
    transform: [{ translateY: interpolate(scrollY.value, [60, 100], [-10, 0], "clamp") }],
  }));

  useEffect(() => {
    if (user?.uid) carregarIngressos(user.uid, "todos");
  }, [user?.uid]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { if (user?.uid) await carregarIngressos(user.uid, "todos"); }
    catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, [user?.uid, carregarIngressos]);

  // contadores
  const contar = useCallback((status) => {
    let n = 0;
    ingressos.forEach((c) =>
      (c.ingressos || []).forEach((ing) => {
        if (status === "ativos") {
          if (ing.status === "confirmado" && parseDateBR(c.eventoDataStr) > new Date()) n++;
        } else if (ing.status === status) n++;
      })
    );
    return n;
  }, [ingressos]);

  const totalTodos     = useMemo(() => ingressos.reduce((a, c) => a + (c.ingressos?.length || 0), 0), [ingressos]);
  const totalAtivos    = useMemo(() => contar("ativos"),     [contar]);
  const totalUsados    = useMemo(() => contar("utilizado"),  [contar]);
  const totalCancelados= useMemo(() => contar("cancelado"),  [contar]);

  const contadores = { todos: totalTodos, ativos: totalAtivos, utilizados: totalUsados, cancelados: totalCancelados };

  // filtro
  const ingressosFiltrados = useMemo(() =>
    ingressos.filter((compra) => {
      if (filtro === "todos") return true;
      return (compra.ingressos || []).some((ing) => {
        if (filtro === "ativos") return ing.status === "confirmado" && parseDateBR(compra.eventoDataStr) > new Date();
        return ing.status === filtro.replace("utilizados", "utilizado").replace("cancelados", "cancelado");
      });
    }),
  [ingressos, filtro]);

  const filtrarIngresso = (ing, compra) => {
    if (filtro === "todos") return true;
    if (filtro === "ativos") return ing.status === "confirmado" && parseDateBR(compra.eventoDataStr) > new Date();
    return ing.status === filtro.replace("utilizados", "utilizado").replace("cancelados", "cancelado");
  };

  const FILTROS = [
    { key: "todos",      label: "Todos",   icon: "ticket-confirmation", color: colors.primary    },
    { key: "ativos",     label: "Ativos",  icon: "check-circle",        color: colors.success    },
    { key: "utilizados", label: "Usados",  icon: "history",             color: colors.textMuted  },
    { key: "cancelados", label: "Cancelados", icon: "close-circle",     color: colors.error      },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* ── STICKY BAR ── */}
      <Animated.View style={[styles.stickyBar, { top: insets.top }, stickyStyle]} pointerEvents="none">
        <BlurView intensity={60} tint="dark" style={styles.stickyBlur}>
          <MaterialCommunityIcons name="ticket-confirmation" size={16} color={colors.primary} />
          <Text style={styles.stickyText}>Meus Ingressos</Text>
        </BlurView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ── HEADER ── */}
        <Animated.View style={headerStyle}>
          <LinearGradient
            colors={gradients.primary}
            style={[styles.header, { paddingTop: insets.top + 20 }]}
          >
            {/* Top row */}
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={[styles.headerBtn, { 
                  backgroundColor: "rgba(255,255,255,0.15)", 
                  borderColor: "rgba(255,255,255,0.25)",
                  shadowColor: "rgba(0,0,0,0.15)",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }]} 
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.headerTitle, { color: colors.onPrimary }]}>Meus Ingressos</Text>
                <Text style={[styles.headerSubtitle, { color: colors.onPrimary + "CC" }]}>
                  {totalTodos} ingresso{totalTodos !== 1 ? "s" : ""} na carteira
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.headerBtn, { 
                  backgroundColor: "rgba(255,255,255,0.15)", 
                  borderColor: "rgba(255,255,255,0.25)",
                  shadowColor: "rgba(0,0,0,0.15)",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }]} 
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── FILTROS PILL ── */}
        <View style={styles.filtrosRow}>
          {FILTROS.map((f) => {
            const isActive = filtro === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filtroPill, isActive && { backgroundColor: f.color + "20", borderColor: f.color }]}
                onPress={() => setFiltro(f.key)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name={f.icon} size={14} color={isActive ? f.color : colors.textMuted} />
                <Text style={[styles.filtroPillText, isActive && { color: f.color }]}>
                  {f.label}
                  {contadores[f.key] > 0 ? ` (${contadores[f.key]})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── LISTA ── */}
        <View style={styles.lista}>
          {loading && ingressos.length === 0 ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyText}>Carregando ingressos...</Text>
            </View>
          ) : ingressosFiltrados.length === 0 ? (
            <Animated.View entering={FadeInDown.springify()} style={styles.emptyBox}>
              <LinearGradient
                colors={[colors.primary + "20", colors.accentCyan + "10"]}
                style={styles.emptyIconWrap}
              >
                <MaterialCommunityIcons name="ticket-confirmation-outline" size={48} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {filtro === "ativos"
                  ? "Nenhum ingresso ativo"
                  : filtro === "utilizados"
                  ? "Nenhum ingresso utilizado"
                  : filtro === "cancelados"
                  ? "Nenhum ingresso cancelado"
                  : "Nenhum ingresso ainda"}
              </Text>
              <Text style={styles.emptySub}>
                {filtro === "todos"
                  ? "Explore eventos e garanta seus ingressos!"
                  : "Nada encontrado para este filtro."}
              </Text>
              {filtro === "todos" && (
                <TouchableOpacity
                  style={styles.btnExplorar}
                  onPress={() => navigation.navigate("EventoHome")}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnExplorarGradient}
                  >
                    <MaterialCommunityIcons name="compass-outline" size={18} color="#FFF" />
                    <Text style={styles.btnExplorarText}>Explorar Eventos</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </Animated.View>
          ) : (
            ingressosFiltrados.map((compra) => {
              const ingressosDaCompra = (compra.ingressos || []).filter((ing) => filtrarIngresso(ing, compra));
              if (!ingressosDaCompra.length) return null;
              return (
                <View key={compra.id || compra.compraId}>
                  {/* Section header */}
                  <Animated.View entering={FadeInLeft.springify()} style={styles.sectionHeader}>
                    <View style={styles.sectionDot} />
                    <Text style={styles.sectionTitle} numberOfLines={1}>{compra.eventoNome}</Text>
                    <View style={styles.sectionBadge}>
                      <Text style={styles.sectionBadgeText}>{ingressosDaCompra.length}</Text>
                    </View>
                  </Animated.View>

                  {ingressosDaCompra.map((ingresso, idx) => (
                    <IngressoCard
                      key={ingresso.codigoIngresso || idx}
                      ingresso={ingresso}
                      compra={compra}
                      index={idx}
                      colors={colors}
                      styles={styles}
                      onPress={(ing, cmp) => setModalIngresso({ ingresso: ing, compra: cmp })}
                    />
                  ))}
                </View>
              );
            })
          )}
        </View>
      </Animated.ScrollView>

      {/* ── QR MODAL ── */}
      <QRModal
        visible={!!modalIngresso}
        ingresso={modalIngresso?.ingresso}
        compra={modalIngresso?.compra}
        onClose={() => setModalIngresso(null)}
        colors={colors}
        styles={styles}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Sticky bar ──
  stickyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
  },
  stickyBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  stickyText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "700",
  },

  // ── Header ──
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: 0,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },

  // ── Filtros ──
  filtrosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 8,
  },
  filtroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : colors.surface,
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.08)" : colors.borderLight,
  },
  filtroPillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Lista ──
  lista: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionBadge: {
    backgroundColor: colors.primary + "20",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Ingresso card ──
  ingressoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
    overflow: "hidden",
  },
  ingressoCardDimmed: {
    opacity: 0.6,
  },
  ingressoAccent: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  ingressoBody: {
    flex: 1,
    padding: 14,
  },
  ingressoTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  ingressoEvento: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  ingressoMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  ingressoMetaText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  ingressoMetaDot: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // dashed divider
  dashedDivider: {
    height: 1,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
    marginVertical: 10,
  },

  ingressoBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ingressoChips: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary + "14",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "600",
  },
  qrPreviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary + "18",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  qrPreviewText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Empty ──
  emptyBox: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  btnExplorar: {
    marginTop: 24,
    borderRadius: 14,
    overflow: "hidden",
  },
  btnExplorarGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  btnExplorarText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // ── QR Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 20,
  },
  modalEventoNome: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  modalEventoData: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
  },
  modalStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  modalStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  qrWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  qrGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  qrBox: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  codigoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    maxWidth: "100%",
  },
  codigoText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    flex: 1,
  },
  modalInfoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  modalInfoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primary + "14",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalInfoChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  modalActions: {
    width: "100%",
    gap: 10,
  },
  modalBtnShare: {
    borderRadius: 16,
    overflow: "hidden",
  },
  modalBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  modalBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  modalBtnClose: {
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalBtnCloseText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});
