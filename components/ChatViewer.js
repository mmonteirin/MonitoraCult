/**
 * 💬 COMPONENTE: VISUALIZADOR DE CHAT
 * Exibe mensagens com input para enviar novas
 */

import React, { memo, useState, useRef, useEffect } from "react";
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
import { Colors } from "../styles/Colors";

// ✅ Item de mensagem
const MensagemItem = memo(
  ({ mensagem, isPropia, onDelete, onEdit }) => {
    const [mostraOpcoes, setMostraOpcoes] = useState(false);

    const formatarHora = (timestamp) => {
      if (!timestamp) return "";
      const date = timestamp.toDate?.() || new Date(timestamp);
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    if (mensagem.deletado) {
      return (
        <View style={[styles.mensagemContainer, isPropia && styles.mensagemPropia]}>
          <View style={[styles.bolha, styles.bolhaDeletada]}>
            <View style={styles.deletadaRow}>
              <MaterialCommunityIcons
                name="cancel"
                size={14}
                color={Colors.textMuted}
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
          <View style={styles.rodapeMensagem}>
            <Text style={styles.horaMensagem}>
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
                  mensagem.lido ? Colors.primary : "rgba(255,255,255,0.5)"
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
              color={Colors.textMuted}
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
                color={Colors.primary}
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
                color={Colors.error}
              />
              <Text style={[styles.opcaoText, { color: Colors.error }]}>
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
    const [texto, setTexto] = useState("");
    const [editandoId, setEditandoId] = useState(null);
    const flatListRef = useRef(null);

    const mensagensFiltradas = termoBusca
      ? mensagens.filter(
          (m) =>
            !m.deletado &&
            m.texto?.toLowerCase().includes(termoBusca.toLowerCase())
        )
      : mensagens;

    // ✅ Auto-scroll para última mensagem
    useEffect(() => {
      if (mensagens.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }, [mensagens]);

    const handleEnviar = async () => {
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
    };

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* MENSAGENS */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : mensagensFiltradas.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons
              name="message-outline"
              size={48}
              color={Colors.textMuted}
            />
            <Text style={styles.vazioText}>Sem mensagens ainda</Text>
            <Text style={styles.vazioSubtext}>Comece a conversa!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={mensagensFiltradas}
            renderItem={({ item }) => (
              <MensagemItem
                mensagem={item}
                isPropia={item.remetenteId === userId}
                onDelete={() => onDelete?.(item.id)}
                onEdit={() => setEditandoId(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            scrollEventThrottle={16}
            contentContainerStyle={styles.mensagensContainer}
          />
        )}

        {/* INPUT */}
        <View style={styles.inputContainer}>
          {editandoId && (
            <View style={styles.editandoInfo}>
              <MaterialCommunityIcons
                name="pencil"
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.editandoText}>Editando mensagem...</Text>
              <TouchableOpacity onPress={() => setEditandoId(null)}>
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.btnAnexo}>
              <MaterialCommunityIcons
                name="plus-circle"
                size={24}
                color={Colors.primary}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Mensagem..."
              placeholderTextColor={Colors.textMuted}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  mensagensContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
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
    paddingVertical: 8,
    borderRadius: 16,
  },

  bolhaPropia: {
    backgroundColor: Colors.primary,
  },

  bolhaAlheio: {
    backgroundColor: Colors.surface,
  },

  bolhaDeletada: {
    backgroundColor: Colors.surface,
    opacity: 0.7,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },

  deletadaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  textoDeletado: {
    fontSize: 13,
    fontStyle: "italic",
    color: Colors.textMuted,
  },

  nomeRemetente: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
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
    color: Colors.textPrimary,
  },

  rodapeMensagem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  horaMensagem: {
    fontSize: 11,
  },

  horaMensagemPropia: {
    color: "rgba(255,255,255,0.7)",
  },

  horaMensagemAlheio: {
    color: Colors.textMuted,
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
  },

  // INPUT
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  editandoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary + "15",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },

  editandoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  btnAnexo: {
    padding: 4,
  },

  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 100,
    fontSize: 14,
  },

  btnEnviar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
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
    color: Colors.textPrimary,
    marginTop: 12,
  },

  vazioSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
});

export default ChatViewer;
