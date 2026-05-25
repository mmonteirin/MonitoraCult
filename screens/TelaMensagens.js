/**
 * 💬 TELA: VISUALIZADOR DE CHAT
 * Exibe conversa individual com envio de mensagens
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { useConversation } from "../hooks/useDirectMessages";
import { getPublicProfile } from "../services/profileService";
import ChatViewer from "../components/ChatViewer";

const TelaMensagens = ({ navigation, route }) => {
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

  const [outroPerfil, setOutroPerfil] = useState(null);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");

  // Buscar perfil do outro usuário
  useEffect(() => {
    if (!outroUserId) return;

    getPublicProfile(outroUserId)
      .then((perfil) => setOutroPerfil(perfil))
      .catch(() => setOutroPerfil(null));
  }, [outroUserId]);

  const nomeOutro = outroPerfil?.displayName || conversa.nomeOutro || `Usuário ${outroUserId.slice(0, 6)}`;
  const fotoOutro = outroPerfil?.photoURL || conversa.fotoOutro || `https://i.pravatar.cc/100?u=${outroUserId}`;

  // Configurar header
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      },
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <Image
            source={{ uri: fotoOutro }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerNome}>{nomeOutro}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.btnHeader}
            onPress={() => {
              setBuscaAberta((prev) => !prev);
              setTermoBusca("");
            }}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnHeader}
            onPress={() => handleCall("video")}
          >
            <MaterialCommunityIcons
              name="video"
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnHeader}
            onPress={() => handleCall("audio")}
          >
            <MaterialCommunityIcons
              name="phone"
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnHeader}>
            <MaterialCommunityIcons
              name="information-outline"
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, outroUserId, nomeOutro, fotoOutro, buscaAberta]);

  const handleCall = (tipo) => {
    Alert.alert(
      `Chamada de ${tipo}`,
      `Iniciar chamada de ${tipo} com ${nomeOutro}?`,
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
        "Apagar mensagem?",
        "Esta ação não pode ser desfeita.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Apagar",
            onPress: async () => {
              const resultado = await deletar(mensagemId);
              if (!resultado.success) {
                Alert.alert("Erro", resultado.error || "Não foi possível apagar a mensagem.");
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

  return (
    <View style={styles.container}>
      {buscaAberta && (
        <View style={styles.barraBusca}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={Colors.textMuted}
          />
          <TextInput
            style={styles.inputBusca}
            placeholder="Buscar mensagens..."
            placeholderTextColor={Colors.textMuted}
            value={termoBusca}
            onChangeText={setTermoBusca}
            autoFocus
          />
          {termoBusca.length > 0 && (
            <TouchableOpacity onPress={() => setTermoBusca("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              setBuscaAberta(false);
              setTermoBusca("");
            }}
            style={styles.btnFecharBusca}
          >
            <Text style={styles.txtFecharBusca}>Fechar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ChatViewer
        mensagens={mensagens}
        loading={loading}
        enviando={enviando}
        userId={userId}
        nomePerfil={conversa.meNome}
        onEnviar={handleEnviar}
        onDelete={handleDeletar}
        onEdit={handleEditar}
        termoBusca={termoBusca}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  headerNome: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  headerStatus: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 12,
  },

  btnHeader: {
    padding: 8,
  },

  barraBusca: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },

  inputBusca: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },

  btnFecharBusca: {
    paddingLeft: 8,
  },

  txtFecharBusca: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
});

export default TelaMensagens;
