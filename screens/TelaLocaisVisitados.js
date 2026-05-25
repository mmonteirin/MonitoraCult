/**
 * TelaLocaisVisitados.js
 *
 * Tela do histórico de locais visitados. Acessada via PerfilStack.
 *
 * Seções:
 *  1. Header com stats (total locais, visitas, categoria favorita)
 *  2. Podium dos 3 locais mais frequentados
 *  3. Lista completa com opção de remover
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { auth } from "../firebaseConfig";
import { Colors } from "../styles/Colors";
import { removerLocalVisitado } from "../services/localVisitadoService";
import useLocaisVisitados from "../hooks/useLocaisVisitados";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(valor) {
  if (!valor) return "—";
  const date = valor?.toDate ? valor.toDate() : new Date(valor);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
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

function StatCard({ icon, valor, label, color = Colors.primary }) {
  return (
    <BlurView intensity={30} tint="dark" style={styles.statCard}>
      <LinearGradient
        colors={[`${color}22`, "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={styles.statValor}>{valor ?? "—"}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </BlurView>
  );
}

function PodiumCard({ local, posicao }) {
  const colors = ["#FFD166", "#C4C8D4", "#CD7F32"];
  const color = colors[posicao] || Colors.primary;
  const icon = iconeCategoria(local.categoria);

  return (
    <Animated.View
      entering={FadeInDown.delay(posicao * 80).springify()}
      style={styles.podiumCard}
    >
      <BlurView intensity={35} tint="dark" style={styles.podiumInner}>
        <LinearGradient
          colors={[`${color}18`, "transparent"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.podiumBadge, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
          <Text style={[styles.podiumPos, { color }]}>#{posicao + 1}</Text>
        </View>
        <View style={[styles.podiumIconCircle, { backgroundColor: `${color}18` }]}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
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

function LocalCard({ item, index, onRemover }) {
  const icon = iconeCategoria(item.categoria);
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <BlurView intensity={30} tint="dark" style={styles.card}>
        <LinearGradient
          colors={["rgba(124,58,237,0.10)", "transparent"]}
          style={styles.cardGlow}
        />

        <View style={styles.cardMain}>
          {/* Ícone */}
          <View style={styles.cardIconWrap}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark || "#5B21B6"]}
              style={StyleSheet.absoluteFill}
            />
            <MaterialCommunityIcons name={icon} size={18} color="#FFF" />
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardNome} numberOfLines={1}>
              {item.nome}
            </Text>
            <View style={styles.cardMeta}>
              {item.bairro ? (
                <Text style={styles.cardMetaText} numberOfLines={1}>
                  📍 {item.bairro}
                </Text>
              ) : null}
              {item.categoria ? (
                <Text style={styles.cardMetaText} numberOfLines={1}>
                  · {item.categoria}
                </Text>
              ) : null}
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
              size={19}
              color={Colors.error}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.cardVisitasBadge}>
            <MaterialCommunityIcons
              name="repeat"
              size={13}
              color={Colors.primaryLight || "#8B7CFF"}
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

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function TelaLocaisVisitados() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;

  const { locais, favoritos, stats, loading, refresh } = useLocaisVisitados(uid);
  const [removendo, setRemovendoId] = useState(null);

  const handleRemover = async (localId) => {
    setRemovendoId(localId);
    await removerLocalVisitado(uid, localId);
    await refresh();
    setRemovendoId(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <LinearGradient
        colors={["#111827", "#070B14"]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Locais Visitados</Text>
            <Text style={styles.subtitle}>Seus espaços culturais favoritos</Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatCard
            icon="map-marker-multiple"
            valor={stats.totalLocais}
            label="Locais"
            color={Colors.primary}
          />
          <StatCard
            icon="ticket-confirmation-outline"
            valor={stats.totalVisitas}
            label="Visitas"
            color={Colors.accentCyan || "#22D3EE"}
          />
          <StatCard
            icon="music"
            valor={stats.categoriaMaisVisitada || "—"}
            label="Categoria fav."
            color="#FFD166"
          />
          <StatCard
            icon="home-city"
            valor={stats.bairroFavorito || "—"}
            label="Bairro fav."
            color={Colors.success}
          />
        </View>
      </LinearGradient>

      {/* ── CONTEÚDO ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : locais.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="map-marker-off-outline"
              size={42}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>Nenhum local ainda</Text>
          <Text style={styles.emptyText}>
            Seus locais visitados aparecerão aqui conforme você frequentar eventos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={locais}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListHeaderComponent={
            favoritos.length >= 2 ? (
              <View style={styles.podiumSection}>
                <View style={styles.sectionHeaderRow}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={16}
                    color="#FFD166"
                  />
                  <Text style={styles.sectionTitle}>Seus favoritos</Text>
                </View>
                <View style={styles.podiumRow}>
                  {favoritos.map((local, i) => (
                    <PodiumCard key={local.id} local={local} posicao={i} />
                  ))}
                </View>
                <View style={styles.sectionDivider} />
                <Text style={styles.sectionTitle2}>Todos os locais</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <LocalCard
              item={item}
              index={index}
              onRemover={handleRemover}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  title: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 3,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  statValor: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
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
  podiumRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  podiumCard: {
    flex: 1,
  },
  podiumInner: {
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  podiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  podiumPos: {
    fontSize: 11,
    fontWeight: "800",
  },
  podiumIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  podiumNome: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 17,
  },
  podiumBairro: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
  },
  podiumVisitas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  podiumVisitasText: {
    fontSize: 12,
    fontWeight: "800",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 16,
  },
  sectionTitle2: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },

  // Cards da lista
  card: {
    borderRadius: 24,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardNome: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 2,
  },
  cardMetaText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  cardVisitasBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(108,92,231,0.14)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  cardVisitasText: {
    color: Colors.primaryLight || "#8B7CFF",
    fontSize: 12,
    fontWeight: "700",
  },
  cardData: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
  },

  // Loading / Empty
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(124,58,237,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
