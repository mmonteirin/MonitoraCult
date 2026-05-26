/**
 * #️⃣ UTILITÁRIOS: MENTIONS E HASHTAGS
 * Parse, extração e renderização de mentions (@usuario) e hashtags (#tag)
 */

import React, { memo } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native";
import { Colors } from "../styles/Colors";

// ✅ Extrair mentions de um texto
export const extrairMencoes = (texto) => {
  if (!texto) return [];
  const regex = /@(\w+)/g;
  const mencoes = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    mencoes.push({
      usuario: match[1],
      fullText: match[0], // @usuario
      index: match.index,
    });
  }

  return mencoes;
};

// ✅ Extrair hashtags
export const extrairHashtags = (texto) => {
  if (!texto) return [];
  const regex = /#(\w+)/g;
  const hashtags = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    hashtags.push({
      tag: match[1],
      fullText: match[0], // #tag
      index: match.index,
    });
  }

  return hashtags;
};

// ✅ Renderizar texto com mentions e hashtags clicáveis
const TextoComMencoeseHashtags = memo(
  ({ texto, onMencaoPress, onHashtagPress, style }) => {
    const mencoes = extrairMencoes(texto);
    const hashtags = extrairHashtags(texto);

    // Combinar tudo em um array com posições
    const items = [
      ...mencoes.map((m) => ({ type: "mencao", ...m })),
      ...hashtags.map((h) => ({ type: "hashtag", ...h })),
    ].sort((a, b) => a.index - b.index);

    if (items.length === 0) {
      return <Text style={style}>{texto}</Text>;
    }

    // Dividir o texto em partes
    const partes = [];
    let ultimoIndex = 0;

    items.forEach((item, idx) => {
      // Adicionar texto antes do item
      if (item.index > ultimoIndex) {
        partes.push({
          type: "texto",
          valor: texto.substring(ultimoIndex, item.index),
        });
      }

      // Adicionar item (mention ou hashtag)
      partes.push(item);
      ultimoIndex = item.index + item.fullText.length;
    });

    // Adicionar texto final
    if (ultimoIndex < texto.length) {
      partes.push({
        type: "texto",
        valor: texto.substring(ultimoIndex),
      });
    }

    return (
      <Text style={style}>
        {partes.map((parte, idx) => {
          if (parte.type === "texto") {
            return <Text key={idx}>{parte.valor}</Text>;
          } else if (parte.type === "mencao") {
            return (
              <Text
                key={idx}
                style={styles.mencao}
                onPress={() => onMencaoPress?.(parte.usuario)}
              >
                @{parte.usuario}
              </Text>
            );
          } else if (parte.type === "hashtag") {
            return (
              <Text
                key={idx}
                style={styles.hashtag}
                onPress={() => onHashtagPress?.(parte.tag)}
              >
                #{parte.tag}
              </Text>
            );
          }
        })}
      </Text>
    );
  }
);

// ✅ Componente para badge de hashtag
const HashtagBadge = memo(({ tag, onPress }) => (
  <TouchableOpacity
    style={styles.hashtagBadge}
    onPress={() => onPress?.(tag)}
    activeOpacity={0.7}
  >
    <Text style={styles.hashtagBadgeText}>#{tag}</Text>
  </TouchableOpacity>
));

// ✅ Componente para lista de hashtags trending
const HashtagsList = memo(({ hashtags = [], onHashtagPress }) => {
  if (!hashtags || hashtags.length === 0) {
    return null;
  }

  return (
    <Text style={styles.hashtagsContainer}>
      {hashtags.map((tag, idx) => (
        <HashtagBadge
          key={tag}
          tag={tag}
          onPress={onHashtagPress}
        />
      ))}
    </Text>
  );
});

// ✅ Componente para mention suggestion
const MencaoSuggestion = memo(({ usuario, onPress }) => (
  <TouchableOpacity
    style={styles.mencaoSuggestion}
    onPress={() => onPress?.(usuario)}
  >
    <Text style={styles.mencaoSuggestionText}>@{usuario}</Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  mencao: {
    color: Colors.primary,
    fontWeight: "700",
  },

  hashtag: {
    color: Colors.primary,
    fontWeight: "700",
  },

  hashtagBadge: {
    backgroundColor: Colors.primary + "22",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    alignSelf: "flex-start",
  },

  hashtagBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },

  hashtagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 8,
  },

  mencaoSuggestion: {
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },

  mencaoSuggestionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});

export { TextoComMencoeseHashtags, HashtagsList, MencaoSuggestion };
export default TextoComMencoeseHashtags;
