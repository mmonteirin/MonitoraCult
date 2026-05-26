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

import AsyncStorage from "@react-native-async-storage/async-storage";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getEventos } from "../services/mapaCulturalService";

const { width } = Dimensions.get("window");

const extrairDataDaDescricao = (descricao) => {
  if (!descricao) return null;

  const padroes = [
    /(\d{2})\/(\d{2})\/(\d{4})/g,
    /(\d{2})\/(\d{2})\/(\d{2})/g,
    /(\d{1,2})\sde\s(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\sde\s(\d{4})/gi,
  ];

  for (const padrao of padroes) {
    const match = padrao.exec(descricao);
    if (match) {
      if (match.length === 4) {
        const [, dia, mes, ano] = match;
        const meses = {
          janeiro: '01', fevereiro: '02', março: '03', abril: '04',
          maio: '05', junho: '06', julho: '07', agosto: '08',
          setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
        };
        const mesNum = meses[mes.toLowerCase()] || mes;
        const anoCompleto = ano.length === 2 ? `20${ano}` : ano;
        return new Date(`${anoCompleto}-${mesNum}-${dia}`);
      }
    }
  }

  return null;
};

const getImagemPorCategoria = (categoria, imagemOriginal) => {
  if (imagemOriginal && imagemOriginal !== "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200") {
    return imagemOriginal;
  }

  const imagensPorCategoria = {
    "Música": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200",
    "Shows": "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1200",
    "Teatro": "https://images.unsplash.com/photo-1503095392237-43e8e5df8a7f?q=80&w=1200",
    "Cinema": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200",
    "Dança": "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?q=80&w=1200",
    "Literatura": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200",
    "Fotografia": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1200",
    "Gastronomia": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200",
    "Arte": "https://images.unsplash.com/photo-1578926288207-a90a5366759d?q=80&w=1200",
    "Esporte": "https://images.unsplash.com/photo-1461896836934- voices-8b1f6a6?q=80&w=1200",
    "Festival": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200",
    "Exposição": "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=1200",
    "Cultura": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200",
  };

  for (const [key, url] of Object.entries(imagensPorCategoria)) {
    if (categoria && categoria.toLowerCase().includes(key.toLowerCase())) {
      return url;
    }
  }

  return imagensPorCategoria["Cultura"];
};

export default function TelaCulturaViva({ navigation }) {

  const insets = useSafeAreaInsets();

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventosSalvos, setEventosSalvos] = useState(new Set());

  useEffect(() => {
    carregarEventos();
    carregarEventosSalvos();
  }, []);

  const carregarEventosSalvos = async () => {
    try {
      const salvos = await AsyncStorage.getItem("eventosSalvos");
      if (salvos) {
        setEventosSalvos(new Set(JSON.parse(salvos)));
      }
    } catch (error) {
      console.log("Erro ao carregar eventos salvos:", error);
    }
  };

  const salvarParaDepois = async (evento) => {
    try {
      const novosSalvos = new Set(eventosSalvos);
      if (novosSalvos.has(evento.id)) {
        novosSalvos.delete(evento.id);
      } else {
        novosSalvos.add(evento.id);
      }
      setEventosSalvos(novosSalvos);
      await AsyncStorage.setItem("eventosSalvos", JSON.stringify([...novosSalvos]));
    } catch (error) {
      console.log("Erro ao salvar evento:", error);
    }
  };

  async function carregarEventos() {
    try {

      const response = await getEventos();

      const lista = Array.isArray(response)
        ? response
        : response?.data || response?.results || [];

      const hoje = new Date();

      const tratados = lista.map((item, index) => {
        const occurrence = item?.occurrences?.[0];
        const inicio = occurrence?.startDate || occurrence?.startsOn || occurrence?.start;
        let dataEvento = inicio ? new Date(inicio) : null;

        if (!dataEvento || isNaN(dataEvento.getTime())) {
          dataEvento = extrairDataDaDescricao(item?.shortDescription || item?.description);
        }

        const linguagens = item?.terms?.linguagem || [];
        let categoria = linguagens.length > 0 ? linguagens[0] : "Cultura";

        if (categoria === "Cultura" && item?.shortDescription) {
          const desc = item.shortDescription.toLowerCase();
          if (desc.includes("música") || desc.includes("show") || desc.includes("concerto")) {
            categoria = "Música";
          } else if (desc.includes("teatro") || desc.includes("peça") || desc.includes("drama")) {
            categoria = "Teatro";
          } else if (desc.includes("exposição") || desc.includes("arte") || desc.includes("galeria")) {
            categoria = "Arte";
          } else if (desc.includes("cinema") || desc.includes("filme") || desc.includes("sala")) {
            categoria = "Cinema";
          } else if (desc.includes("dança") || desc.includes("ballet") || desc.includes("coreografia")) {
            categoria = "Dança";
          } else if (desc.includes("literatura") || desc.includes("livro") || desc.includes("leitura")) {
            categoria = "Literatura";
          } else if (desc.includes("gastronomia") || desc.includes("comida") || desc.includes("culinária")) {
            categoria = "Gastronomia";
          } else if (desc.includes("esporte") || desc.includes("competição") || desc.includes("atletismo")) {
            categoria = "Esporte";
          } else if (desc.includes("festival") || desc.includes("feira")) {
            categoria = "Festival";
          }
        }

        return {
          id: item.id || String(index),
          titulo: item.name || "Evento Cultural",
          local: item?.location?.name || "Fortaleza",
          descricao: item?.shortDescription || "Evento cultural disponível na cidade.",
          imagem: getImagemPorCategoria(
            categoria,
            item?.files?.avatar?.url ||
            item?.files?.header?.url ||
            item?.files?.[0]?.url
          ),
          dataEvento: dataEvento,
          data: dataEvento
            ? dataEvento.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Em breve",
          categoria: categoria,
        };
      });

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

                  <ImageBackground
                    source={{ uri: item.imagem }}
                    style={styles.eventImage}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.92)"]}
                      style={styles.eventImageOverlay}
                    >
                      <View style={styles.categoryBadge}>
                        <MaterialCommunityIcons
                          name="tag-outline"
                          size={12}
                          color="#FFF"
                        />
                        <Text style={styles.categoryBadgeText}>
                          {item.categoria}
                        </Text>
                      </View>

                      <Text style={styles.eventTitle}>
                        {item.titulo}
                      </Text>

                      <Text style={styles.eventLocal}>
                        📍 {item.local}
                      </Text>

                      <View style={styles.dateHighlight}>
                        <MaterialCommunityIcons
                          name="calendar-outline"
                          size={14}
                          color="#8B5CF6"
                        />
                        <Text style={styles.dateHighlightText}>
                          {item.data}
                        </Text>
                      </View>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          style={styles.botaoSalvar}
                          onPress={() => salvarParaDepois(item)}
                        >
                          <LinearGradient
                            colors={
                              eventosSalvos.has(item.id)
                                ? ["#8B5CF6", "#6D28D9"]
                                : ["rgba(139,92,246,0.3)", "rgba(109,40,217,0.3)"]
                            }
                            style={styles.gradientBtnSalvar}
                          >
                            <MaterialCommunityIcons
                              name={eventosSalvos.has(item.id) ? "bookmark" : "bookmark-outline"}
                              size={16}
                              color={eventosSalvos.has(item.id) ? "#FFF" : "#8B5CF6"}
                            />
                            <Text style={[
                              styles.textoBtnSalvar,
                              eventosSalvos.has(item.id) && styles.textoBtnSalvarActive
                            ]}>
                              {eventosSalvos.has(item.id) ? "Salvo" : "Salvar"}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </ImageBackground>

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
    borderRadius:24,
    overflow:"hidden",
    height:220,
    borderWidth:1,
    borderColor:"rgba(255,255,255,0.06)",
  },

  eventImage:{
    width:"100%",
    height:"100%",
  },

  eventImageOverlay:{
    flex:1,
    padding:18,
    justifyContent:"flex-end",
  },

  categoryBadge:{
    flexDirection:"row",
    alignItems:"center",
    paddingHorizontal:12,
    paddingVertical:6,
    borderRadius:16,
    backgroundColor:"rgba(139,92,246,0.95)",
    alignSelf:"flex-start",
    marginBottom:12,
    borderWidth:1,
    borderColor:"rgba(255,255,255,0.2)",
  },

  categoryBadgeText:{
    color:"#FFF",
    fontSize:11,
    fontWeight:"800",
    marginLeft:4,
  },

  eventTitle:{
    color:"#FFF",
    fontSize:18,
    fontWeight:"800",
    marginBottom:6,
  },

  eventLocal:{
    color:"rgba(255,255,255,0.7)",
    fontSize:13,
    marginBottom:12,
  },

  dateHighlight:{
    flexDirection:"row",
    alignItems:"center",
    backgroundColor:"rgba(139,92,246,0.15)",
    borderRadius:10,
    paddingHorizontal:10,
    paddingVertical:6,
    marginBottom:12,
    alignSelf:"flex-start",
    borderWidth:1,
    borderColor:"rgba(139,92,246,0.3)",
  },

  dateHighlightText:{
    color:"#8B5CF6",
    fontSize:12,
    fontWeight:"700",
    marginLeft:6,
  },

  actions:{
    flexDirection:"row",
    justifyContent:"flex-end",
  },

  botaoSalvar:{
    borderRadius:14,
    overflow:"hidden",
  },

  gradientBtnSalvar:{
    flexDirection:"row",
    alignItems:"center",
    paddingVertical:10,
    paddingHorizontal:14,
    borderWidth:1,
    borderColor:"rgba(139,92,246,0.5)",
  },

  textoBtnSalvar:{
    color:"#8B5CF6",
    fontWeight:"800",
    fontSize:12,
    marginLeft:4,
  },

  textoBtnSalvarActive:{
    color:"#FFF",
  },

});