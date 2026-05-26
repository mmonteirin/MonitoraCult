/**
 * 📷 TELA DE SCANNER QR — ENTRADA DO EVENTO
 *
 * O organizador abre esta tela a partir do Dashboard Individual.
 * A câmera fica em loop contínuo: escaneia → exibe resultado →
 * volta a escanear automaticamente após 2 s.
 *
 * Deps Expo SDK 54 (já incluídas no bare Expo):
 *   expo-camera   — CameraView + useCameraPermissions
 *
 * Navegação:
 *   navigation.navigate('AdmQRScanner', { eventoId, eventoNome })
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useAuth } from "../context/AuthContext";
import { realizarCheckIn } from "../services/qrCheckinService";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

// ─── Constantes ───────────────────────────────────────────────────────────────
const COOLDOWN_MS = 2200; // pausa entre scans
let styles;
let colors;

// ─── Tipos de resultado visual ───────────────────────────────────────────────
const ESTADO = {
  AGUARDANDO: "aguardando",
  PROCESSANDO: "processando",
  SUCESSO: "sucesso",
  ERRO: "erro",
};

// ─── Linha de varredura animada ───────────────────────────────────────────────
function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <Animated.View
      style={[scanStyles.line, { transform: [{ translateY }] }]}
    />
  );
}

// ─── Card de resultado ────────────────────────────────────────────────────────
function ResultCard({ estado, dados }) {
  if (estado === ESTADO.AGUARDANDO) return null;

  if (estado === ESTADO.PROCESSANDO) {
    return (
      <BlurView intensity={28} tint={blurTint} style={resStyles.card}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={resStyles.msg}>Verificando ingresso…</Text>
      </BlurView>
    );
  }

  const ok = estado === ESTADO.SUCESSO;

  return (
    <BlurView intensity={28} tint={blurTint} style={resStyles.card}>
      {/* Ícone de status */}
      <View
        style={[
          resStyles.iconCircle,
          { backgroundColor: ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" },
        ]}
      >
        <MaterialCommunityIcons
          name={ok ? "check-circle" : "close-circle"}
          size={52}
          color={ok ? colors.success : colors.error}
        />
      </View>

      {/* Nome do usuário */}
      {dados?.foto ? (
        <Image
          source={{ uri: dados.foto }}
          style={resStyles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={resStyles.avatarPlaceholder}>
          <MaterialCommunityIcons
            name="account"
            size={32}
            color="rgba(255,255,255,0.4)"
          />
        </View>
      )}

      <Text style={resStyles.userName}>
        {dados?.usuario || "Participante"}
      </Text>

      {dados?.tipo && ok && (
        <View style={resStyles.tipoBadge}>
          <Text style={resStyles.tipoText}>
            {dados.tipo.charAt(0).toUpperCase() + dados.tipo.slice(1)}
          </Text>
        </View>
      )}

      <Text
        style={[
          resStyles.statusMsg,
          { color: ok ? colors.success : colors.error },
        ]}
      >
        {dados?.mensagem}
      </Text>
    </BlurView>
  );
}

