import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
} from "firebase/firestore";

import { useAuth } from "../context/AuthContext";

import { db } from "../firebaseConfig";

import { obterEstatisticasVendas } from "../services/ingressoServiceV2";

import { Colors } from "../styles/Colors";

const DEFAULT_EVENT_IMAGE =
  "https://placehold.co/600x400/png";

const toDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;

  if (typeof value === "string") {
    const brMatch = value.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (brMatch) {
      const [, day, month, year] = brMatch;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );
    }

    const isoDateMatch = value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );
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

  const diffDays = Math.ceil(
    (eventDate - today) / 86400000
  );

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

// ─── Dashboard de Alcance ────────────────────────────────────────────────────

const REACH_STEPS = [
  {
    key: "visualizacoes",
    label: "Viram",
    icon: "eye-outline",
    color: "#38BDF8",
    bg: "rgba(56,189,248,0.12)",
    description: "Pessoas que visualizaram o evento",
  },
  {
    key: "cliques",
    label: "Clicaram",
    icon: "cursor-default-click-outline",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.12)",
    description: "Acessaram a página do evento",
  },
  {
    key: "inscricoes",
    label: "Inscreveram",
    icon: "ticket-confirmation-outline",
    color: "#34D399",
    bg: "rgba(52,211,153,0.12)",
    description: "Garantiram presença ou ingresso",
  },
  {
    key: "comparecimentos",
    label: "Foram",
    icon: "map-marker-check-outline",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.12)",
    description: "Compareceram ao evento",
  },
];

function ReachDashboard({ alcance }) {
  const dados = alcance || {};

  const valores = REACH_STEPS.map((step) =>
    Number(dados[step.key] || 0)
  );

  const maximo = Math.max(...valores, 1);

  const taxaConversao =
    valores[0] > 0
      ? ((valores[2] / valores[0]) * 100).toFixed(1)
      : "0.0";

  const taxaComparecimento =
    valores[2] > 0
      ? ((valores[3] / valores[2]) * 100).toFixed(1)
      : "0.0";

  return (
    <View style={reachStyles.wrapper}>
      {/* Título */}
      <View style={reachStyles.header}>
        <View style={reachStyles.titleRow}>
          <MaterialCommunityIcons
            name="radar"
            size={22}
            color="#A78BFA"
          />
          <Text style={reachStyles.title}>
            Dashboard de Alcance
          </Text>
        </View>
        <Text style={reachStyles.subtitle}>
          Funil de engajamento do evento
        </Text>
      </View>

      {/* Cards de métricas */}
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
              tint="dark"
              style={reachStyles.metricCard}
            >
              {/* Ícone */}
              <View
                style={[
                  reachStyles.iconWrap,
                  { backgroundColor: step.bg },
                ]}
              >
                <MaterialCommunityIcons
                  name={step.icon}
                  size={20}
                  color={step.color}
                />
              </View>

              {/* Número */}
              <Text style={reachStyles.metricValue}>
                {valor.toLocaleString("pt-BR")}
              </Text>

              {/* Label */}
              <Text style={reachStyles.metricLabel}>
                {step.label}
              </Text>

              {/* Taxa de conversão do passo anterior */}
              {taxa !== null && (
                <View
                  style={[
                    reachStyles.taxaBadge,
                    { backgroundColor: step.bg },
                  ]}
                >
                  <Text
                    style={[
                      reachStyles.taxaText,
                      { color: step.color },
                    ]}
                  >
                    {taxa}%
                  </Text>
                </View>
              )}
            </BlurView>
          );
        })}
      </View>

      {/* Funil visual */}
      <BlurView
        intensity={20}
        tint="dark"
        style={reachStyles.funnelCard}
      >
        <Text style={reachStyles.funnelTitle}>
          Funil de Conversão
        </Text>

        {REACH_STEPS.map((step, index) => {
          const valor = valores[index];
          const pct = maximo > 0 ? (valor / maximo) * 100 : 0;

          return (
            <View key={step.key} style={reachStyles.funnelRow}>
              {/* Label */}
              <View style={reachStyles.funnelLabelWrap}>
                <MaterialCommunityIcons
                  name={step.icon}
                  size={14}
                  color={step.color}
                />
                <Text style={reachStyles.funnelLabel}>
                  {step.label}
                </Text>
              </View>

              {/* Barra */}
              <View style={reachStyles.funnelBarTrack}>
                <LinearGradient
                  colors={[step.color, step.color + "99"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    reachStyles.funnelBarFill,
                    { width: `${pct}%` },
                  ]}
                />
              </View>

              {/* Valor */}
              <Text style={reachStyles.funnelValue}>
                {valor.toLocaleString("pt-BR")}
              </Text>
            </View>
          );
        })}
      </BlurView>

      {/* Indicadores síntese */}
      <View style={reachStyles.synthRow}>
        <BlurView
          intensity={20}
          tint="dark"
          style={reachStyles.synthCard}
        >
          <MaterialCommunityIcons
            name="filter-outline"
            size={18}
            color="#34D399"
          />
          <Text style={reachStyles.synthValue}>
            {taxaConversao}%
          </Text>
          <Text style={reachStyles.synthLabel}>
            Conversão{"\n"}Geral
          </Text>
        </BlurView>

        <BlurView
          intensity={20}
          tint="dark"
          style={reachStyles.synthCard}
        >
          <MaterialCommunityIcons
            name="walk"
            size={18}
            color="#FBBF24"
          />
          <Text style={reachStyles.synthValue}>
            {taxaComparecimento}%
          </Text>
          <Text style={reachStyles.synthLabel}>
            Taxa de{"\n"}Comparecimento
          </Text>
        </BlurView>

        <BlurView
          intensity={20}
          tint="dark"
          style={reachStyles.synthCard}
        >
          <MaterialCommunityIcons
            name="account-multiple-outline"
            size={18}
            color="#38BDF8"
          />
          <Text style={reachStyles.synthValue}>
            {(valores[0] - valores[2]).toLocaleString("pt-BR")}
          </Text>
          <Text style={reachStyles.synthLabel}>
            Viram mas não{"\n"}inscreveram
          </Text>
        </BlurView>
      </View>
    </View>
  );
}

