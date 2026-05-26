import React from "react";

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Share,
  Alert,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const { width } = Dimensions.get("window");

export default function EventoDetalhesPublico({ route, navigation }) {
  const { evento } = route.params;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Handle both raw API structure and transformed structure
  const eventoNormalizado = {
    titulo: evento.titulo || evento.name || "Evento",
    descricao: evento.descricao || evento.shortDescription || evento.description || "",
    data: evento.data || "Em breve",
    local: evento.local || evento.location?.name || evento.location || "Fortaleza",
    categoria: evento.categoria || "Cultura",
    imagem: evento.imagem || evento.files?.avatar?.url || evento.files?.header?.url || evento.files?.[0]?.url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200",
    status: evento.status || "pendente",
  };

  const handleShare = async () => {
    try {
      const message = `${eventoNormalizado.titulo}\n\n📅 ${eventoNormalizado.data}\n📍 ${eventoNormalizado.local}\n\n${eventoNormalizado.descricao}`;

      await Share.share({
        message: message,
        title: eventoNormalizado.titulo,
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível compartilhar o evento.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 40,
        }}
      >
        {/* HEADER COM IMAGEM */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: eventoNormalizado.imagem }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)", "rgba(0,0,0,0.95)"]}
            style={styles.imageOverlay}
          />

          {/* BOTÃO VOLTAR */}
          <TouchableOpacity
            style={[styles.backButton, { paddingTop: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <BlurView intensity={40} tint="dark" style={styles.blurBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
            </BlurView>
          </TouchableOpacity>

          {/* STATUS */}
          <View style={styles.statusContainer}>
            <BlurView intensity={40} tint="dark" style={styles.statusPill}>
              <MaterialCommunityIcons
                name={eventoNormalizado.status === "passado" ? "history" : eventoNormalizado.status === "confirmado" ? "check-circle" : "clock-outline"}
                size={14}
                color="#FFF"
              />
              <Text style={styles.statusText}>
                {eventoNormalizado.status === "passado" ? "Passado" : eventoNormalizado.status === "confirmado" ? "Confirmado" : "Pendente"}
              </Text>
            </BlurView>
          </View>
        </View>

        {/* CONTEÚDO */}
        <View style={styles.content}>
          {/* TÍTULO */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
          >
            <Text style={styles.title}>{eventoNormalizado.titulo}</Text>
          </MotiView>

          {/* INFORMAÇÕES */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 120 }}
          >
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Data</Text>
                  <Text style={styles.infoValue}>{eventoNormalizado.data}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#06B6D4" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Local</Text>
                  <Text style={styles.infoValue}>{eventoNormalizado.local}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="tag" size={20} color="#F59E0B" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Categoria</Text>
                  <Text style={styles.infoValue}>{eventoNormalizado.categoria}</Text>
                </View>
              </View>
            </View>
          </MotiView>

          {/* DESCRIÇÃO */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 240 }}
          >
            <View style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>Descrição</Text>
              <Text style={styles.description}>{eventoNormalizado.descricao}</Text>
            </View>
          </MotiView>

          {/* BOTÃO AÇÃO */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 600, delay: 360 }}
          >
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <LinearGradient
                colors={["#8B5CF6", "#6D28D9"]}
                style={styles.gradientButton}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Compartilhar Evento</Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },

  imageContainer: {
    height: 350,
    position: "relative",
  },

  headerImage: {
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },

  blurBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  statusContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    overflow: "hidden",
    gap: 6,
  },

  statusText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },

  content: {
    padding: 24,
  },

  title: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 24,
    lineHeight: 40,
  },

  infoCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },

  infoValue: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },

  descriptionCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  description: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    lineHeight: 24,
  },

  actionButton: {
    borderRadius: 20,
    overflow: "hidden",
  },

  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },

  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
