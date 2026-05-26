import React, {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView, AnimatePresence } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { getEventos } from "../services/mapaCulturalService";

const { width } = Dimensions.get("window");

const extrairDataDaDescricao = (descricao) => {
  if (!descricao) return null;

  // Padrões de data brasileira: DD/MM/YYYY, DD/MM/YY, DD de MMMM de YYYY
  const padroes = [
    /(\d{2})\/(\d{2})\/(\d{4})/g, // DD/MM/YYYY
    /(\d{2})\/(\d{2})\/(\d{2})/g, // DD/MM/YY
    /(\d{1,2})\sde\s(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\sde\s(\d{4})/gi, // DD de MMMM de YYYY
  ];

  for (const padrao of padroes) {
    const match = padrao.exec(descricao);
    if (match) {
      if (match.length === 4) {
        const [, dia, mes, ano] = match;
        // Converter mês por extenso para número
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
  // Se já tem imagem, usa ela
  if (imagemOriginal && imagemOriginal !== "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200") {
    return imagemOriginal;
  }

  // Mapeamento de categorias para imagens
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

  // Tenta encontrar a categoria exata ou parcial
  for (const [key, url] of Object.entries(imagensPorCategoria)) {
    if (categoria && categoria.toLowerCase().includes(key.toLowerCase())) {
      return url;
    }
  }

  // Imagem padrão para cultura
  return imagensPorCategoria["Cultura"];
};

export default function EventosPublicos({ navigation }) {

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarPassados, setMostrarPassados] = useState(true); // mostrar passados como padrão
  const [likedEvents, setLikedEvents] = useState({}); // estado para likes
  const [eventosSalvos, setEventosSalvos] = useState(new Set()); // eventos salvos

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    carregarEventos();
    carregarEventosSalvos();
  }, [mostrarPassados]);

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
        Alert.alert("Removido", "Evento removido dos salvos.");
      } else {
        novosSalvos.add(evento.id);
        Alert.alert("Salvo", "Evento salvo para depois.");
      }
      setEventosSalvos(novosSalvos);
      await AsyncStorage.setItem("eventosSalvos", JSON.stringify([...novosSalvos]));
    } catch (error) {
      console.log("Erro ao salvar evento:", error);
    }
  };

  const toggleLike = (eventId) => {
    setLikedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const carregarEventos = async () => {
    try {

      const response = await getEventos();

      const lista = Array.isArray(response)
        ? response
        : response?.data ||
          response?.results ||
          [];

      const hoje = new Date();

      const limite60 = new Date();

      limite60.setDate(
        hoje.getDate() + 60
      );

      const tratados = lista
        .map((item, index) => {

          const occurrence =
            item?.occurrences?.[0];

          const inicio =
            occurrence?.startDate ||
            occurrence?.startsOn ||
            occurrence?.start;

          let dataEvento =
            inicio
              ? new Date(inicio)
              : null;

          // Se não encontrou data na occurrence, tentar extrair da descrição
          if (!dataEvento || isNaN(dataEvento.getTime())) {
            dataEvento = extrairDataDaDescricao(item?.shortDescription || item?.description);
          }

          // Identificar se o evento já ocorreu
          const jaOcorreu = dataEvento && dataEvento < hoje;

          // Extrair categoria/linguagem dos terms
          const linguagens = item?.terms?.linguagem || [];
          let categoria = linguagens.length > 0 ? linguagens[0] : "Cultura";

          // Se não tiver categoria definida, tentar extrair da descrição
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

            id:
              item.id ||
              String(index),

            titulo:
              item.name ||
              "Evento Cultural",

            local:
              item?.location?.name ||
              item?.location ||
              "Fortaleza",

            descricao:
              item?.shortDescription ||
              "Evento cultural disponível.",

            imagem:
              getImagemPorCategoria(
                categoria,
                item?.files?.avatar?.url ||
                item?.files?.header?.url ||
                item?.files?.[0]?.url
              ),

            dataObj:
              dataEvento,

            data:

              dataEvento
                ? dataEvento.toLocaleDateString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : "Em breve",

            status:

              jaOcorreu ? "passado" : (dataEvento && dataEvento >= hoje ? "confirmado" : "pendente"),

            jaOcorreu: jaOcorreu,

            categoria: categoria,

          };

        })

        .filter((evento) => {
          // Se mostrarPassados está ativo, inclui todos os eventos com data
          if (mostrarPassados) {
            if (!evento.dataObj) return true; // Inclui eventos sem data
            return evento.dataObj <= limite60; // Apenas eventos até 60 dias no futuro
          }
          // Se não mostrar passados, filtra apenas eventos futuros
          if (!evento.dataObj) return true; // Inclui eventos sem data (podem ser futuros)
          return evento.dataObj >= hoje && evento.dataObj <= limite60;
        })

        .sort((a, b) => {
          // Eventos sem data vão para o final
          if (!a.dataObj) return 1;
          if (!b.dataObj) return -1;
          // Se mostrar passados, ordena do mais recente para o mais antigo
          if (mostrarPassados) {
            return b.dataObj - a.dataObj;
          }
          // Se não mostrar passados, ordena do mais próximo para o mais distante
          return a.dataObj - b.dataObj;
        });

      setEventos(tratados);

    } catch (error) {

      console.log(
        "Erro API:",
        error
      );

    } finally {

      setLoading(false);

    }
  };

  const cancelarInscricao = (id) => {

    Alert.alert(
      "Cancelar inscrição",
      "Deseja cancelar sua inscrição?",
      [
        {
          text: "Não",
          style: "cancel",
        },

        {
          text: "Sim",
          style: "destructive",

          onPress: () => {

            setEventos((prev) =>
              prev.filter(
                (item) =>
                  item.id !== id
              )
            );

          },
        },
      ]
    );
  };

  const renderItem = useCallback(
    ({ item, index }) => {

      const confirmado =
        item.status ===
        "confirmado";

      const passado =
        item.status ===
        "passado";

      const isLiked = likedEvents[item.id];

      return (

        <AnimatePresence
          key={item.id}
        >

          <MotiView
            from={{
              opacity: 0,
              translateY: 50,
              scale: 0.95,
            }}

            animate={{
              opacity: 1,
              translateY: 0,
              scale: 1,
            }}

            exit={{
              opacity: 0,
              translateX: width,
            }}

            transition={{
              type: "timing",
              duration: 600,
              delay:
                index * 120,
            }}
          >

            <TouchableOpacity
              activeOpacity={0.95}
              style={styles.card}
            >

              <ImageBackground
                source={{
                  uri: item.imagem,
                }}
                style={
                  styles.imagem
                }
              >

                <LinearGradient
                  colors={[
                    "rgba(139,92,246,0.28)",
                    "transparent",
                  ]}
                  style={
                    styles.glow
                  }
                />

                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(0,0,0,0.35)",
                    "rgba(0,0,0,0.96)",
                  ]}
                  style={
                    styles.overlayCard
                  }
                >

                  <MotiView
                    from={{
                      opacity: 0,
                      scale: 0.8,
                    }}

                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}

                    style={styles.status}
                  >

                    <MaterialCommunityIcons
                      name="tag-outline"
                      size={14}
                      color="#FFF"
                    />

                    <Text
                      style={
                        styles.statusText
                    }
                    >
                      {item.categoria || "Cultura"}
                    </Text>

                  </MotiView>

                  </LinearGradient>
