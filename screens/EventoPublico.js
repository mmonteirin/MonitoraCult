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

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView, AnimatePresence } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { getEventos } from "../services/mapaCulturalService";

const { width } = Dimensions.get("window");

export default function EventosPublicos() {

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    carregarEventos();
  }, []);

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

          const dataEvento =
            inicio
              ? new Date(inicio)
              : null;

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
              item?.files?.avatar?.url ||
              item?.files?.header?.url ||
              item?.files?.[0]?.url ||
              "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200",

            dataObj:
              dataEvento,

            data:

              dataEvento
                ? dataEvento.toLocaleDateString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "Em breve",

            status:

              dataEvento &&
              dataEvento > hoje

                ? "confirmado"
                : "pendente",

          };

        })

        .filter((evento) => {

          if (!evento.dataObj)
            return false;

          return (

            evento.dataObj >= hoje &&

            evento.dataObj <= limite60

          );

        })

        .sort(

          (a, b) =>

            a.dataObj - b.dataObj

        );

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

                    style={[
                      styles.status,

                      confirmado
                        ? styles.confirmado
                        : styles.pendente,
                    ]}
                  >

                    <View
                      style={
                        styles.statusDot
                      }
                    />

                    <Text
                      style={
                        styles.statusText
                      }
                    >
                      {confirmado
                        ? "Confirmado"
                        : "Pendente"}
                    </Text>

                  </MotiView>

                  <TouchableOpacity
  activeOpacity={0.9}
  style={styles.floatingBtn}
>
  <BlurView
    intensity={70}
    tint="dark"
    style={styles.floatingBlur}
  >
    <MaterialCommunityIcons
      name="heart-outline"
      size={20}
      color="#FFF"
    />
  </BlurView>
</TouchableOpacity>

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

<View style={styles.actions}>

<TouchableOpacity
activeOpacity={0.9}
style={styles.botaoEvento}
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
activeOpacity={0.7}
onPress={() =>
cancelarInscricao(
item.id
)
}
style={styles.cancelarBtn}
>

<MaterialCommunityIcons
name="close-circle-outline"
size={18}
color="#EF4444"
/>

<Text style={styles.cancelar}>
Cancelar
</Text>

</TouchableOpacity>

</View>

</BlurView>
</TouchableOpacity>
</MotiView>
</AnimatePresence>

      );

    },
    []
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
},

confirmado:{
backgroundColor:
"rgba(34,197,94,0.95)",
},

pendente:{
backgroundColor:
"rgba(245,158,11,0.95)",
},

statusDot:{
width:8,
height:8,
borderRadius:4,

backgroundColor:"#FFF",

marginRight:8,
},

statusText:{
color:"#FFF",
fontSize:12,
fontWeight:"800",
},

floatingBtn:{
position:"absolute",
top:18,
right:18,

borderRadius:22,
overflow:"hidden",
},

floatingBlur:{
width:46,
height:46,

justifyContent:"center",
alignItems:"center",

backgroundColor:
"rgba(0,0,0,0.28)",
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

actions:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",

marginTop:24,
},

botaoEvento:{
borderRadius:18,
overflow:"hidden",
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

cancelarBtn:{
flexDirection:"row",
alignItems:"center",
},

cancelar:{
color:"#EF4444",

fontWeight:"800",
fontSize:14,

marginLeft:6,
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