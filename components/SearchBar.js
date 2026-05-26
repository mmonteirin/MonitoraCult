import React from "react";
import { View, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../context/ThemeContext";
import { useGlobalStyles } from "../hooks/useGlobalStyles";

export default function SearchBar({ value, onChangeText }) {
  const colors = useColors();
  const styles = useGlobalStyles();
  return (
    <View style={styles.search_container}>
      <MaterialCommunityIcons
        name="magnify"
        size={22}
        color={colors.textMuted}
      />
      <TextInput
        placeholder="Quais experiencias vamos viver?"
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        style={styles.search_input}
      />
    </View>
  );
}