const reachStyles = StyleSheet.create({
  wrapper: {
    marginTop: 22,
  },

  header: {
    marginBottom: 14,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    marginLeft: 8,
  },

  subtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    marginTop: 4,
  },

  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

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

  metricValue: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
  },

  metricLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
  },

  taxaBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },

  taxaText: {
    fontSize: 11,
    fontWeight: "800",
  },

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

  funnelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  funnelLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    width: 90,
    gap: 6,
  },

  funnelLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginLeft: 6,
  },

  funnelBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    marginHorizontal: 10,
  },

  funnelBarFill: {
    height: "100%",
    borderRadius: 999,
    minWidth: 4,
  },

  funnelValue: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    width: 52,
    textAlign: "right",
  },

  synthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 10,
  },

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

  synthValue: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },

  synthLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});

// ─────────────────────────────────────────────────────────────────────────────

export default function AdmEventoDashIndividual({
  navigation,
  route,
}) {
  const { nome, foto } = useAuth();

  const eventoId =
    route?.params?.eventoId ||
    route?.params?.evento?.id;

  const [evento, setEvento] = useState(
    route?.params?.evento || {}
  );

  const [vendas, setVendas] = useState(null);

  const [avaliacoes, setAvaliacoes] = useState([]);

  const [ocorrencias, setOcorrencias] = useState([]);

  const [alcance, setAlcance] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const carregarDados = async () => {
      if (!eventoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const eventoRef = doc(db, "eventos", eventoId);

        const [
          eventoSnap,
          vendasData,
          avaliacoesSnap,
          ocorrenciasSnap,
          alcanceSnap,
        ] = await Promise.all([
          getDoc(eventoRef),
          obterEstatisticasVendas(eventoId),
          getDocs(
            query(
              collection(
                db,
                "eventos",
                eventoId,
                "avaliacoes"
              ),
              orderBy("createdAt", "desc")
            )
          ),
          getDocs(
            query(
              collection(
                db,
                "eventos",
                eventoId,
                "ocorrencias"
              ),
              orderBy("createdAt", "desc")
            )
          ),
          getDoc(doc(db, "eventos", eventoId, "metricas", "alcance")),
        ]);

        if (!mounted) return;

        if (eventoSnap.exists()) {
          setEvento({
            id: eventoSnap.id,
            ...eventoSnap.data(),
          });
        }

        setVendas(vendasData || null);

        setAlcance(
          alcanceSnap.exists()
            ? alcanceSnap.data()
            : {
                visualizacoes: evento?.visualizacoes || 0,
                cliques: evento?.cliques || 0,
                inscricoes:
                  evento?.inscricoes ||
                  vendas?.totalIngressosVendidos ||
                  evento?.ingressosVendidos ||
                  0,
                comparecimentos: evento?.comparecimentos || 0,
              }
        );

        setAvaliacoes(
          avaliacoesSnap.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );

        setOcorrencias(
          ocorrenciasSnap.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
      } catch (error) {
        console.log(error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    carregarDados();

    return () => {
      mounted = false;
    };
  }, [eventoId]);

  const metricas = useMemo(() => {
    const statusIngressos =
      vendas?.statusIngressos || {};

    const totalIngressos =
      vendas?.totalIngressosVendidos ||
      evento?.ingressosVendidos ||
      0;

    const ingressosCancelados =
      statusIngressos.cancelado || 0;

    const ingressosAprovados = Math.max(
      0,
      totalIngressos - ingressosCancelados
    );

    const receita =
      vendas?.arrecadacaoTotal ||
      evento?.arrecadacaoTotal ||
      evento?.receita ||
      0;

    const ticketMedio =
      ingressosAprovados > 0
        ? receita / ingressosAprovados
        : 0;

    const comprasPorDia =
      vendas?.comprasPorDia || {};

    const totalCompras = Object.values(
      comprasPorDia
    ).reduce(
      (acc, item) => acc + (item.compras || 0),
      0
    );

    const diasComCompra = Object.keys(
      comprasPorDia
    ).sort();

    const ultimaCompra =
      diasComCompra[diasComCompra.length - 1];

    const totalAvaliacoes = avaliacoes.length;

    const mediaAvaliacoes =
      totalAvaliacoes > 0
        ? avaliacoes.reduce(
            (acc, item) =>
              acc + Number(item.nota || 0),
            0
          ) / totalAvaliacoes
        : 0;

    const aprovacoes = avaliacoes.filter(
      (item) => Number(item.nota || 0) >= 4
    ).length;

    const aprovacaoPercentual =
      totalAvaliacoes > 0
        ? Math.round(
            (aprovacoes / totalAvaliacoes) * 100
          )
        : 0;

    const problemasFrequentes = Object.entries(
      ocorrencias.reduce((acc, item) => {
        const chave =
          item.tipo ||
          item.categoria ||
          item.descricao ||
          "Ocorrência";

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
      ultimaAtualizacao:
        ultimaCompra ||
        evento?.updatedAt ||
        evento?.createdAt,
      contagem: getCountdownLabel(
        evento?.dataEvento ||
          evento?.dataInicio ||
          evento?.createdAt
      ),
    };
  }, [avaliacoes, evento, ocorrencias, vendas]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[
            "#05060A",
            "#0B1020",
            "#111827",
          ]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.loadingState}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.loadingText}>
            Carregando dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          "#05060A",
          "#0B1020",
          "#111827",
        ]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <BlurView
          intensity={28}
          tint="dark"
          style={styles.headerCard}
        >
          <View style={styles.profileRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>

            <Image
              source={{
                uri: foto || "https://i.pravatar.cc/300",
              }}
              style={styles.avatar}
              contentFit="cover"
            />

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {nome || "Administrador"}
              </Text>

              <Text style={styles.userRole}>
                Área do Administrador
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.notificationButton}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* EVENTO */}
          <View style={styles.eventCard}>
            <Image
              source={{
                uri:
                  evento.imagemEvento ||
                  DEFAULT_EVENT_IMAGE,
              }}
              style={styles.eventImage}
              contentFit="cover"
            />

            <View style={styles.eventContent}>
              <Text
                style={styles.eventTitle}
                numberOfLines={1}
              >
                {evento.tituloEvento || "Evento"}
              </Text>

              <Text style={styles.eventLocation}>
                {evento.localEvento ||
                  evento.nomeLocal ||
                  "Local não informado"}
              </Text>

              <View style={styles.eventDateRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={13}
                  color={Colors.textMuted}
                />

                <Text style={styles.eventDate}>
                  {evento.dataEvento || "Data não informada"}
                </Text>
              </View>
            </View>
          </View>
        </BlurView>

        {/* FATURAMENTO */}
        <LinearGradient
          colors={[
            Colors.primary,
            Colors.primaryDark,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.salesCard}
        >
          <View style={styles.salesHeader}>
            <Text style={styles.salesLabel}>
              Vendas Líquidas
            </Text>

            <MaterialCommunityIcons
              name="trending-up"
              size={22}
              color="#FFF"
            />
          </View>

          <Text style={styles.salesValue}>
            {formatCurrency(metricas.receita)}
          </Text>

          <Text style={styles.salesGrowth}>
            {metricas.totalCompras} compra(s) registrada(s)
          </Text>
        </LinearGradient>

        {/* STATS */}
        <View style={styles.grid}>
          <BlurView
            intensity={22}
            tint="dark"
            style={styles.statCard}
          >
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons
                name="ticket-confirmation"
                size={20}
                color={Colors.primaryLight}
              />
            </View>

            <Text style={styles.statLabel}>
              Ingressos Aprovados
            </Text>

            <Text style={styles.statValue}>
              {metricas.ingressosAprovados}
            </Text>
          </BlurView>

          <BlurView
            intensity={22}
            tint="dark"
            style={styles.statCard}
          >
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons
                name="currency-usd"
                size={20}
                color="#FBBF24"
              />
            </View>

            <Text style={styles.statLabel}>
              Ticket Médio
            </Text>

            <Text style={styles.statValue}>
              {formatCurrency(metricas.ticketMedio)}
            </Text>
          </BlurView>

          <BlurView
            intensity={22}
            tint="dark"
            style={styles.statCard}
          >
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color="#38BDF8"
              />
            </View>

            <Text style={styles.statLabel}>
              Última Atualização
            </Text>

            <Text style={styles.statSmall}>
              {formatDateTime(
                metricas.ultimaAtualizacao
              )}
            </Text>
          </BlurView>

          <BlurView
            intensity={22}
            tint="dark"
            style={styles.statCard}
          >
            <View style={styles.statIconWrap}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={20}
                color="#FB7185"
              />
            </View>

            <Text style={styles.statLabel}>
              Contagem
            </Text>

            <Text style={styles.statSmall}>
              {metricas.contagem}
            </Text>
          </BlurView>
        </View>

        {/* ALCANCE */}
        <ReachDashboard alcance={alcance} />

        {/* AVALIAÇÕES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Avaliações do Evento
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.viewButton}
            >
              <Text style={styles.viewButtonText}>
                {metricas.totalAvaliacoes} avaliação(ões)
              </Text>
            </TouchableOpacity>
          </View>

          <BlurView
            intensity={24}
            tint="dark"
            style={styles.ratingCard}
          >
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingLabel}>
                Nota Média
              </Text>

              <Text style={styles.ratingValue}>
                {metricas.mediaAvaliacoes.toFixed(1)}
              </Text>
            </View>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((item) => (
                <MaterialCommunityIcons
                  key={item}
                  name={getStarName(
                    metricas.mediaAvaliacoes,
                    item
                  )}
                  size={38}
                  color="#FFC857"
                />
              ))}
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[
                    "#FFC857",
                    "#FFB547",
                  ]}
                  style={[
                    styles.progressFill,
                    {
                      width: `${metricas.aprovacaoPercentual}%`,
                    },
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
          <Text style={styles.sectionTitle}>
            Problemas Frequentes
          </Text>

          <BlurView
            intensity={22}
            tint="dark"
            style={styles.problemCard}
          >
            {metricas.problemasFrequentes.length ? (
              metricas.problemasFrequentes.map(
                ([problema, total]) => (
                  <View
                    key={problema}
                    style={styles.problemRow}
                  >
                    <View style={styles.problemDot} />

                    <Text style={styles.problemText}>
                      {problema} ({total})
                    </Text>
                  </View>
                )
              )
            ) : (
              <Text style={styles.emptyText}>
                Nenhuma ocorrência registrada para este evento.
              </Text>
            )}
          </BlurView>
        </View>

        {/* AÇÕES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ações Rápidas
          </Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("AdmQRScanner", {
                  eventoId,
                  eventoNome: evento.tituloEvento || "Evento",
                })
              }
            >
              <LinearGradient
                colors={[
                  "#16A34A",
                  "#15803D",
                ]}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={24}
                  color="#FFF"
                />

                <Text style={styles.actionText}>
                  Scanner QR{"\n"}Check-in
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.actionButton}
            >
              <LinearGradient
                colors={[
                  "#2563EB",
                  "#1D4ED8",
                ]}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons
                  name="ticket-percent"
                  size={24}
                  color="#FFF"
                />

                <Text style={styles.actionText}>
                  Gerenciar Ingressos
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.actionButton}
            >
              <LinearGradient
                colors={[
                  "#7C3AED",
                  "#5B21B6",
                ]}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons
                  name="chart-box"
                  size={24}
                  color="#FFF"
                />

                <Text style={styles.actionText}>
                  Relatórios
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.actionButton}
            >
              <LinearGradient
                colors={[
                  "#EA580C",
                  "#C2410C",
                ]}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={24}
                  color="#FFF"
                />

                <Text style={styles.actionText}>
                  Configurações
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },

  headerCard: {
    borderRadius: 30,
    padding: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginRight: 12,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#1F2937",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  userName: {
    color: "#FFF",
    fontSize: 21,
    fontWeight: "800",
  },

  userRole: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    marginTop: 4,
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  eventCard: {
    marginTop: 22,
    borderRadius: 22,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  eventImage: {
    width: 110,
    height: 110,
    backgroundColor: "#111827",
  },

  eventContent: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },

  eventTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
  },

  eventLocation: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    marginTop: 6,
  },

  eventDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  eventDate: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    marginLeft: 6,
  },

  salesCard: {
    marginTop: 22,
    borderRadius: 30,
    padding: 22,
  },

  salesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  salesLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "700",
  },

  salesValue: {
    color: "#FFF",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 12,
    letterSpacing: -1,
  },

  salesGrowth: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    marginTop: 8,
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
    borderColor: "rgba(255,255,255,0.06)",
  },

  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },

  statLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },

  statValue: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 8,
  },

  statSmall: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
    lineHeight: 30,
  },

  section: {
    marginTop: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
  },

  viewButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },

  viewButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },

  ratingCard: {
    borderRadius: 28,
    padding: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ratingLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 16,
  },

  ratingValue: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "900",
  },

  starsRow: {
    flexDirection: "row",
    marginTop: 16,
  },

  progressRow: {
    marginTop: 18,
  },

  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressFill: {
    width: 0,
    height: "100%",
    borderRadius: 999,
  },

  progressText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    marginTop: 8,
  },

  problemCard: {
    borderRadius: 26,
    padding: 20,
    marginTop: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  problemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  problemDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#FB7185",
    marginRight: 12,
  },

  problemText: {
    color: "#FFF",
    fontSize: 15,
  },

  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
  },

  actionButton: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
  },

  actionGradient: {
    height: 120,
    padding: 18,
    justifyContent: "space-between",
  },

  actionText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
});