import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors } from "../../styles/Colors";

export default function EventSignalPill({
  countdown,
  ticketSignal,
}) {
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
          color={Colors.textPrimary}
        />
      </View>

      <Text
        style={styles.text}
        numberOfLines={1}
      >
        {ticketSignal || countdown?.label}
      </Text>

      {live && <View style={styles.livePulse} />}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",

    flexDirection: "row",
    alignItems: "center",

    maxWidth: "100%",

    paddingHorizontal: 10,
    paddingVertical: 7,

    borderRadius: 16,

    backgroundColor: Colors.glass,

    borderWidth: 1,
    borderColor: Colors.glassBorder,

    overflow: "hidden",
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

    backgroundColor: Colors.overlayLight,
  },

  liveIcon: {
    backgroundColor: Colors.success,
  },

  soonIcon: {
    backgroundColor: Colors.warning,
  },

  text: {
    color: Colors.textPrimary,

    fontSize: 11,
    fontWeight: "800",

    marginLeft: 7,

    letterSpacing: 0.2,
  },

  livePulse: {
    width: 7,
    height: 7,

    borderRadius: 4,

    marginLeft: 8,

    backgroundColor: Colors.success,
  },
});