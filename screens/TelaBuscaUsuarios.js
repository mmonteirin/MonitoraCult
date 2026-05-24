/**
 * 🔍 TELA: BUSCA DE USUÁRIOS PARA INICIAR CONVERSA
 * Permite buscar e selecionar usuários para mensagem direta
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { searchUsers } from "../services/userService";
import { useAuth } from "../context/AuthContext";

const TelaBuscaUsuarios = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔍 Buscar usuários quando o texto muda
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setUsuarios([]);
      return;
    }

    const buscar = async () => {
      setLoading(true);
      try {
        const resultado = await searchUsers(searchQuery, user?.uid);
        setUsuarios(resultado || []);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(buscar, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.uid]);

  const handleSelectUsuario = useCallback(
    (usuarioSelecionado) => {
      navigation.navigate("TelaMensagens", {
        conversaId: null,
        usuarioSelecionado,
      });
    },
    [navigation]
  );

  const handleVoltar = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderUsuario = ({ item }) => (
    <TouchableOpacity
      style={styles.usuarioItem}
      onPress={() => handleSelectUsuario(item)}
    >
      <Image
        source={{
          uri: item.avatar || `https://i.pravatar.cc/100?u=${item.id}`,
        }}
        style={styles.avatar}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.nome}>{item.nome || item.username}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={Colors.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.btnVoltar}
          onPress={handleVoltar}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.titulo}>Buscar usuários</Text>
        <View style={styles.btnVoltar} />
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={Colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou @username"
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* RESULTADOS */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />
        </View>
      ) : usuarios.length > 0 ? (
        <FlatList
          data={usuarios}
          renderItem={renderUsuario}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : searchQuery.length > 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="account-search-outline"
            size={48}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyText}>
            Nenhum usuário encontrado
          </Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={48}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyText}>
            Digite para buscar usuários
          </Text>
        </View>
      )}
    </SafeAreaView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  btnVoltar: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  listContent: {
    paddingHorizontal: 16,
  },

  usuarioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },

  infoContainer: {
    flex: 1,
  },

  nome: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  username: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 16,
  },
});

export default TelaBuscaUsuarios;
