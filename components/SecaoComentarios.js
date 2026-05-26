/**
 * 💬 COMPONENTE: SEÇÃO DE COMENTÁRIOS
 * Exibe lista de comentários e permite adicionar novo comentário
 */

import React, { memo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useComments } from "../hooks/useComments";
import { Colors } from "../styles/Colors";

// ✅ Item individual de comentário
const CommentItem = memo(({ comment, onDelete }) => (
  <View style={styles.commentCard}>
    {/* Avatar */}
    <Image
      source={{
        uri: comment.foto || `https://i.pravatar.cc/100?u=${comment.userId}`,
      }}
      style={styles.avatar}
    />

    {/* Conteúdo */}
    <View style={styles.commentContent}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentUser}>{comment.nome}</Text>
        <Text style={styles.commentTime}>agora</Text>
      </View>

      <Text style={styles.commentText}>{comment.texto}</Text>

      {/* Rodapé com ações */}
      <View style={styles.commentFooter}>
        <TouchableOpacity style={styles.commentAction}>
          <MaterialCommunityIcons
            name="heart-outline"
            size={14}
            color={Colors.textMuted}
          />
          <Text style={styles.commentActionText}>Curtir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.commentAction}>
          <MaterialCommunityIcons
            name="reply"
            size={14}
            color={Colors.textMuted}
          />
          <Text style={styles.commentActionText}>Responder</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Botão deletar (se for seu comentário) */}
    {onDelete && (
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={16}
          color={Colors.error}
        />
      </TouchableOpacity>
    )}
  </View>
));

// ✅ Componente principal
const SecaoComentarios = memo(({ postId, canComment = true }) => {
  const { user, profile } = useAuth();
  const { comentarios, loading, adicionando, adicionarComentario } =
    useComments(postId);
  const [novoComentario, setNovoComentario] = useState("");

  const handleEnviar = async () => {
    if (!novoComentario.trim() || !user) return;

    const result = await adicionarComentario(
      {
        uid: user.uid,
        displayName: profile?.nome || user.displayName,
        photoURL: profile?.foto || user.photoURL,
      },
      novoComentario
    );

    if (result.success) {
      setNovoComentario("");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>
          💬 Comentários ({comentarios.length})
        </Text>
      </View>

      {/* LISTA DE COMENTÁRIOS */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loaderText}>Carregando...</Text>
        </View>
      ) : comentarios.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="comment-outline"
            size={40}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyText}>Sem comentários ainda</Text>
          <Text style={styles.emptySubtext}>Seja o primeiro a comentar!</Text>
        </View>
      ) : (
        <FlatList
          data={comentarios}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              onDelete={
                user?.uid === item.userId
                  ? () => {
                      // TODO: Implementar delete
                      console.log("Deletar comentário:", item.id);
                    }
                  : null
              }
            />
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* INPUT COMENTÁRIO */}
      {canComment && user && (
        <View style={styles.inputContainer}>
          <Image
            source={{
              uri: profile?.foto || `https://i.pravatar.cc/100?u=${user.uid}`,
            }}
            style={styles.inputAvatar}
          />

          <TextInput
            style={styles.input}
            placeholder="Adicione um comentário..."
            placeholderTextColor={Colors.textMuted}
            value={novoComentario}
            onChangeText={setNovoComentario}
            maxLength={300}
            editable={!adicionando}
          />

          <TouchableOpacity
            onPress={handleEnviar}
            disabled={adicionando || !novoComentario.trim()}
            style={styles.sendButton}
          >
            {adicionando ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={
                  novoComentario.trim() ? Colors.primary : Colors.textMuted
                }
              />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Call-to-action para fazer login */}
      {!user && canComment && (
        <View style={styles.loginPrompt}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={16}
            color={Colors.textMuted}
          />
          <Text style={styles.loginPromptText}>
            Faça login para comentar
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },

  header: {
    marginBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  // LOADER
  loaderContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },

  loaderText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // EMPTY STATE
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // COMENTÁRIOS
  commentCard: {
    flexDirection: "row",
    marginBottom: 12,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },

  commentContent: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
  },

  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  commentUser: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  commentTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  commentText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  commentFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },

  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  commentActionText: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  deleteBtn: {
    padding: 6,
  },

  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },

  // INPUT
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 80,
  },

  sendButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  // LOGIN PROMPT
  loginPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  loginPromptText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});

export default SecaoComentarios;
