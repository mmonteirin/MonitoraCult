/**
 * 🎫 TELA DE INGRESSOS DO PARTICIPANTE
 *
 * Melhorias v2:
 *  • QR Code visual gerado por ingresso (react-native-qrcode-svg)
 *  • Fluxo: Seleção → Resumo → Processando → Sucesso com QR Code
 *  • Compartilhamento do ingresso com imagem do QR
 *  • Botão "Ver meus ingressos" com listagem de QR Codes
 *  • Visual de "ingresso físico" com borda tracejada e perfurações
 *
 * Instalação necessária (1 pacote):
 *   npx expo install react-native-qrcode-svg
 *   (usa react-native-svg já instalado no projeto)
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Share,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { useAuth } from "../context/AuthContext";
import { useIngressos } from "../hooks/useIngressos";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

import SeletorIngressos from "../components/SeletorIngressos";
import CarrinhoIngressos from "../components/CarrinhoIngressos";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPrecoBase = (evento) =>
  Number(
    evento?.precoIngresso ??
    evento?.precoInteira ??
    evento?.preco ??
    evento?.valor ??
    0
  ) || 0;

const isGratuito = (evento) =>
  evento?.gratuito === true ||
  evento?.tipoEvento === "gratuito" ||
  getPrecoBase(evento) === 0;

/** Dados a encodar no QR (JSON compacto) */
const buildQrPayload = (ing, eventoId) =>
  JSON.stringify({
    c: ing.codigoIngresso,
    e: eventoId,
    t: ing.tipo,
  });

// ─── Componente: Stepper de progresso ───────────────────────────────────────────

