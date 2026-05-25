import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { Colors } from "../../styles/Colors";

const { width } = Dimensions.get("window");

const PROMPTS_SUGERIDOS = [
  { id: "orla", label: "🏖️ Eventos na Orla", busca: "orla" },
  { id: "gratis", label: "🎟️ Eventos Gratuitos", busca: "gratuito" },
  { id: "shows", label: "🎸 Shows ao Vivo", busca: "show" },
  { id: "teatro", label: "🎭 Teatro e Arte", busca: "teatro" },
];

export default function CulturalAISection({ onPressInsight }) {
  const [loadingAI, setLoadingAI] = useState(false);
  const [promptSelecionado, setPromptSelecionado] = useState(null);

  const getSaudacaoAI = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Planejando sua manhã cultural? ☕";
    if (hora >= 12 && hora < 18) return "Buscando o que fazer hoje à tarde? ☀️";
    return "Vamos de roteiro cultural para hoje à noite? 🌙";
  };

  const lidarComCliqueInsight = async () => {
    if (loadingAI) return;
    
    setLoadingAI(true);
    try {
      // Passa o termo de busca interno do chip selecionado (ou undefined se nenhum estiver ativo)
      await onPressInsight(promptSelecionado ? promptSelecionado.busca : undefined);
    } catch (error) {
      console.log("Erro ao gerar insights da IA:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  const alternarPrompt = (prompt) => {
    if (promptSelecionado?.id === prompt.id) {
      setPromptSelecionado(null);
    } else {
      setPromptSelecionado(prompt);
    }
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(300).springify()} 
      layout={LinearTransition.springify()} 
      style={styles.container}
    >
      <BlurView intensity={40} tint="dark" style={styles.box}>
        
        {/* Header da IA - Interrogação/Sparkles removida daqui */}
        <View style={styles.headerRow}>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="robot" size={14} color="#FFF" />
            <Text style={styles.aiBadgeText}>Cultural AI</Text>
          </View>
        </View>

        <Text style={styles.title}>
          {getSaudacaoAI()}
        </Text>
        
        <Text style={styles.description}>
          Nossa inteligência artificial analisa suas preferências para montar o roteiro perfeito sob medida. Escolha um foco abaixo se preferir:
        </Text>

        <View style={styles.promptsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollPrompts}
          >
            {PROMPTS_SUGERIDOS.map((prompt) => {
              const ativo = promptSelecionado?.id === prompt.id;
              return (
                <TouchableOpacity
                  key={prompt.id}
                  activeOpacity={0.8}
                  style={[styles.promptChip, ativo && styles.promptChipActive]}
                  onPress={() => alternarPrompt(prompt)}
                >
                  <Text style={[styles.promptChipText, ativo && styles.promptChipTextActive]}>
                    {prompt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity 
          style={[styles.button, loadingAI && styles.buttonDisabled]} 
          activeOpacity={0.85}
          disabled={loadingAI}
          onPress={lidarComCliqueInsight}
        >
          {loadingAI ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.buttonText}>Analisando preferências...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              {promptSelecionado 
                ? `Gerar Roteiro de ${promptSelecionado.label.split(" ").slice(1).join(" ")} ✨`
                : "Gerar Insights Mágicos ✨"
              }
            </Text>
          )}
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginTop: 24, marginBottom: 8 },
  box: { padding: 20, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.06)", backgroundColor: "rgba(255, 255, 255, 0.02)" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  aiBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(139, 92, 246, 0.25)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 6 },
  aiBadgeText: { color: "#C084FC", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
  title: { color: "#FFF", fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  description: { color: Colors?.textSecondary || "#94A3B8", fontSize: 13, lineHeight: 20, marginBottom: 16 },
  promptsContainer: { marginBottom: 20, marginHorizontal: -20 },
  scrollPrompts: { paddingHorizontal: 20, gap: 8 },
  promptChip: { backgroundColor: "rgba(255, 255, 255, 0.05)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.04)" },
  promptChipActive: { backgroundColor: "rgba(139, 92, 246, 0.3)", borderColor: "#8B5CF6" },
  promptChipText: { color: Colors?.textSecondary || "#94A3B8", fontSize: 12, fontWeight: "600" },
  promptChipTextActive: { color: "#FFF", fontWeight: "700" },
  button: { backgroundColor: Colors?.primary || "#7C3AED", height: 52, borderRadius: 18, justifyContent: "center", alignItems: "center", shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  buttonDisabled: { backgroundColor: "rgba(124, 58, 237, 0.6)" },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  loaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
});