/**
 * 💬 TELA: GERENCIADOR DE CONVERSAS
 * Exibe lista de conversas com opções
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { useDirectMessages } from "../hooks/useDirectMessages";
import ListaConversas from "../components/ListaConversas";

const TelaConversas = ({ navigation, route }) => {
  const auth = route?.params?.auth; // Obtém auth via params
  const userId = auth?.currentUser?.uid;
  
  const { conversas, loading, naoLidas, iniciarConversa } =
    useDirectMessages(userId);

  const handleConversaPress = useCallback(
    (conversa) => {
      navigation.navigate("TelaMensagens", {
        conversaId: conversa.id,
        conversa,
        auth,
      });
    },
    [navigation, auth]
  );

  const handleNovaConversa = useCallback(() => {
    // Aqui você pode adicionar um modal para selecionar contato
    Alert.alert(
      "Nova Conversa",
      "Selecione um contato para iniciar",
      [{ text: "OK" }]
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.titulo}>Mensagens</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
  },

  badgeNaoLidas: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  btnNovaConversa: {
    padding: 8,
  },
});

export default TelaConversas;
