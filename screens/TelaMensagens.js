import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../styles/Colors";
import { useAuth } from "../context/AuthContext";
import { useConversation } from "../hooks/useDirectMessages";
import { obterOuCriarConversa } from "../services/dmService";
import ChatViewer from "../components/ChatViewer";

const TelaMensagens = ({ navigation, route }) => {
  const { user, nome, foto } = useAuth();
  const userId = user?.uid;
  const insets = useSafeAreaInsets();

  // ── Extrair params de forma estável ────────────────────────────────────────
  // Lemos os params uma única vez via ref para não colocar objetos instáveis
  // nas dependências de useEffect.
  const paramsRef = useRef(route?.params || {});
  const {
    conversaId: rotaConversaId,
    conversa,
    usuarioSelecionado,
  } = paramsRef.current;

  const [conversaId, setConversaId]   = useState(rotaConversaId ?? null);
  const [inicializando, setInicializando] = useState(!!usuarioSelecionado && !rotaConversaId);

  // Extrair o outro usuário de forma estável, sem useEffect
  const outroUsuario = useMemo(() => {
    if (usuarioSelecionado) return usuarioSelecionado;
    if (conversa) {
      const profiles = conversa.participantProfiles || {};
      // conversa.participantes pode ser array de IDs ou array de objetos
      const partics = conversa.participantes || [];
      const outroId = partics.find((p) => {
        const pid = typeof p === "string" ? p : p?.id || p?.uid;
        return pid !== userId;
      });
      if (typeof outroId === "object") return outroId;
      if (profiles[outroId]) return profiles[outroId];
      // Se for só um ID, monta objeto mínimo
      if (outroId) return {
        id: outroId,
        nome: conversa.nomeOutro || conversa.outroNome || "Usuário",
        avatar: conversa.fotoOutro || `https://i.pravatar.cc/100?u=${outroId}`,
      };
    }
    return null;
  }, [conversa, userId, usuarioSelecionado]);

  const { mensagens, loading, enviando, enviar, deletar, editar } =
    useConversation(userId, conversaId);

  // ── Criar conversa se veio de BuscaUsuarios ────────────────────────────────
  useEffect(() => {
    if (!usuarioSelecionado || rotaConversaId || !userId) return;

    let cancelled = false;

    const criar = async () => {
      try {
        const resultado = await obterOuCriarConversa(
          userId,
          usuarioSelecionado.id,
          usuarioSelecionado.nome,
          usuarioSelecionado.avatar,
          nome || user?.displayName || "Usuário",
          foto || user?.photoURL
        );
        if (cancelled) return;

        if (resultado.success) {
          setConversaId(resultado.conversaId);
        } else {
          Alert.alert("Erro", "Não foi possível criar a conversa");
        }
      } catch (error) {
        if (!cancelled) Alert.alert("Erro", error.message);
      } finally {
        if (!cancelled) setInicializando(false);
      }
    };

    criar();
    return () => { cancelled = true; };
  }, [foto, nome, rotaConversaId, user, userId, usuarioSelecionado]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEnviar = useCallback(
    async (dados) => {
      const resultado = await enviar({
        texto: dados.texto,
        destinatarioId: outroUsuario?.id,
        destinatarioName: outroUsuario?.nome,
        destinatarioPhoto: outroUsuario?.avatar,
        remetenteName: nome || user?.displayName || "Usuário",
        remetentePhoto: foto || user?.photoURL,
      });
      if (!resultado.success) Alert.alert("Erro", resultado.error || "Falha ao enviar");
    },
    [enviar, foto, nome, outroUsuario, user]
  );

  const handleDeletar = useCallback(
    async (mensagemId) => {
      Alert.alert("Deletar mensagem?", "Esta ação não pode ser desfeita", [
        { text: "Cancelar" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            const resultado = await deletar(mensagemId);
            if (!resultado.success) Alert.alert("Erro", resultado.error);
          },
        },
      ]);
    },
    [deletar]
  );

  const handleEditar = useCallback(
    async (mensagemId, novoTexto) => {
      const resultado = await editar(mensagemId, novoTexto);
      if (!resultado.success) Alert.alert("Erro", resultado.error);
    },
    [editar]
  );

  // ── Render: estados de espera ──────────────────────────────────────────────
  if (inicializando) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Iniciando conversa...</Text>
      </View>
    );
  }

  if (!conversaId) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="message-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyText}>Erro ao abrir conversa</Text>
      </View>
    );
  }

  // ── Render principal ───────────────────────────────────────────────────────
  const avatarUri =
    outroUsuario?.avatar ||
    outroUsuario?.foto ||
    `https://i.pravatar.cc/100?u=${outroUsuario?.id || "user"}`;

  const nomeOutro =
    outroUsuario?.nome ||
    `Usuário ${String(outroUsuario?.id || "").slice(0, 4)}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER MANUAL — compatível com headerShown: false do Stack */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUser}
          activeOpacity={0.8}
          onPress={() =>
            outroUsuario?.id &&
            navigation.navigate("PerfilPublico", { userId: outroUsuario.id })
          }
        >
          <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerNome} numberOfLines={1}>{nomeOutro}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() =>
              Alert.alert("Chamada de vídeo", "Recurso em breve!")
            }
          >
            <MaterialCommunityIcons name="video" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() =>
              Alert.alert("Chamada de áudio", "Recurso em breve!")
            }
          >
            <MaterialCommunityIcons name="phone" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CHAT */}
      <ChatViewer
        mensagens={mensagens}
        loading={loading}
        enviando={enviando}
        userId={userId}
        nomePerfil={nomeOutro}
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
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textMuted,
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: Colors.card,
  },
  headerNome: {
    fontSize: 14,
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
  },
  headerBtn: {
    padding: 8,
  },
});

export default TelaMensagens;
