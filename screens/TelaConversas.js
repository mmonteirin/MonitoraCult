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
  const embedded = !!route?.params?.embedded;
  const scrollY = route?.params?.scrollY;
  const onNovaConversaExterno = route?.params?.onNovaConversa;

  const { user } = useAuth();
  const userId = user?.uid;

  const { conversas, loading, deletarConversa } = useDirectMessages(userId);

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
    if (onNovaConversaExterno) {
      onNovaConversaExterno();
      return;
    }
    navigation.navigate("BuscaUsuarios");
  }, [navigation, onNovaConversaExterno]);

  const handleDeleteConversa = useCallback(
    async (conversaId) => {
      await deletarConversa(conversaId);
    },
    [deletarConversa]
  );

  if (embedded) {
    return (
      <View style={styles.containerEmbedded}>
        <ListaConversas
          conversas={conversas}
          loading={loading}
          userId={userId}
          embedded
          scrollY={scrollY}
          onConversaPress={handleConversaPress}
          onNovaConversa={handleNovaConversa}
          onDeleteConversa={handleDeleteConversa}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.label}>Mensagens</Text>
          <View style={styles.headerTitleRow}>
            <Text style={styles.titulo}>Conversas</Text>
          </View>
          <Text style={styles.subtitulo}>
            Suas conversas e mensagens diretas
          </Text>
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

  containerEmbedded: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
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