</ImageBackground>

<BlurView
  intensity={55}
  tint="dark"
  style={styles.conteudo}
>

<Text
  style={styles.titulo}
  numberOfLines={1}
>
  {item.titulo}
</Text>

<View style={styles.infoContainer}>

<View style={styles.infoCard}>

<View style={styles.iconBox}>
<MaterialCommunityIcons
name="calendar-month-outline"
size={16}
color="#A78BFA"
/>
</View>

<Text style={styles.infoText}>
{item.data}
</Text>

</View>

<View style={styles.infoCard}>

<View style={styles.iconBox}>
<MaterialCommunityIcons
name="map-marker-outline"
size={16}
color="#60A5FA"
/>
</View>

<Text
style={styles.infoText}
numberOfLines={1}
>
{item.local}
</Text>

</View>

</View>

<View style={styles.dateHighlight}>
  <MaterialCommunityIcons
    name="clock-outline"
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
style={styles.botaoEvento}
onPress={() => navigation.navigate("EventoDetalhesPublico", { evento: item })}
>

<LinearGradient
colors={[
"#8B5CF6",
"#6D28D9",
]}
style={styles.gradientBtn}
>

<MaterialCommunityIcons
name="eye-outline"
size={18}
color="#FFF"
/>

<Text style={styles.textoBtn}>
Ver Evento
</Text>

