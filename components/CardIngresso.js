/**
 * 🎫 COMPONENTE: CARD DE INGRESSO
 * Exibe ingresso individual com código QR/informações
 */

import React, { memo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../styles/Colors";
import * as Clipboard from "expo-clipboard";

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

const CardIngresso = memo(({ compra, ingresso, index, total }) => {
  const [modalVisivel, setModalVisivel] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const dataEvento = compra.eventoData || "Data não informada";
  const horaEvento = compra.eventoHora || "Horário não informado";
  const statusConfig = getStatusConfig(ingresso.status);

  // Verificar se é evento futuro
  const isFuturo = parseDateBR(compra.eventoData ?? dataEvento) > new Date();

  const handleCopiar = async () => {
    try {
      await Clipboard.setStringAsync(ingresso.codigoIngresso);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      Alert.alert("Copiado!", `Código: ${ingresso.codigoIngresso}`);
    }
  };

  const handleCompartilhar = async () => {
    try {
      await Share.share({
        message: `🎫 Tenho ingresso para ${compra.eventoNome}!\n\n📅 ${dataEvento}\n⏰ ${horaEvento}\n📍 ${compra.eventoLocal}\n\nCódigo: ${ingresso.codigoIngresso}`,
        title: `${compra.eventoNome} - Ingresso`,
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível compartilhar");
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setModalVisivel(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isFuturo ? [Colors.primary + "20", Colors.primary + "08"] : [Colors.border, Colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* BADGES */}
          <View style={styles.badges}>
            {index + 1 > 1 && (
              <View style={styles.badgeQtd}>
                <Text style={styles.badgeQtdText}>{index + 1}/{total}</Text>
              </View>
            )}

            <View style={[styles.badgeStatus, getStatusBadgeStyle(ingresso.status)]}>
              <Text style={styles.badgeStatusText}>{statusConfig.label}</Text>
            </View>
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.eventoNome} numberOfLines={1}>
                {compra.eventoNome}
              </Text>

              <View style={styles.headerMeta}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={12}
                  color={Colors.textMuted}
                />
                <Text style={styles.meta}>{dataEvento}</Text>
              </View>

              <View style={styles.headerMeta}>
                <MaterialCommunityIcons
                  name="clock"
                  size={12}
                  color={Colors.textMuted}
                />
                <Text style={styles.meta}>{horaEvento}</Text>
              </View>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={Colors.textMuted}
            />
          </View>

          {/* TIPO E CÓDIGO */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.labelCodigo}>Tipo</Text>
              <Text style={styles.tipoCodigo}>{ingresso.tipo.toUpperCase()}</Text>
            </View>

            <View style={styles.separador} />

            <View style={styles.codigoContainer}>
              <Text style={styles.labelCodigo}>Código</Text>
              <Text style={styles.codigo}>{ingresso.codigoIngresso}</Text>
            </View>
          </View>

          {/* INDICADOR FUTURO */}
          {isFuturo && (
            <View style={styles.ingressoAtivo}>
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color={Colors.success}
              />
              <Text style={styles.ingressoAtivoText}>Válido</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* MODAL DETALHES */}
      <Modal visible={modalVisivel} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisivel(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisivel(false)}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{compra.eventoNome}</Text>
              <View style={[styles.badgeStatus, getStatusBadgeStyle(ingresso.status)]}>
                <Text style={styles.badgeStatusText}>{statusConfig.label}</Text>
              </View>
            </View>

            {/* INFORMAÇÕES DETALHADAS */}
            <View style={styles.modalInfo}>
              <InfoRow
                icon="calendar"
                label="Data"
                valor={dataEvento}
              />
              <InfoRow
                icon="clock"
                label="Hora"
                valor={horaEvento}
              />
              <InfoRow
                icon="map-marker"
                label="Local"
                valor={compra.eventoLocal}
              />
              <InfoRow
                icon="ticket"
                label="Tipo"
                valor={ingresso.tipo.toUpperCase()}
              />
              <InfoRow
                icon="barcode"
                label="Código"
                valor={ingresso.codigoIngresso}
              />
            </View>

            {/* AÇÕES */}
            {isFuturo && ingresso.status !== "cancelado" && (
              <View style={styles.modalAcoes}>
                <TouchableOpacity
                  style={[styles.btnAcao, styles.btnPrimary]}
                  onPress={handleCompartilhar}
                >
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.btnAcaoText}>Compartilhar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnAcao, styles.btnSecundary]}
                  onPress={handleCopiar}
                >
                  <MaterialCommunityIcons
                    name={copiado ? "check" : "content-copy"}
                    size={20}
                    color={Colors.primary}
                  />
                  <Text style={[styles.btnAcaoText, { color: Colors.primary }]}>
                    {copiado ? "Copiado!" : "Copiar Código"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.btnFechar}
              onPress={() => setModalVisivel(false)}
            >
              <Text style={styles.btnFecharText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
});

const InfoRow = ({ icon, label, valor }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabel}>
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={Colors.primary}
      />
      <Text style={styles.infoLabelText}>{label}</Text>
    </View>
    <Text style={styles.infoValor}>{valor}</Text>
  </View>
);

function getStatusConfig(status) {
  const configs = {
    confirmado: { label: "✓ Confirmado", color: Colors.success },
    utilizado: { label: "✓ Utilizado", color: Colors.textMuted },
    cancelado: { label: "✗ Cancelado", color: Colors.error },
    pendente: { label: "⏳ Pendente", color: Colors.warning },
  };

  return configs[status] || configs.confirmado;
}

function getStatusBadgeStyle(status) {
  const styles = {
    confirmado: { backgroundColor: Colors.success + "20" },
    utilizado: { backgroundColor: Colors.border },
    cancelado: { backgroundColor: Colors.error + "20" },
    pendente: { backgroundColor: Colors.warning + "20" },
  };

  return styles[status] || styles.confirmado;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    backgroundColor: Colors.surface,
  },

  badges: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  badgeQtd: {
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },

  badgeQtdText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textMuted,
  },

  badgeStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  badgeStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  headerInfo: {
    flex: 1,
    marginRight: 10,
  },

  eventoNome: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },

  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },

  meta: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  separador: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },

  tipoCodigo: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: 2,
  },

  labelCodigo: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  codigo: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 2,
    fontFamily: Platform.OS === "web" ? "Courier New" : "monospace",
  },

  codigoContainer: {
    flex: 1,
    marginLeft: 12,
  },

  ingressoAtivo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  ingressoAtivoText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: "600",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "80%",
  },

  modalClose: {
    alignSelf: "flex-end",
    padding: 8,
    marginRight: -8,
  },

  modalHeader: {
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },

  modalInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  infoLabelText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
  },

  infoValor: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "700",
  },

  modalAcoes: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  btnAcao: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },

  btnPrimary: {
    backgroundColor: Colors.primary,
  },

  btnSecundary: {
    backgroundColor: Colors.border,
  },

  btnAcaoText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  btnFechar: {
    paddingVertical: 12,
    alignItems: "center",
  },

  btnFecharText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "600",
  },
});

export default CardIngresso;