import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../firebaseConfig";
import { Colors } from "../styles/Colors";
import ConfirmModal from "../components/ConfirmModal";
import {
  TIPOS_INGRESSO,
  STATUS_INGRESSO,
  escutarComprasEvento,
  cancelarCompraAdmin,
  atualizarConfigIngressosEvento,
  calcularResumoIngressosEvento,
} from "../services/ingressoServiceV2";

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "confirmados", label: "Confirmados" },
  { id: "utilizados", label: "Utilizados" },
  { id: "cancelados", label: "Cancelados" },
];

const STATUS_LABEL = {
  [STATUS_INGRESSO.CONFIRMADO]: "Confirmado",
  [STATUS_INGRESSO.UTILIZADO]: "Utilizado",
  [STATUS_INGRESSO.CANCELADO]: "Cancelado",
  [STATUS_INGRESSO.PENDENTE]: "Pendente",
};

const STATUS_COLOR = {
  [STATUS_INGRESSO.CONFIRMADO]: Colors.success,
  [STATUS_INGRESSO.UTILIZADO]: Colors.info,
  [STATUS_INGRESSO.CANCELADO]: Colors.error,
  [STATUS_INGRESSO.PENDENTE]: Colors.warning,
};

function formatDate(value) {
  if (!value) return "—";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelTipoIngresso(tipo) {
  const chave = String(tipo || "").toUpperCase();
  return TIPOS_INGRESSO[chave]?.label || tipo || "Ingresso";
}

function compraPassaFiltro(compra, filtro) {
  if (filtro === "todos") return true;
  if (filtro === "cancelados") {
    return compra.status === "cancelado";
  }

  const ingressos = compra.ingressos || [];

  if (filtro === "confirmados") {
    return (
      compra.status !== "cancelado" &&
      ingressos.some((ing) => ing.status === STATUS_INGRESSO.CONFIRMADO)
    );
  }

  if (filtro === "utilizados") {
    return ingressos.some(
      (ing) => ing.status === STATUS_INGRESSO.UTILIZADO
    );
  }

  return true;
}

function StatMini({ icon, label, value, color = Colors.primaryLight }) {
  return (
    <View style={styles.statMini}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={styles.statMiniValue}>{value}</Text>
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

export default function AdmGerenciarIngressos({ navigation, route }) {
  const eventoId =
    route?.params?.eventoId || route?.params?.evento?.id;

  const [evento, setEvento] = useState(route?.params?.evento || {});
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  const [capacidade, setCapacidade] = useState("");
  const [precoIngresso, setPrecoIngresso] = useState("");

  const [cancelModal, setCancelModal] = useState({
    visible: false,
    compra: null,
  });
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    if (!eventoId) {
      setLoading(false);
      return;
    }

    const unsubEvento = onSnapshot(doc(db, "eventos", eventoId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setEvento(data);
        setCapacidade(
          data.capacidade != null ? String(data.capacidade) : ""
        );
        setPrecoIngresso(
          String(data.precoIngresso ?? data.precoInteira ?? "")
        );
      }
    });

    const unsubCompras = escutarComprasEvento(
      eventoId,
      (lista) => {
        setCompras(lista);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      unsubEvento();
      unsubCompras();
    };
  }, [eventoId]);

  const resumo = useMemo(
    () => calcularResumoIngressosEvento(compras, evento),
    [compras, evento]
  );

  const comprasFiltradas = useMemo(
    () => compras.filter((c) => compraPassaFiltro(c, filtro)),
    [compras, filtro]
  );

  const gratuito =
    evento?.tipoEvento === "gratuito" ||
    Number(evento?.precoIngresso || 0) === 0;

  const showFeedback = (title, message, type = "error") => {
    setFeedbackModal({ visible: true, title, message, type });
  };

  const handleSalvarConfig = async () => {
    if (!eventoId) return;

    const cap = capacidade.trim()
      ? Math.max(0, Number(capacidade.replace(/\D/g, "")))
      : 0;
    const preco = precoIngresso.trim()
      ? Math.max(0, parseFloat(precoIngresso.replace(",", ".")) || 0)
      : 0;

    if (cap > 0 && cap < resumo.vendidos) {
      showFeedback(
        "Capacidade inválida",
        `A capacidade não pode ser menor que os ${resumo.vendidos} ingressos já vendidos.`,
        "warning"
      );
      return;
    }

    try {
      setSalvandoConfig(true);
      await atualizarConfigIngressosEvento(eventoId, {
        capacidade: cap,
        precoIngresso: preco,
        precoInteira: preco,
      });
      showFeedback(
        "Configuração salva",
        "Capacidade e preço atualizados com sucesso.",
        "success"
      );
    } catch (error) {
      showFeedback(
        "Erro",
        error.message || "Não foi possível salvar a configuração."
      );
    } finally {
      setSalvandoConfig(false);
    }
  };

  const confirmarCancelamento = async () => {
    const compra = cancelModal.compra;
    if (!compra?.id) return;

    setCancelModal({ visible: false, compra: null });

    try {
      await cancelarCompraAdmin({ compraRaizId: compra.id });
      showFeedback(
        "Compra cancelada",
        "Os ingressos foram cancelados e a capacidade foi atualizada.",
        "success"
      );
    } catch (error) {
      showFeedback(
        "Erro",
        error.message || "Não foi possível cancelar a compra."
      );
    }
  };

  const renderCompra = useCallback(
    ({ item }) => {
      const cancelada = item.status === "cancelado";
      const podeCancelar =
        !cancelada &&
        (item.ingressos || []).some(
          (ing) => ing.status === STATUS_INGRESSO.CONFIRMADO
        );

      return (
        <BlurView intensity={28} tint="dark" style={styles.compraCard}>
          <View style={styles.compraHeader}>
            <View style={styles.compraAvatar}>
              <MaterialCommunityIcons
                name="account"
                size={22}
                color={Colors.primaryLight}
              />
            </View>
            <View style={styles.compraInfo}>
              <Text style={styles.compraNome} numberOfLines={1}>
                {item.userName || "Participante"}
              </Text>
              <Text style={styles.compraEmail} numberOfLines={1}>
                {item.userEmail || "—"}
              </Text>
              <Text style={styles.compraData}>
                {formatDate(item.dataCompra)}
              </Text>
            </View>
            <View style={styles.compraValorBox}>
              <Text style={styles.compraValor}>
                {Number(item.valorTotal || 0) === 0
                  ? "Grátis"
                  : `R$ ${Number(item.valorTotal).toFixed(2)}`}
              </Text>
              {cancelada && (
                <View
                  style={[
                    styles.statusPill,
                    { borderColor: Colors.error },
                  ]}
                >
                  <Text
                    style={[styles.statusPillText, { color: Colors.error }]}
                  >
                    Cancelada
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.ingressosLista}>
            {(item.ingressos || []).map((ing) => (
              <View
                key={ing.codigoIngresso}
                style={styles.ingressoRow}
              >
                <View style={styles.ingressoMeta}>
                  <Text style={styles.ingressoTipo}>
                    {labelTipoIngresso(ing.tipo)}
                  </Text>
                  <Text style={styles.ingressoCodigo}>
                    {ing.codigoIngresso}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      borderColor:
                        STATUS_COLOR[ing.status] || Colors.textMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          STATUS_COLOR[ing.status] || Colors.textMuted,
                      },
                    ]}
                  >
                    {STATUS_LABEL[ing.status] || ing.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {podeCancelar && (
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.85}
              onPress={() =>
                setCancelModal({ visible: true, compra: item })
              }
            >
              <MaterialCommunityIcons
                name="ticket-outline"
                size={18}
                color={Colors.error}
              />
              <Text style={styles.cancelBtnText}>Cancelar compra</Text>
            </TouchableOpacity>
          )}
        </BlurView>
      );
    },
    []
  );

  if (!eventoId) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Evento não encontrado</Text>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#240046", "#3C096C", "#5A189A"]}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Gerenciar Ingressos</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {evento.tituloEvento || "Evento"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.scannerBtn}
            onPress={() =>
              navigation.navigate("AdmQRScanner", {
                eventoId,
                eventoNome: evento.tituloEvento || "Evento",
              })
            }
          >
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={22}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatMini
            icon="ticket-confirmation"
            label="Vendidos"
            value={resumo.vendidos}
          />
          <StatMini
            icon="account-check"
            label="Check-in"
            value={resumo.utilizados}
            color={Colors.info}
          />
          <StatMini
            icon="cash"
            label="Receita"
            value={
              gratuito ? "—" : `R$ ${resumo.receita.toFixed(0)}`
            }
            color={Colors.success}
          />
          <StatMini
            icon="seat"
            label="Restantes"
            value={
              resumo.restantes != null ? resumo.restantes : "∞"
            }
            color={Colors.warning}
          />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <BlurView intensity={24} tint="dark" style={styles.configCard}>
          <Text style={styles.sectionTitle}>Configuração</Text>
          <Text style={styles.sectionHint}>
            {gratuito
              ? "Evento gratuito — ajuste apenas a capacidade."
              : "Defina capacidade e preço base (inteira)."}
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Capacidade</Text>
              <TextInput
                style={styles.input}
                value={capacidade}
                onChangeText={setCapacidade}
                keyboardType="number-pad"
                placeholder="0 = ilimitado"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            {!gratuito && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preço (R$)</Text>
                <TextInput
                  style={styles.input}
                  value={precoIngresso}
                  onChangeText={setPrecoIngresso}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSalvarConfig}
            disabled={salvandoConfig}
          >
            <LinearGradient
              colors={["#9333EA", "#7E22CE"]}
              style={styles.saveBtn}
            >
              {salvandoConfig ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="content-save"
                    size={18}
                    color="#FFF"
                  />
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTROS.map((item) => {
            const active = filtro === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => setFiltro(item.id)}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.listTitle}>
          Compras ({comprasFiltradas.length})
        </Text>

        {loading ? (
          <ActivityIndicator
            color={Colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={comprasFiltradas}
            keyExtractor={(item) => item.id}
            renderItem={renderCompra}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons
                  name="ticket-outline"
                  size={48}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyTitle}>
                  Nenhuma compra neste filtro
                </Text>
                <Text style={styles.emptyText}>
                  As vendas aparecerão aqui em tempo real.
                </Text>
              </View>
            }
          />
        )}
      </ScrollView>

      <ConfirmModal
        visible={cancelModal.visible}
        title="Cancelar compra?"
        message="Os ingressos desta compra serão invalidados e a capacidade do evento será liberada."
        confirmText="Cancelar compra"
        cancelText="Voltar"
        type="danger"
        icon="ticket-outline"
        onCancel={() =>
          setCancelModal({ visible: false, compra: null })
        }
        onConfirm={confirmarCancelamento}
      />

      <ConfirmModal
        visible={feedbackModal.visible}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        confirmText="OK"
        onConfirm={() =>
          setFeedbackModal((prev) => ({ ...prev, visible: false }))
        }
        onCancel={
          feedbackModal.type === "success"
            ? undefined
            : () =>
                setFeedbackModal((prev) => ({
                  ...prev,
                  visible: false,
                }))
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: "center", alignItems: "center", padding: 24 },
  header: {
    paddingTop: Platform.OS === "ios" ? 58 : 46,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  scannerBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCopy: { flex: 1 },
  title: { color: "#FFF", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  statMini: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statMiniValue: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 6,
  },
  statMiniLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  scroll: { padding: 16, paddingBottom: 40 },
  configCard: {
    borderRadius: 22,
    padding: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  inputRow: { flexDirection: "row", gap: 10 },
  inputGroup: { flex: 1 },
  inputLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  filters: { gap: 8, paddingBottom: 12 },
  filterChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: { color: Colors.textSecondary, fontWeight: "700", fontSize: 12 },
  filterTextActive: { color: "#FFF" },
  listTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  compraCard: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  compraHeader: { flexDirection: "row", alignItems: "flex-start" },
  compraAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  compraInfo: { flex: 1 },
  compraNome: { color: Colors.textPrimary, fontWeight: "800", fontSize: 14 },
  compraEmail: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  compraData: { color: Colors.textSecondary, fontSize: 11, marginTop: 4 },
  compraValorBox: { alignItems: "flex-end" },
  compraValor: { color: Colors.success, fontWeight: "800", fontSize: 14 },
  ingressosLista: { marginTop: 12, gap: 8 },
  ingressoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 10,
  },
  ingressoMeta: { flex: 1, paddingRight: 8 },
  ingressoTipo: { color: Colors.textPrimary, fontSize: 13, fontWeight: "600" },
  ingressoCodigo: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillText: { fontSize: 10, fontWeight: "800" },
  cancelBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  cancelBtnText: { color: Colors.error, fontWeight: "700", fontSize: 13 },
  emptyBox: {
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  backLink: { marginTop: 16 },
  backLinkText: { color: Colors.primaryLight, fontWeight: "700" },
});
