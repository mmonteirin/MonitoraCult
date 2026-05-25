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
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { searchUsers } from "../services/userService";
import { useAuth } from "../context/AuthContext";

const TelaBuscaUsuarios = ({ navigation, route }) => {
  const { user } = useAuth();
  const embedded = !!route?.params?.embedded;
  const scrollY = route?.params?.scrollY;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) {
        scrollY.value = event.contentOffset.y;
      }
    },
  });
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

  const Root = embedded ? View : SafeAreaView;
  const rootProps = embedded
    ? { style: styles.containerEmbedded }
    : { style: styles.container };

  const ListComponent = scrollY ? Animated.FlatList : Animated.FlatList;

  return (
    <Root {...rootProps}>
      {/* HEADER */}
      {!embedded && (
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
      )}

      {/* SEARCH BAR */}
      <View style={[styles.searchWrap, embedded && styles.searchWrapEmbedded]}>
        <View
          style={[
            styles.searchContainer,
            embedded && styles.searchContainerEmbedded,
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={Colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={
              embedded
                ? "Buscar pessoas..."
                : "Buscar por nome ou @username"
            }
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!embedded && searchQuery.length === 0 && (
        <View style={styles.tipBox}>
          <MaterialCommunityIcons name="message-plus-outline" size={20} color={Colors.primary} />
          <Text style={styles.tipText}>Selecione uma pessoa para iniciar uma conversa direta.</Text>
        </View>
      )}

      {/* RESULTADOS */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />
        </View>
      ) : usuarios.length > 0 ? (
        <ListComponent
          data={usuarios}
          renderItem={renderUsuario}
          keyExtractor={(item) => item.id}
          style={embedded ? styles.listFlex : undefined}
          contentContainerStyle={[
            styles.listContent,
            embedded && { paddingBottom: 100 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={scrollY ? scrollHandler : undefined}
          scrollEventThrottle={16}
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
          <Text style={styles.emptySubtext}>
            Tente buscar por outro nome ou username.
          </Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={42}
              color={Colors.textMuted}
            />
          </View>
          <Text style={styles.emptyText}>
            Digite para buscar usuários
          </Text>
          <Text style={styles.emptySubtext}>
            O resultado aparece aqui em tempo real.
          </Text>
        </View>
      )}
    </Root>
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
    paddingHorizontal: 14,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  searchWrapEmbedded: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },

  searchContainerEmbedded: {
    minHeight: 44,
    borderRadius: 14,
  },

  embeddedTitleWrap: {
    marginBottom: 14,
  },

  embeddedLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  embeddedTitle: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 2,
  },

  embeddedSub: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 5,
    lineHeight: 18,
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

  listFlex: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 130,
  },

  usuarioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
    paddingHorizontal: 34,
  },

  emptyText: {
    fontSize: 15,
    color: Colors.textPrimary,
    marginTop: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
    textAlign: "center",
  },

  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  tipText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default TelaBuscaUsuarios;
