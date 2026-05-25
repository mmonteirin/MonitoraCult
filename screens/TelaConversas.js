/**
 * 💬 TELA: GERENCIADOR DE CONVERSAS
 * Exibe lista de conversas com opções
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { useAuth } from "../context/AuthContext";
import { useDirectMessages } from "../hooks/useDirectMessages";
import ListaConversas from "../components/ListaConversas";

const TelaConversas = ({ navigation, route }) => {
  const { user } = useAuth();
  const userId = user?.uid;
  
  const { conversas, loading, naoLidas, iniciarConversa, deletarConversa } =
    useDirectMessages(userId);

  const handleConversaPress = useCallback(
    (conversa) => {
      navigation.navigate("TelaMensagens", {
        conversaId: conversa.id,
        conversa,
      });
    },
    [navigation]
  );

  const handleNovaConversa = useCallback(() => {
    navigation.navigate("BuscaUsuarios");
  }, [navigation]);

  const handleDeleteConversa = useCallback(
    async (conversaId) => {
      const resultado = await deletarConversa(conversaId);
      if (resultado.success) {
        // Conversa foi deletada com sucesso (removida da lista)
      }
    },
    [deletarConversa]
  );

  return (
    <View style={styles.container}>
      {/* HEADER MELHORADO */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.label}>Mensagens</Text>
          <View style={styles.headerTitleRow}>
            <Text style={styles.titulo}>Conversas</Text>
            {naoLidas > 0 && (
              <View style={styles.badgePrincipal}>
                <Text style={styles.badgePrincipalText}>{naoLidas}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitulo}>Suas conversas e mensagens diretas</Text>
        </View>

        <TouchableOpacity
          style={styles.btnNovaConversa}
          onPress={handleNovaConversa}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="pencil-plus"
            size={24}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      <ListaConversas
        conversas={conversas}
        loading={loading}
        userId={userId}
        onConversaPress={handleConversaPress}
        onNovaConversa={handleNovaConversa}
        onDeleteConversa={handleDeleteConversa}
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
    backgroundColor: Colors.surface,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  headerContent: {
    flex: 1,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  label: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  subtitulo: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },

  badgePrincipal: {
    backgroundColor: Colors.primary,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  badgePrincipalText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  btnNovaConversa: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
});

export default TelaConversas;