// ─── Item do histórico ────────────────────────────────────────────────────────
function HistoricoItem({ item }) {
  return (
    <View style={histStyles.row}>
      <View
        style={[
          histStyles.dot,
          {
            backgroundColor: item.valido ? colors.success : colors.error,
          },
        ]}
      />
      <View style={histStyles.info}>
        <Text style={histStyles.name} numberOfLines={1}>
          {item.usuario}
        </Text>
        <Text style={histStyles.meta}>
          {item.tipo} · {item.hora}
        </Text>
      </View>
      <MaterialCommunityIcons
        name={item.valido ? "check" : "close"}
        size={16}
        color={item.valido ? colors.success : colors.error}
      />
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function AdmQRScanner({ navigation, route }) {
  const themeContext = useTheme();
  colors = themeContext.colors;
  styles = useThemedStyles(createThemedScreenStyles);
  const { uid } = useAuth();
  const eventoId = route?.params?.eventoId;
  const eventoNome = route?.params?.eventoNome || "Evento";

  const [permission, requestPermission] = useCameraPermissions();
  const [estado, setEstado] = useState(ESTADO.AGUARDANDO);
  const [dadosResultado, setDadosResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalErros, setTotalErros] = useState(0);
  const [scanAtivo, setScanAtivo] = useState(true);

  const cooldownRef = useRef(false);

  // ── Solicitar permissão de câmera ─────────────────────────────────────────
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // ── Processar QR escaneado ────────────────────────────────────────────────
  const handleBarCodeScanned = useCallback(
    async ({ data }) => {
      if (cooldownRef.current || estado === ESTADO.PROCESSANDO) return;

      cooldownRef.current = true;
      setScanAtivo(false);
      setEstado(ESTADO.PROCESSANDO);
      setDadosResultado(null);

      Vibration.vibrate(60);

      const res = await realizarCheckIn(data, eventoId, uid);

      setDadosResultado(res);
      setEstado(res.valido ? ESTADO.SUCESSO : ESTADO.ERRO);

      Vibration.vibrate(res.valido ? [0, 80, 60, 80] : 350);

      // Adicionar ao histórico local
      const agora = new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setHistorico((prev) => [
        {
          id: Date.now(),
          usuario: res.usuario || "—",
          tipo: res.tipo || "—",
          hora: agora,
          valido: res.valido,
          mensagem: res.mensagem,
        },
        ...prev.slice(0, 49),
      ]);

      if (res.valido) {
        setTotalEntradas((n) => n + 1);
      } else {
        setTotalErros((n) => n + 1);
      }

      // Volta a escanear após cooldown
      setTimeout(() => {
        setEstado(ESTADO.AGUARDANDO);
        setDadosResultado(null);
        setScanAtivo(true);
        cooldownRef.current = false;
      }, COOLDOWN_MS);
    },
    [estado, eventoId, uid]
  );

  // ─── Permissão negada ─────────────────────────────────────────────────────
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#05060A", "#0B1020", "#111827"]}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={colors.primary}
        />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#05060A", "#0B1020", "#111827"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.permissionBox}>
          <MaterialCommunityIcons
            name="camera-off"
            size={56}
            color={colors.textMuted}
          />
          <Text style={styles.permissionTitle}>
            Câmera necessária
          </Text>
          <Text style={styles.permissionSub}>
            Permita o acesso à câmera para escanear QR Codes de entrada.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.permissionBtn}
            onPress={requestPermission}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.permissionBtnGrad}
            >
              <Text style={styles.permissionBtnText}>
                Permitir câmera
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── UI principal ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#05060A", "#0B1020", "#111827"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Check-in QR</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {eventoNome}
            </Text>
          </View>

          {/* Contador rápido */}
          <View style={styles.counterBadge}>
            <MaterialCommunityIcons
              name="account-check"
              size={14}
              color={colors.success}
            />
            <Text style={styles.counterText}>{totalEntradas}</Text>
          </View>
        </View>

        {/* STATS RÁPIDAS */}
        <View style={styles.statsRow}>
          <BlurView intensity={20} tint={blurTint} style={styles.statPill}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={16}
              color={colors.success}
            />
            <Text style={styles.statNum}>{totalEntradas}</Text>
            <Text style={styles.statLbl}>Entradas</Text>
          </BlurView>

          <BlurView intensity={20} tint={blurTint} style={styles.statPill}>
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={16}
              color={colors.error}
            />
            <Text style={styles.statNum}>{totalErros}</Text>
            <Text style={styles.statLbl}>Recusados</Text>
          </BlurView>

          <BlurView intensity={20} tint={blurTint} style={styles.statPill}>
            <MaterialCommunityIcons
              name="percent"
              size={16}
              color={colors.info}
            />
            <Text style={styles.statNum}>
              {totalEntradas + totalErros > 0
                ? Math.round(
                    (totalEntradas / (totalEntradas + totalErros)) * 100
                  )
                : 0}
              %
            </Text>
            <Text style={styles.statLbl}>Válidos</Text>
          </BlurView>
        </View>

        {/* CÂMERA */}
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={
              scanAtivo ? handleBarCodeScanned : undefined
            }
          />

          {/* Moldura do QR */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.frame}>
              {/* Cantos */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {scanAtivo && <ScanLine />}
            </View>
          </View>

          {/* Status overlay enquanto processa */}
          {estado !== ESTADO.AGUARDANDO && (
            <View style={styles.statusOverlay} pointerEvents="none">
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      estado === ESTADO.PROCESSANDO
                        ? colors.warning
                        : estado === ESTADO.SUCESSO
                        ? colors.success
                        : colors.error,
                  },
                ]}
              />
            </View>
          )}
        </View>

        <Text style={styles.hint}>
          {scanAtivo
            ? "Aponte a câmera para o QR Code do ingresso"
            : "Processando…"}
        </Text>

        {/* RESULTADO */}
        <ResultCard estado={estado} dados={dadosResultado} />

        {/* HISTÓRICO */}
        {historico.length > 0 && (
          <View style={styles.histSection}>
            <Text style={styles.histTitle}>Histórico da sessão</Text>

            <BlurView
              intensity={18}
              tint={blurTint}
              style={styles.histCard}
            >
              {historico.slice(0, 20).map((item) => (
                <HistoricoItem key={item.id} item={item} />
              ))}
            </BlurView>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const FRAME_SIZE = 240;
const CORNER = 24;

const scanStyles = StyleSheet.create({
  line: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
});

const resStyles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
    backgroundColor: "#1F2937",
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  userName: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  tipoBadge: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(108,92,231,0.2)",
  },
  tipoText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "700",
  },
  statusMsg: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  msg: {
    color: colors.textSecondary,
    marginTop: 14,
    fontSize: 15,
  },
});

const histStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  meta: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
  },
});

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { paddingHorizontal: 18, paddingTop: 18 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: c.glassStrong,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerInfo: { flex: 1 },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    marginTop: 2,
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  counterText: {
    color: c.success,
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 4,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  statPill: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glassBorder,
    gap: 2,
  },
  statNum: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  statLbl: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },

  // Câmera
  cameraWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "relative",
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: c.primary,
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
  statusOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  hint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 4,
  },

  // Histórico
  histSection: { marginTop: 22 },
  histTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  histCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 6,
    overflow: "hidden",
    backgroundColor: c.glass,
    borderWidth: 1,
    borderColor: c.glassBorder,
  },

  // Permissão
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  permissionTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 18,
    textAlign: "center",
  },
  permissionSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionBtn: {
    marginTop: 28,
    borderRadius: 20,
    overflow: "hidden",
    width: "100%",
  },
  permissionBtnGrad: {
    paddingVertical: 16,
    alignItems: "center",
  },
  permissionBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
}
