/**
 * 📝 EXEMPLOS DE USO: STORIES & DIRECT MESSAGES
 * Copy-paste ready para integrar
 */

// ============================================
// EXEMPLO 1: USAR STORIES NO FEED
// ============================================

import React, { useState } from "react";
import { View } from "react-native";
import StoriesCarousel from "../components/StoriesCarousel";
import StoryViewer from "../components/StoryViewer";
import StoryCriador from "../components/StoryCriador";
import { useStories } from "../hooks/useStories";

export function MinhaTelaFeed({ route }) {
  const auth = route?.params?.auth;
  const userData = route?.params?.userData;
  const userId = auth?.currentUser?.uid;

  // States
  const [storyVisualizando, setStoryVisualizando] = useState(null);
  const [modalCriarStory, setModalCriarStory] = useState(false);

  // Hook
  const { stories, loading, criarNovoStory } = useStories(
    userId,
    userData?.seguindo || []
  );

  const handleCriarStory = async (dados) => {
    const resultado = await criarNovoStory(
      dados.imagemUri,
      dados.textoStory,
      dados.musica,
      userData
    );

    if (resultado.success) {
      console.log("✅ Story criada com sucesso!");
      setModalCriarStory(false);
    }
  };

  return (
    <View>
      {/* Carrossel de stories */}
      <StoriesCarousel
        stories={stories}
        loading={loading}
        onStoryPress={(storyGroup) => setStoryVisualizando(storyGroup)}
        onCriarStory={() => setModalCriarStory(true)}
      />

      {/* Viewer */}
      <StoryViewer
        storyGroup={storyVisualizando}
        visible={!!storyVisualizando}
        onClose={() => setStoryVisualizando(null)}
        userId={userId}
      />

      {/* Criador */}
      <StoryCriador
        visible={modalCriarStory}
        onClose={() => setModalCriarStory(false)}
        onCriar={handleCriarStory}
        userData={userData}
      />
    </View>
  );
}

// ============================================
// EXEMPLO 2: USAR CONVERSAS (Lista)
// ============================================

import React from "react";
import { useDirectMessages } from "../hooks/useDirectMessages";
import TelaConversas from "../screens/TelaConversas";

export function MeuTelaConversas({ route, navigation }) {
  // TelaConversas já usa o hook internamente
  return <TelaConversas route={route} navigation={navigation} />;
}

// ============================================
// EXEMPLO 3: USAR CHAT (Mensagens)
// ============================================

import React from "react";
import { useConversation } from "../hooks/useDirectMessages";
import ChatViewer from "../components/ChatViewer";

export function MeuChat({ route }) {
  const { conversaId, auth, userData } = route?.params;
  const userId = auth?.currentUser?.uid;

  const {
    mensagens,
    loading,
    enviando,
    enviar,
    deletar,
    editar,
  } = useConversation(userId, conversaId);

  const handleEnviar = async (dados) => {
    const resultado = await enviar(dados);
    if (!resultado.success) {
      console.error("Erro ao enviar:", resultado.error);
    }
  };

  return (
    <ChatViewer
      mensagens={mensagens}
      loading={loading}
      enviando={enviando}
      userId={userId}
      nomePerfil={userData?.nome}
      onEnviar={handleEnviar}
      onDelete={deletar}
      onEdit={editar}
    />
  );
}

// ============================================
// EXEMPLO 4: INICIAR CONVERSA PROGRAMATICAMENTE
// ============================================

import { useDirectMessages } from "../hooks/useDirectMessages";

export function IniciarConversa() {
  const { iniciarConversa } = useDirectMessages(userId);

  const handleEnviarMensagem = async (outroUserId) => {
    const resultado = await iniciarConversa(
      outroUserId,
      "João Silva", // Nome do outro user
      "https://i.pravatar.cc/100?u=joao" // Foto
    );

    if (resultado.success) {
      // Navegar para chat
      navigation.navigate("TelaMensagens", {
        conversaId: resultado.conversaId,
      });
    }
  };

  return null;
}

// ============================================
// EXEMPLO 5: ADICIONAR BADGE DE MENSAGENS
// ============================================

import { useDirectMessages } from "../hooks/useDirectMessages";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function TabMessages({ navigation }) {
  const { naoLidas } = useDirectMessages(userId);

  React.useEffect(() => {
    navigation.setOptions({
      tabBarBadge: naoLidas > 0 ? naoLidas : null,
      tabBarIcon: ({ color, size }) => (
        <MaterialCommunityIcons
          name="message"
          size={size}
          color={color}
        />
      ),
    });
  }, [naoLidas, navigation]);

  return null;
}

// ============================================
// EXEMPLO 6: INTEGRAR NO STACK DE NAVEGAÇÃO
// ============================================

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Colors } from "../styles/Colors";

const Stack = createNativeStackNavigator();

export function MessageStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
      }}
    >
      <Stack.Screen
        name="TelaConversas"
        component={TelaConversas}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="TelaMensagens"
        component={TelaMensagens}
        options={{
          title: "",
        }}
      />
    </Stack.Navigator>
  );
}

