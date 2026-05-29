/**
 * 🖼️ COMPONENTE: VISUALIZADOR DE STORIES
 * Exibe story individual com animações e interações
 */

import React, { memo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

import { useStories } from "../hooks/useStories";

const EMOJIS = ["😍", "😂", "😮", "😢", "😡", "🔥", "❤️"];
const SCREEN_WIDTH = Dimensions.get("window").width;

const StoryViewer = memo(
  ({
    storyGroup,
    visible,
    onClose,
    userId,
    onReacao,
  }) => {
    const { colors } = useTheme();
    const styles = useThemedStyles(createThemedScreenStyles);

    const [storyAtualIdx, setStoryAtualIdx] = useState(0);
    const [showReacoes, setShowReacoes] = useState(false);
    const [progressoAnimacao] = useState(new Animated.Value(0));
    const timeoutRef = useRef(null);
    const { verStory, adicionarReacao } = useStories(userId, []);

    const storyAtual = storyGroup.stories[storyAtualIdx];
    const totalStories = storyGroup.stories.length;

    // ✅ Auto-advance para próxima story
    useEffect(() => {
      if (!visible || !storyAtual) return;

      // Marcar como visto
      verStory(storyAtual.id);

      // Animar progresso
      progressoAnimacao.setValue(0);
      Animated.timing(progressoAnimacao, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start();

      // Timeout para próxima story
      timeoutRef.current = setTimeout(() => {
        if (storyAtualIdx < totalStories - 1) {
          setStoryAtualIdx((prev) => prev + 1);
        } else {
          // Próximo usuário ou fechar
          onClose();
        }
      }, 5000);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [visible, storyAtualIdx, totalStories, storyAtual]);

    const handleProximo = () => {
      if (storyAtualIdx < totalStories - 1) {
        setStoryAtualIdx((prev) => prev + 1);
      } else {
        onClose();
      }
    };

    const handleAnterior = () => {
      if (storyAtualIdx > 0) {
        setStoryAtualIdx((prev) => prev - 1);
      }
    };

    const handleReacao = async (emoji) => {
      await adicionarReacao(storyAtual.id, emoji);
      setShowReacoes(false);
      onReacao?.({ storyId: storyAtual.id, emoji });
    };

    if (!visible || !storyAtual) return null;

    const progresso = progressoAnimacao.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.container}>
          {/* IMAGEM DE FUNDO */}
          <Image
            source={{ uri: storyAtual.imagemUri }}
            style={styles.imagem}
          />

          {/* OVERLAY ESCURO */}
          <View style={styles.overlay} />

          {/* HEADER COM PROGRESSO */}
          <View style={styles.header}>
            {/* Barras de progresso */}
            <View style={styles.progressoContainer}>
              {Array.from({ length: totalStories }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.progressoBarra,
                    idx < storyAtualIdx && styles.progressoCompleto,
                    idx === storyAtualIdx && styles.progressoAtual,
                  ]}
                >
                  {idx === storyAtualIdx && (
                    <Animated.View
                      style={[
                        styles.progressoPreenchimento,
                        { width: progresso },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* INFO DO CRIADOR */}
            <View style={styles.criadoInfo}>
              <Image
                source={{ uri: storyGroup.userPhoto }}
                style={styles.avatarCriador}
              />
              <View>
                <Text style={styles.nomeCriador}>{storyGroup.userName}</Text>
                <Text style={styles.timpoStory}>há 2h</Text>
              </View>
              <TouchableOpacity style={{ marginLeft: "auto" }}>
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* TEXTO DA STORY */}
          {storyAtual.textoStory && (
            <View style={styles.textoOverlay}>
              <Text style={styles.textoStory}>{storyAtual.textoStory}</Text>
            </View>
          )}

          {/* ÁREAS CLICÁVEIS */}
          <TouchableOpacity
            style={styles.areaEsquerda}
            onPress={handleAnterior}
          />
          <TouchableOpacity
            style={styles.areaDireita}
            onPress={handleProximo}
          />

          {/* FOOTER COM AÇÕES */}
          <View style={styles.footer}>
            {/* Reações */}
            <TouchableOpacity
              style={styles.btnAcao}
              onPress={() => setShowReacoes(!showReacoes)}
            >
              <MaterialCommunityIcons
                name="emoticon-outline"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            {/* Mensagem */}
            <TouchableOpacity style={styles.btnAcao}>
              <MaterialCommunityIcons
                name="message-outline"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            {/* Enviar para */}
            <TouchableOpacity style={styles.btnAcao}>
              <MaterialCommunityIcons
                name="share-outline"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            {/* Fechar */}
            <TouchableOpacity
              style={styles.btnAcao}
              onPress={onClose}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* SELETOR DE REAÇÕES */}
          {showReacoes && (
            <View style={styles.reacoesContainer}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiBtn}
                  onPress={() => handleReacao(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* CONTADOR DE VISUALIZAÇÕES */}
          <View style={styles.visualizacoes}>
            <MaterialCommunityIcons
              name="eye-outline"
              size={18}
              color="#fff"
            />
            <Text style={styles.vizualizacoesText}>
              {storyAtual.visualizacoes || 0}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }
);

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  imagem: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  // HEADER
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  progressoContainer: {
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  progressoBarra: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
    overflow: "hidden",
  },

  progressoCompleto: {
    backgroundColor: "#fff",
  },

  progressoAtual: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  progressoPreenchimento: {
    height: "100%",
    backgroundColor: "#fff",
  },

  criadoInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },

  avatarCriador: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  nomeCriador: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  timpoStory: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },

  // TEXTO
  textoOverlay: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    zIndex: 5,
  },

  textoStory: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // ÁREAS CLICÁVEIS
  areaEsquerda: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "30%",
    height: "100%",
  },

  areaDireita: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "30%",
    height: "100%",
  },

  // FOOTER
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 10,
  },

  btnAcao: {
    padding: 10,
  },

  // REAÇÕES
  reacoesContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    zIndex: 15,
  },

  emojiBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  emojiText: {
    fontSize: 24,
  },

  // VISUALIZAÇÕES
  visualizacoes: {
    position: "absolute",
    bottom: 20,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  vizualizacoesText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  });
}

export default StoryViewer;
