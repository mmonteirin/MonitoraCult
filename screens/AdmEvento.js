import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, Alert } from "react-native";
import styles from "../styles/Styles_admEventos";

export default function AdmEvento() {

  const [eventos, setEventos] = useState([
    {
      id: "1",
      titulo: "Peça Cora",
      local: "Cine São Luiz",
      data: "18 de Maio de 2026",
      imagem: ""
    },
    {
      id: "2",
      titulo: "Follow the sun",
      local: "Praia do Cumbuco",
      data: "06 de Setembro de 2026",
      imagem: ""
    }
  ]);

  const deletarEvento = (id) => {
    setEventos(eventos.filter(item => item.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardEvento}>

      <Image source={{ uri: item.imagem }} style={styles.imagemEvento} />

      <View style={{ flex: 1 }}>
        <Text style={styles.tituloEvento}>{item.titulo}</Text>
        <Text style={styles.localEvento}>{item.local}</Text>
        <Text style={styles.dataEvento}>{item.data}</Text>
      </View>

      <View style={styles.acoesEvento}>
        
        <TouchableOpacity onPress={() => deletarEvento(item.id)}>
          <Text style={styles.icone}>🗑️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoDashboard}
          onPress={() => Alert.alert("Abrir dashboard")}
        >
          <Text style={styles.textoBotaoDashboard}>Dashboard</Text>
        </TouchableOpacity>

      </View>

    </View>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.headerMenu}>
        <Image
          source={{ uri: "https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/2f7d32b1787708aba49b3586082d327b" }}
          style={styles.avatarMenu}
        />
        <View>
          <Text style={styles.nomeMenu}>Marcos Monteiro</Text>
          <Text style={styles.subtituloMenu}>Área de Administrador</Text>
        </View>
      </View>

      {/* Título + Botão */}
      <View style={styles.topoEventos}>
        <Text style={styles.tituloSecao}>Meus Eventos</Text>

        <TouchableOpacity
          style={styles.botaoCadastrar}
          onPress={() => Alert.alert("Cadastrar evento")}
        >
          <Text style={styles.textoBotao}>Cadastrar Evento</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
}