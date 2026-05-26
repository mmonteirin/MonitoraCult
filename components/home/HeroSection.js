import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import Animated from "react-native-reanimated";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { WebView } from "react-native-webview";

import EventSignalPill from "./EventSignalPill";
import { getCountdownInfo, getTicketSignal } from "./homeUtils";

import { useTheme } from "../../context/ThemeContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";

function VideoTeaser({ url, fallback, style }) {
  if (!url) {
    return (
      <Image
        source={fallback}
        style={style}
        contentFit="cover"
        transition={250}
      />
    );
  }

  const html = `
    <html>
      <body style="margin:0;background:#000;overflow:hidden">
        <video
          src="${url}"
          autoplay
          muted
          loop
          playsinline
          style="width:100%;height:100%;object-fit:cover"
        ></video>
      </body>
    </html>
  `;

  return (
    <WebView
      source={{ html }}
      style={style}
      scrollEnabled={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
    />
  );
}

export default function HeroSection({
  evento,
  animatedStyle,
  onPress,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);

  const countdown = getCountdownInfo(evento);

  const ticketSignal = getTicketSignal(evento);

  if (!evento) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.96}
      style={styles.momentCard}
      onPress={() => onPress(evento)}
    >
      <Animated.View
        style={[styles.mediaWrap, animatedStyle]}
      >
        <VideoTeaser
          url={evento.videoUrl}
          fallback={evento.imagem}
          style={styles.momentImage}
        />
      </Animated.View>

      <LinearGradient
        colors={[
          "rgba(0,0,0,0)",
          colors.overlayDark,
          "rgba(0,0,0,0.96)",
        ]}
        style={styles.overlay}
      />

      <View style={styles.topRow}>
        <EventSignalPill
          countdown={countdown}
          ticketSignal={ticketSignal}
          onImage
        />

        {!!evento.videoUrl && (
          <View style={styles.videoBadge}>
            <MaterialCommunityIcons
              name="play"
              size={14}
              color={colors.onPrimary}
            />

            <Text style={styles.videoText}>
              Teaser
            </Text>
          </View>
        )}
      </View>

      <View style={styles.momentContent}>
        <Text style={styles.eyebrow}>
          FORTALEZA HOJE
        </Text>

        <Text
          style={styles.momentTitle}
          numberOfLines={2}
        >
          {evento.titulo}
        </Text>

        <Text
          style={styles.location}
          numberOfLines={1}
        >
          {evento.local}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  momentCard: {
    height: 250,
    marginHorizontal: 18,
    marginTop: 6,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.glassBorder,
  },

  mediaWrap: {
    flex: 1,
  },

  momentImage: {
    width: "100%",
    height: "100%",
    backgroundColor: c.background,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  topRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  videoText: {
    color: c.onPrimary,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 4,
  },

  momentContent: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: Platform.OS === "web" ? 20 : 22,
  },

  eyebrow: {
    color: c.primaryLight,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  momentTitle: {
    color: c.onPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 32,
  },

  location: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "500",
  },
});
}
