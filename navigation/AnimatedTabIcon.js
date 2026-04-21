import React, { useRef, useEffect } from "react";
import { Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AnimatedTabIcon({ name, color, size, focused }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </Animated.View>
  );
}