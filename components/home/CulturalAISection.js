import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors } from "../../styles/Colors";

const prompts = [
  "O que fazer hoje em Fortaleza?",
  "Eventos gratuitos agora",
  "Baladas parecidas com WOW",
  "Roles tranquilos hoje",
];

function answerFor(prompt, eventos) {
  const lower = prompt.toLowerCase();

  let list = eventos;

  if (lower.includes("gratuitos")) {
    list = eventos.filter((evento) => evento.gratuito);
  }

  if (lower.includes("baladas") || lower.includes("wow")) {
    list = eventos.filter((evento) =>
      `${evento.categoria} ${evento.titulo}`
        .toLowerCase()
        .match(/show|festival|musica|balada|party/)
    );
  }

  if (lower.includes("tranquilos")) {
    list = eventos.filter((evento) =>
      `${evento.categoria} ${evento.titulo}`
        .toLowerCase()
        .match(/arte|teatro|gastronomia|expo|cinema/)
    );
  }

  const top = list.slice(0, 3).map((evento) => evento.titulo);

  if (!top.length) {
    return "Ainda não encontrei um match perfeito, mas os destaques de hoje estão fortes.";
  }

  return `Eu iria de ${top.join(
    ", "
  )}. Boa mistura de relevância, horário e vibe da cidade.`;
}

export default function CulturalAISection({ eventos }) {
  const [activePrompt, setActivePrompt] = useState(prompts[0]);

  const rotationAnim = useSharedValue(0);

  React.useEffect(() => {
    rotationAnim.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: interpolate(
          rotationAnim.value,
          [0, 360],
          [0, 360],
          Extrapolate.CLAMP
        ) + "deg",
      },
    ],
  }));

  const answer = useMemo(
    () => answerFor(activePrompt, eventos),
    [activePrompt, eventos]
  );

  return (
    <View style={styles.wrap}>
      <BlurView intensity={22} tint="dark" style={styles.card}>
        <View style={styles.glow} />

        <View style={styles.header}>
          <View style={styles.icon}>
            <LinearGradient
              colors={[
                Colors.primary,
                Colors.primaryDark,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradientBg}
            />
            <Animated.View style={animatedStyle}>
              <MaterialCommunityIcons
                name="creation"
                size={20}
                color={Colors.textPrimary}
              />
            </Animated.View>
          </View>

          <View style={styles.titleBox}>
            <Text style={styles.title}>IA Cultural</Text>

            <Text style={styles.subtitle}>
              Pergunte por clima, bairro, preço ou vibe
            </Text>
          </View>
        </View>

        <View style={styles.answerContainer}>
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={18}
            color={Colors.primaryLight}
          />

          <Text style={styles.answer}>{answer}</Text>
        </View>

        <View style={styles.prompts}>
          {prompts.map((prompt) => {
            const active = prompt === activePrompt;

            return (
              <TouchableOpacity
                key={prompt}
                activeOpacity={0.9}
                style={[
                  styles.prompt,
                  active && styles.promptActive,
                ]}
                onPress={() => setActivePrompt(prompt)}
              >
                <Text
                  style={[
                    styles.promptText,
                    active && styles.promptTextActive,
                  ]}
                >
                  {prompt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 18,
    marginTop: 28,
  },

  card: {
    borderRadius: 28,
    padding: 20,
    overflow: "hidden",

    backgroundColor: Colors.glass,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  glow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,

    backgroundColor: Colors.purpleGlow,

    top: -60,
    right: -50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: 18,

    backgroundColor: Colors.primary,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,

    overflow: "visible",
  },

  iconGradientBg: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 18,
    top: -4,
    left: -4,
  },

  titleBox: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },

  answerContainer: {
    marginTop: 20,

    flexDirection: "row",
    alignItems: "flex-start",

    backgroundColor: "rgba(255,255,255,0.03)",

    borderRadius: 18,

    padding: 16,

    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  answer: {
    flex: 1,

    color: Colors.textPrimary,

    fontSize: 15,
    lineHeight: 24,

    marginLeft: 10,

    fontWeight: "500",
  },

  prompts: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
  },

  prompt: {
    maxWidth: "100%",

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 18,

    backgroundColor: Colors.overlayLight,

    borderWidth: 1,
    borderColor: Colors.glassBorder,

    marginRight: 8,
    marginBottom: 8,
  },

  promptActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,

    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
  },

  promptText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },

  promptTextActive: {
    color: Colors.textPrimary,
  },
});