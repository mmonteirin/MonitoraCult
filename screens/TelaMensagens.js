/**
 * 💬 TELA: VISUALIZADOR DE CHAT
 * Exibe conversa individual com envio de mensagens
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../styles/Colors";
import { useConversation } from "../hooks/useDirectMessages";
import ChatViewer from "../components/ChatViewer";

const TelaMensagens = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { conversaId, conversa, auth } = route?.params;
  const userId = auth?.currentUser?.uid;

  const {
    mensagens,
    loading,
    enviando,
    enviar,
    deletar,
    editar,
  } = useConversation(userId, conversaId);

  const [outroUserId] = useState(
    conversa.participantes[0] === userId
      ? conversa.participantes[1]
      : conversa.participantes[0]
  );

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleCall = (tipo) => {
    Alert.alert(
      `Chamada de ${tipo}`,
      `Iniciar chamada de ${tipo} com usuário?`,
      [
        { text: "Cancelar" },
        { text: "Iniciar", onPress: () => console.log(`Iniciando ${tipo}`) },
      ]
    );
  };

  const handleEnviar = useCallback(
    async (dados) => {
      const resultado = await enviar({
        texto: dados.texto,
        remetenteName: dados.remetenteName,
      });

      if (!resultado.success) {
        Alert.alert("Erro", resultado.error || "Falha ao enviar");
      }
    },
    [enviar]
  );

  const handleDeletar = useCallback(
    async (mensagemId) => {
      Alert.alert(
        "Deletar mensagem?",
        "Esta ação não pode ser desfeita",
        [
          { text: "Cancelar" },
          {
            text: "Deletar",
            onPress: async () => {
              const resultado = await deletar(mensagemId);
              if (!resultado.success) {
                Alert.alert("Erro", resultado.error);
              }
            },
            style: "destructive",
          },
        ]
      );
    },
    [deletar]
  );

  const handleEditar = useCallback(
    async (mensagemId, novoTexto) => {
      const resultado = await editar(mensagemId, novoTexto);
      if (!resultado.success) {
        Alert.alert("Erro", resultado.error);
      }
    },
    [editar]
  );

  const nomeOutro = conversa?.nomeOutro || conversa?.outroNome || `Usuário ${String(outroUserId || "").slice(0, 4)}`;
  const avatarOutro = conversa?.fotoOutro || `https://i.pravatar.cc/100?u=${outroUserId}`;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={[Colors.backgroundSecondary, Colors.surface, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUser}
          activeOpacity={0.8}
        >
          <Image source={{ uri: avatarOutro }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerNome} numberOfLines={1}>{nomeOutro}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => handleCall("video")}>
            <MaterialCommunityIcons name="video" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => handleCall("audio")}>
            <MaterialCommunityIcons name="phone" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ChatViewer
        mensagens={mensagens}
        loading={loading}
        enviando={enviando}
        userId={userId}
        nomePerfil={conversa.meNome}
        onEnviar={handleEnviar}
        onDelete={handleDeletar}
        onEdit={handleEditar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  headerUser: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },

  headerNome: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    maxWidth: 160,
  },

  headerStatus: {
    fontSize: 11,
    color: Colors.success,
    marginTop: 1,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});

export default TelaMensagens;
