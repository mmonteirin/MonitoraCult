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
  
  const { conversas, loading, naoLidas, iniciarConversa } =
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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.label}>Conversas</Text>
          <Text style={styles.titulo}>Mensagens</Text>
          <Text style={styles.subtitulo}>Fale com pessoas, criadores e organizadores.</Text>
          {naoLidas > 0 && (
            <View style={styles.badgeNaoLidas}>
              <Text style={styles.badgeText}>{naoLidas}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.btnNovaConversa}
          onPress={handleNovaConversa}
        >
          <MaterialCommunityIcons
            name="pencil-plus"
            size={24}
            color={Colors.primary}
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
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerContent: {
    flex: 1,
    paddingRight: 14,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 2,
  },

  label: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0,
  },

  subtitulo: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 5,
    lineHeight: 18,
  },

  badgeNaoLidas: {
    backgroundColor: Colors.primary,
    alignSelf: "flex-start",
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 7,
    marginTop: 10,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  btnNovaConversa: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default TelaConversas;
