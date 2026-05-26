import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function EventSignalPill({
  countdown,
  ticketSignal,
  onImage = false,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const iconColor = onImage ? colors.onPrimary : colors.textPrimary;

  const live = countdown?.tone === "live";

  const soon = countdown?.tone === "soon";

  const iconName = live
    ? "access-point"
    : ticketSignal
    ? "ticket-confirmation"
    : "clock-outline";

  return (
    <View
      style={[
        styles.pill,
        onImage && styles.pillOnImage,
        live && styles.live,
        soon && styles.soon,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          live && styles.liveIcon,
          soon && styles.soonIcon,
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={13}
          color={iconColor}
        />
      </View>

      <Text
        style={[styles.text, onImage && styles.textOnImage]}
        numberOfLines={1}
      >
        {ticketSignal || countdown?.label}
      </Text>

      {live && <View style={styles.livePulse} />}
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  pill: {
    alignSelf: "flex-start",

    flexDirection: "row",
    alignItems: "center",

    maxWidth: "100%",

    paddingHorizontal: 10,
    paddingVertical: 7,

    borderRadius: 16,

    backgroundColor: c.glass,

    borderWidth: 1,
    borderColor: c.glassBorder,

    overflow: "hidden",
  },

  pillOnImage: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderColor: "rgba(255,255,255,0.18)",
  },

  live: {
    backgroundColor: "rgba(34,197,94,0.16)",
    borderColor: "rgba(34,197,94,0.35)",
  },

  soon: {
    backgroundColor: "rgba(245,158,11,0.14)",
    borderColor: "rgba(245,158,11,0.32)",
  },

  iconContainer: {
    width: 22,
    height: 22,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: c.overlayLight,
  },

  liveIcon: {
    backgroundColor: c.success,
  },

  soonIcon: {
    backgroundColor: c.warning,
  },

  text: {
    color: c.textPrimary,

    fontSize: 11,
    fontWeight: "800",

    marginLeft: 7,

    letterSpacing: 0.2,
  },

  textOnImage: {
    color: c.onPrimary,
  },

  livePulse: {
    width: 7,
    height: 7,

    borderRadius: 4,

    marginLeft: 8,

    backgroundColor: c.success,
  },
});
}
