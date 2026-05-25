/**
 * components/NotificationBell.js
 * Sininho de notificações com badge animado.
 * Usar em qualquer header do app.
 *
 * Uso:
 *   <NotificationBell onPress={() => navigation.navigate("TelaNotificacoes")} />
 */

import React, { useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext";
import { Colors } from "../styles/Colors";

export default function NotificationBell({ onPress, color, size = 24, style }) {
  const { naoLidas } = useNotifications();

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // Animação de sino quando chega nova notificação
  useEffect(() => {
    if (naoLidas > 0) {
      rotate.value = withSequence(
        withTiming(-0.15, { duration: 80 }),
        withTiming(0.15, { duration: 80 }),
        withTiming(-0.1, { duration: 60 }),
        withTiming(0.1, { duration: 60 }),
        withTiming(0, { duration: 50 })
      );
      scale.value = withSequence(
        withSpring(1.25),
        withSpring(1)
      );
    }
  }, [naoLidas]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}rad` },
    ],
  }));

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
    >
      <Animated.View style={animStyle}>
        <MaterialCommunityIcons
          name={naoLidas > 0 ? "bell-ring" : "bell-outline"}
          size={size}
          color={naoLidas > 0 ? Colors.primary : (color || Colors.textSecondary)}
        />
      </Animated.View>

      {naoLidas > 0 && (
        <Animated.View
          style={[
            styles.badge,
            naoLidas > 9 && styles.badgeWide,
          ]}
        >
          <Text style={styles.badgeText}>
            {naoLidas > 99 ? "99+" : naoLidas}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  badgeWide: {
    minWidth: 22,
    borderRadius: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 12,
  },
});