</LinearGradient>

</TouchableOpacity>

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
size={18}
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

</BlurView>
</TouchableOpacity>
</MotiView>
</AnimatePresence>

      );

    },
    [likedEvents]
  );

if (loading) {

return (

<View style={styles.loadingContainer}>

<ActivityIndicator
size="large"
color="#8B5CF6"
/>

<Text style={styles.loadingText}>
Carregando eventos...
</Text>

</View>

);

}

return (

<View style={styles.container}>

<StatusBar
barStyle="light-content"
/>

<ImageBackground
source={require("../assets/fundoTelaLogin.png")}
style={styles.bg}
resizeMode="cover"
>

<LinearGradient
colors={[
"rgba(5,8,18,0.97)",
"rgba(10,12,24,0.96)",
"rgba(22,14,50,0.96)",
]}
style={styles.overlayScreen}
>

<View style={styles.glowTop}/>
<View style={styles.glowBottom}/>

<ScrollView
showsVerticalScrollIndicator={false}
contentContainerStyle={{
paddingBottom:
tabBarHeight + 40,
}}
>

<View
style={[
styles.header,
{
paddingTop:
insets.top + 10,
},
]}
>

<MotiView
from={{
opacity:0,
translateY:25,
}}
animate={{
opacity:1,
translateY:0,
}}
transition={{
type:"timing",
duration:700,
}}
>

<LinearGradient
colors={[
"#8B5CF6",
"#5B21B6",
]}
style={styles.heroGradient}
>

<MaterialCommunityIcons
name="ticket-confirmation-outline"
size={38}
color="#FFF"
/>

</LinearGradient>

<Text style={styles.headerTitle}>
Eventos Públicos
</Text>

<Text style={styles.headerSub}>
Eventos mais recentes dos
próximos 60 dias.
</Text>

<View style={styles.filtroRow}>
  <TouchableOpacity
    style={[styles.filtroBtn, mostrarPassados && styles.filtroBtnActive]}
    onPress={() => setMostrarPassados(!mostrarPassados)}
  >
    <MaterialCommunityIcons
      name={mostrarPassados ? "history" : "clock-outline"}
      size={18}
      color={mostrarPassados ? "#8B5CF6" : "#FFF"}
    />
    <Text style={[styles.filtroBtnText, mostrarPassados && styles.filtroBtnTextActive]}>
      {mostrarPassados ? "Passados" : "Futuros"}
    </Text>
  </TouchableOpacity>
</View>

</MotiView>

</View>

<View style={styles.listContainer}>

{eventos.map(
(item,index)=>
renderItem({
item,
index,
})
)}

{!eventos.length && (

<MotiView
from={{
opacity:0,
scale:0.9,
}}
animate={{
opacity:1,
scale:1,
}}
style={styles.emptyContainer}
>

<LinearGradient
colors={[
"rgba(139,92,246,0.25)",
"rgba(255,255,255,0.03)",
]}
style={styles.emptyIconBox}
>

<MaterialCommunityIcons
name="calendar-remove-outline"
size={68}
color="rgba(255,255,255,0.4)"
/>

</LinearGradient>

<Text style={styles.empty}>
Nenhum evento encontrado
</Text>

<Text style={styles.emptySub}>
Sem eventos disponíveis
nos próximos 60 dias.
</Text>

</MotiView>

)}

</View>

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

loadingContainer:{
flex:1,
justifyContent:"center",
alignItems:"center",
backgroundColor:"#070B14",
},

loadingText:{
color:"#FFF",
marginTop:16,
fontSize:15,
fontWeight:"700",
},

bg:{
flex:1,
},

overlayScreen:{
flex:1,
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

heroGradient:{
width:90,
height:90,
borderRadius:30,
justifyContent:"center",
alignItems:"center",
marginBottom:22,

shadowColor:"#8B5CF6",
shadowOpacity:0.45,
shadowRadius:20,

shadowOffset:{
width:0,
height:10,
},

elevation:12,
},

headerTitle:{
color:"#FFF",
fontSize:
width < 380
? 34
: 40,

fontWeight:"800",
letterSpacing:-0.5,
},

headerSub:{
color:"rgba(255,255,255,0.70)",
marginTop:12,
fontSize:15,
lineHeight:24,
maxWidth:"95%",
},

filtroRow:{
flexDirection:"row",
alignItems:"center",
marginTop:16,
gap:12,
},

filtroBtn:{
flexDirection:"row",
alignItems:"center",
backgroundColor:"rgba(139,92,246,0.2)",
borderWidth:1,
borderColor:"rgba(139,92,246,0.4)",
borderRadius:20,
paddingHorizontal:16,
paddingVertical:10,
gap:6,
},

filtroBtnText:{
color:"#FFF",
fontSize:14,
fontWeight:"700",
},

filtroBtnActive:{
backgroundColor:"rgba(139,92,246,0.35)",
borderColor:"rgba(139,92,246,0.6)",
},

filtroBtnTextActive:{
color:"#8B5CF6",
},

listContainer:{
paddingHorizontal:20,
paddingTop:10,
},

card:{
borderRadius:32,
overflow:"hidden",
marginBottom:24,

backgroundColor:
"rgba(255,255,255,0.06)",

borderWidth:1,
borderColor:
"rgba(255,255,255,0.06)",

shadowColor:"#000",
shadowOpacity:0.25,
shadowRadius:18,

shadowOffset:{
width:0,
height:10,
},

elevation:12,
},

imagem:{
height:240,
justifyContent:"flex-end",
},

glow:{
...StyleSheet.absoluteFillObject,
},

overlayCard:{
flex:1,
justifyContent:"space-between",
padding:18,
},

status:{
alignSelf:"flex-start",

flexDirection:"row",
alignItems:"center",

paddingHorizontal:14,
paddingVertical:8,

borderRadius:20,

backgroundColor:"rgba(139,92,246,0.95)",

borderWidth:1,
borderColor:"rgba(255,255,255,0.2)",
},

statusText:{
color:"#FFF",
fontSize:12,
fontWeight:"800",
marginLeft:6,
},

conteudo:{
padding:20,
backgroundColor:
"rgba(12,12,18,0.72)",
},

titulo:{
color:"#FFF",
fontSize:24,
fontWeight:"800",
marginBottom:18,
},

infoContainer:{
gap:12,
},

infoCard:{
flexDirection:"row",
alignItems:"center",

backgroundColor:
"rgba(255,255,255,0.05)",

borderRadius:16,

paddingHorizontal:14,
paddingVertical:12,
},

iconBox:{
width:30,
height:30,
borderRadius:10,

backgroundColor:
"rgba(255,255,255,0.06)",

justifyContent:"center",
alignItems:"center",
},

infoText:{
flex:1,

color:
"rgba(255,255,255,0.78)",

marginLeft:12,

fontSize:13,
},

dateHighlight:{
flexDirection:"row",
alignItems:"center",

backgroundColor:"rgba(139,92,246,0.15)",

borderRadius:12,
paddingHorizontal:12,
paddingVertical:8,

marginTop:8,

borderWidth:1,
borderColor:"rgba(139,92,246,0.3)",
},

dateHighlightText:{
color:"#8B5CF6",
fontSize:13,
fontWeight:"700",
marginLeft:6,
},

actions:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",

marginTop:24,
},

botaoEvento:{
borderRadius:18,
overflow:"hidden",
flex:1,
marginRight:10,
},

gradientBtn:{
flexDirection:"row",
alignItems:"center",

paddingVertical:14,
paddingHorizontal:20,
},

textoBtn:{
color:"#FFF",

fontWeight:"800",
fontSize:13,

marginLeft:8,
},

botaoSalvar:{
borderRadius:18,
overflow:"hidden",
},

gradientBtnSalvar:{
flexDirection:"row",
alignItems:"center",

paddingVertical:14,
paddingHorizontal:16,

borderWidth:1,
borderColor:"rgba(139,92,246,0.5)",
},

textoBtnSalvar:{
color:"#8B5CF6",

fontWeight:"800",
fontSize:13,

marginLeft:6,
},

textoBtnSalvarActive:{
color:"#FFF",
},

emptyContainer:{
alignItems:"center",

marginTop:100,

paddingHorizontal:30,
},

emptyIconBox:{
width:130,
height:130,

borderRadius:65,

justifyContent:"center",
alignItems:"center",

marginBottom:26,
},

empty:{
color:"#FFF",

textAlign:"center",

fontSize:18,
fontWeight:"700",

lineHeight:28,
},

emptySub:{
color:
"rgba(255,255,255,0.55)",

marginTop:10,

textAlign:"center",

fontSize:14,

lineHeight:22,
},

});