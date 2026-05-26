/**
 * 🚀 GUIA DE INTEGRAÇÃO: STORIES & DIRECT MESSAGES
 * Como integrar os novos componentes no seu app
 */

// ============================================
// 1️⃣ ADICIONAR STORIES NO TelaFeed.js
// ============================================

/**
 * Passo 1: Importar componentes
 */
import StoriesCarousel from "../components/StoriesCarousel";
import StoryCriador from "../components/StoryCriador";
import StoryViewer from "../components/StoryViewer";
import { useStories } from "../hooks/useStories";

/**
 * Passo 2: No componente TelaFeed.js, adicionar:
 */
export default function TelaFeed({ route }) {
  const auth = route?.params?.auth;
  const userId = auth?.currentUser?.uid;
  const userData = route?.params?.userData;

  // Estados
  const [storyVisualizando, setStoryVisualizando] = useState(null);
  const [modalCriarStory, setModalCriarStory] = useState(false);

  // Hook
  const { stories, criarNovoStory, verStory, adicionarReacao } = useStories(
    userId,
    userData?.seguindo || []
  );

  // Handler para criar story
  const handleCriarStory = async (dados) => {
    const resultado = await criarNovoStory(
      dados.imagemUri,
      dados.textoStory,
      dados.musica,
      userData
    );

    if (resultado.success) {
      // Sucesso! Story criada
      setModalCriarStory(false);
    } else {
      Alert.alert("Erro", resultado.error);
    }
  };

  return (
    <View style={styles.container}>
      {/* CARROSSEL DE STORIES */}
      <StoriesCarousel
        stories={stories}
        loading={loading}
        onStoryPress={(storyGroup) => setStoryVisualizando(storyGroup)}
        onCriarStory={() => setModalCriarStory(true)}
        mostrarCriarStory={true}
      />

      {/* VIEWER DE STORY */}
      <StoryViewer
        storyGroup={storyVisualizando}
        visible={!!storyVisualizando}
        onClose={() => setStoryVisualizando(null)}
        userId={userId}
        onReacao={(dados) => console.log("Reação adicionada:", dados)}
      />

      {/* CRIADOR DE STORY (Modal) */}
      <StoryCriador
        visible={modalCriarStory}
        onClose={() => setModalCriarStory(false)}
        onCriar={handleCriarStory}
        userData={userData}
        criando={false}
      />

      {/* FEED DE POSTS */}
      {/* ... resto do seu feed ... */}
    </View>
  );
}

// ============================================
// 2️⃣ ADICIONAR DIRECT MESSAGES NA NAVEGAÇÃO
// ============================================

/**
 * Arquivo: navigation/MessageStack.js
 * Criar novo stack para mensagens
 */
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TelaConversas from "../screens/TelaConversas";
import TelaMensagens from "../screens/TelaMensagens";
import { Colors } from "../styles/Colors";

const Stack = createNativeStackNavigator();

export default function MessageStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "700",
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
          title: "Chat",
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Arquivo: navigation/MainNavigator.js
 * Adicionar MessageStack como aba ou opção no drawer
 */
import MessageStack from "./MessageStack";

export default function MainNavigator() {
  return (
    <Tab.Navigator>
      {/* Abas existentes */}
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="FeedTab" component={FeedStack} />

      {/* NOVA ABA DE MENSAGENS */}
      <Tab.Screen
        name="MessagesTab"
        component={MessageStack}
        options={{
          tabBarLabel: "Mensagens",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen name="ProfileTab" component={PerfilStack} />
    </Tab.Navigator>
  );
}

// ============================================
// 3️⃣ PASSAR AUTH PARA TELAS
// ============================================

/**
 * Arquivo: navigation/TabNavigator.js ou local onde você navega
 * Verificar que auth está sendo passado
 */

// Quando navegando para TelaConversas, passar auth:
navigation.navigate("MessagesTab", {
  screen: "TelaConversas",
  params: { auth: auth }, // Certifique-se que auth está aqui
});

// ============================================
// 4️⃣ EXEMPLO COMPLETO EM App.js
// ============================================

/**
 * No seu App.js ou lugar onde você monta a navegação
 */
import AuthContext from "./context/AuthContext";

export default function App() {
  const auth = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializar Firebase Auth
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setLoading(false);
      if (user) {
        // Usuário logado
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  if (!auth?.currentUser) {
    return <AuthNavigator />;
  }

  return (
    <NavigationContainer>
      <MainNavigator auth={auth} />
    </NavigationContainer>
  );
}

// ============================================
// 5️⃣ EXEMPLO: INTEGRAR NO DRAWER
// ============================================

/**
 * Se preferir adicionar mensagens no menu drawer
 */
import DrawerNavigator from "./DrawerNavigator";

// No DrawerNavigator.js:
export default function DrawerNavigator({ auth }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="HomeStack"
        component={HomeStack}
        options={{ title: "Home" }}
      />
      
      <Drawer.Screen
        name="FeedStack"
        component={FeedStack}
        options={{ title: "Feed" }}
      />

      {/* NOVA OPÇÃO */}
      <Drawer.Screen
        name="MessageStack"
        component={MessageStack}
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

      <Drawer.Screen
        name="PerfilStack"
        component={PerfilStack}
        options={{ title: "Perfil" }}
      />
    </Drawer.Navigator>
  );
}

// ============================================
// 6️⃣ CHECKLIST DE INTEGRAÇÃO
// ============================================

/**
 * ✅ Criar novo arquivo: navigation/MessageStack.js
 * ✅ Importar MessageStack no MainNavigator ou DrawerNavigator
 * ✅ Adicionar Tab.Screen ou Drawer.Screen para mensagens
 * ✅ Adicionar StoriesCarousel no topo de TelaFeed
 * ✅ Adicionar StoryCriador modal no TelaFeed
 * ✅ Adicionar StoryViewer modal no TelaFeed
 * ✅ Verificar que auth está sendo passado via route.params
 * ✅ Testar criação de stories
 * ✅ Testar envio de mensagens
 * ✅ Testar visualização de stories
 * ✅ Testar recebimento em tempo real
 */

// ============================================
// 7️⃣ TROUBLESHOOTING
// ============================================

/**
 * ERRO: "undefined is not an object (evaluating 'auth.currentUser')"
 * SOLUÇÃO: Certifique-se que auth está sendo passado via route.params
 * 
 * ERRO: "Stories não aparecem no carrossel"
 * SOLUÇÃO: Verifique que seguindo[] tem usuários
 * 
 * ERRO: "Mensagens não sincronizam em tempo real"
 * SOLUÇÃO: Verifique as Firestore Rules e que conversaId está correto
 * 
 * ERRO: "Hook 'useStories' must be inside a function component"
 * SOLUÇÃO: Só use hooks dentro de componentes funcioaris, não em screens
 */

export default {};