// ============================================
// EXEMPLO 7: USAR NO DRAWER NAVIGATOR
// ============================================

import { createDrawerNavigator } from "@react-navigation/drawer";

const Drawer = createDrawerNavigator();

export function DrawerWithMessages() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen
        name="HomeStack"
        component={HomeStack}
        options={{ title: "Home" }}
      />

      <Drawer.Screen
        name="MessageStack"
        component={MessageStackNavigator}
        options={{
          title: "Mensagens",
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="message"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

// ============================================
// EXEMPLO 8: PASSAR AUTH ATRAVÉS DA NAVEGAÇÃO
// ============================================

// Em App.js ou NavigationService.js
navigation.navigate("TelaConversas", {
  auth: firebaseAuth, // Passou auth aqui
  userData: userProfile,
});

// Em TelaConversas.js
export default function TelaConversas({ route, navigation }) {
  const auth = route?.params?.auth; // Recebido aqui
  const userId = auth?.currentUser?.uid;
  
  // ... resto do código
}

// ============================================
// EXEMPLO 9: VALIDAR ANTES DE ENVIAR
// ============================================

export function ValidarMensagem() {
  const handleEnviar = async (texto) => {
    // Validações
    if (!texto || texto.trim().length === 0) {
      Alert.alert("Erro", "Mensagem não pode estar vazia");
      return;
    }

    if (texto.length > 500) {
      Alert.alert("Erro", "Mensagem não pode ter mais de 500 caracteres");
      return;
    }

    if (!userId || !conversaId) {
      Alert.alert("Erro", "IDs inválidos");
      return;
    }

    // Enviar
    const resultado = await enviar({ texto });
    if (!resultado.success) {
      Alert.alert("Erro", resultado.error);
    }
  };

  return null;
}

// ============================================
// EXEMPLO 10: LISTAR TODAS AS CONVERSAS
// ============================================

import { useDirectMessages } from "../hooks/useDirectMessages";

export function ListarConversas() {
  const { conversas, loading } = useDirectMessages(userId);

  return (
    <FlatList
      data={conversas}
      renderItem={({ item: conversa }) => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("TelaMensagens", {
              conversaId: conversa.id,
              conversa,
              auth,
            })
          }
        >
          <Text>{conversa.ultimaMensagem}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}

// ============================================
// EXEMPLO 11: DELETAR CONVERSA (Soft Delete)
// ============================================

import { dmService } from "../services/dmService";

export function DeletarConversa() {
  const handleDeletar = async (conversaId) => {
    Alert.alert(
      "Deletar conversa?",
      "Todas as mensagens serão perdidas",
      [
        { text: "Cancelar" },
        {
          text: "Deletar",
          onPress: async () => {
            // Deletar todas as mensagens
            const msgs = await dmService.obterMensagens(conversaId);
            for (const msg of msgs) {
              await dmService.deletarMensagem(conversaId, msg.id);
            }
            console.log("✅ Conversa deletada");
          },
          style: "destructive",
        },
      ]
    );
  };

  return null;
}

// ============================================
// EXEMPLO 12: ANIMAR ENTRADA DE NOVA MENSAGEM
// ============================================

import { Animated } from "react-native";

export function MensagemComAnimacao({ mensagem }) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.mensagem,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Conteúdo */}
    </Animated.View>
  );
}

// ============================================
// EXEMPLO 13: COPIAR MENSAGEM
// ============================================

import Clipboard from "@react-native-clipboard/clipboard";

export function CopiarMensagem() {
  const handleCopiar = (texto) => {
    Clipboard.setString(texto);
    Alert.alert("Copiado", "Mensagem copiada para área de transferência");
  };

  return (
    <TouchableOpacity onPress={() => handleCopiar(mensagem.texto)}>
      <MaterialCommunityIcons name="content-copy" size={20} />
    </TouchableOpacity>
  );
}

// ============================================
// EXEMPLO 14: BUSCAR MENSAGENS
// ============================================

export function BuscarMensagens() {
  const [busca, setBusca] = useState("");

  const mensagensEncontradas = mensagens.filter((m) =>
    m.texto.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View>
      <TextInput
        placeholder="Buscar..."
        value={busca}
        onChangeText={setBusca}
      />

      <FlatList
        data={mensagensEncontradas}
        renderItem={({ item }) => (
          <Text>{item.texto}</Text>
        )}
      />
    </View>
  );
}

// ============================================
// EXEMPLO 15: NOTIFICAÇÃO DE NOVA MENSAGEM
// ============================================

import * as Notifications from "expo-notifications";

export function NotificarNovaMensagem(mensagem) {
  // Configurar notificação local
  Notifications.scheduleNotificationAsync({
    content: {
      title: "Nova mensagem",
      body: mensagem.texto.substring(0, 50),
      data: { conversaId: mensagem.conversaId },
    },
    trigger: { seconds: 1 },
  });
}

export default {};
