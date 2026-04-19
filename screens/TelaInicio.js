import React from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import CategoryCard from "../components/CardCategorias";
import EventCard from "../components/cardEventos";

export default function TelaInicio() {
  const navigation = useNavigation();

  const categorias = [
    {
      nome: "Teatro",
      icon: <MaterialCommunityIcons name="drama-masks" size={24} />,
    },
    { nome: "Museus", icon: <MaterialCommunityIcons name="bank" size={24} /> },
    {
      nome: "Shows",
      icon: <MaterialCommunityIcons name="microphone" size={24} />,
    },
    {
      nome: "Livros",
      icon: <MaterialCommunityIcons name="book-open" size={24} />,
    },
    { nome: "Cinema", icon: <MaterialCommunityIcons name="movie" size={24} /> },
    {
      nome: "Festas",
      icon: <MaterialCommunityIcons name="party-popper" size={24} />,
    },
  ];

  const eventos = [
    { id: 1, image: "https://via.placeholder.com/150" },
    { id: 2, image: "https://via.placeholder.com/150" },
    { id: 3, image: "https://via.placeholder.com/150" },
    { id: 4, image: "https://via.placeholder.com/150" },
  ];

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={
        <>
          {/* Header */}
          <Text style={styles.title}>Olá, Marcos</Text>
          <Text style={styles.subtitle}>O que vamos curtir hoje?</Text>

          {/* Categorias */}
          <FlatList
            data={categorias}
            numColumns={2}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <CategoryCard
                item={item}
                onPress={() =>
                  navigation.navigate("Busca", { tipo: item.nome })
                }
              />
            )}
            columnWrapperStyle={{ justifyContent: "space-between" }}
          />

          {/* Últimos locais */}
          <Text style={styles.section}>Últimos Locais Visitados</Text>

          <Image
            source={{ uri: "https://via.placeholder.com/400x200" }}
            style={styles.banner}
          />

          <View style={styles.row}>
            <Image
              source={{ uri: "https://via.placeholder.com/100" }}
              style={styles.smallImg}
            />
            <Image
              source={{ uri: "https://via.placeholder.com/100" }}
              style={styles.smallImg}
            />
            <Image
              source={{ uri: "https://via.placeholder.com/100" }}
              style={styles.smallImg}
            />
          </View>

          {/* Eventos */}
          <Text style={styles.section}>Eventos perto de você...</Text>
        </>
      }
      data={eventos}
      numColumns={2}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <EventCard
          image={item.image}
          onPress={() => navigation.navigate("Feed")}
        />
      )}
      columnWrapperStyle={{ justifyContent: "space-between" }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 15,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#aaa",
    marginBottom: 15,
  },
  section: {
    color: "#fff",
    marginVertical: 15,
    fontSize: 16,
  },
  banner: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  smallImg: {
    width: "32%",
    height: 80,
    borderRadius: 10,
  },
});
