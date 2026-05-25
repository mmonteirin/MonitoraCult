import React from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BlurView } from "expo-blur";

import { LinearGradient } from "expo-linear-gradient";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors } from "../../styles/Colors";

export default function LiveMapCard({
  onPress,
  activeCount = 0,
}) {
  const animatedScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));

  const handlePressIn = () => {
    animatedScale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    animatedScale.value = withSpring(1);
  };

  return (
    <Animated.View
      style={[styles.liveCard, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.96}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <BlurView
          intensity={18}
          tint="dark"
          style={styles.liveContent}
        >
          <View style={styles.liveDot} />

          <View style={styles.iconWrap}>
            <LinearGradient
              colors={[
                Colors.primary + "33",
                Colors.primaryLight + "1a",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glowGradient}
            />
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={24}
              color={Colors.primaryLight}
            />
          </View>

          <View style={styles.copy}>
            <Text style={styles.liveTitle}>
              Mapa Cultural Ao Vivo
            </Text>

            <Text style={styles.liveSub}>
              {activeCount
                ? `${activeCount} eventos no radar`
                : "Veja eventos próximos agora"}
            </Text>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={Colors.textMuted}
          />
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  liveCard: {
    marginHorizontal: 18,
    marginTop: 28,
  },

  liveContent: {
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",


    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,

    overflow: "visible",
  },

  glowGradient: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 16,
    top: -4,
    left: -4,
    backgroundColor: Colors.glass,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,

    backgroundColor: Colors.success,

    marginRight: 14,
  },

  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: Colors.overlayLight,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  copy: {
    flex: 1,
    marginLeft: 14,
  },

  liveTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  liveSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});