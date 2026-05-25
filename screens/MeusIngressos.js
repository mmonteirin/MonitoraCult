/**
 * 🎫 TELA: MEUS INGRESSOS
 * 
 * Lista todos os ingressos comprados pelo usuário com:
 * - QR Code visual para cada ingresso
 * - Compartilhamento do QR Code
 * - Filtro por status (ativos, utilizados, cancelados)
 * - Informações detalhadas do evento
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useIngressos } from "../hooks/useIngressos";
import CardIngresso from "../components/CardIngresso";
import { Colors } from "../styles/Colors";

// Converte "DD/MM/AAAA" ou Timestamp Firebase → Date
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

export default function MeusIngressos({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { ingressos, carregarIngressos, loading } = useIngressos();

  const [filtro, setFiltro] = useState("todos"); // todos | ativos | utilizados | cancelados
  const [refreshing, setRefreshing] = useState(false);

  // Carregar ingressos ao montar
  useEffect(() => {
    if (user?.uid) {
      carregarIngressos(user.uid, "todos");
    }
  }, [user?.uid]);

  // Filtrar ingressos
  const ingressosFiltrados = ingressos.filter((compra) => {
    if (filtro === "todos") return true;
    
    // Verificar status dos ingressos dentro da compra
    const ingressosDaCompra = compra.ingressos || [];
    const temIngressosComFiltro = ingressosDaCompra.some((ing) => {
      if (filtro === "ativos") {
        const isFuturo = parseDateBR(compra.eventoDataStr) > new Date();
        return ing.status === "confirmado" && isFuturo;
      }
      return ing.status === filtro;
    });
    
    return temIngressosComFiltro;
  });

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (user?.uid) {
        await carregarIngressos(user.uid, "todos");
      }
    } catch (error) {
      console.error("Erro ao carregar ingressos:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid, carregarIngressos]);

  // Contar ingressos por status
  const contarIngressos = (status) => {
    let count = 0;
    ingressos.forEach((compra) => {
      (compra.ingressos || []).forEach((ing) => {
        if (status === "ativos") {
          const isFuturo = parseDateBR(compra.eventoDataStr) > new Date();
          if (ing.status === "confirmado" && isFuturo) count++;
        } else if (ing.status === status) {
          count++;
        }
      });
    });
    return count;
  };

  const totalAtivos = contarIngressos("ativos");
  const totalUtilizados = contarIngressos("utilizado");
  const totalCancelados = contarIngressos("cancelado");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* HEADER */}
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Ingressos</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* STATS */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statCard, filtro === "todos" && styles.statCardActive]}
          onPress={() => setFiltro("todos")}
        >
          <MaterialCommunityIcons
            name="ticket-confirmation"
            size={20}
            color={filtro === "todos" ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.statCount,
              filtro === "todos" && styles.statCountActive,
            ]}
          >
            {ingressos.reduce((acc, c) => acc + (c.ingressos?.length || 0), 0)}
          </Text>
          <Text
            style={[
              styles.statLabel,
              filtro === "todos" && styles.statLabelActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, filtro === "ativos" && styles.statCardActive]}
          onPress={() => setFiltro("ativos")}
        >
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={filtro === "ativos" ? Colors.success : Colors.textMuted}
          />
          <Text
            style={[
              styles.statCount,
              filtro === "ativos" && styles.statCountActive,
            ]}
          >
            {totalAtivos}
          </Text>
          <Text
            style={[
              styles.statLabel,
              filtro === "ativos" && styles.statLabelActive,
            ]}
          >
            Ativos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, filtro === "utilizados" && styles.statCardActive]}
          onPress={() => setFiltro("utilizados")}
        >
          <MaterialCommunityIcons
            name="history"
            size={20}
            color={filtro === "utilizados" ? Colors.textMuted : Colors.textMuted}
          />
          <Text
            style={[
              styles.statCount,
              filtro === "utilizados" && styles.statCountActive,
            ]}
          >
            {totalUtilizados}
          </Text>
          <Text
            style={[
              styles.statLabel,
              filtro === "utilizados" && styles.statLabelActive,
            ]}
          >
            Usados
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE INGRESSOS */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && ingressos.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Carregando ingressos...</Text>
          </View>
        ) : ingressosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={64}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {filtro === "ativos"
                ? "Nenhum ingresso ativo"
                : filtro === "utilizados"
                ? "Nenhum ingresso utilizado"
                : filtro === "cancelados"
                ? "Nenhum ingresso cancelado"
                : "Nenhum ingresso encontrado"}
            </Text>
            <Text style={styles.emptySub}>
              {filtro === "ativos"
                ? "Você ainda não comprou ingressos para eventos futuros."
                : filtro === "todos"
                ? "Comece explorando eventos e adquira seus primeiros ingressos!"
                : ""}
            </Text>
            {filtro === "todos" && (
              <TouchableOpacity
                style={styles.btnExplorar}
                onPress={() => navigation.navigate("EventoHome")}
              >
                <Text style={styles.btnExplorarText}>Explorar Eventos</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          ingressosFiltrados.map((compra) => (
            <View key={compra.id || compra.compraId}>
              <Text style={styles.compraHeader}>
                {compra.eventoNome}
              </Text>
              {(compra.ingressos || [])
                .filter((ing) => {
                  if (filtro === "todos") return true;
                  if (filtro === "ativos") {
                    const isFuturo = parseDateBR(compra.eventoDataStr) > new Date();
                    return ing.status === "confirmado" && isFuturo;
                  }
                  return ing.status === filtro;
                })
                .map((ingresso, index) => (
                  <CardIngresso
                    key={ingresso.codigoIngresso}
                    compra={compra}
                    ingresso={ingresso}
                    index={index}
                    total={compra.ingressos?.length || 1}
                  />
                ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* INFO FOOTER */}
      {ingressosFiltrados.length > 0 && (
        <View style={styles.infoFooter}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={Colors.textMuted}
          />
          <Text style={styles.infoFooterText}>
            Toque em um ingresso para ver o QR Code e compartilhar
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardActive: {
    backgroundColor: Colors.primary + "10",
    borderColor: Colors.primary,
  },
  statCount: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textMuted,
    marginTop: 4,
  },
  statCountActive: {
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  statLabelActive: {
    color: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  btnExplorar: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  btnExplorarText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  compraHeader: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  infoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoFooterText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
});