function ProgressStepper({ etapaAtual }) {
  const { colors } = useTheme();
  const stepper = useThemedStyles(createStepperStyles);

  const etapas = [
    { id: "selecao", label: "Seleção", icon: "ticket-outline" },
    { id: "carrinho", label: "Carrinho", icon: "cart-outline" },
    { id: "processando", label: "Processando", icon: "loading" },
    { id: "sucesso", label: "Confirmado", icon: "check-circle" },
  ];

  const etapaIndex = etapas.findIndex(e => e.id === etapaAtual);

  return (
    <View style={stepper.container}>
      {etapas.map((etapa, index) => {
        const ativo = index === etapaIndex;
        const completo = index < etapaIndex;
        const proximo = index === etapaIndex + 1;

        return (
          <View key={etapa.id} style={stepper.step}>
            {/* Círculo do passo */}
            <View
              style={[
                stepper.circle,
                ativo && stepper.circleActive,
                completo && stepper.circleComplete,
              ]}
            >
              {completo ? (
                <MaterialCommunityIcons name="check" size={16} color="#FFF" />
              ) : (
                <MaterialCommunityIcons
                  name={etapa.icon}
                  size={16}
                  color={ativo ? "#FFF" : colors.textMuted}
                />
              )}
            </View>

            {/* Linha de conexão */}
            {index < etapas.length - 1 && (
              <View
                style={[
                  stepper.line,
                  (ativo || completo) && stepper.lineActive,
                ]}
              />
            )}

            {/* Label */}
            <Text
              style={[
                stepper.label,
                ativo && stepper.labelActive,
                completo && stepper.labelComplete,
              ]}
            >
              {etapa.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Componente: Cartão visual de ingresso com QR ────────────────────────────

function IngressoCard({ ingresso, evento, index, onShare }) {
  const shotRef = useRef(null);
  const { colors } = useTheme();
  const card = useThemedStyles(createIngressoCardStyles);

  const corTipo = {
    inteira: colors.primary,
    meia: colors.accentCyan,
    estudante: colors.success,
    senior: colors.accentOrange,
    promocional: colors.accentPink,
  }[ingresso.tipo] || colors.primary;

  const labelTipo = {
    inteira: "Inteira",
    meia: "Meia Entrada",
    estudante: "Estudante",
    senior: "Idoso / Deficiente",
    promocional: "Promocional",
  }[ingresso.tipo] || ingresso.tipo;

  const qrValue = buildQrPayload(ingresso, evento?.id || evento?.eventoId);

  const handleShare = async () => {
    try {
      if (shotRef.current?.capture) {
        const uri = await shotRef.current.capture();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: "image/png" });
        }
      } else {
        await Share.share({
          message: `🎫 ${evento?.tituloEvento}\nIngresso ${index + 1} — ${labelTipo}\nCódigo: ${ingresso.codigoIngresso}\n\nApresente este código na entrada.`,
        });
      }
    } catch (_) {}
    onShare?.();
  };

  return (
    <ViewShot ref={shotRef} options={{ format: "png", quality: 0.95 }}>
      <View style={[card.wrapper, { borderColor: corTipo + "55" }]}>
        {/* Topo colorido */}
        <LinearGradient
          colors={[corTipo + "22", "transparent"]}
          style={card.topBar}
        >
          <View style={[card.tipoBadge, { backgroundColor: corTipo + "25" }]}>
            <MaterialCommunityIcons name="ticket-confirmation" size={13} color={corTipo} />
            <Text style={[card.tipoText, { color: corTipo }]}>{labelTipo}</Text>
          </View>
          <Text style={card.numero}>#{index + 1}</Text>
        </LinearGradient>

        {/* Corpo principal */}
        <View style={card.body}>
          {/* Coluna esquerda: QR Code */}
          <View style={card.qrCol}>
            <View style={[card.qrBox, { borderColor: corTipo + "40" }]}>
              <QRCode
                value={qrValue}
                size={110}
                backgroundColor="transparent"
                color="#FFFFFF"
                quietZone={6}
              />
            </View>
            <Text style={card.scanHint}>Escaneie na entrada</Text>
          </View>

          {/* Separador perfurado */}
          <View style={card.separator}>
            <View style={card.perfTop} />
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={card.perfDot} />
            ))}
            <View style={card.perfBottom} />
          </View>

          {/* Coluna direita: infos */}
          <View style={card.infoCol}>
            <Text style={card.nomeEvento} numberOfLines={2}>
              {evento?.tituloEvento}
            </Text>

            <View style={card.metaItem}>
              <MaterialCommunityIcons name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={card.metaText}>{evento?.dataEvento || "—"}</Text>
            </View>

            {evento?.horaInicio && (
              <View style={card.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textMuted} />
                <Text style={card.metaText}>{evento.horaInicio}</Text>
              </View>
            )}

            {evento?.localEvento && (
              <View style={card.metaItem}>
                <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textMuted} />
                <Text style={card.metaText} numberOfLines={2}>{evento.localEvento}</Text>
              </View>
            )}

            <View style={card.codigoBox}>
              <Text style={card.codigoLabel}>Código</Text>
              <Text style={card.codigo}>{ingresso.codigoIngresso}</Text>
            </View>

            {/* Status */}
            {ingresso.status === "utilizado" ? (
              <View style={card.statusUsado}>
                <MaterialCommunityIcons name="check-circle" size={13} color={colors.textMuted} />
                <Text style={card.statusUsadoText}>Utilizado</Text>
              </View>
            ) : (
              <View style={[card.statusAtivo, { backgroundColor: corTipo + "20" }]}>
                <View style={[card.statusDot, { backgroundColor: corTipo }]} />
                <Text style={[card.statusAtivoText, { color: corTipo }]}>Ativo</Text>
              </View>
            )}
          </View>
        </View>

        {/* Rodapé */}
        <TouchableOpacity style={card.shareBtn} onPress={handleShare} activeOpacity={0.8}>
          <MaterialCommunityIcons name="share-variant-outline" size={15} color={colors.textMuted} />
          <Text style={card.shareBtnText}>Compartilhar ingresso</Text>
        </TouchableOpacity>
      </View>
    </ViewShot>
  );
}

// ─── Modal de sucesso: exibe todos os QR Codes gerados ────────────────────────

