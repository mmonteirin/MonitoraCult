import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = ({ size = 24, style }) => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={isDark ? "weather-sunny" : "moon-waning-crescent"}
          size={size}
          color={theme.textPrimary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ThemeToggle;
