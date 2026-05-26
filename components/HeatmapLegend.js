import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

export default function HeatmapLegend({ maxIntensity = 100 }) {
  const styles = useThemedStyles(createThemedScreenStyles);
  const colors = [
    { label: "Baixa", color: "rgb(0, 255, 0)" },
    { label: "Média", color: "rgb(255, 255, 0)" },
    { label: "Alta", color: "rgb(255, 165, 0)" },
    { label: "Muito Alta", color: "rgb(255, 0, 0)" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Intensidade Cultural</Text>
      <View style={styles.gradient}>
        {colors.map((item, index) => (
          <View key={index} style={styles.gradientItem}>
            <View
              style={[styles.colorBox, { backgroundColor: item.color }]}
            />
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.subtitle}>
        Indica concentração de eventos e check-ins na região
      </Text>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    backgroundColor: c.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 8,
  },
  gradient: {
    flexDirection: "column",
    gap: 6,
    marginBottom: 8,
  },
  gradientItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  label: {
    fontSize: 11,
    color: c.textSecondary,
    flex: 1,
  },
  subtitle: {
    fontSize: 10,
    color: c.textMuted,
    fontStyle: "italic",
  },
});
}
