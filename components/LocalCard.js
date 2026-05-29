import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity
} from "react-native";
import GlobalStyles from "../styles/GlobalStyles";

const styles = GlobalStyles;

export default function LocalCard({
  nome,
  rating,
  imagem,
  onPress
}) {
  return (
    <TouchableOpacity
      style={styles.local_card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri: imagem || "https://placehold.co/80x80"
        }}
        style={styles.local_image}
      />

      <View>
        <Text style={styles.local_title}>{nome}</Text>

        <Text style={styles.local_rating}>
          {"⭐".repeat(rating)}{"☆".repeat(5 - rating)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
