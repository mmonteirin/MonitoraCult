/**
 * 🛒 CARRINHO DE INGRESSOS
 * Resumo do carrinho e checkout
 */

import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { TIPOS_INGRESSO } from "../services/ingressoServiceV2";

const ItemCarrinho = memo(({ item, onRemover, onAtualizar, colors, styles }) => {
  const tipoConfig = TIPOS_INGRESSO[item.tipo.toUpperCase()];
  const precoComDesconto = item.precoUnitario * (1 - item.desconto);
  const subtotal = precoComDesconto * item.quantidade;
  const gratuito = subtotal === 0;

  return (
    <View style={styles.itemCarrinho}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemLabel}>{tipoConfig?.label}</Text>
        <Text style={styles.itemQtd}>
          {item.quantidade}x {gratuito ? "Gratuito" : `R$ ${precoComDesconto.toFixed(2)}`}
        </Text>
      </View>

      <View style={styles.itemAcoes}>
        <Text style={styles.itemSubtotal}>
          {gratuito ? "Gratuito" : `R$ ${subtotal.toFixed(2)}`}
        </Text>

        <TouchableOpacity
          onPress={() => onRemover(item.tipo)}
          style={styles.btnRemover}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const CarrinhoIngressos = ({
  carrinho = [],
  total = 0,
  quantidadeTotal = 0,
  loading = false,
  onRemover,
  onComprar,
  nomeEvento = "Evento",
  dataEvento = "",
  gratuito = false,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
  const economiaTotal = useMemo(() => {
    return carrinho.reduce((acc, item) => {
      const precoOriginal = item.precoUnitario;
      const desconto = precoOriginal * item.desconto;
      return acc + desconto * item.quantidade;
    }, 0);
  }, [carrinho]);

  if (carrinho.length === 0) {
    return (
      <View style={styles.vazio}>
        <MaterialCommunityIcons
          name="ticket-outline"
          size={48}
          color={colors.textMuted}
        />
        <Text style={styles.vazioTitle}>Seu carrinho está vazio</Text>
        <Text style={styles.vazioSubtitle}>Adicione ingressos para continuar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Seu Carrinho</Text>
        <View style={styles.headerSubtitle}>
          <Text style={styles.headerCount}>{quantidadeTotal} ingresso(s)</Text>
        </View>
      </View>

      {/* EVENTO INFO */}
      <View style={styles.eventoInfo}>
        <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
        <View style={styles.eventoTexto}>
          <Text style={styles.eventoNome}>{nomeEvento}</Text>
          {dataEvento && <Text style={styles.eventoData}>{dataEvento}</Text>}
        </View>
      </View>

      {/* ITENS */}
      <FlatList
        data={carrinho}
        renderItem={({ item }) => (
          <ItemCarrinho
            item={item}
            onRemover={onRemover}
            onAtualizar={() => {}} // Usar em atualizarQuantidade
            colors={colors}
            styles={styles}
          />
        )}
        keyExtractor={item => item.tipo}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
      />

      {/* RESUMO */}
      <LinearGradient
        colors={[colors.surfaceMuted, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.resumo}
      >
        {economiaTotal > 0 && (
          <View style={styles.linhaResumo}>
            <Text style={styles.labelResumo}>Economia:</Text>
            <Text style={[styles.valorResumo, { color: colors.success }]}>
              R$ {economiaTotal.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={[styles.linhaResumo, styles.linhaDivisoria]} />

        <View style={styles.linhaResumo}>
          <Text style={styles.labelTotal}>Total:</Text>
          <Text style={styles.valorTotal}>
            {gratuito || total === 0 ? "Gratuito" : `R$ ${total.toFixed(2)}`}
          </Text>
        </View>
      </LinearGradient>

      {/* BOTÃO COMPRAR */}
      <TouchableOpacity
        style={[styles.btnComprar, loading && { opacity: 0.7 }]}
        onPress={onComprar}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons
              name={gratuito || total === 0 ? "ticket-confirmation" : "credit-card"}
              size={22}
              color="#fff"
            />
            <Text style={styles.btnComprarText}>
              {gratuito || total === 0 ? "Reservar ingresso" : "Continuar pagamento"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.avisoSeguranca}>
        {gratuito || total === 0
          ? "Reserva gratuita. Seu ingresso será gerado sem cobrança."
          : "Pagamento seguro com encriptação SSL"}
      </Text>
    </View>
  );
};

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    backgroundColor: c.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
  },

  vazio: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  vazioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: c.textPrimary,
    marginTop: 16,
  },

  vazioSubtitle: {
    fontSize: 13,
    color: c.textMuted,
    marginTop: 4,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: c.textPrimary,
  },

  headerCount: {
    fontSize: 12,
    color: c.textMuted,
    backgroundColor: c.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  eventoInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.primary + "10",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
  },

  eventoTexto: {
    flex: 1,
  },

  eventoNome: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary,
  },

  eventoData: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2,
  },

  itemCarrinho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },

  itemInfo: {
    flex: 1,
  },

  itemLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary,
  },

  itemQtd: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2,
  },

  itemAcoes: {
    alignItems: "flex-end",
    gap: 10,
  },

  itemSubtotal: {
    fontSize: 14,
    fontWeight: "700",
    color: c.primary,
  },

  btnRemover: {
    padding: 6,
  },

  separador: {
    height: 1,
    backgroundColor: c.border,
  },

  resumo: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
  },

  linhaResumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  linhaDivisoria: {
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },

  labelResumo: {
    fontSize: 12,
    color: c.textMuted,
    fontWeight: "500",
  },

  valorResumo: {
    fontSize: 12,
    fontWeight: "700",
  },

  labelTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: c.textPrimary,
  },

  valorTotal: {
    fontSize: 20,
    fontWeight: "800",
    color: c.primary,
  },

  btnComprar: {
    backgroundColor: c.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  btnComprarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  avisoSeguranca: {
    fontSize: 11,
    color: c.textMuted,
    textAlign: "center",
    fontStyle: "italic",
  },
  });
}

export default CarrinhoIngressos;
