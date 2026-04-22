import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../styles/Styles_Perfil";

export default function TelaPerfil({ navigation }) {
  return (
    <View style={styles.principal}>

      {/* 👤 HEADER */}
      <View style={styles.header}>
        <View style={styles.avatar_container}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150" }}
            style={styles.avatar}
          />
          <Text style={styles.texto_editar}>Editar Perfil</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.nome}>Marcos Monteiro</Text>
          <Text style={styles.email}>marcos@email.com</Text>
        </View>
      </View>

      {/* ⚙️ MENU */}
      <View style={styles.menu}>

        <TouchableOpacity style={styles.item}>
          <MaterialCommunityIcons name="account-edit" size={24} color="#333" />
          <Text style={styles.texto}>Editar Dados</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <MaterialCommunityIcons name="lock-reset" size={24} color="#333" />
          <Text style={styles.texto}>Alterar Senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#333" />
          <Text style={styles.texto}>Notificações</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color="#333" />
          <Text style={styles.texto}>Suporte</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <MaterialCommunityIcons name="logout" size={24} color="#FF4C4C" />
          <Text style={[styles.texto, { color: "#FF4C4C" }]}>Sair</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}