function ModalSucesso({ visible, resultado, evento, onClose, onVerIngressos }) {
  const { colors, isDark } = useTheme();
  const suc = useThemedStyles(createSucStyles);
  const blurTint = isDark ? "dark" : "light";
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!resultado) return null;
  const { ingressos = [] } = resultado;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <BlurView intensity={40} tint={blurTint} style={suc.overlay}>
        <Animated.View style={[suc.sheet, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Ícone de sucesso */}
          <LinearGradient colors={["#22C55E", "#15803D"]} style={suc.iconCircle}>
            <MaterialCommunityIcons name="check-bold" size={34} color="#FFF" />
          </LinearGradient>

          <Text style={suc.titulo}>
            {ingressos.length > 1 ? "Ingressos confirmados!" : "Ingresso confirmado!"}
          </Text>
          <Text style={suc.subtitulo}>{evento?.tituloEvento}</Text>

          {/* Scroll horizontal de QR Codes */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={suc.qrScroll}
            contentContainerStyle={suc.qrScrollContent}
          >
            {ingressos.map((ing, i) => (
              <IngressoCard
                key={ing.codigoIngresso}
                ingresso={ing}
                evento={evento}
                index={i}
              />
            ))}
          </ScrollView>

          {ingressos.length > 1 && (
            <Text style={suc.swipeHint}>← deslize para ver todos os ingressos →</Text>
          )}

          <Text style={suc.aviso}>
            Apresente o QR Code ao organizador na entrada do evento.
          </Text>

          {/* Botões */}
          <TouchableOpacity style={suc.btnPrimary} onPress={onVerIngressos} activeOpacity={0.85}>
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={suc.btnGrad}>
              <MaterialCommunityIcons name="ticket-account" size={18} color="#FFF" />
              <Text style={suc.btnPrimaryText}>Ver meus ingressos</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={suc.btnSecondary} onPress={onClose}>
            <Text style={suc.btnSecondaryText}>Fechar</Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function TelaIngressos({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const evento = route.params?.evento;
  const resultadoCompra = route.params?.resultadoCompra;

  const {
    carrinho,
    loading,
    adicionarAoCarrinho,
    removerDoCarrinho,
    comprar,
    total,
    quantidadeTotal,
  } = useIngressos();

  const [etapa, setEtapa] = useState("selecao"); // selecao | carrinho | processando | sucesso
  const [resultado, setResultado] = useState(null);
  const [modalSucesso, setModalSucesso] = useState(false);

  // Se veio do carrinho com resultado de compra, mostrar modal de sucesso
  useEffect(() => {
    if (resultadoCompra) {
      setResultado(resultadoCompra);
      setEtapa("sucesso");
      setTimeout(() => setModalSucesso(true), 300);
    }
  }, [resultadoCompra]);

  const gratuito = useMemo(() => isGratuito(evento), [evento]);
  const precoBase = useMemo(() => getPrecoBase(evento), [evento]);

  const precos = useMemo(() => {
    if (gratuito) return { inteira: 0, meia: 0, estudante: 0, senior: 0, promocional: 0 };
    return {
      inteira:     Number(evento?.precoIngresso ?? evento?.precoInteira ?? precoBase),
      meia:        Number(evento?.precoMeia         || precoBase * 0.5),
      estudante:   Number(evento?.precoEstudante    || precoBase * 0.7),
      senior:      Number(evento?.precoSenior       || precoBase * 0.5),
      promocional: Number(evento?.precoPromocional  || precoBase * 0.5),
    };
  }, [gratuito, precoBase, evento]);

  const capacidadeRestante = useMemo(() => {
    const cap = Number(evento?.capacidade || 0);
    if (cap <= 0) return null;
    return Math.max(0, cap - (evento?.ingressosVendidos || 0));
  }, [evento]);

  const temVagas = capacidadeRestante === null || capacidadeRestante >= quantidadeTotal;

  // ── Sem evento ───────────────────────────────────────────────────────────
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

  // ── Processar compra ─────────────────────────────────────────────────────
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

    setEtapa("processando");

    try {
      const res = await comprar(
        evento.id,
        user.uid,
        profile?.nome || user.displayName || user.email,
        profile?.email || user.email || "",
        profile?.foto || user.photoURL || "",
        gratuito ? "gratuito" : "credit_card"
      );

      setResultado(res);
      setEtapa("sucesso");

      // Pequeno delay para o estado atualizar antes de abrir modal
      setTimeout(() => setModalSucesso(true), 300);
    } catch (err) {
      setEtapa("selecao");
      const msg =
        err.message?.includes("Capacidade limite")
          ? "Ingressos esgotados. Não há mais vagas disponíveis."
          : err.message || "Não foi possível concluir. Tente novamente.";
      Alert.alert("Erro na compra", msg);
    }
  }, [user, profile, carrinho, comprar, evento, gratuito, temVagas]);

  const handleVerIngressos = () => {
    setModalSucesso(false);
    navigation.navigate("MeusIngressos");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Modal de sucesso com QR Codes */}
      <ModalSucesso
        visible={modalSucesso}
        resultado={resultado}
        evento={evento}
        onClose={() => { setModalSucesso(false); navigation.goBack(); }}
        onVerIngressos={handleVerIngressos}
      />

      {/* HEADER */}
      <LinearGradient colors={[colors.background, colors.surface]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {gratuito ? "Reservar Ingresso" : "Comprar Ingressos"}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* STEPPER DE PROGRESSO */}
      <View style={styles.stepperWrapper}>
        <ProgressStepper etapaAtual={etapa} />
      </View>

      {/* CONTEÚDO */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner do evento */}
        <View style={styles.eventoBanner}>
          <Image
            source={{ uri: evento.imagemEvento || "https://placehold.co/600x300/171B26/FFFFFF?text=Evento" }}
            style={styles.eventoImage}
          />
          <LinearGradient colors={["transparent", "rgba(7,11,20,0.96)"]} style={styles.eventoOverlay}>
            <Text style={styles.eventoTitulo}>{evento.tituloEvento}</Text>
            <View style={styles.eventoMeta}>
              <MaterialCommunityIcons name="calendar" size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.eventoMetaText}>
                {evento.dataEvento}{evento.horaInicio ? ` · ${evento.horaInicio}` : ""}
              </Text>
            </View>
            <View style={styles.eventoMeta}>
              <MaterialCommunityIcons name="map-marker" size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.eventoMetaText} numberOfLines={1}>{evento.localEvento}</Text>
            </View>
          </LinearGradient>
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

        {/* Info sobre QR Code */}
        {etapa === "selecao" && (
          <View style={styles.infoQr}>
            <MaterialCommunityIcons name="qrcode" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoQrTitle}>QR Code de entrada</Text>
              <Text style={styles.infoQrSub}>
                Após a confirmação, você receberá um QR Code exclusivo. O organizador vai escanear na entrada para registrar sua presença automaticamente.
              </Text>
            </View>
          </View>
        )}

        {/* SELETOR DE INGRESSOS */}
        {etapa === "selecao" && temVagas && (
          <SeletorIngressos
            precos={precos}
            carrinho={carrinho}
            onAdionar={adicionarAoCarrinho}
            onRemover={removerDoCarrinho}
            gratuito={gratuito}
          />
        )}

        {/* BOTÃO PARA IR AO CARRINHO */}
        {etapa === "selecao" && carrinho.length > 0 && (
          <TouchableOpacity
            style={styles.btnIrCarrinho}
            onPress={() => setEtapa("carrinho")}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.btnIrCarrinhoGrad}>
              <MaterialCommunityIcons name="cart-arrow-right" size={20} color="#FFF" />
              <View style={styles.btnIrCarrinhoInfo}>
                <Text style={styles.btnIrCarrinhoText}>
                  {quantidadeTotal} ingresso{quantidadeTotal !== 1 ? "s" : ""}
                </Text>
                <Text style={styles.btnIrCarrinhoSub}>
                  {gratuito ? "Gratuito" : `R$ ${total.toFixed(2)}`}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* FASE DO CARRINHO */}
        {etapa === "carrinho" && (
          <View style={styles.carrinhoContainer}>
            <TouchableOpacity
              style={styles.btnVoltarCarrinho}
              onPress={() => setEtapa("selecao")}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={styles.btnVoltarCarrinhoText}>Voltar à seleção</Text>
            </TouchableOpacity>
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
            />
          </View>
        )}

        {/* PROCESSANDO */}
        {etapa === "processando" && (
          <View style={styles.processando}>
            <View style={styles.processandoAnim}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={styles.processandoTitle}>Processando sua compra</Text>
            <Text style={styles.processandoSub}>
              Gerando seus QR Codes de entrada exclusivos
            </Text>
            <View style={styles.processandoSteps}>
              <View style={styles.processandoStep}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                <Text style={styles.processandoStepText}>Validando disponibilidade</Text>
              </View>
              <View style={styles.processandoStep}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                <Text style={styles.processandoStepText}>Gerando ingressos</Text>
              </View>
              <View style={styles.processandoStep}>
                <ActivityIndicator size={12} color={colors.primary} />
                <Text style={styles.processandoStepText}>Criando QR Codes</Text>
              </View>
            </View>
          </View>
        )}

        {/* SUCESSO (enquanto modal está abrindo) */}
        {etapa === "sucesso" && !modalSucesso && (
          <View style={styles.sucessoInline}>
            <LinearGradient colors={["#22C55E20", "transparent"]} style={styles.sucessoInlineGrad}>
              <MaterialCommunityIcons name="qrcode-scan" size={48} color={colors.success} />
              <Text style={styles.sucessoInlineText}>QR Codes gerados!</Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const CARD_W = SCREEN_W * 0.82;

function createIngressoCardStyles(c) {
  return StyleSheet.create({
    wrapper: {
      width: CARD_W,
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      overflow: "hidden",
      marginRight: 14,
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    tipoBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    tipoText: { fontSize: 12, fontWeight: "700" },
    numero: { color: c.textMuted, fontSize: 12, fontWeight: "600" },
    body: {
      flexDirection: "row",
      paddingHorizontal: 14,
      paddingBottom: 14,
      gap: 0,
      alignItems: "flex-start",
    },
    qrCol: { alignItems: "center", width: 130 },
    qrBox: {
      padding: 10,
      backgroundColor: c.surfaceMuted,
      borderRadius: 14,
      borderWidth: 1,
    },
    scanHint: {
      color: c.textMuted,
      fontSize: 10,
      marginTop: 6,
      textAlign: "center",
    },
    separator: {
      width: 20,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    perfTop: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: c.background,
      marginBottom: 4,
    },
    perfDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginBottom: 5,
    },
    perfBottom: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: c.background,
      marginTop: 4,
    },
    infoCol: { flex: 1, paddingLeft: 4 },
    nomeEvento: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 19,
      marginBottom: 10,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 5,
      marginBottom: 5,
    },
    metaText: { color: c.textMuted, fontSize: 11, flex: 1, lineHeight: 15 },
    codigoBox: {
      backgroundColor: c.primarySoft,
      borderRadius: 8,
      padding: 8,
      marginTop: 8,
    },
    codigoLabel: { color: c.textMuted, fontSize: 9, fontWeight: "600", marginBottom: 2 },
    codigo: {
      color: c.primaryLight,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      fontFamily: "monospace",
    },
    statusAtivo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      alignSelf: "flex-start",
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusAtivoText: { fontSize: 11, fontWeight: "700" },
    statusUsado: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
    },
    statusUsadoText: { color: c.textMuted, fontSize: 11 },
    shareBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    shareBtnText: { color: c.textMuted, fontSize: 12, fontWeight: "600" },
  });
}

