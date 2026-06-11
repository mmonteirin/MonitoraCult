/**
 * 🛒 TELA DE CARRINHO DE INGRESSOS
 * 
 * Tela separada para revisar e confirmar a compra de ingressos
 * Etapa intermediária entre seleção e confirmação
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useIngressos } from "../hooks/useIngressos";
import { useTheme } from "../context/ThemeContext";
import CarrinhoIngressos from "../components/CarrinhoIngressos";
import { TIPOS_INGRESSO } from "../services/ingressoServiceV2";

export default function TelaCarrinhoIngressos({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const evento = route.params?.evento;

  const {
    carrinho,
    loading,
    removerDoCarrinho,
    comprar,
    total,
    quantidadeTotal,
  } = useIngressos();

  const [processando, setProcessando] = useState(false);

  const gratuito = useMemo(() => {
    const precoBase = Number(
      evento?.precoIngresso ??
      evento?.precoInteira ??
      evento?.preco ??
      evento?.valor ??
      0
    ) || 0;
    return evento?.gratuito === true ||
           evento?.tipoEvento === "gratuito" ||
           precoBase === 0;
  }, [evento]);

  const economiaTotal = useMemo(() => {
    return carrinho.reduce((acc, item) => {
      const precoOriginal = item.precoUnitario;
      const desconto = precoOriginal * item.desconto;
      return acc + desconto * item.quantidade;
    }, 0);
  }, [carrinho]);

  const capacidadeRestante = useMemo(() => {
    const cap = Number(evento?.capacidade || 0);
    if (cap <= 0) return null;
    return Math.max(0, cap - (evento?.ingressosVendidos || 0));
  }, [evento]);

  const temVagas = capacidadeRestante === null || capacidadeRestante >= quantidadeTotal;

  // Voltar se não houver itens no carrinho
  useEffect(() => {
    if (carrinho.length === 0 && !loading) {
      navigation.goBack();
    }
  }, [carrinho, loading, navigation]);

  const handleComprar = useCallback(async () => {
    if (!user?.uid) {
      Alert.alert("Login necessário", "Faça login para adquirir ingressos.");
      navigation.navigate("PerfilLogin");
      return;
    }
    if (!temVagas) {
      Alert.alert("Sem vagas", "Não há ingressos suficientes disponíveis.");
      return;
    }

    if (!gratuito) {
      navigation.navigate("CheckoutScreen", {
        evento,
        carrinho,
        total,
        quantidadeTotal,
      });
      return;
    }

    setProcessando(true);

    try {
      await comprar(
        evento.id,
        user.uid,
        profile?.nome || user.displayName || user.email,
        profile?.email || user.email || "",
        profile?.foto || user.photoURL || "",
        gratuito ? "gratuito" : "credit_card"
      );

      navigation.navigate("MeusIngressos");
    } catch (err) {
      const msg =
        err.message?.includes("Capacidade limite")
          ? "Ingressos esgotados. Não há mais vagas disponíveis."
          : err.message || "Não foi possível concluir. Tente novamente.";
      Alert.alert("Erro na compra", msg);
    } finally {
      setProcessando(false);
    }
  }, [user, profile, carrinho, comprar, evento, gratuito, temVagas, navigation, total, quantidadeTotal]);

  if (!evento) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Evento não encontrado</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
          <Text style={styles.btnVoltarText}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* HEADER */}
      <LinearGradient colors={[colors.background, colors.surface]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carrinho de Ingressos</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* CONTEÚDO */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner do evento */}
        <View style={styles.eventoBanner}>
          <Text style={styles.eventoTitulo}>{evento.tituloEvento}</Text>
          <View style={styles.eventoMeta}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.textMuted} />
            <Text style={styles.eventoMetaText}>
              {evento.dataEvento}{evento.horaInicio ? ` · ${evento.horaInicio}` : ""}
            </Text>
          </View>
          <View style={styles.eventoMeta}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.textMuted} />
            <Text style={styles.eventoMetaText}>{evento.localEvento}</Text>
          </View>
        </View>

        {/* Badge de disponibilidade */}
        {capacidadeRestante !== null && (
          <View style={capacidadeRestante > 0 ? styles.disponivel : styles.esgotado}>
            <MaterialCommunityIcons
              name={capacidadeRestante > 0 ? "ticket-account" : "ticket-remove"}
              size={16}
              color={capacidadeRestante > 0 ? colors.success : colors.error}
            />
            <Text style={capacidadeRestante > 0 ? styles.disponivelText : styles.esgotadoText}>
              {capacidadeRestante > 0
                ? `${capacidadeRestante} vaga${capacidadeRestante !== 1 ? "s" : ""} disponível${capacidadeRestante !== 1 ? "is" : ""}`
                : "Ingressos esgotados"}
            </Text>
          </View>
        )}

        {/* CARRINHO */}
        <CarrinhoIngressos
          carrinho={carrinho}
          total={total}
          quantidadeTotal={quantidadeTotal}
          loading={loading}
          onRemover={removerDoCarrinho}
          onComprar={handleComprar}
          nomeEvento={evento.tituloEvento}
          dataEvento={evento.dataEvento}
          gratuito={gratuito}
          colors={colors}
        />

        {/* Resumo da economia */}
        {economiaTotal > 0 && (
          <View style={styles.economiaBox}>
            <MaterialCommunityIcons name="tag-outline" size={18} color={colors.success} />
            <Text style={styles.economiaText}>
              Você economizou R$ {economiaTotal.toFixed(2)} com descontos!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FOOTER COM BOTÃO DE COMPRA */}
      <View style={[styles.footer(colors), { paddingBottom: 16 + insets.bottom }]}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>
            {gratuito ? "Gratuito" : `R$ ${total.toFixed(2)}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.btnComprar,
            (!temVagas || processando) && styles.btnComprarDisabled,
          ]}
          onPress={handleComprar}
          disabled={!temVagas || processando}
          activeOpacity={0.85}
        >
          {processando ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
              <Text style={styles.btnComprarText}>
                {gratuito ? "Confirmar Reserva" : "Ir para Pagamento"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },

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
    backgroundColor: colors.glass,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },

  eventoBanner: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventoTitulo: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  eventoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  eventoMetaText: {
    color: colors.textMuted,
    fontSize: 12,
  },

  disponivel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.success + "18",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  disponivelText: { color: colors.success, fontSize: 13, fontWeight: "600" },
  esgotado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.error + "18",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  esgotadoText: { color: colors.error, fontSize: 13, fontWeight: "600" },

  economiaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.success + "15",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.success + "30",
  },
  economiaText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  footerInfo: {
    flex: 1,
  },
  footerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  footerTotal: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  btnComprar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  btnComprarDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  btnComprarText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },

  errorText: { color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginTop: 16 },
  btnVoltar: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  btnVoltarText: { color: "#FFF", fontWeight: "700" },
});
