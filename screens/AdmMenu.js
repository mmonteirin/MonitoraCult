import React from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import styles from "../styles/Styles_admMenu";

export default function AdmMenu() {

  const handleCriarEvento = () => {
    Alert.alert("Criar evento clicado");
  };

  const handleMeusEventos = () => {
    Alert.alert("Meus eventos clicado");
  };

  const handleFavoritos = () => {
    Alert.alert("Eventos favoritos clicado");
  };

  const handleAjuda = () => {
    Alert.alert("Central de ajuda");
  };

  const handleSair = () => {
    Alert.alert("Você saiu da conta");
  };

  return (
    <View style={styles.container}>

      {/* Perfil */}
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

      {/* Opções */}
      <View style={styles.menuOptions}>

        <TouchableOpacity style={styles.itemMenu} onPress={handleCriarEvento}>
          <Text style={styles.icone}>＋</Text>
          <Text style={styles.textoMenu}>Criar evento</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.itemMenu} onPress={handleMeusEventos}>
          <Text style={styles.icone}>📅</Text>
          <Text style={styles.textoMenu}>Meus eventos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.itemMenu} onPress={handleFavoritos}>
          <Text style={styles.icone}>❤️</Text>
          <Text style={styles.textoMenu}>Eventos Favoritos</Text>
        </TouchableOpacity>

      </View>

      {/* Outros */}
      <View style={{ marginTop: 30 }}>
      
          <Text style={styles.tituloSecao}>Central de Ajuda</Text>

        <TouchableOpacity onPress={handleSair}>
          <Text style={styles.tituloSecao}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}