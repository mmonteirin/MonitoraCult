import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getEventos } from "../services/mapaCulturalService";

const { width } = Dimensions.get("window");

export default function TelaCulturaViva({ navigation }) {

  const insets = useSafeAreaInsets();

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEventos();
  }, []);

  async function carregarEventos() {
    try {

      const response = await getEventos();

      const lista = Array.isArray(response)
        ? response
        : response?.data || response?.results || [];

      const icones = [
        "music",
        "palette",
        "movie-open",
        "drama-masks",
        "microphone",
        "book-open-page-variant",
        "silverware-fork-knife",
      ];

      const cores = [
        "#8B5CF6",
        "#06B6D4",
        "#EC4899",
        "#10B981",
        "#F59E0B",
        "#3B82F6",
      ];

      const tratados = lista.map((item, index) => ({
        id: item.id || index,
        titulo: item.name || "Evento Cultural",
        local: item?.location?.name || "Fortaleza",
        descricao:
          item?.shortDescription ||
          "Evento cultural disponível na cidade.",
        icon: icones[index % icones.length],
        cor: cores[index % cores.length],
      }));

      setEventos(tratados);

    } catch (err) {

      console.log("Erro API:", err);

    } finally {

      setLoading(false);

    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#8B5CF6"
        />

        <Text style={styles.loadingText}>
          Carregando cultura...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <StatusBar barStyle="light-content" />

      <ImageBackground
        source={require("../assets/fundoTelaLogin.png")}
        resizeMode="cover"
        style={styles.bg}
      >

        <LinearGradient
          colors={[
            "rgba(5,8,18,0.97)",
            "rgba(10,12,24,0.96)",
            "rgba(22,14,50,0.96)",
          ]}
          style={styles.overlay}
        >

          <View style={styles.glowTop}/>
          <View style={styles.glowBottom}/>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 40,
            }}
          >

            {/* HEADER */}

            <View
              style={[
                styles.header,
                {
                  paddingTop:
                    insets.top + 10,
                },
              ]}
            >

              <TouchableOpacity
                style={styles.backButton}
                onPress={() =>
                  navigation.goBack()
                }
              >

                <MaterialCommunityIcons
                  name="arrow-left"
                  size={22}
                  color="#FFF"
                />

              </TouchableOpacity>

              <MotiView
                from={{
                  opacity: 0,
                  translateY: 20,
                }}
                animate={{
                  opacity: 1,
                  translateY: 0,
                }}
              >

                <LinearGradient
                  colors={[
                    "#8B5CF6",
                    "#5B21B6",
                  ]}
                  style={styles.heroIcon}
                >

                  <MaterialCommunityIcons
                    name="fire"
                    size={38}
                    color="#FFF"
                  />

                </LinearGradient>

                <Text style={styles.title}>
                  Cultura Viva
                </Text>

                <Text style={styles.subtitle}>
                  Descubra o que está
                  acontecendo agora em
                  Fortaleza.
                </Text>

              </MotiView>

            </View>

            {/* STATUS */}

            <BlurView
              intensity={55}
              tint="dark"
              style={styles.statusCard}
            >

              <View>

                <Text style={styles.statusLabel}>
                  Cidade agora
                </Text>

                <Text style={styles.statusTitle}>
                  🔥 Alta atividade cultural
                </Text>

              </View>

              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>
                  AO VIVO
                </Text>
              </View>

            </BlurView>

            <Text style={styles.sectionTitle}>
              🔥 Em alta hoje
            </Text>

            {eventos.map((item, index) => (

              <MotiView
                key={item.id}
                from={{
                  opacity: 0,
                  translateY: 25,
                }}
                animate={{
                  opacity: 1,
                  translateY: 0,
                }}
                transition={{
                  delay: index * 80,
                }}
              >

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.eventCard}
                >

                  <BlurView
                    intensity={60}
                    tint="dark"
                    style={styles.eventBlur}
                  >

                    <LinearGradient
                      colors={[
                        item.cor,
                        "rgba(255,255,255,0.08)",
                      ]}
                      style={styles.iconBox}
                    >

                      <MaterialCommunityIcons
                        name={item.icon}
                        size={24}
                        color="#FFF"
                      />

                    </LinearGradient>

                    <View style={{ flex: 1 }}>

                      <Text style={styles.eventTitle}>
                        {item.titulo}
                      </Text>

                      <Text style={styles.eventLocal}>
                        📍 {item.local}
                      </Text>

                      <Text
                        numberOfLines={2}
                        style={styles.eventDesc}
                      >
                        {item.descricao}
                      </Text>

                    </View>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color="rgba(255,255,255,0.4)"
                    />

                  </BlurView>

                </TouchableOpacity>

              </MotiView>

            ))}

          </ScrollView>

        </LinearGradient>

      </ImageBackground>

    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#070B14",
  },

  bg:{
    flex:1,
  },

  overlay:{
    flex:1,
  },

  loadingContainer:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"#070B14",
  },

  loadingText:{
    color:"#FFF",
    marginTop:16,
    fontSize:16,
  },

  glowTop:{
    position:"absolute",
    top:-120,
    right:-80,
    width:300,
    height:300,
    borderRadius:200,
    backgroundColor:"rgba(124,58,237,0.18)",
  },

  glowBottom:{
    position:"absolute",
    bottom:-140,
    left:-80,
    width:260,
    height:260,
    borderRadius:200,
    backgroundColor:"rgba(59,130,246,0.10)",
  },

  header:{
    paddingHorizontal:24,
    paddingBottom:24,
  },

  backButton:{
    width:46,
    height:46,
    borderRadius:16,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"rgba(255,255,255,0.08)",
    marginBottom:24,
  },

  heroIcon:{
    width:90,
    height:90,
    borderRadius:30,
    justifyContent:"center",
    alignItems:"center",
    marginBottom:22,
  },

  title:{
    color:"#FFF",
    fontSize: width < 380 ? 34 : 40,
    fontWeight:"800",
  },

  subtitle:{
    color:"rgba(255,255,255,0.7)",
    marginTop:12,
    fontSize:15,
    lineHeight:24,
  },

  statusCard:{
    marginHorizontal:20,
    marginBottom:24,
    borderRadius:24,
    padding:20,
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    overflow:"hidden",
    borderWidth:1,
    borderColor:"rgba(255,255,255,0.06)",
  },

  statusLabel:{
    color:"rgba(255,255,255,0.55)",
    marginBottom:6,
  },

  statusTitle:{
    color:"#FFF",
    fontSize:16,
    fontWeight:"800",
  },

  liveBadge:{
    backgroundColor:"rgba(239,68,68,0.15)",
    paddingHorizontal:14,
    paddingVertical:8,
    borderRadius:30,
  },

  liveText:{
    color:"#EF4444",
    fontWeight:"800",
    fontSize:12,
  },

  sectionTitle:{
    color:"#FFF",
    fontSize:22,
    fontWeight:"800",
    paddingHorizontal:22,
    marginBottom:18,
  },

  eventCard:{
    marginHorizontal:20,
    marginBottom:16,
  },

  eventBlur:{
    flexDirection:"row",
    alignItems:"center",
    padding:18,
    borderRadius:24,
    overflow:"hidden",
    borderWidth:1,
    borderColor:"rgba(255,255,255,0.06)",
  },

  iconBox:{
    width:60,
    height:60,
    borderRadius:18,
    justifyContent:"center",
    alignItems:"center",
    marginRight:16,
  },

  eventTitle:{
    color:"#FFF",
    fontSize:16,
    fontWeight:"800",
  },

  eventLocal:{
    color:"rgba(255,255,255,0.65)",
    marginTop:6,
    fontSize:13,
  },

  eventDesc:{
    color:"#A5B4FC",
    marginTop:8,
    fontSize:12,
    lineHeight:18,
  },

});