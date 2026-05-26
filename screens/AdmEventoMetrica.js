// ✅ AdmEventoMetricas.jsx COMPLETO
// 🔥 Agora conectado com TODOS os eventos do administrador
// 🔥 Mostra:
// - Total de Eventos
// - Total de Avaliações
// - Média Geral
// - Total de Likes
// - Total de Views
// - Total de Participantes
// - Gráfico de avaliações
// - Sentimento geral

import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";

import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

import {
  BarChart,
  PieChart,
} from "react-native-chart-kit";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import { BlurView } from "expo-blur";

import { MotiView } from "moti";

import { Colors } from "../styles/Colors";

import { useAuth } from "../context/AuthContext";

const screenWidth =
  Dimensions.get("window").width;

export default function AdmEventoMetricas({
  navigation,
}) {
  const { user } = useAuth();

  const [loading, setLoading] =
    useState(true);

  const [eventos, setEventos] =
    useState([]);

  const [avaliacoes, setAvaliacoes] =
    useState([]);

  const [metricas, setMetricas] =
    useState({
      totalEventos: 0,
      totalLikes: 0,
      totalViews: 0,
      totalParticipantes: 0,
    });

  useEffect(() => {
    if (!user?.uid) return;

    carregarDados();
  }, [user?.uid]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // 🔥 BUSCAR EVENTOS DO ADM
      const eventosQuery = query(
        collection(db, "eventos"),
        where(
          "uidEvento",
          "==",
          user.uid
        )
      );

      const eventosSnap =
        await getDocs(eventosQuery);

      const listaEventos =
        eventosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

      setEventos(listaEventos);

      // 🔥 MÉTRICAS
      let totalLikes = 0;
      let totalViews = 0;
      let totalParticipantes = 0;

      listaEventos.forEach((evento) => {
        totalLikes +=
          evento.likes || 0;

        totalViews +=
          evento.views || 0;

        totalParticipantes +=
          evento.participantes || 0;
      });

      // 🔥 BUSCAR TODAS AVALIAÇÕES
      let todasAvaliacoes = [];

      for (const evento of listaEventos) {
        const avaliacoesSnap =
          await getDocs(
            collection(
              db,
              "eventos",
              evento.id,
              "avaliacoes"
            )
          );

        const lista =
          avaliacoesSnap.docs.map(
            (doc) => ({
              id: doc.id,
              eventoId: evento.id,
              ...doc.data(),
            })
          );

        todasAvaliacoes.push(...lista);
      }

      setAvaliacoes(todasAvaliacoes);

      setMetricas({
        totalEventos:
          listaEventos.length,

        totalLikes,

        totalViews,

        totalParticipantes,
      });

      setLoading(false);
    } catch (err) {
      console.log(err);

      setLoading(false);
    }
  };

  /* 🔥 ESTATÍSTICAS */

  const totalAvaliacoes =
    avaliacoes.length;

  const media =
    totalAvaliacoes > 0
      ? (
          avaliacoes.reduce(
            (acc, item) =>
              acc +
              (item?.nota || 0),
            0
          ) / totalAvaliacoes
        ).toFixed(1)
      : 0;

  const contar = (nota) =>
    avaliacoes.filter(
      (a) =>
        (a?.nota || 0) === nota
    ).length;

  /* 🔥 CHARTS */

  const chartDataBar = {
    labels: [
      "5★",
      "4★",
      "3★",
      "2★",
      "1★",
    ],

    datasets: [
      {
        data: [
          contar(5),
          contar(4),
          contar(3),
          contar(2),
          contar(1),
        ],
      },
    ],
  };

  const pieData = [
    {
      name: "Positivo",
      population:
        contar(5) + contar(4),
      color: "#22C55E",
      legendFontColor: "#FFF",
      legendFontSize: 12,
    },

    {
      name: "Neutro",
      population: contar(3),
      color: "#F59E0B",
      legendFontColor: "#FFF",
      legendFontSize: 12,
    },

    {
      name: "Negativo",
      population:
        contar(2) + contar(1),
      color: "#EF4444",
      legendFontColor: "#FFF",
      legendFontSize: 12,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />

        <Text style={styles.loadingText}>
          Carregando métricas...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
      />

      {/* HEADER */}
      <LinearGradient
        colors={[
          "#0F172A",
          "#111827",
          "#1E1B4B",
        ]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.goBack()
          }
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="#FFF"
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>
            Dashboard Geral
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            Todos os eventos
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* CARDS */}
        <View style={styles.grid}>
          <MetricCard
            title="Eventos"
            value={
              metricas.totalEventos
            }
            icon="calendar"
            color="#8B5CF6"
          />

          <MetricCard
            title="Avaliações"
            value={totalAvaliacoes}
            icon="star"
            color="#F59E0B"
          />

          <MetricCard
            title="Média"
            value={`${media} ★`}
            icon="chart-line"
            color="#06B6D4"
          />

          <MetricCard
            title="Likes"
            value={
              metricas.totalLikes
            }
            icon="heart"
            color="#EF4444"
          />

          <MetricCard
            title="Views"
            value={
              metricas.totalViews
            }
            icon="eye"
            color="#22C55E"
          />

          <MetricCard
            title="Participantes"
            value={
              metricas.totalParticipantes
            }
            icon="account-group"
            color="#6366F1"
          />
        </View>

        {/* BAR */}
        <Text style={styles.section}>
          Distribuição de Notas
        </Text>

        <BlurView
          intensity={50}
          tint="dark"
          style={styles.chartCard}
        >
          <BarChart
            data={chartDataBar}
            width={screenWidth - 50}
            height={240}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            chartConfig={chartConfig}
          />
        </BlurView>

        {/* PIE */}
        <Text style={styles.section}>
          Sentimento Geral
        </Text>

        <BlurView
          intensity={50}
          tint="dark"
          style={styles.chartCard}
        >
          <PieChart
            data={pieData}
            width={screenWidth - 50}
            height={230}
            accessor="population"
            backgroundColor="transparent"
            chartConfig={chartConfig}
            absolute
          />
        </BlurView>
      </ScrollView>
    </View>
  );
}

