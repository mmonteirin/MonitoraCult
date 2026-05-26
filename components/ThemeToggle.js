import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = ({ size = 24, style }) => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={isDark ? "weather-sunny" : "moon-waning-crescent"}
          size={size}
          color={isDark ? theme.warning : theme.primary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ThemeToggle;
