/**
 * EventoShareCard.js
 * Componente de compartilhamento de evento para stories do Instagram.
 *
 * USO em EventoDetalhes.js (ou qualquer tela):
 *
 *   import EventoShareCard from "../components/EventoShareCard";
 *
 *   // state
 *   const [showShare, setShowShare] = useState(false);
 *
 *   // botão
 *   <TouchableOpacity onPress={() => setShowShare(true)}>
 *     <MaterialCommunityIcons name="share-variant" size={22} color="#FFF" />
 *   </TouchableOpacity>
 *
 *   // modal
 *   <EventoShareCard
 *     visible={showShare}
 *     onClose={() => setShowShare(false)}
 *     evento={evento}
 *   />
 *
 * PROPS do objeto `evento` esperadas:
 *   titulo / tituloEvento   — nome do evento
 *   local  / localEvento    — local
 *   data   / dataEvento     — string de data (ex: "28 Jun 2025")
 *   categoria               — categoria
 *   imagemEvento            — URL da imagem de capa
 *   preco  / precoEvento    — "Gratuito" ou valor
 *
 * DEPENDÊNCIAS (já no package.json do projeto):
 *   expo-file-system, expo-image-manipulator, react-native-svg,
 *   react-native-reanimated, expo-linear-gradient, expo-blur,
 *   expo-sharing (adicionar: npx expo install expo-sharing)
 */

import React, {
  useRef,
  useState,
  useCallback,
  memo,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from "react-native";

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

// ── Captura cross-platform ────────────────────
// Na web usamos html2canvas; no nativo, react-native-view-shot.
async function capturarNode(ref) {
  if (Platform.OS === "web") {
    // Importação dinâmica para não quebrar o bundle nativo
    const html2canvas = (await import("html2canvas")).default;
    const node = ref.current;
    if (!node) throw new Error("Ref não disponível");
    const canvas = await html2canvas(node, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: null,
    });
    return canvas.toDataURL("image/png");
  } else {
    // Nativo: react-native-view-shot
    const { captureRef } = require("react-native-view-shot");
    return await captureRef(ref, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });
  }
}

// ─────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get("window");

// Proporção 9:16 para stories
const CARD_W = SW - 48;
const CARD_H = CARD_W * (16 / 9);

// Temas visuais para o card
const TEMAS = [
  {
    id: "roxo",
    label: "Roxo",
    colors: ["#1a0533", "#2d0a52", "#6C5CE7"],
    accent: "#A78BFA",
    dot: "#6C5CE7",
  },
  {
    id: "neon",
    label: "Neon",
    colors: ["#020c1b", "#0a1628", "#00D2FF"],
    accent: "#00D2FF",
    dot: "#00D2FF",
  },
  {
    id: "sunset",
    label: "Sunset",
    colors: ["#1a0a00", "#2d1200", "#F97316"],
    accent: "#FBBF24",
    dot: "#F97316",
  },
  {
    id: "pink",
    label: "Rosa",
    colors: ["#1a0020", "#2d0038", "#EC4899"],
    accent: "#F472B6",
    dot: "#EC4899",
  },
];

// ─────────────────────────────────────────────
// Utilitários
// ─────────────────────────────────────────────
function normalizeEvento(evento) {
  return {
    titulo: evento?.titulo || evento?.tituloEvento || "Evento",
    local: evento?.local || evento?.localEvento || "Local",
    data: evento?.data || evento?.dataEvento || "",
    categoria: evento?.categoria || "Evento",
    imagem: evento?.imagem || evento?.imagemEvento || null,
    preco:
      evento?.preco ||
      evento?.precoEvento ||
      (evento?.gratuito ? "Gratuito" : null),
  };
}

