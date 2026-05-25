import React from "react";
import { View, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GlobalStyles from "../styles/GlobalStyles";
import { Colors } from "../styles/Colors";

const styles = GlobalStyles;

export default function SearchBar({ value, onChangeText }) {
  return (
    <View style={styles.search_container}>
      <MaterialCommunityIcons
        name="magnify"
        size={22}
        color={Colors.textMuted}
      />
      <TextInput
        placeholder="Quais experiencias vamos viver?"
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        style={styles.search_input}
      />
    </View>
  );
}