function createStepperStyles(c) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    step: {
      flex: 1,
      alignItems: "center",
    },
    circle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.glass,
      borderWidth: 2,
      borderColor: c.border,
      justifyContent: "center",
      alignItems: "center",
    },
    circleActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    circleComplete: {
      backgroundColor: c.success,
      borderColor: c.success,
    },
    line: {
      position: "absolute",
      top: 16,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: c.border,
      zIndex: -1,
    },
    lineActive: {
      backgroundColor: c.primary,
    },
    label: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 6,
      fontWeight: "600",
    },
    labelActive: {
      color: c.primary,
      fontWeight: "700",
    },
    labelComplete: {
      color: c.success,
      fontWeight: "700",
    },
  });
}

function createSucStyles(c) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: c.overlayStronger,
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingTop: 28,
      paddingBottom: 40,
      paddingHorizontal: 24,
      alignItems: "center",
      borderTopWidth: 1,
      borderColor: c.glassBorder,
    },
    iconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    titulo: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 4,
      textAlign: "center",
    },
    subtitulo: {
      color: c.textMuted,
      fontSize: 13,
      marginBottom: 20,
      textAlign: "center",
    },
    qrScroll: { width: "100%", marginBottom: 8 },
    qrScrollContent: { paddingLeft: 4, paddingRight: 4 },
    swipeHint: {
      color: c.textMuted,
      fontSize: 11,
      marginBottom: 12,
      textAlign: "center",
    },
    aviso: {
      color: c.textMuted,
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 20,
      paddingHorizontal: 10,
    },
    btnPrimary: { width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 10 },
    btnGrad: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 15,
    },
    btnPrimaryText: { color: c.onPrimary, fontSize: 15, fontWeight: "800" },
    btnSecondary: { paddingVertical: 10 },
    btnSecondaryText: { color: c.textMuted, fontSize: 14 },
  });
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  center: { justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

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
    backgroundColor: c.glass,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },

  stepperWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },

  eventoBanner: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    height: 180,
    marginVertical: 12,
  },
  eventoImage: { width: "100%", height: "100%", resizeMode: "cover" },
  eventoOverlay: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eventoTitulo: { color: "#FFF", fontSize: 17, fontWeight: "800", marginBottom: 5 },
  eventoMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  eventoMetaText: { color: "rgba(255,255,255,0.65)", fontSize: 12 },

  disponivel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.success + "18",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  disponivelText: { color: c.success, fontSize: 13, fontWeight: "600" },
  esgotado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.error + "18",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  esgotadoText: { color: c.error, fontSize: 13, fontWeight: "600" },

  infoQr: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: c.primarySoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: c.primary + "30",
  },
  infoQrTitle: { color: c.primaryLight, fontSize: 13, fontWeight: "700", marginBottom: 3 },
  infoQrSub: { color: c.textMuted, fontSize: 12, lineHeight: 17 },

  btnIrCarrinho: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  btnIrCarrinhoGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  btnIrCarrinhoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  btnIrCarrinhoText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  btnIrCarrinhoSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
  },

  processando: { alignItems: "center", paddingVertical: 40 },
  processandoAnim: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  processandoTitle: { color: c.textPrimary, fontSize: 18, fontWeight: "700", marginTop: 16 },
  processandoSub: { color: c.textMuted, fontSize: 13, marginTop: 6, textAlign: "center", paddingHorizontal: 32 },
  processandoSteps: {
    marginTop: 32,
    width: "100%",
    paddingHorizontal: 32,
  },
  processandoStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  processandoStepText: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },

  sucessoInline: { borderRadius: 20, overflow: "hidden", marginVertical: 16 },
  sucessoInlineGrad: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 },
  sucessoInlineText: { color: c.success, fontSize: 20, fontWeight: "700", marginTop: 12 },

  carrinhoContainer: {
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 16,
  },

  btnVoltarCarrinho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  btnVoltarCarrinhoText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

  errorText: { color: c.textPrimary, fontSize: 16, fontWeight: "600", marginTop: 16 },
  btnVoltar: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: c.primary,
    borderRadius: 12,
  },
  btnVoltarText: { color: "#FFF", fontWeight: "700" },
});
}
