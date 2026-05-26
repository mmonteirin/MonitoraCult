/**
 * screens/TelaNotificacoes.js
 * Tela de Notificações — inbox estilo app moderno
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";

import Animated, {
  FadeInDown,
  FadeIn,
  Layout,
  SlideOutRight,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { darkThemeColors } from "../styles/Colors";
import { NOTIFICATION_TYPES } from "../services/notificationService";

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatarTempo(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  const diff = Date.now() - data.getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (min < 1) return "Agora";
  if (min < 60) return `${min}m atrás`;
  if (h < 24) return `${h}h atrás`;
  if (d === 1) return "Ontem";
  if (d < 7) return `${d}d atrás`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getIconConfig(tipo) {
  switch (tipo) {
    case NOTIFICATION_TYPES.EVENTO_NOVO:
      return { icon: "calendar-plus", color: "#6C5CE7", bg: "rgba(108,92,231,0.15)" };
    case NOTIFICATION_TYPES.EVENTO_LEMBRETE:
      return { icon: "clock-alert-outline", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" };
    case NOTIFICATION_TYPES.EVENTO_CANCELADO:
      return { icon: "calendar-remove", color: "#EF4444", bg: "rgba(239,68,68,0.15)" };
    case NOTIFICATION_TYPES.EVENTO_ALTERADO:
      return { icon: "calendar-edit", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" };
    case NOTIFICATION_TYPES.LIKE:
      return { icon: "heart", color: "#EC4899", bg: "rgba(236,72,153,0.15)" };
    case NOTIFICATION_TYPES.COMENTARIO:
      return { icon: "comment-outline", color: "#22C55E", bg: "rgba(34,197,94,0.15)" };
    case NOTIFICATION_TYPES.FOLLOW:
      return { icon: "account-plus", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" };
    case NOTIFICATION_TYPES.MENSAGEM:
      return { icon: "message-outline", color: "#06B6D4", bg: "rgba(6,182,212,0.15)" };
    case NOTIFICATION_TYPES.COMUNIDADE:
      return { icon: "account-group-outline", color: "#6C5CE7", bg: "rgba(108,92,231,0.15)" };
    default:
      return {
        icon: "bell-outline",
        color: darkThemeColors.textMuted,
        bg: darkThemeColors.surface,
      };
  }
}

// ─── Componente de item ───────────────────────────────────────────────────────

const NotifItem = React.memo(({ item, index, onPress, onMarcarLida, s, colors }) => {
  const { icon, color, bg } = getIconConfig(item.tipo);
  const isNaoLida = !item.lida;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify()}
      layout={Layout.springify()}
      exiting={SlideOutRight}
    >
      <TouchableOpacity
        style={[s.item, isNaoLida && s.itemNaoLido]}
        onPress={() => onPress(item)}
        activeOpacity={0.75}
      >
        {/* INDICADOR NÃO LIDA */}
        {isNaoLida && <View style={s.unreadDot} />}

        {/* ÍCONE */}
        <View style={[s.iconBox, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>

        {/* CONTEÚDO */}
        <View style={s.content}>
          <Text style={[s.titulo, isNaoLida && s.tituloNaoLido]} numberOfLines={1}>
            {item.titulo}
          </Text>
          <Text style={s.corpo} numberOfLines={2}>
            {item.corpo}
          </Text>
          <Text style={s.tempo}>{formatarTempo(item.criadoEm)}</Text>
        </View>

        {/* MARCAR LIDA */}
        {isNaoLida && (
          <TouchableOpacity
            style={s.markBtn}
            onPress={(e) => { e.stopPropagation?.(); onMarcarLida(item.id); }}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Separador de data ────────────────────────────────────────────────────────

function DateSeparator({ label, s }) {
  return (
    <View style={s.separator}>
      <View style={s.sepLine} />
      <Text style={s.sepLabel}>{label}</Text>
      <View style={s.sepLine} />
    </View>
  );
}

function agruparPorData(notifs) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const grupos = [];
  let ultimoLabel = null;

  notifs.forEach((n) => {
    const ts = n.criadoEm;
    const data = ts?.toDate ? ts.toDate() : ts ? new Date(ts.seconds * 1000) : new Date();
    data.setHours(0, 0, 0, 0);

    let label;
    if (data.getTime() === hoje.getTime()) label = "Hoje";
    else if (data.getTime() === ontem.getTime()) label = "Ontem";
    else label = data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

    if (label !== ultimoLabel) {
      grupos.push({ type: "separator", label, id: `sep_${label}` });
      ultimoLabel = label;
    }
    grupos.push({ type: "item", ...n });
  });

  return grupos;
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────

export default function TelaNotificacoes({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = useThemedStyles(createFeedStyles);
  const blurTint = isDark ? "dark" : "light";
  const insets = useSafeAreaInsets();
  const {
    notificacoes, naoLidas, carregando,
    carregarNotificacoes, marcarLida, marcarTodasLidas, limparHistorico,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarNotificacoes();
    setRefreshing(false);
  }, [carregarNotificacoes]);

  const handlePress = useCallback((notif) => {
    if (!notif.lida) marcarLida(notif.id);
    // Navegar conforme dados
    const dados = notif.dados || {};
    switch (notif.tipo) {
      case NOTIFICATION_TYPES.EVENTO_NOVO:
      case NOTIFICATION_TYPES.EVENTO_LEMBRETE:
        if (dados.eventoId) navigation.navigate("EventoStack", { screen: "Detalhes", params: { eventoId: dados.eventoId } });
        break;
      case NOTIFICATION_TYPES.MENSAGEM:
        navigation.navigate("TelaConversas");
        break;
      case NOTIFICATION_TYPES.COMUNIDADE:
        if (dados.groupId) navigation.navigate("ComunidadeStack", { screen: "ComunidadeGrupoDetalhes", params: { groupId: dados.groupId } });
        break;
      default:
        break;
    }
  }, [marcarLida, navigation]);

  const confirmLimpar = () => {
    Alert.alert(
      "Limpar histórico",
      "Todas as notificações serão removidas. Confirma?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar", style: "destructive", onPress: limparHistorico },
      ]
    );
  };

  const items = agruparPorData(notificacoes);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <Animated.View entering={FadeIn.springify()} style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notificações</Text>
          {naoLidas > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{naoLidas > 99 ? "99+" : naoLidas}</Text>
            </View>
          )}
        </View>

        <View style={s.headerActions}>
          {naoLidas > 0 && (
            <TouchableOpacity style={s.headerBtn} onPress={marcarTodasLidas}>
              <MaterialCommunityIcons name="check-all" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {notificacoes.length > 0 && (
            <TouchableOpacity style={s.headerBtn} onPress={confirmLimpar}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* BARRA DE RESUMO */}
      {naoLidas > 0 && (
        <Animated.View entering={FadeInDown.springify()} style={s.summaryBar}>
          <LinearGradient
            colors={["rgba(108,92,231,0.15)", "rgba(108,92,231,0.05)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.summaryGrad}
          >
            <MaterialCommunityIcons name="bell-ring-outline" size={16} color={colors.primary} />
            <Text style={s.summaryText}>
              Você tem <Text style={s.summaryBold}>{naoLidas} notificaç{naoLidas === 1 ? "ão" : "ões"}</Text> não {naoLidas === 1 ? "lida" : "lidas"}
            </Text>
            <TouchableOpacity onPress={marcarTodasLidas}>
              <Text style={s.summaryAction}>Marcar todas</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* LISTA */}
      {carregando && notificacoes.length === 0 ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item, index }) => {
            if (item.type === "separator") {
              return <DateSeparator label={item.label} s={s} />;
            }
            return (
              <NotifItem
                item={item}
                index={index}
                onPress={handlePress}
                onMarcarLida={marcarLida}
                s={s}
                colors={colors}
              />
            );
          }}
          ListEmptyComponent={
            <Animated.View entering={FadeIn.delay(200).springify()} style={s.empty}>
              <View style={s.emptyIcon}>
                <MaterialCommunityIcons name="bell-sleep-outline" size={52} color={colors.textMuted} />
              </View>
              <Text style={s.emptyTitle}>Tudo em dia!</Text>
              <Text style={s.emptySub}>Nenhuma notificação por aqui ainda.</Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

function createFeedStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  // HEADER
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: c.surface,
    justifyContent: "center", alignItems: "center",
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: c.textPrimary },
  badge: {
    backgroundColor: c.primary, borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: 4 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: c.surface,
    justifyContent: "center", alignItems: "center",
  },

  // SUMMARY
  summaryBar: { marginHorizontal: 14, marginTop: 10, borderRadius: 14, overflow: "hidden" },
  summaryGrad: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(108,92,231,0.2)", borderRadius: 14,
  },
  summaryText: { flex: 1, fontSize: 13, color: c.textSecondary },
  summaryBold: { fontWeight: "700", color: c.textPrimary },
  summaryAction: { fontSize: 12, fontWeight: "700", color: c.primary },

  // ITEMS
  item: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 14, marginVertical: 4,
    backgroundColor: c.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: c.border,
    position: "relative",
  },
  itemNaoLido: {
    borderColor: "rgba(108,92,231,0.25)",
    backgroundColor: "rgba(108,92,231,0.05)",
  },
  unreadDot: {
    position: "absolute", top: 14, left: 14,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: c.primary,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  content: { flex: 1 },
  titulo: { fontSize: 13, color: c.textSecondary, fontWeight: "600", marginBottom: 3 },
  tituloNaoLido: { color: c.textPrimary, fontWeight: "700" },
  corpo: { fontSize: 13, color: c.textMuted, lineHeight: 18 },
  tempo: { fontSize: 11, color: c.textMuted, marginTop: 5 },
  markBtn: { padding: 4 },

  // SEPARATOR
  separator: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginVertical: 10, gap: 10 },
  sepLine: { flex: 1, height: 1, backgroundColor: c.border },
  sepLabel: { fontSize: 11, color: c.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },

  // EMPTY
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 40 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 28, backgroundColor: c.surface,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: c.border, marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: c.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: c.textMuted, textAlign: "center", lineHeight: 20 },
});
}