// ─────────────────────────────────────────────
// CardPreview — o visual capturado como imagem
// ─────────────────────────────────────────────
const CardPreview = memo(
  React.forwardRef(({ evento, tema, styles }, ref) => {
    const ev = normalizeEvento(evento);

    return (
      <View ref={ref} style={[styles.card, { width: CARD_W, height: CARD_H }]} collapsable={false}>
        {/* Imagem de fundo */}
        {ev.imagem ? (
          <Image
            source={{ uri: ev.imagem }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: tema.colors[1] },
            ]}
          />
        )}

        {/* Overlay escuro para legibilidade */}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.18)",
            "rgba(0,0,0,0.55)",
            "rgba(0,0,0,0.92)",
          ]}
          style={StyleSheet.absoluteFill}
        />

        {/* Gradiente do tema na parte inferior */}
        <LinearGradient
          colors={[
            "transparent",
            tema.colors[0] + "CC",
            tema.colors[0],
          ]}
          style={styles.cardThemeGradient}
        />

        {/* Efeito de brilho circular */}
        <View
          style={[styles.cardGlow, { backgroundColor: tema.accent + "28" }]}
        />

        {/* ── TOP — logo / branding ── */}
        <View style={styles.cardTop}>
          <View style={[styles.brandPill, { borderColor: tema.accent + "50" }]}>
            <View style={[styles.brandDot, { backgroundColor: tema.dot }]} />
            <Text style={[styles.brandText, { color: tema.accent }]}>
              MonitoraCult
            </Text>
          </View>
        </View>

        {/* ── BOTTOM — informações ── */}
        <View style={styles.cardBottom}>
          {/* Categoria */}
          <View
            style={[
              styles.categoriaBadge,
              { backgroundColor: tema.accent + "25", borderColor: tema.accent + "60" },
            ]}
          >
            <Text style={[styles.categoriaText, { color: tema.accent }]}>
              {ev.categoria.toUpperCase()}
            </Text>
          </View>

          {/* Título */}
          <Text numberOfLines={3} style={styles.cardTitulo}>
            {ev.titulo}
          </Text>

          {/* Infos */}
          <View style={styles.cardInfos}>
            {ev.local ? (
              <View style={styles.cardInfoRow}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={14}
                  color={tema.accent}
                />
                <Text style={styles.cardInfoText} numberOfLines={1}>
                  {ev.local}
                </Text>
              </View>
            ) : null}

            {ev.data ? (
              <View style={styles.cardInfoRow}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={14}
                  color={tema.accent}
                />
                <Text style={styles.cardInfoText}>{ev.data}</Text>
              </View>
            ) : null}

            {ev.preco ? (
              <View style={styles.cardInfoRow}>
                <MaterialCommunityIcons
                  name={ev.preco === "Gratuito" ? "tag-heart" : "ticket"}
                  size={14}
                  color={tema.accent}
                />
                <Text style={styles.cardInfoText}>{ev.preco}</Text>
              </View>
            ) : null}
          </View>

          {/* CTA */}
          <View
            style={[
              styles.ctaRow,
              { backgroundColor: tema.accent + "22", borderColor: tema.accent + "44" },
            ]}
          >
            <Text style={[styles.ctaText, { color: tema.accent }]}>
              Confira no app
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={14}
              color={tema.accent}
            />
          </View>
        </View>

        {/* Borda decorativa */}
        <View
          style={[
            styles.cardBorder,
            { borderColor: tema.accent + "30" },
          ]}
        />
      </View>
    );
  })
);

