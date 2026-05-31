/**
 * 💬 COMPONENTE: VISUALIZADOR DE CHAT
 * Exibe mensagens com input para enviar novas
 */

import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

const TAB_BAR_CLEARANCE = 96;

const formatarHora = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate?.() || new Date(timestamp);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

// ✅ Item de mensagem
const MensagemItem = memo(
  ({ mensagem, isPropia, onDelete, onEdit }) => {
    const [mostraOpcoes, setMostraOpcoes] = useState(false);

    const { colors } = useTheme();
    const styles = useThemedStyles(createThemedScreenStyles);

    if (mensagem.deletado) {
      return (
        <View style={[styles.mensagemContainer, isPropia && styles.mensagemPropia]}>
          <View style={[styles.bolha, styles.bolhaDeletada]}>
            <View style={styles.deletadaRow}>
              <MaterialCommunityIcons
                name="cancel"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.textoDeletado}>Mensagem apagada</Text>
            </View>
            <Text style={styles.horaMensagem}>
              {formatarHora(mensagem.createdAt)}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.mensagemContainer, isPropia && styles.mensagemPropia]}>
        {/* Avatar */}
        {!isPropia && (
          <Image
            source={{
              uri: mensagem.remetentePhoto || `https://i.pravatar.cc/100?u=${mensagem.remetenteId}`,
            }}
            style={styles.avatarMensagem}
          />
        )}

        {/* Bolha */}
        <View
          style={[
            styles.bolha,
            isPropia ? styles.bolhaPropia : styles.bolhaAlheio,
          ]}
        >
          {/* Nome (apenas se não for propio) */}
          {!isPropia && (
            <Text style={styles.nomeRemetente}>{mensagem.remetenteName}</Text>
          )}

          {/* Conteúdo */}
          {mensagem.midia && (
            <Image
              source={{ uri: mensagem.midia.uri }}
              style={styles.midiaChat}
            />
          )}

          <Text
            style={[
              styles.textoMensagem,
              isPropia
                ? styles.textoMensagemPropia
                : styles.textoMensagemAlheio,
            ]}
          >
            {mensagem.texto}
          </Text>

          {/* Indicadores */}
          <View style={[styles.rodapeMensagem, isPropia && styles.rodapeMensagemPropia]}>
            <Text style={[styles.horaMensagem, isPropia ? styles.horaMensagemPropia : styles.horaMensagemAlheio]}>
              {formatarHora(mensagem.createdAt)}
            </Text>

            {/* Editado */}
            {mensagem.editado && (
              <Text style={styles.editadoLabel}>editado</Text>
            )}

            {/* Visto (apenas propio) */}
            {isPropia && (
              <MaterialCommunityIcons
                name={mensagem.lido ? "check-all" : "check"}
                size={14}
                color={
                  mensagem.lido ? colors.primary : "rgba(255,255,255,0.5)"
                }
              />
            )}
          </View>
        </View>

        {/* Botão de opções */}
        {isPropia && (
          <TouchableOpacity
            style={styles.btnOpcoes}
            onPress={() => setMostraOpcoes(!mostraOpcoes)}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {/* Menu de opções */}
        {mostraOpcoes && isPropia && (
          <View style={styles.menuOpcoes}>
            <TouchableOpacity
              style={styles.opcao}
              onPress={() => {
                onEdit?.(mensagem.id);
                setMostraOpcoes(false);
              }}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.opcaoText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.opcao}
              onPress={() => {
                onDelete?.(mensagem.id);
                setMostraOpcoes(false);
              }}
            >
              <MaterialCommunityIcons
                name="trash-can"
                size={16}
                color={colors.error}
              />
              <Text style={[styles.opcaoText, { color: colors.error }]}>
                Deletar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
);

// ✅ Componente principal
const ChatViewer = memo(
  ({
    mensagens,
    loading,
    enviando,
    userId,
    onEnviar,
    onDelete,
    onEdit,
    nomePerfil,
    termoBusca,
  }) => {
    const { colors, isDark } = useTheme();
    const styles = useThemedStyles(createThemedScreenStyles);
    const blurTint = isDark ? "dark" : "light";
    const [texto, setTexto] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    const flatListRef = useRef(null);
    const insets = useSafeAreaInsets();
    const bottomClearance = TAB_BAR_CLEARANCE + insets.bottom;

    // ✅ Filtrar mensagens pela busca
    const mensagensFiltradas = useMemo(() => {
      if (!termoBusca) return mensagens;
      return mensagens.filter(
        (m) =>
          !m.deletado &&
          m.texto?.toLowerCase().includes(termoBusca.toLowerCase())
      );
    }, [mensagens, termoBusca]);

    // ✅ Auto-scroll para última mensagem
    useEffect(() => {
      if (mensagens.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }, [mensagens]);

    const handleEnviar = useCallback(async () => {
      if (!texto.trim()) return;

      if (editandoId) {
        // Modo edição
        await onEdit?.(editandoId, texto);
        setEditandoId(null);
      } else {
        // Novo envio
        await onEnviar?.({
          texto,
          remetenteName: nomePerfil,
        });
      }

      setTexto("");
    }, [texto, editandoId, onEdit, onEnviar, nomePerfil]);

    const renderItem = useCallback(({ item }) => (
      <MensagemItem
        mensagem={item}
        isPropia={item.remetenteId === userId}
        onDelete={() => onDelete?.(item.id)}
        onEdit={() => setEditandoId(item.id)}
      />
    ), [userId, onDelete]);

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* MENSAGENS */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : mensagensFiltradas.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons
              name="message-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.vazioText}>Sem mensagens ainda</Text>
            <Text style={styles.vazioSubtext}>Comece a conversa!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={mensagensFiltradas}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEventThrottle={16}
            contentContainerStyle={styles.mensagensContainer}
          />
        )}

        {/* INPUT */}
        <View style={[styles.inputContainer, { marginBottom: bottomClearance }]}>
          {editandoId && (
            <View style={styles.editandoInfo}>
              <MaterialCommunityIcons
                name="pencil"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.editandoText}>Editando mensagem...</Text>
              <TouchableOpacity onPress={() => setEditandoId(null)}>
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.btnAnexo}>
              <MaterialCommunityIcons
                name="image-plus"
                size={22}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Mensagem..."
              placeholderTextColor={colors.textMuted}
              value={texto}
              onChangeText={setTexto}
              maxLength={500}
              multiline
            />

            <TouchableOpacity
              style={[styles.btnEnviar, enviando && styles.btnEnviarDesabilitado]}
              onPress={handleEnviar}
              disabled={enviando || !texto.trim()}
            >
              {enviando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons
                  name={editandoId ? "check" : "send"}
                  size={20}
                  color="#fff"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }
);

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  mensagensContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 24,
  },

  mensagemContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },

  mensagemPropia: {
    justifyContent: "flex-end",
  },

  avatarMensagem: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  bolha: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
  },

  bolhaPropia: {
    backgroundColor: c.primary,
    borderColor: c.primary,
    borderBottomRightRadius: 6,
  },

  bolhaAlheio: {
    backgroundColor: c.surface,
    borderColor: c.border,
    borderBottomLeftRadius: 6,
  },

  nomeRemetente: {
    fontSize: 11,
    fontWeight: "600",
    color: c.textMuted,
    marginBottom: 2,
  },

  midiaChat: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 6,
  },

  textoMensagem: {
    fontSize: 14,
    lineHeight: 20,
  },

  textoMensagemPropia: {
    color: "#fff",
  },

  textoMensagemAlheio: {
    color: c.textPrimary,
  },

  rodapeMensagem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  rodapeMensagemPropia: {
    justifyContent: "flex-end",
  },

  horaMensagem: {
    fontSize: 11,
  },

  horaMensagemPropia: {
    color: "rgba(255,255,255,0.7)",
  },

  horaMensagemAlheio: {
    color: c.textMuted,
  },

  editadoLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontStyle: "italic",
  },

  btnOpcoes: {
    padding: 6,
  },

  menuOpcoes: {
    position: "absolute",
    right: 0,
    bottom: 40,
    backgroundColor: c.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.border,
  },

  opcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  opcaoText: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary,
  },

  bolhaDeletada: {
    backgroundColor: "transparent",
    borderColor: c.textMuted,
    opacity: 0.7,
    borderWidth: 1,
    borderStyle: "dashed",
  },

  deletadaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  textoDeletado: {
    fontSize: 13,
    color: c.textMuted,
    fontStyle: "italic",
  },

  // INPUT
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 14 : 10,
  },

  editandoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.primary + "15",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },

  editandoText: {
    flex: 1,
    fontSize: 12,
    color: c.primary,
    fontWeight: "600",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  btnAnexo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.border,
  },

  input: {
    flex: 1,
    backgroundColor: c.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: c.textPrimary,
    borderWidth: 1,
    borderColor: c.border,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 14,
  },

  btnEnviar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  btnEnviarDesabilitado: {
    opacity: 0.5,
  },

  vazio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  vazioText: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textPrimary,
    marginTop: 12,
  },

  vazioSubtext: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 4,
  },
  });
}

export default ChatViewer;