/* 🔥 CARD */
function MetricCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        type: "timing",
        duration: 500,
      }}
      style={styles.metricCard}
    >
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.08)",
          "rgba(255,255,255,0.03)",
        ]}
        style={styles.metricGradient}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: color,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color="#FFF"
          />
        </View>

        <Text style={styles.metricTitle}>
          {title}
        </Text>

        <Text style={styles.metricValue}>
          {value}
        </Text>
      </LinearGradient>
    </MotiView>
  );
}

/* CHART CONFIG */
const chartConfig = {
  backgroundGradientFrom:
    "transparent",

  backgroundGradientTo:
    "transparent",

  decimalPlaces: 0,

  color: (opacity = 1) =>
    `rgba(139,92,246, ${opacity})`,

  labelColor: () =>
    "rgba(255,255,255,0.7)",

  propsForBackgroundLines: {
    stroke:
      "rgba(255,255,255,0.08)",
  },

  barPercentage: 0.7,
};

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#070B14",
  },

  loadingText: {
    color: "#FFF",
    marginTop: 14,
  },

  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,

    flexDirection: "row",
    alignItems: "center",

    gap: 16,
  },

  backButton: {
    width: 46,
    height: 46,

    borderRadius: 16,

    backgroundColor:
      "rgba(255,255,255,0.08)",

    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  headerSubtitle: {
    color:
      "rgba(255,255,255,0.6)",

    marginTop: 4,
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent:
      "space-between",
  },

  metricCard: {
    width: "48%",
    marginBottom: 16,
  },

  metricGradient: {
    borderRadius: 24,
    padding: 18,

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.05)",
  },

  iconBox: {
    width: 48,
    height: 48,

    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 14,
  },

  metricTitle: {
    color:
      "rgba(255,255,255,0.65)",

    fontSize: 13,

    marginBottom: 6,
  },

  metricValue: {
    color: "#FFF",

    fontSize: 24,
    fontWeight: "bold",
  },

  section: {
    color: "#FFF",

    fontSize: 18,
    fontWeight: "bold",

    marginTop: 20,
    marginBottom: 14,
  },

  chartCard: {
    borderRadius: 26,

    overflow: "hidden",

    paddingVertical: 20,

    marginBottom: 24,

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.06)",
  },
});