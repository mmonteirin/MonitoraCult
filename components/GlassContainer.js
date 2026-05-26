import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Componente reutilizável para efeito Liquid Glass
 * Simula vidro translúcido com blur e bordas suaves
 */
export default function GlassContainer({
  children,
  style,
  intensity = 0.15,
  variant = 'light',
  blur = true,
  shadow = true,
}) {
  const bgColor =
    variant === 'dark'
      ? `rgba(50, 50, 50, ${intensity})`
      : `rgba(255, 255, 255, ${intensity})`;

  const borderColor =
    variant === 'dark'
      ? `rgba(255, 255, 255, ${intensity * 0.67})`
      : `rgba(255, 255, 255, ${intensity * 2})`;

  const containerStyle = [
    styles.base,
    {
      backgroundColor: bgColor,
      borderColor: borderColor,
    },
    shadow && styles.shadow,
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
});
