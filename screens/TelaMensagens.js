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
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { useAuth } from "../context/AuthContext";
import { useConversation, useDirectMessages } from "../hooks/useDirectMessages";
import { obterOuCriarConversa } from "../services/dmService";
import ChatViewer from "../components/ChatViewer";

const TelaMensagens = ({ navigation, route }) => {
  const { user } = useAuth();
  const userId = user?.uid;
  
  const { conversaId: rotaConversaId, conversa, usuarioSelecionado } = route?.params || {};
  const [conversaId, setConversaId] = useState(rotaConversaId);
  const [outroUsuario, setOutroUsuario] = useState(null);
  const [inicializando, setInicializando] = useState(!!usuarioSelecionado);

  const {
    mensagens,
    loading,
    enviando,
    enviar,
    deletar,
    editar,
  } = useConversation(userId, conversaId);

  // 🔄 Se for um novo usuário selecionado, criar conversa
  useEffect(() => {
    if (usuarioSelecionado && !conversaId && userId) {
      const criarConversa = async () => {
        try {
          const resultado = await obterOuCriarConversa(
            userId,
            usuarioSelecionado.id,
            usuarioSelecionado.nome,
            usuarioSelecionado.avatar
          );

          if (resultado.success) {
            setConversaId(resultado.conversaId);
            setOutroUsuario(usuarioSelecionado);
            setInicializando(false);
          } else {
            Alert.alert("Erro", "Não foi possível criar a conversa");
            setInicializando(false);
          }
        } catch (error) {
          console.error("Erro ao criar conversa:", error);
          Alert.alert("Erro", error.message);
          setInicializando(false);
        }
      };

      criarConversa();
    } else if (conversa && !outroUsuario) {
      // Se veio com conversa existente, extrair o outro usuário
      const outro = conversa.participantes[0] === userId
        ? conversa.participantes[1]
        : conversa.participantes[0];
      setOutroUsuario(outro);
    }
  }, [usuarioSelecionado, conversaId, userId, conversa]);

  // ✅ Configurar header
  useEffect(() => {
    if (!outroUsuario) return;

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
            source={{
              uri: outroUsuario.avatar || `https://i.pravatar.cc/100?u=${outroUsuario.id || outroUsuario}`,
            }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerNome}>
              {outroUsuario.nome || `Usuário ${outroUsuario.slice ? outroUsuario.slice(0, 4) : outroUsuario.id?.slice(0, 4)}`}
            </Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
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
  }, [navigation, outroUsuario]);

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

  if (inicializando) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Iniciando conversa...</Text>
      </View>
    );
  }

  if (!conversaId) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <MaterialCommunityIcons
          name="message-outline"
          size={48}
          color={Colors.textMuted}
        />
        <Text style={styles.emptyText}>Erro ao abrir conversa</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ChatViewer
        mensagens={mensagens}
        loading={loading}
        enviando={enviando}
        userId={userId}
        nomePerfil={outroUsuario?.nome}
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

  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: "500",
  },

  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: "500",
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
});

export default TelaMensagens;
