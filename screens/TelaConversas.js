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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../styles/Colors";
import { useDirectMessages } from "../hooks/useDirectMessages";
import ListaConversas from "../components/ListaConversas";

const TelaConversas = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const auth = route?.params?.auth;
  const userId = auth?.currentUser?.uid;
  
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
      <LinearGradient
        colors={[Colors.backgroundSecondary, Colors.surface, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mensagens</Text>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.8}
            onPress={handleNovaConversa}
          >
            <MaterialCommunityIcons name="pencil-plus" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerSubRow}>
          <Text style={styles.subtitulo}>Suas conversas diretas</Text>
          {naoLidas > 0 && (
            <View style={styles.badgeNaoLidas}>
              <Text style={styles.badgeText}>{naoLidas}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

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
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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

  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },

  headerActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  subtitulo: {
    color: Colors.textMuted,
    fontSize: 13,
  },

  badgeNaoLidas: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 9,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default TelaConversas;
