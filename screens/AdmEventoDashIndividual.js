import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";

import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from "react-native";

import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import {
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import { obterEstatisticasVendas } from "../services/ingressoServiceV2";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

// ─── Constantes ──────────────────────────────────────────────────────────────

const DEFAULT_EVENT_IMAGE = "https://placehold.co/600x400/png";
let styles;
let colors;
let blurTint;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Utilitários ─────────────────────────────────────────────────────────────

const toDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const brMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      const [, day, month, year] = brMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatDateTime = (value) => {
  const date = toDate(value);
  if (!date) return "Sem registro";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCountdownLabel = (value) => {
  const date = toDate(value);
  if (!date) return "Data\nindefinida";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((eventDate - today) / 86400000);
  if (diffDays > 1) return `Faltam\n${diffDays} dias`;
  if (diffDays === 1) return "Falta\n1 dia";
  if (diffDays === 0) return "Evento\nhoje";
  return "Evento\nencerrado";
};

const getStarName = (media, index) => {
  if (media >= index) return "star";
  if (media >= index - 0.5) return "star-half-full";
  return "star-outline";
};

// ─── Filtro de período ────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "all", label: "Tudo" },
];

function PeriodFilter({ selected, onChange }) {
  return (
    <View style={periodStyles.wrapper}>
      {PERIOD_OPTIONS.map((opt) => {
        const isActive = selected === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            activeOpacity={0.8}
            onPress={() => onChange(opt.key)}
            style={[
              periodStyles.pill,
              isActive && periodStyles.pillActive,
            ]}
          >
            {isActive && (
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <Text
              style={[
                periodStyles.pillText,
                isActive && periodStyles.pillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const periodStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pillActive: {
    borderColor: "transparent",
  },
  pillText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "700",
  },
  pillTextActive: {
    color: "#FFF",
  },
});

// ─── Gráfico de vendas por dia ────────────────────────────────────────────────

function SalesChart({ comprasPorDia, periodo }) {
  const entries = useMemo(() => {
    const cutoff = new Date();
    const days =
      periodo === "7d" ? 7 : periodo === "30d" ? 30 : periodo === "90d" ? 90 : 9999;
    cutoff.setDate(cutoff.getDate() - days);

    return Object.entries(comprasPorDia || {})
      .filter(([dateStr]) => {
        if (periodo === "all") return true;
        const d = toDate(dateStr);
        return d && d >= cutoff;
      })
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14); // máximo 14 barras visíveis
  }, [comprasPorDia, periodo]);

  if (!entries.length) {
    return (
      <BlurView intensity={22} tint={blurTint} style={chartStyles.emptyCard}>
        <MaterialCommunityIcons name="chart-bar" size={28} color="rgba(255,255,255,0.2)" />
        <Text style={chartStyles.emptyText}>Sem dados no período</Text>
      </BlurView>
    );
  }

  const maxVal = Math.max(...entries.map(([, v]) => v?.compras || v || 0), 1);
  const BAR_WIDTH = Math.min(32, (SCREEN_WIDTH - 80) / entries.length - 6);

  return (
    <BlurView intensity={22} tint={blurTint} style={chartStyles.card}>
      <View style={chartStyles.header}>
        <MaterialCommunityIcons name="chart-bar" size={18} color="#38BDF8" />
        <Text style={chartStyles.title}>Vendas por Dia</Text>
      </View>

      <View style={chartStyles.chartArea}>
        {entries.map(([dateStr, val]) => {
          const qtd = val?.compras ?? val ?? 0;
          const receita = val?.receita ?? 0;
          const pct = (qtd / maxVal) * 100;
          const label = dateStr.slice(5).replace("-", "/"); // MM/DD ou similar

          return (
            <View key={dateStr} style={chartStyles.barGroup}>
              {receita > 0 && (
                <Text style={chartStyles.barReceita}>
                  {formatCurrency(receita).replace("R$\u00a0", "R$")}
                </Text>
              )}
              <View style={[chartStyles.barTrack, { width: BAR_WIDTH }]}>
                <LinearGradient
                  colors={["#38BDF8", "#0EA5E9"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[chartStyles.barFill, { height: `${Math.max(pct, 4)}%` }]}
                />
              </View>
              <Text style={chartStyles.barValue}>{qtd}</Text>
              <Text style={chartStyles.barLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
    </BlurView>
  );
}

const chartStyles = StyleSheet.create({
  card: {
    borderRadius: 26,
    padding: 20,
    marginTop: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  emptyCard: {
    borderRadius: 26,
    padding: 28,
    marginTop: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  title: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 120,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barTrack: {
    height: "80%",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 8,
  },
  barReceita: {
    color: "rgba(56,189,248,0.7)",
    fontSize: 8,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  barValue: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 4,
  },
  barLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    marginTop: 2,
  },
});

// ─── Toast de notificação ─────────────────────────────────────────────────────

function useNotificationToast() {
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const show = useCallback((message, type = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 3500);
  }, [anim]);

  const ToastComponent = toast ? (
    <Animated.View
      style={[
        toastStyles.container,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={
          toast.type === "success"
            ? ["#16A34A", "#15803D"]
            : toast.type === "warning"
            ? ["#D97706", "#B45309"]
            : ["#2563EB", "#1D4ED8"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={toastStyles.gradient}
      >
        <MaterialCommunityIcons
          name={
            toast.type === "success"
              ? "check-circle-outline"
              : toast.type === "warning"
              ? "alert-outline"
              : "bell-outline"
          }
          size={18}
          color="#FFF"
        />
        <Text style={toastStyles.text}>{toast.message}</Text>
      </LinearGradient>
    </Animated.View>
  ) : null;

  return { show, ToastComponent };
}

const toastStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 12,
    left: 18,
    right: 18,
    zIndex: 999,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  text: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
});

// ─── Indicador de tempo real ──────────────────────────────────────────────────

function LiveBadge() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={liveStyles.wrapper}>
      <Animated.View style={[liveStyles.dot, { opacity: pulse }]} />
      <Text style={liveStyles.text}>AO VIVO</Text>
    </View>
  );
}

const liveStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(52,211,153,0.12)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#34D399",
  },
  text: {
    color: "#34D399",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

// ─── Exportação ───────────────────────────────────────────────────────────────

function buildCSV(evento, metricas, avaliacoes, ocorrencias, alcance) {
  const rows = [
    ["Campo", "Valor"],
    ["Evento", evento?.tituloEvento || ""],
    ["Local", evento?.localEvento || ""],
    ["Data", evento?.dataEvento || ""],
    ["Receita Total", metricas.receita],
    ["Ingressos Aprovados", metricas.ingressosAprovados],
    ["Ticket Médio", metricas.ticketMedio.toFixed(2)],
    ["Total Compras", metricas.totalCompras],
    ["Nota Média", metricas.mediaAvaliacoes.toFixed(1)],
    ["Total Avaliações", metricas.totalAvaliacoes],
    ["% Aprovação", metricas.aprovacaoPercentual + "%"],
    ["Visualizações", alcance?.visualizacoes || 0],
    ["Cliques", alcance?.cliques || 0],
    ["Inscrições", alcance?.inscricoes || 0],
    ["Comparecimentos", alcance?.comparecimentos || 0],
    ["Total Ocorrências", ocorrencias.length],
  ];
  return rows.map((r) => r.join(";")).join("\n");
}

// ─── Dashboard de Alcance ────────────────────────────────────────────────────

const REACH_STEPS = [
  {
    key: "visualizacoes",
    label: "Viram",
    icon: "eye-outline",
    color: "#38BDF8",
    bg: "rgba(56,189,248,0.12)",
  },
  {
    key: "cliques",
    label: "Clicaram",
    icon: "cursor-default-click-outline",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
  },
  {
    key: "inscricoes",
    label: "Inscreveram",
    icon: "ticket-confirmation-outline",
    color: "#34D399",
    bg: "rgba(52,211,153,0.12)",
  },
  {
    key: "comparecimentos",
    label: "Foram",
    icon: "map-marker-check-outline",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.12)",
  },
];

function ReachDashboard({ alcance }) {
  const dados = alcance || {};
  const valores = REACH_STEPS.map((step) => Number(dados[step.key] || 0));
  const maximo = Math.max(...valores, 1);
  const taxaConversao =
    valores[0] > 0 ? ((valores[2] / valores[0]) * 100).toFixed(1) : "0.0";
  const taxaComparecimento =
    valores[2] > 0 ? ((valores[3] / valores[2]) * 100).toFixed(1) : "0.0";

  return (
    <View style={reachStyles.wrapper}>
      <View style={reachStyles.header}>
        <View style={reachStyles.titleRow}>
          <MaterialCommunityIcons name="radar" size={22} color="#A78BFA" />
          <Text style={reachStyles.title}>Dashboard de Alcance</Text>
        </View>
        <Text style={reachStyles.subtitle}>Funil de engajamento do evento</Text>
      </View>

      <View style={reachStyles.cardsRow}>
        {REACH_STEPS.map((step, index) => {
          const valor = valores[index];
          const anterior = index > 0 ? valores[index - 1] : null;
          const taxa =
            anterior != null && anterior > 0
              ? ((valor / anterior) * 100).toFixed(0)
              : null;
          return (
            <BlurView
              key={step.key}
              intensity={22}
              tint={blurTint}
              style={reachStyles.metricCard}
            >
              <View style={[reachStyles.iconWrap, { backgroundColor: step.bg }]}>
                <MaterialCommunityIcons name={step.icon} size={20} color={step.color} />
              </View>
              <Text style={reachStyles.metricValue}>
                {valor.toLocaleString("pt-BR")}
              </Text>
              <Text style={reachStyles.metricLabel}>{step.label}</Text>
              {taxa !== null && (
                <View style={[reachStyles.taxaBadge, { backgroundColor: step.bg }]}>
                  <Text style={[reachStyles.taxaText, { color: step.color }]}>
                    {taxa}%
                  </Text>
                </View>
              )}
            </BlurView>
          );
        })}
      </View>

      <BlurView intensity={20} tint={blurTint} style={reachStyles.funnelCard}>
        <Text style={reachStyles.funnelTitle}>Funil de Conversão</Text>
        {REACH_STEPS.map((step, index) => {
          const valor = valores[index];
          const pct = maximo > 0 ? (valor / maximo) * 100 : 0;
          return (
            <View key={step.key} style={reachStyles.funnelRow}>
              <View style={reachStyles.funnelLabelWrap}>
                <MaterialCommunityIcons name={step.icon} size={14} color={step.color} />
                <Text style={reachStyles.funnelLabel}>{step.label}</Text>
              </View>
              <View style={reachStyles.funnelBarTrack}>
                <LinearGradient
                  colors={[step.color, step.color + "99"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[reachStyles.funnelBarFill, { width: `${pct}%` }]}
                />
              </View>
              <Text style={reachStyles.funnelValue}>
                {valor.toLocaleString("pt-BR")}
              </Text>
            </View>
          );
        })}
      </BlurView>

      <View style={reachStyles.synthRow}>
        <BlurView intensity={20} tint={blurTint} style={reachStyles.synthCard}>
          <MaterialCommunityIcons name="filter-outline" size={18} color="#34D399" />
          <Text style={reachStyles.synthValue}>{taxaConversao}%</Text>
          <Text style={reachStyles.synthLabel}>Conversão{"\n"}Geral</Text>
        </BlurView>
        <BlurView intensity={20} tint={blurTint} style={reachStyles.synthCard}>
          <MaterialCommunityIcons name="walk" size={18} color="#FBBF24" />
          <Text style={reachStyles.synthValue}>{taxaComparecimento}%</Text>
          <Text style={reachStyles.synthLabel}>Taxa de{"\n"}Comparecimento</Text>
        </BlurView>
        <BlurView intensity={20} tint={blurTint} style={reachStyles.synthCard}>
          <MaterialCommunityIcons name="account-multiple-outline" size={18} color="#38BDF8" />
          <Text style={reachStyles.synthValue}>
            {(valores[0] - valores[2]).toLocaleString("pt-BR")}
          </Text>
          <Text style={reachStyles.synthLabel}>Viram mas não{"\n"}inscreveram</Text>
        </BlurView>
      </View>
    </View>
  );
}

const reachStyles = StyleSheet.create({
  wrapper: { marginTop: 22 },
  header: { marginBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: "#FFF", fontSize: 24, fontWeight: "800", marginLeft: 8 },
  subtitle: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4 },
  cardsRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  metricCard: {
    flex: 1,
    borderRadius: 22,
    padding: 14,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricValue: { color: "#FFF", fontSize: 18, fontWeight: "900" },
  metricLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
  },
  taxaBadge: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  taxaText: { fontSize: 11, fontWeight: "800" },
  funnelCard: {
    marginTop: 16,
    borderRadius: 26,
    padding: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  funnelTitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  funnelRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  funnelLabelWrap: { flexDirection: "row", alignItems: "center", width: 90, gap: 6 },
  funnelLabel: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginLeft: 6 },
  funnelBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    marginHorizontal: 10,
  },
  funnelBarFill: { height: "100%", borderRadius: 999, minWidth: 4 },
  funnelValue: { color: "#FFF", fontSize: 13, fontWeight: "700", width: 52, textAlign: "right" },
  synthRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, gap: 10 },
  synthCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 6,
  },
  synthValue: { color: "#FFF", fontSize: 20, fontWeight: "900", marginTop: 4 },
  synthLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});

function ExportReportModal({
  visible,
  onClose,
  onExportCsv,
  onShare,
}) {
  const { colors, gradients, isDark } = useTheme();
  const exportModalStyles = useThemedStyles(createExportModalStyles);
  const blurTint = isDark ? "dark" : "light";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={exportModalStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <BlurView intensity={50} tint={blurTint} style={exportModalStyles.card}>
          <LinearGradient
            colors={["rgba(108,92,231,0.15)", "rgba(49,46,129,0.05)"]}
            style={exportModalStyles.gradient}
          >
            <View style={exportModalStyles.iconWrap}>
              <MaterialCommunityIcons
                name="export-variant"
                size={34}
                color={colors.primary}
              />
            </View>
            <Text style={exportModalStyles.title}>Exportar relatório</Text>
            <Text style={exportModalStyles.message}>
              Escolha o formato de exportação:
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={exportModalStyles.actionBtn}
              onPress={onExportCsv}
            >
              <LinearGradient
                colors={gradients.primaryButton}
                style={exportModalStyles.actionGradient}
              >
                <MaterialCommunityIcons
                  name="file-delimited-outline"
                  size={18}
                  color="#FFF"
                />
                <Text style={exportModalStyles.actionText}>Gerar CSV</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={exportModalStyles.actionBtn}
              onPress={onShare}
            >
              <LinearGradient
                colors={gradients.primaryButton}
                style={exportModalStyles.actionGradient}
              >
                <MaterialCommunityIcons
                  name="share-variant-outline"
                  size={18}
                  color="#FFF"
                />
                <Text style={exportModalStyles.actionText}>Compartilhar</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={exportModalStyles.cancelBtn}
              onPress={onClose}
            >
              <Text style={exportModalStyles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </LinearGradient>
        </BlurView>
      </View>
    </Modal>
  );
}

function createExportModalStyles(colors) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayStronger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  gradient: {
    padding: 28,
    alignItems: "center",
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  message: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },
  actionBtn: {
    width: "100%",
    marginTop: 14,
  },
  actionGradient: {
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelBtn: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.glass,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  cancelText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  });
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function AdmEventoDashIndividual({ navigation, route }) {
  const themeContext = useTheme();
  colors = themeContext.colors;
  blurTint = themeContext.isDark ? "dark" : "light";
  styles = useThemedStyles(createThemedScreenStyles);
  const { nome, foto } = useAuth();

  const eventoId = route?.params?.eventoId || route?.params?.evento?.id;

  const [evento, setEvento] = useState(route?.params?.evento || {});
  const [vendas, setVendas] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [alcance, setAlcance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("30d");
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const { show: showToast, ToastComponent } = useNotificationToast();

  // Refs para os unsubscribes dos listeners
  const unsubscribeRefs = useRef([]);

  // ── Carga inicial (evento + vendas) ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const carregarDadosIniciais = async () => {
      if (!eventoId) { setLoading(false); return; }
      try {
        setLoading(true);
        const eventoRef = doc(db, "eventos", eventoId);
        const [eventoSnap, vendasData] = await Promise.all([
          getDoc(eventoRef),
          obterEstatisticasVendas(eventoId),
        ]);
        if (!mounted) return;
        if (eventoSnap.exists()) {
          setEvento({ id: eventoSnap.id, ...eventoSnap.data() });
        }
        setVendas(vendasData || null);
      } catch (error) {
        console.log("Erro carga inicial:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    carregarDadosIniciais();
    return () => { mounted = false; };
  }, [eventoId]);

  // ── Listeners em tempo real ──────────────────────────────────────────────
  useEffect(() => {
    if (!eventoId) return;

    // Limpa listeners anteriores
    unsubscribeRefs.current.forEach((unsub) => unsub());
    unsubscribeRefs.current = [];

    let isFirst = {
      vendas: true,
      avaliacoes: true,
      ocorrencias: true,
      alcance: true,
    };

    // 1. Listener: Alcance (metricas/alcance)
    const alcanceRef = doc(db, "eventos", eventoId, "metricas", "alcance");
    const unsubAlcance = onSnapshot(alcanceRef, (snap) => {
      if (snap.exists()) {
        setAlcance(snap.data());
        if (!isFirst.alcance) {
          showToast("📊 Métricas de alcance atualizadas!", "info");
        }
        isFirst.alcance = false;
      } else {
        setAlcance({
          visualizacoes: evento?.visualizacoes || 0,
          cliques: evento?.cliques || 0,
          inscricoes: evento?.inscricoes || 0,
          comparecimentos: evento?.comparecimentos || 0,
        });
        isFirst.alcance = false;
      }
    }, (err) => console.log("Listener alcance:", err));
    unsubscribeRefs.current.push(unsubAlcance);

    // 2. Listener: Avaliações
    const avaliacoesQuery = query(
      collection(db, "eventos", eventoId, "avaliacoes"),
      orderBy("createdAt", "desc")
    );
    const unsubAvaliacoes = onSnapshot(avaliacoesQuery, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAvaliacoes(docs);
      if (!isFirst.avaliacoes) {
        const novas = snap.docChanges().filter((c) => c.type === "added").length;
        if (novas > 0) showToast(`⭐ ${novas} nova(s) avaliação(ões)!`, "success");
      }
      isFirst.avaliacoes = false;
    }, (err) => console.log("Listener avaliações:", err));
    unsubscribeRefs.current.push(unsubAvaliacoes);

    // 3. Listener: Ocorrências
    const ocorrenciasQuery = query(
      collection(db, "eventos", eventoId, "ocorrencias"),
      orderBy("createdAt", "desc")
    );
    const unsubOcorrencias = onSnapshot(ocorrenciasQuery, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOcorrencias(docs);
      if (!isFirst.ocorrencias) {
        const novas = snap.docChanges().filter((c) => c.type === "added").length;
        if (novas > 0) showToast(`⚠️ ${novas} nova(s) ocorrência(s)!`, "warning");
      }
      isFirst.ocorrencias = false;
    }, (err) => console.log("Listener ocorrências:", err));
    unsubscribeRefs.current.push(unsubOcorrencias);

    // 4. Listener: Vendas (ingressos vendidos via evento doc)
    const eventoDocRef = doc(db, "eventos", eventoId);
    const unsubEvento = onSnapshot(eventoDocRef, async (snap) => {
      if (!snap.exists()) return;
      const novoEvento = { id: snap.id, ...snap.data() };
      setEvento(novoEvento);

      // Re-carrega estatísticas de vendas quando o documento mudar
      try {
        const vendasData = await obterEstatisticasVendas(eventoId);
        setVendas(vendasData || null);
        if (!isFirst.vendas) {
          showToast("🎟️ Novas vendas registradas!", "success");
        }
        isFirst.vendas = false;
      } catch (err) {
        console.log("Erro re-carregando vendas:", err);
        isFirst.vendas = false;
      }
    }, (err) => console.log("Listener evento:", err));
    unsubscribeRefs.current.push(unsubEvento);

    return () => {
      unsubscribeRefs.current.forEach((unsub) => unsub());
      unsubscribeRefs.current = [];
    };
  }, [eventoId]);

  // ── Métricas calculadas ──────────────────────────────────────────────────
  const metricas = useMemo(() => {
    const statusIngressos = vendas?.statusIngressos || {};
    const totalIngressos =
      vendas?.totalIngressosVendidos || evento?.ingressosVendidos || 0;
    const ingressosCancelados = statusIngressos.cancelado || 0;
    const ingressosAprovados = Math.max(0, totalIngressos - ingressosCancelados);
    const receita =
      vendas?.arrecadacaoTotal ||
      evento?.arrecadacaoTotal ||
      evento?.receita ||
      0;
    const ticketMedio = ingressosAprovados > 0 ? receita / ingressosAprovados : 0;

    const comprasPorDia = vendas?.comprasPorDia || {};
    const totalCompras = Object.values(comprasPorDia).reduce(
      (acc, item) => acc + (item.compras || 0),
      0
    );
    const diasComCompra = Object.keys(comprasPorDia).sort();
    const ultimaCompra = diasComCompra[diasComCompra.length - 1];

    const totalAvaliacoes = avaliacoes.length;
    const mediaAvaliacoes =
      totalAvaliacoes > 0
        ? avaliacoes.reduce((acc, item) => acc + Number(item.nota || 0), 0) /
          totalAvaliacoes
        : 0;
    const aprovacoes = avaliacoes.filter((item) => Number(item.nota || 0) >= 4).length;
    const aprovacaoPercentual =
      totalAvaliacoes > 0 ? Math.round((aprovacoes / totalAvaliacoes) * 100) : 0;

    const problemasFrequentes = Object.entries(
      ocorrencias.reduce((acc, item) => {
        const chave = item.tipo || item.categoria || item.descricao || "Ocorrência";
        acc[chave] = (acc[chave] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      receita,
      ticketMedio,
      totalCompras,
      ingressosAprovados,
      mediaAvaliacoes,
      totalAvaliacoes,
      aprovacaoPercentual,
      problemasFrequentes,
      comprasPorDia,
      ultimaAtualizacao: ultimaCompra || evento?.updatedAt || evento?.createdAt,
      contagem: getCountdownLabel(
        evento?.dataEvento || evento?.dataInicio || evento?.createdAt
      ),
    };
  }, [avaliacoes, evento, ocorrencias, vendas]);

  // ── Exportação CSV ───────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    setExportModalVisible(true);
  }, []);

  const handleExportCsv = useCallback(() => {
    const csv = buildCSV(evento, metricas, avaliacoes, ocorrencias, alcance);
    setExportModalVisible(false);
    showToast("📄 Relatório CSV gerado!", "success");
    console.log("CSV:\n", csv);
  }, [evento, metricas, avaliacoes, ocorrencias, alcance, showToast]);

  const handleExportShare = useCallback(() => {
    setExportModalVisible(false);
    showToast("📤 Abrindo compartilhamento...", "info");
  }, [showToast]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#05060A", "#0B1020", "#111827"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#05060A", "#0B1020", "#111827"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Toast flutuante */}
      {ToastComponent}

      <ExportReportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onExportCsv={handleExportCsv}
        onShare={handleExportShare}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <BlurView intensity={28} tint={blurTint} style={styles.headerCard}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <Image
              source={{ uri: foto || "https://i.pravatar.cc/300" }}
              style={styles.avatar}
              contentFit="cover"
            />

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{nome || "Administrador"}</Text>
              <Text style={styles.userRole}>Área do Administrador</Text>
            </View>

            {/* Badge AO VIVO + botão notificações */}
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <LiveBadge />
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.notificationButton}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* EVENTO */}
          <View style={styles.eventCard}>
            <Image
              source={{ uri: evento.imagemEvento || DEFAULT_EVENT_IMAGE }}
              style={styles.eventImage}
              contentFit="cover"
            />
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {evento.tituloEvento || "Evento"}
              </Text>
              <Text style={styles.eventLocation}>
                {evento.localEvento || evento.nomeLocal || "Local não informado"}
              </Text>
              <View style={styles.eventDateRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={13}
                  color={colors.textMuted}
                />
                <Text style={styles.eventDate}>
                  {evento.dataEvento || "Data não informada"}
                </Text>
              </View>
            </View>
          </View>
        </BlurView>

        {/* FILTRO DE PERÍODO */}
        <PeriodFilter selected={periodo} onChange={setPeriodo} />

        {/* FATURAMENTO */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.salesCard}
        >
          <View style={styles.salesHeader}>
            <Text style={styles.salesLabel}>Vendas Líquidas</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleExport}
                style={styles.exportButton}
              >
                <View style={[styles.exportIconCircle, { backgroundColor: "rgba(108,92,231,0.2)" }]}>
                  <MaterialCommunityIcons name="export-variant" size={16} color="#6C5CE7" />
                </View>
                <Text style={styles.exportLabel}>Exportar</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={16}
                  color={colors.textMuted}
                  style={styles.exportChevron}
                />
              </TouchableOpacity>
              <MaterialCommunityIcons name="trending-up" size={22} color="#FFF" />
            </View>
          </View>

          <Text style={styles.salesValue}>{formatCurrency(metricas.receita)}</Text>
          <Text style={styles.salesGrowth}>
            {metricas.totalCompras} compra(s) registrada(s)
          </Text>
        </LinearGradient>

        {/* GRÁFICO DE VENDAS POR DIA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendas por Dia</Text>
          <SalesChart comprasPorDia={metricas.comprasPorDia} periodo={periodo} />
        </View>

        {/* STATS */}
        <View style={styles.grid}>
          <BlurView intensity={22} tint={blurTint} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons
                name="ticket-confirmation"
                size={20}
                color={colors.primaryLight}
              />
            </View>
            <Text style={styles.statLabel}>Ingressos Aprovados</Text>
            <Text style={styles.statValue}>{metricas.ingressosAprovados}</Text>
          </BlurView>

          <BlurView intensity={22} tint={blurTint} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons name="currency-usd" size={20} color="#FBBF24" />
            </View>
            <Text style={styles.statLabel}>Ticket Médio</Text>
            <Text style={styles.statValue}>{formatCurrency(metricas.ticketMedio)}</Text>
          </BlurView>

          <BlurView intensity={22} tint={blurTint} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#38BDF8" />
            </View>
            <Text style={styles.statLabel}>Última Atualização</Text>
            <Text style={styles.statSmall}>
              {formatDateTime(metricas.ultimaAtualizacao)}
            </Text>
          </BlurView>

          <BlurView intensity={22} tint={blurTint} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#FB7185" />
            </View>
            <Text style={styles.statLabel}>Contagem</Text>
            <Text style={styles.statSmall}>{metricas.contagem}</Text>
          </BlurView>
        </View>

        {/* ALCANCE */}
        <ReachDashboard alcance={alcance} />

        {/* AVALIAÇÕES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avaliações do Evento</Text>
            <TouchableOpacity activeOpacity={0.9} style={styles.viewButton}>
              <Text style={styles.viewButtonText}>
                {metricas.totalAvaliacoes} avaliação(ões)
              </Text>
            </TouchableOpacity>
          </View>

          <BlurView intensity={24} tint={blurTint} style={styles.ratingCard}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingLabel}>Nota Média</Text>
              <Text style={styles.ratingValue}>
                {metricas.mediaAvaliacoes.toFixed(1)}
              </Text>
            </View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((item) => (
                <MaterialCommunityIcons
                  key={item}
                  name={getStarName(metricas.mediaAvaliacoes, item)}
                  size={38}
                  color="#FFC857"
                />
              ))}
            </View>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={["#FFC857", "#FFB547"]}
                  style={[
                    styles.progressFill,
                    { width: `${metricas.aprovacaoPercentual}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {metricas.aprovacaoPercentual}% aprovação
              </Text>
            </View>
          </BlurView>
        </View>

        {/* PROBLEMAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problemas Frequentes</Text>
          <BlurView intensity={22} tint={blurTint} style={styles.problemCard}>
            {metricas.problemasFrequentes.length ? (
              metricas.problemasFrequentes.map(([problema, total]) => (
                <View key={problema} style={styles.problemRow}>
                  <View style={styles.problemDot} />
                  <Text style={styles.problemText}>
                    {problema} ({total})
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                Nenhuma ocorrência registrada para este evento.
              </Text>
            )}
          </BlurView>
        </View>

        {/* AÇÕES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("AdmQRScanner", {
                  eventoId,
                  eventoNome: evento.tituloEvento || "Evento",
                })
              }
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "rgba(22,163,74,0.2)" }]}>
                <MaterialCommunityIcons name="qrcode-scan" size={22} color="#16A34A" />
              </View>
              <Text style={styles.actionLabel}>Scanner QR Check-in</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textMuted}
                style={styles.actionChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("AdmGerenciarIngressos", {
                  eventoId,
                  evento,
                })
              }
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "rgba(37,99,235,0.2)" }]}>
                <MaterialCommunityIcons name="ticket-percent" size={22} color="#2563EB" />
              </View>
              <Text style={styles.actionLabel}>Gerenciar Ingressos</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textMuted}
                style={styles.actionChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.actionButton}
              onPress={handleExport}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "rgba(124,58,237,0.2)" }]}>
                <MaterialCommunityIcons name="chart-box" size={22} color="#7C3AED" />
              </View>
              <Text style={styles.actionLabel}>Relatórios</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textMuted}
                style={styles.actionChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("CriarEvento", {
                  eventoId,
                  evento,
                  isEditing: true,
                })
              }
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "rgba(234,88,12,0.2)" }]}>
                <MaterialCommunityIcons name="cog-outline" size={22} color="#EA580C" />
              </View>
              <Text style={styles.actionLabel}>Editar Evento</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textMuted}
                style={styles.actionChevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos principais ───────────────────────────────────────────────────────

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scrollContent: { paddingHorizontal: 18, paddingTop: 18 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: {
    color: c.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  headerCard: {
    borderRadius: 30,
    padding: 18,
    overflow: "hidden",
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glass,
  },
  profileRow: { flexDirection: "row", alignItems: "center" },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    marginRight: 12,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#1F2937",
  },
  profileInfo: { flex: 1, marginLeft: 14 },
  userName: { color: "#FFF", fontSize: 21, fontWeight: "800" },
  userRole: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 4 },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
  },
  eventCard: {
    marginTop: 22,
    borderRadius: 22,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: c.glass,
  },
  eventImage: { width: 110, height: 110, backgroundColor: c.surfaceMuted },
  eventContent: { flex: 1, padding: 14, justifyContent: "center" },
  eventTitle: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  eventLocation: { color: "rgba(255,255,255,0.72)", fontSize: 14, marginTop: 6 },
  eventDateRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  eventDate: { color: "rgba(255,255,255,0.58)", fontSize: 12, marginLeft: 6 },
  salesCard: { marginTop: 16, borderRadius: 30, padding: 22 },
  salesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  salesLabel: { color: "rgba(255,255,255,0.72)", fontSize: 14, fontWeight: "700" },
  salesValue: {
    color: "#FFF",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 12,
    letterSpacing: -1,
  },
  salesGrowth: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 8 },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: c.glassStrong,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  exportIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  exportLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
  },
  exportChevron: {
    opacity: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 22,
  },
  statCard: {
    width: "48%",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: c.glass,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.glassStrong,
    marginBottom: 14,
  },
  statLabel: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
  statValue: { color: "#FFF", fontSize: 28, fontWeight: "900", marginTop: 8 },
  statSmall: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
    lineHeight: 30,
  },
  section: { marginTop: 18 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  viewButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: c.primary,
  },
  viewButtonText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  ratingCard: {
    borderRadius: 28,
    padding: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: c.glass,
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingLabel: { color: "rgba(255,255,255,0.65)", fontSize: 16 },
  ratingValue: { color: "#FFF", fontSize: 26, fontWeight: "900" },
  starsRow: { flexDirection: "row", marginTop: 16 },
  progressRow: { marginTop: 18 },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: c.glassStrong,
  },
  progressFill: { width: 0, height: "100%", borderRadius: 999 },
  progressText: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 8 },
  problemCard: {
    borderRadius: 26,
    padding: 20,
    marginTop: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: c.glass,
  },
  problemRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  problemDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FB7185",
    marginRight: 12,
  },
  problemText: { color: "#FFF", fontSize: 15 },
  emptyText: { color: c.textMuted, fontSize: 14, lineHeight: 20 },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
  },
  actionButton: {
    width: "48%",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.glassBorder,
    gap: 10,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: c.textPrimary,
  },
  actionChevron: {
    opacity: 0.5,
  },
});
}
