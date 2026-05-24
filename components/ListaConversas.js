/**
 * 💬 COMPONENTE: LISTA DE CONVERSAS
 * Exibe todas as conversas do usuário com último mensagem
 */

import React, { memo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";

const TAB_BAR_CLEARANCE = 130;

const formatarHora = (timestamp) => {
  if (!timestamp) return "";
  const data = timestamp.toDate?.() || new Date(timestamp);
  const diff = Date.now() - data.getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);

  if (min < 1) return "agora";
  if (min < 60) return `${min}m`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

// ✅ Item de conversa
const ConversaItem = memo(({ conversa, onPress, userId }) => {
  // Identificar outro usuário
  const participantes = conversa.participantes || [];
  const outroUserId =
    participantes.find((participante) => participante !== userId) || "";
  const outroPerfil = conversa.participantProfiles?.[outroUserId] || {};

  const naoLidas = conversa.naoLido?.[userId] || 0;
  const ultimoFoiEle = conversa.remetente !== userId;
  const nome = outroPerfil.nome || conversa.nomeOutro || `Usuário ${outroUserId.slice(0, 4)}`;
  const avatar = outroPerfil.avatar || conversa.fotoOutro || `https://i.pravatar.cc/100?u=${outroUserId || "user"}`;

  return (
    <TouchableOpacity
      style={[styles.conversaItem, naoLidas > 0 && styles.conversaNaoLida]}
      onPress={() => onPress?.(conversa)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <Image
        source={{
          uri: avatar,
        }}
        style={styles.avatar}
      />

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.header}>
          <Text
            style={[
              styles.nome,
              naoLidas > 0 && styles.nomeNaoLido,
            ]}
            numberOfLines={1}
          >
            {nome}
          </Text>
          <Text
            style={[
              styles.hora,
              naoLidas > 0 && styles.horaNaoLida,
            ]}
          >
            {formatarHora(conversa.ultimaAtividade)}
          </Text>
        </View>

        <Text
          style={[
            styles.ultimaMensagem,
            naoLidas > 0 && styles.ultimaMensagemNaoLida,
          ]}
          numberOfLines={1}
        >
          {ultimoFoiEle ? "" : "Você: "}{conversa.ultimaMensagem || "Nenhuma mensagem"}
        </Text>
      </View>

      {/* Badge de não lidas */}
      {naoLidas > 0 && (
        <View style={styles.badgeNaoLidas}>
          <Text style={styles.badgeNaoLidasText}>{naoLidas}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ✅ Componente principal
const ListaConversas = memo(
  ({ conversas, loading, userId, onConversaPress, onNovaConversa }) => {
    if (loading) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (conversas.length === 0) {
      return (
        <View style={styles.vazio}>
          <MaterialCommunityIcons
            name="message-outline"
            size={48}
            color={Colors.textMuted}
          />
          <Text style={styles.vazioText}>Nenhuma conversa ainda</Text>
          <TouchableOpacity
            style={styles.btnNovaConversa}
            onPress={onNovaConversa}
          >
            <Text style={styles.btnNovaConversaText}>
              Iniciar Conversa
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={conversas}
        renderItem={({ item }) => (
          <ConversaItem
            conversa={item}
            onPress={onConversaPress}
            userId={userId}
          />
        )}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        contentContainerStyle={styles.lista}
        scrollEventThrottle={16}
      />
    );
  }
);

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  conversaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginVertical: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  conversaNaoLida: {
    backgroundColor: Colors.primary + "12",
    borderColor: Colors.primary + "55",
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },

  info: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  nome: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "700",
  },

  nomeNaoLido: {
    color: Colors.textPrimary,
    fontWeight: "700",
  },

  hora: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  horaNaoLida: {
    color: Colors.primary,
    fontWeight: "600",
  },

  ultimaMensagem: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  ultimaMensagemNaoLida: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  badgeNaoLidas: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  badgeNaoLidasText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  separador: {
    height: 0,
  },

  lista: {
    paddingTop: 8,
    paddingBottom: TAB_BAR_CLEARANCE,
  },

  vazio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: TAB_BAR_CLEARANCE,
  },

  vazioText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },

  btnNovaConversa: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },

  btnNovaConversaText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default ListaConversas;
