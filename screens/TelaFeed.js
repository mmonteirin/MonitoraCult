import React, { useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../styles/Styles_Feed";

const dados = [
  {
    id: "1",
    titulo: "Show de Rock no Centro",
    descricao: "Uma noite incrível com bandas locais 🔥",
    imagem: "https://picsum.photos/400/200",
  },
  {
    id: "2",
    titulo: "Festival de Forró",
    descricao: "Vem dançar muito forró 💃",
    imagem: "https://picsum.photos/401/200",
  },
  {
    id: "3",
    titulo: "Peça de Teatro - Drama",
    descricao: "Uma história emocionante 🎭",
    imagem: "https://picsum.photos/402/200",
  },
];

export default function TelaFeed() {
  const [likes, setLikes] = useState({});

  const toggleLike = (id) => {
    setLikes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderItem = ({ item }) => {
    const curtido = likes[item.id];

    return (
      <View style={styles.card}>

        <Image source={{ uri: item.imagem }} style={styles.imagem} />

        <View style={styles.conteudo}>
          <Text style={styles.titulo}>{item.titulo}</Text>
          <Text style={styles.descricao}>{item.descricao}</Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => toggleLike(item.id)}>
              <MaterialCommunityIcons
                name={curtido ? "heart" : "heart-outline"}
                size={26}
                color={curtido ? "#FF4C4C" : "#AAA"}
              />
            </TouchableOpacity>

            <TouchableOpacity>
              <MaterialCommunityIcons
                name="share-outline"
                size={24}
                color="#AAA"
              />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    );
  };

  return (
    <View style={styles.principal}>
      <FlatList
        data={dados}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}