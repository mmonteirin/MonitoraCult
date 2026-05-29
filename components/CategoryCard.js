import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GlobalStyles from "../styles/GlobalStyles";

const styles = GlobalStyles;

export default function CategoryCard({ icon, label, onPress, selected }) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && { backgroundColor: "#FFD700" } // destaque opcional
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={selected ? "#000" : "#000"}
      />
      <Text style={styles.card_text}>{label}</Text>
    </TouchableOpacity>
  );
}
