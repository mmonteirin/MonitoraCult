import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors } from "../../styles/Colors";

function getBubbleVariant(index) {
  const variants = [
    {
      width: 118,
      height: 88,
      borderRadius: 34,
      rotate: "-2deg",
    },
    {
      width: 92,
      height: 92,
      borderRadius: 46,
      rotate: "2deg",
    },
    {
      width: 132,
      height: 82,
      borderRadius: 28,
      rotate: "-1deg",
    },
    {
      width: 104,
      height: 104,
      borderRadius: 52,
      rotate: "3deg",
    },
    {
      width: 124,
      height: 94,
      borderRadius: 36,
      rotate: "-3deg",
    },
  ];

  return variants[index % variants.length];
}

export default function StoryBar({ eventos = [], onPress }) {
  if (!eventos?.length) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Agora na cidade</Text>
          <Text style={styles.subtitle}>
            Descobertas culturais em movimento
          </Text>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {eventos.slice(0, 10).map((item, index) => {
          const variant = getBubbleVariant(index);

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.92}
              style={[
                styles.cardWrapper,
                {
                  transform: [{ rotate: variant.rotate }],
                },
              ]}
              onPress={() => onPress(item)}
            >
              <LinearGradient
                colors={[
                  Colors.primary,
                  Colors.primaryDark,
                  Colors.background,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.gradientBorder,
                  {
                    width: variant.width,
                    height: variant.height,
                    borderRadius: variant.borderRadius,
                  },
                ]}
              >
                <BlurView
                  intensity={24}
                  tint="dark"
                  style={[
                    styles.card,
                    {
                      borderRadius: variant.borderRadius - 4,
                    },
                  ]}
                >
                  <Image
                    source={item.imagem}
                    style={styles.image}
                    contentFit="cover"
                    transition={250}
                  />

                  <LinearGradient
                    colors={[
                      "rgba(0,0,0,0)",
                      "rgba(0,0,0,0.18)",
                      "rgba(0,0,0,0.85)",
                    ]}
                    style={styles.overlay}
                  />

                  <View style={styles.content}>
                    <View style={styles.topTag}>
                      <MaterialCommunityIcons
                        name="tag"
                        size={11}
                        color={Colors.textPrimary}
                      />

                      <Text style={styles.tagText} numberOfLines={1}>
                        {item.categoria}
                      </Text>
                    </View>

                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {item.titulo}
                    </Text>
                  </View>
                </BlurView>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 26,
  },

  header: {
    paddingHorizontal: 18,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },

  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
  },

  liveText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  container: {
    paddingHorizontal: 18,
    paddingBottom: 6,
    alignItems: "center",
  },

  cardWrapper: {
    marginRight: 16,
  },

  gradientBorder: {
    padding: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },

  card: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },

  image: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.backgroundSecondary,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },

  topTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
    maxWidth: "100%",
  },

  tagText: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
  },

  eventTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
});