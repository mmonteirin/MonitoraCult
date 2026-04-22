import React from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../styles/Styles_Busca";

export default function TelaBusca() {
  return (
    <View style={styles.principal}>

      {/* 🔍 Barra de busca */}
      <View style={styles.search_container}>
        <MaterialCommunityIcons name="magnify" size={24} color="#000" />
        <TextInput
          placeholder="Quais experiencias iremos viver?"
          placeholderTextColor="#666"
          style={styles.search_input}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* 🎭 Gêneros */}
        <Text style={styles.section_title}>Generos de Peças e Filmes</Text>

        <View style={styles.grid}>
          {[
            { icon: "emoticon-happy-outline", label: "Comédia" },
            { icon: "book-open-variant", label: "Biografia" },
            { icon: "compass-outline", label: "Aventura" },
            { icon: "baby-face-outline", label: "Infantil" },
            { icon: "drama-masks", label: "Drama" },
            { icon: "heart-outline", label: "Romance" },
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.card}>
              <MaterialCommunityIcons name={item.icon} size={24} color="#000" />
              <Text style={styles.card_text}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🎵 Shows */}
        <Text style={styles.section_title}>Shows</Text>

        <View style={styles.grid}>
          {[
            { icon: "guitar-acoustic", label: "MPB" },
            { icon: "music-circle", label: "Forró" },
            { icon: "disc", label: "EDM" },
            { icon: "speaker", label: "Urbana" },
            { icon: "guitar-electric", label: "Rock" },
            { icon: "microphone-variant", label: "Latina" },
            ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.card}>
             <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color="#000"
            />
            <Text style={styles.card_text}>{item.label}</Text>
            </TouchableOpacity>
        ))}
        </View>

        {/* 📍 Locais */}
        <Text style={styles.section_title}>Locais perto...</Text>

        {[1,2,3].map((item) => (
          <View key={item} style={styles.local_card}>
            <View style={styles.local_image}/>
            <View>
              <Text style={styles.local_title}>Nome do Local</Text>
              <Text style={styles.local_rating}>⭐⭐⭐⭐☆</Text>
            </View>
          </View>
        ))}

      </ScrollView>

    </View>
  );
}