// ─────────────────────────────────────────────
// TemaSelector
// ─────────────────────────────────────────────
const TemaSelector = memo(({ temaAtivo, onSelect, styles }) => (
  <View style={styles.temaRow}>
    {TEMAS.map((t) => {
      const ativo = temaAtivo.id === t.id;
      return (
        <TouchableOpacity
          key={t.id}
          onPress={() => onSelect(t)}
          style={[
            styles.temaDot,
            { backgroundColor: t.dot },
            ativo && styles.temaDotActive,
          ]}
        >
          {ativo && (
            <MaterialCommunityIcons name="check" size={14} color="#FFF" />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
));

// ─────────────────────────────────────────────
// BotaoAcao
// ─────────────────────────────────────────────
const BotaoAcao = memo(({ icon, label, onPress, primary, accent, loading, colors, styles }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.botaoAcaoWrap, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        disabled={loading}
        style={[
          styles.botaoAcao,
          primary
            ? { backgroundColor: accent || colors.primary }
            : styles.botaoAcaoSecundario,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={primary ? "#FFF" : "rgba(255,255,255,0.85)"}
            />
            <Text
              style={[
                styles.botaoAcaoText,
                !primary && styles.botaoAcaoTextSecundario,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function EventoShareCard({ visible, onClose, evento }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const insets = useSafeAreaInsets();
  const cardRef = useRef(null);

  const [temaAtivo, setTemaAtivo] = useState(TEMAS[0]);
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Captura o card como imagem ──
  const capturarImagem = useCallback(async () => {
    return await capturarNode(cardRef);
  }, []);

  // ── Compartilhar ──
  const handleCompartilhar = useCallback(async () => {
    try {
      setSharing(true);
      const resultado = await capturarImagem();

      if (Platform.OS === "web") {
        // Web: abre a imagem em nova aba para o usuário baixar/salvar
        const link = document.createElement("a");
        link.href = resultado; // dataURL
        link.download = `MonitoraCult_${Date.now()}.png`;
        link.click();
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert(
            "Compartilhamento indisponível",
            "Seu dispositivo não suporta esta função."
          );
          return;
        }
        await Sharing.shareAsync(resultado, {
          mimeType: "image/png",
          dialogTitle: "Compartilhar evento",
          UTI: "public.png",
        });
      }
    } catch (e) {
      console.log("Erro ao compartilhar:", e);
      Alert.alert("Erro", "Não foi possível gerar a imagem.");
    } finally {
      setSharing(false);
    }
  }, [capturarImagem]);

  // ── Salvar ──
  const handleSalvar = useCallback(async () => {
    try {
      setSaving(true);
      const resultado = await capturarImagem();

      if (Platform.OS === "web") {
        // Web: força download direto
        const link = document.createElement("a");
        link.href = resultado;
        link.download = `MonitoraCult_evento_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert("Imagem salva! 🎉", "O download foi iniciado.");
      } else {
        const fileName = `MonitoraCult_evento_${Date.now()}.png`;
        const destino = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({ from: resultado, to: destino });
        Alert.alert(
          "Imagem salva! 🎉",
          "A imagem foi salva nos documentos do app. Compartilhe pelo botão abaixo."
        );
      }
    } catch (e) {
      console.log("Erro ao salvar:", e);
      Alert.alert("Erro", "Não foi possível salvar a imagem.");
    } finally {
      setSaving(false);
    }
  }, [capturarImagem]);

  const ev = normalizeEvento(evento);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(180)}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown.duration(220)}
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Título do modal */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Compartilhar evento</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Subtítulo */}
          <Text style={styles.sheetSub}>
            Escolha um tema e compartilhe nos seus stories
          </Text>

          {/* Preview do card */}
          <View style={styles.previewWrap}>
            {/* Sombra decorativa */}
            <View
              style={[
                styles.previewShadow,
                { backgroundColor: temaAtivo.accent + "20" },
              ]}
            />
            <CardPreview ref={cardRef} evento={evento} tema={temaAtivo} styles={styles} />
          </View>

          {/* Seletor de tema */}
          <View style={styles.temaSection}>
            <Text style={styles.temaLabel}>Tema</Text>
            <TemaSelector temaAtivo={temaAtivo} onSelect={setTemaAtivo} styles={styles} />
          </View>

          {/* Botões de ação */}
          <View style={styles.acoesRow}>
            <BotaoAcao
              icon="download-outline"
              label="Salvar"
              onPress={handleSalvar}
              loading={saving}
              accent={temaAtivo.accent}
              colors={colors}
              styles={styles}
            />
            <BotaoAcao
              icon="share-variant"
              label="Compartilhar"
              onPress={handleCompartilhar}
              primary
              loading={sharing}
              accent={temaAtivo.accent}
              colors={colors}
              styles={styles}
            />
          </View>

          {/* Dica Instagram */}
          <View style={styles.dica}>
            <MaterialCommunityIcons
              name="instagram"
              size={15}
              color="rgba(255,255,255,0.35)"
            />
            <Text style={styles.dicaText}>
              Salve e adicione aos seus stories como imagem
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
function createThemedScreenStyles(c) {
  return StyleSheet.create({
  // ── Modal ──
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0F1221",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: c.glassBorder,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.glassStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 24,
  },

  // ── Preview ──
  previewWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  previewShadow: {
    position: "absolute",
    width: CARD_W + 40,
    height: CARD_H + 40,
    borderRadius: 40,
    bottom: -20,
    alignSelf: "center",
    filter: "blur(30px)", // web only; no-op nativo
  },
  card: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0a0a14",
  },
  cardThemeGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CARD_H * 0.65,
  },
  cardGlow: {
    position: "absolute",
    width: CARD_W * 0.9,
    height: CARD_W * 0.9,
    borderRadius: CARD_W * 0.45,
    top: -CARD_W * 0.3,
    alignSelf: "center",
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
  },

  // ── Card TOP ──
  cardTop: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  brandText: {
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // ── Card BOTTOM ──
  cardBottom: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 24,
  },
  categoriaBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  categoriaText: {
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1.2,
  },
  cardTitulo: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
    marginBottom: 14,
  },
  cardInfos: {
    gap: 8,
    marginBottom: 16,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  cardInfoText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    flex: 1,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: "flex-start",
  },
  ctaText: {
    fontWeight: "700",
    fontSize: 13,
  },

  // ── Tema ──
  temaSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  temaLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    width: 42,
  },
  temaRow: {
    flexDirection: "row",
    gap: 12,
  },
  temaDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.7,
  },
  temaDotActive: {
    opacity: 1,
    transform: [{ scale: 1.15 }],
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // ── Botões ──
  acoesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  botaoAcaoWrap: {
    flex: 1,
  },
  botaoAcao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 20,
  },
  botaoAcaoSecundario: {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  botaoAcaoText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
  },
  botaoAcaoTextSecundario: {
    color: "rgba(255,255,255,0.85)",
  },

  // ── Dica ──
  dica: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    justifyContent: "center",
  },
  dicaText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
  },
});
}
