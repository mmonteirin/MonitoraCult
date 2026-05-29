/**
 * 🎫 SELETOR DE TIPOS DE INGRESSO
 * Component para escolher tipo e quantidade
 */

import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { TIPOS_INGRESSO } from "../services/ingressoServiceV2";

const TipoIngressoItem = memo(
  ({ tipo, preco, onAdionar, onRemover, quantidadeNoCarrinho, gratuito, colors, styles }) => {
    const tipoConfig = TIPOS_INGRESSO[tipo.toUpperCase()];
    const desconto = tipoConfig?.desconto || 0;
    const precoComDesconto = preco * (1 - desconto);
    const economiza = preco - precoComDesconto;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.label}>{tipoConfig?.label}</Text>
            {desconto > 0 && (
              <View style={styles.desconto}>
                <Text style={styles.descontoText}>
                  -{Math.round(desconto * 100)}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.preco}>
            {!gratuito && desconto > 0 && (
              <Text style={styles.precoOriginal}>R$ {preco.toFixed(2)}</Text>
            )}
            <Text style={styles.precoFinal}>
              {gratuito ? "Gratuito" : `R$ ${precoComDesconto.toFixed(2)}`}
            </Text>
            {!gratuito && economiza > 0 && (
              <Text style={styles.economiza}>Economiza R$ {economiza.toFixed(2)}</Text>
            )}
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => onRemover(tipo)}
          >
            <MaterialCommunityIcons
              name="minus"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>

          <View style={styles.quantity}>
            <Text style={styles.quantityText}>
              {quantidadeNoCarrinho || 0}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => onAdionar(tipo, preco)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const SeletorIngressos = ({
  precos = {}, // { inteira: 50, meia: 25, ... }
  carrinho = [],
  onAdionar,
  onRemover,
  gratuito = false,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
  const tipos = Object.keys(TIPOS_INGRESSO);

  const renderItem = ({ item: tipo }) => {
    const preco = precos[tipo] || 0;
    const noCarrinho = carrinho.find(c => c.tipo === tipo);

    return (
      <TipoIngressoItem
        tipo={tipo}
        preco={preco}
        onAdionar={(tipo, preco) => onAdionar(tipo, 1, preco)}
        onRemover={() => onRemover(tipo)}
        quantidadeNoCarrinho={noCarrinho?.quantidade || 0}
        gratuito={gratuito}
        colors={colors}
        styles={styles}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {gratuito ? "Escolha seus ingressos gratuitos" : "Escolha seus ingressos"}
      </Text>

      <FlatList
        data={tipos}
        renderItem={renderItem}
        keyExtractor={item => item}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 14,
  },

  card: {
    paddingVertical: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  info: {
    flex: 1,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textPrimary,
  },

  desconto: {
    backgroundColor: c.error + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: "flex-start",
  },

  descontoText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.error,
  },

  preco: {
    alignItems: "flex-end",
  },

  precoOriginal: {
    fontSize: 12,
    color: c.textMuted,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },

  precoFinal: {
    fontSize: 16,
    fontWeight: "700",
    color: c.primary,
  },

  economiza: {
    fontSize: 11,
    color: c.success,
    marginTop: 2,
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  btnPrimary: {
    backgroundColor: c.primary,
  },

  btnOutline: {
    backgroundColor: c.border,
  },

  quantity: {
    flex: 1,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.border,
    borderRadius: 8,
  },

  quantityText: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textPrimary,
  },

  separator: {
    height: 1,
    backgroundColor: c.border,
    marginVertical: 10,
  },
  });
}

export default SeletorIngressos;
