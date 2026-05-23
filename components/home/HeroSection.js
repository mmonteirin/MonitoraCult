import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import Animated from "react-native-reanimated";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { WebView } from "react-native-webview";

import EventSignalPill from "./EventSignalPill";
import { getCountdownInfo, getTicketSignal } from "./homeUtils";

import { Colors } from "../../styles/Colors";

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
          "rgba(0,0,0,0.2)",
          Colors.overlayDark,
        ]}
        style={styles.overlay}
      />

      <View style={styles.topRow}>
        <EventSignalPill
          countdown={countdown}
          ticketSignal={ticketSignal}
        />

        {!!evento.videoUrl && (
          <BlurView
            intensity={18}
            tint="dark"
            style={styles.videoBadge}
          >
            <LinearGradient
              colors={[
                Colors.primary + "33",
                "rgba(59,130,246,0.1)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.videoBadgeGradient}
            />
            <MaterialCommunityIcons
              name="play"
              size={14}
              color={Colors.textPrimary}
            />

            <Text style={styles.videoText}>
              Teaser
            </Text>
          </BlurView>
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

const styles = StyleSheet.create({
  momentCard: {
    height: 250,
    marginHorizontal: 18,
    marginTop: 6,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  mediaWrap: {
    flex: 1,
  },

  momentImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background,
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
    overflow: "hidden",
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  videoBadgeGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },

  videoText: {
    color: Colors.textPrimary,
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
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 1,
  },

  momentTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
  },

  location: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
});