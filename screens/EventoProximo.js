import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../styles/Styles_Eventos";

const eventosMock = [
  {
    id: "1",
    titulo: "Show de Rock",
    data: "25 Abr - 20:00",
    local: "Centro Cultural",
    status: "confirmado",
    imagem: "https://picsum.photos/400/200",
  },
  {
    id: "2",
    titulo: "Festival de Forró",
    data: "28 Abr - 18:00",
    local: "Praia de Iracema",
    status: "pendente",
    imagem: "https://picsum.photos/401/200",
  },
];

export default function TelaGerenciarEventos() {
  const [eventos, setEventos] = useState(eventosMock);

  const cancelarInscricao = (id) => {
    setEventos((prev) => prev.filter((item) => item.id !== id));
  };

  const renderItem = ({ item }) => {
    const confirmado = item.status === "confirmado";

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imagem }} style={styles.imagem} />

        <View style={styles.conteudo}>
          <Text style={styles.titulo}>{item.titulo}</Text>

          <View style={styles.info_row}>
            <MaterialCommunityIcons name="calendar" size={16} color="#AAA" />
            <Text style={styles.info_text}>{item.data}</Text>
          </View>

          <View style={styles.info_row}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#AAA" />
            <Text style={styles.info_text}>{item.local}</Text>
          </View>

          {/* Status */}
          <View style={[
            styles.status,
            confirmado ? styles.confirmado : styles.pendente
          ]}>
            <Text style={styles.status_text}>
              {confirmado ? "Confirmado" : "Pendente"}
            </Text>
          </View>

          {/* Ações */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.botao_cancelar}
              onPress={() => cancelarInscricao(item.id)}
            >
              <Text style={styles.texto_cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.principal}>
      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Você ainda não se inscreveu em eventos 😢
          </Text>
        }
      />
    </View>
  );
}