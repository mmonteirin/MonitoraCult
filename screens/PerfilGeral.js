import * as ImagePicker from 'expo-image-picker';
import { TouchableOpacity } from 'react-native';
import React, { useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import styles from '../styles/Styles_perfilGeral'


export default function ProfileScreen() {
  const escolherFoto = async () => {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissao.granted) {
    alert("Permissão necessária!");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (!result.canceled) {
    setFoto(result.assets[0].uri);
  }
};

  const [nome, setNome] = useState("Pedrin");
  const [foto, setFoto] = useState('https://i.pravatar.cc/100');
  const [avaliacoes, setAvaliacoes] = useState(0);
  const [ocorrencias, setOcorrencias] = useState(3);

  const [eventos, setEventos] = useState([
    {
      id: 1,
      titulo: "Theatro José de Alencar",
      data: "18 de Maio",
      imagem: "https://via.placeholder.com/100",
    },
    {
      id: 2,
      titulo: "Sana Parte II",
      data: "11 de Julho",
      imagem: "https://via.placeholder.com/100",
    },
  ]);
  return (
    <ScrollView style={styles.container}>
      
      {/* Foto + Nome */}
      <View style={styles.header}>
        <TouchableOpacity onPress={escolherFoto}>
          <Image source={{ uri: foto }} style={styles.avatar} />
        </TouchableOpacity>
        <Text style={styles.name}>{nome}</Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Avaliações registradas:</Text>
          <Text style={styles.cardNumber}>{avaliacoes}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ocorrências registradas:</Text>
          <Text style={styles.cardNumber}>{ocorrencias}</Text>
        </View>
      </View>

      {/* Eventos */}
      <Text style={styles.sectionTitle}>Eventos Visitados</Text>

      {eventos.map((evento) => (
  <View key={evento.id} style={styles.eventCard}>
    <Image source={{ uri: evento.imagem }} style={styles.eventImage} />
    <View>
      <Text style={styles.eventTitle}>{evento.titulo}</Text>
      <Text style={styles.eventDate}>{evento.data}</Text>
    </View>
  </View>
))}

    </ScrollView>
  );
}