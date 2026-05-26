/**
 * 📸 COMPONENTE: CARROSSEL DE STORIES
 * Exibe stories dos seguidos com indicador de visto
 */

import React, { memo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

const StoryItem = memo(({ storyGroup, onPress, styles }) => {
  const temNaoVista = !storyGroup.jaSeen;

  return (
    <TouchableOpacity
      style={[styles.storyItem, temNaoVista && styles.storyItemNaoVista]}
      onPress={() => onPress(storyGroup)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: storyGroup.userPhoto }}
        style={styles.storyAvatar}
      />

      {temNaoVista && <View style={styles.novoIndicador} />}

      {storyGroup.stories.length > 1 && (
        <View style={styles.qtdBadge}>
          <Text style={styles.qtdText}>{storyGroup.stories.length}</Text>
        </View>
      )}

      <Text style={styles.storyName} numberOfLines={1}>
        {storyGroup.userName}
      </Text>
    </TouchableOpacity>
  );
});

export default function StoriesCarousel({
  stories,
  loading,
  onStoryPress,
  onCriarStory,
  mostrarCriarStory = true,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (stories.length === 0 && !mostrarCriarStory) {
    return (
      <View style={styles.vazio}>
        <MaterialCommunityIcons
          name="image-outline"
          size={32}
          color={colors.textMuted}
        />
        <Text style={styles.vazioText}>Nenhum story disponível</Text>
      </View>
    );
  }

  const dados = [];
  if (mostrarCriarStory) {
    dados.push({ type: "criar" });
  }
  dados.push(...stories.map((s) => ({ ...s, type: "story" })));

  return (
    <FlatList
      data={dados}
      renderItem={({ item }) => {
        if (item.type === "criar") {
          return (
            <TouchableOpacity
              style={[styles.storyItem, styles.criarStoryBtn]}
              onPress={onCriarStory}
              activeOpacity={0.8}
            >
              <View style={styles.criarStoryAvatar}>
                <MaterialCommunityIcons
                  name="plus"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.storyName}>Sua Story</Text>
            </TouchableOpacity>
          );
        }

        return (
          <StoryItem
            storyGroup={item}
            onPress={() => onStoryPress?.(item)}
            styles={styles}
          />
        );
      }}
      keyExtractor={(item, idx) =>
        item.type === "criar" ? "criar" : `${item.usuarioId}_${idx}`
      }
      horizontal
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carousel}
    />
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
    carousel: {
      paddingHorizontal: 10,
      paddingVertical: 12,
      gap: 8,
    },

    storyItem: {
      width: 90,
      alignItems: "center",
    },

    storyItemNaoVista: {},

    storyAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 2,
      borderColor: c.border,
    },

    novoIndicador: {
      position: "absolute",
      top: 0,
      right: 8,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: c.primary,
      borderWidth: 2,
      borderColor: c.surface,
    },

    qtdBadge: {
      position: "absolute",
      top: 4,
      left: 4,
      backgroundColor: c.primary + "dd",
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },

    qtdText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
    },

    storyName: {
      fontSize: 11,
      color: c.textPrimary,
      marginTop: 6,
      textAlign: "center",
      fontWeight: "600",
    },

    criarStoryBtn: {},

    criarStoryAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: c.primary + "15",
      borderWidth: 2,
      borderColor: c.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    loader: {
      height: 120,
      justifyContent: "center",
      alignItems: "center",
    },

    vazio: {
      height: 100,
      justifyContent: "center",
      alignItems: "center",
    },

    vazioText: {
      marginTop: 8,
      fontSize: 12,
      color: c.textMuted,
    },
  });
}
