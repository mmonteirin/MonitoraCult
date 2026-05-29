/**
 * 🔧 CHECKLIST DE INTEGRAÇÃO PRONTA
 * Alterações exatas para fazer em seus arquivos existentes
 */

# ⚡ INTEGRAÇÃO RÁPIDA

## 1️⃣ Modificar `navigation/MainNavigator.js` ou seu equivalente

```javascript
// ✅ ADICIONAR IMPORT
import MessageStack from './MessageStack';

// ✅ ADICIONAR IMPORT NO TABNAVIGATOR
import { useDirectMessages } from '../hooks/useDirectMessages';

// ✅ NO COMPONENTE DE TABS (antes de return), adicionar:

export default function MainNavigator({ auth }) {
  const { naoLidas } = useDirectMessages(auth?.currentUser?.uid);

  return (
    <Tab.Navigator
      screenOptions={{
        // ... suas opções existentes
      }}
    >
      {/* Suas abas existentes */}
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="FeedTab" component={FeedStack} />

      {/* ADICIONAR ESTA ABA */}
      <Tab.Screen
        name="MessagesTab"
        component={MessageStack}
        options={{
          tabBarLabel: "Mensagens",
          tabBarBadge: naoLidas > 0 ? naoLidas : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="message"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen name="ProfileTab" component={PerfilStack} />
    </Tab.Navigator>
  );
}
```

## 2️⃣ Criar novo arquivo `navigation/MessageStack.js`

```javascript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TelaConversas from '../screens/TelaConversas';
import TelaMensagens from '../screens/TelaMensagens';
import { Colors } from '../styles/Colors';

const Stack = createNativeStackNavigator();

export default function MessageStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="TelaConversas"
        component={TelaConversas}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TelaMensagens"
        component={TelaMensagens}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
}
```

## 3️⃣ Modificar `screens/TelaFeed.js`

```javascript
// ✅ ADICIONAR IMPORTS NO TOPO
import StoriesCarousel from '../components/StoriesCarousel';
import StoryCriador from '../components/StoryCriador';
import StoryViewer from '../components/StoryViewer';
import { useStories } from '../hooks/useStories';

// ✅ NO COMPONENTE, ADICIONAR ESTADOS
const [storyVisualizando, setStoryVisualizando] = useState(null);
const [modalCriarStory, setModalCriarStory] = useState(false);

// ✅ ADICIONAR HOOK
const { stories, loading: storiesLoading } = useStories(
  auth?.currentUser?.uid,
  userData?.seguindo || []
);

// ✅ NO RETURN JSX, NO TOPO ANTES DO FEED, ADICIONAR:

return (
  <View style={styles.container}>
    {/* STORIES CARROSSEL */}
    <StoriesCarousel
      stories={stories}
      loading={storiesLoading}
      onStoryPress={(storyGroup) => setStoryVisualizando(storyGroup)}
      onCriarStory={() => setModalCriarStory(true)}
      mostrarCriarStory={true}
    />

    {/* STORY VIEWER */}
    <StoryViewer
      storyGroup={storyVisualizando}
      visible={!!storyVisualizando}
      onClose={() => setStoryVisualizando(null)}
      userId={auth?.currentUser?.uid}
    />

    {/* STORY CRIADOR */}
    <StoryCriador
      visible={modalCriarStory}
      onClose={() => setModalCriarStory(false)}
      onCriar={async (dados) => {
        const { criarNovoStory } = useStories(
          auth?.currentUser?.uid,
          userData?.seguindo || []
        );
        await criarNovoStory(
          dados.imagemUri,
          dados.textoStory,
          dados.musica,
          userData
        );
        setModalCriarStory(false);
      }}
      userData={userData}
    />

    {/* SEU FEED EXISTENTE */}
    <FlatList
      data={posts}
      renderItem={/* seu render */}
      // ... resto do seu feed
    />
  </View>
);
```

## 4️⃣ Modificar `screens/PerfilMenu.js` (ou equivalente)

```javascript
// ✅ ADICIONAR OPÇÃO PARA MENSAGENS NO MENU

<TouchableOpacity
  style={styles.opcaoMenu}
  onPress={() => {
    navigation.navigate("MessagesTab", {
      screen: "TelaConversas",
      params: { auth },
    });
  }}
>
  <MaterialCommunityIcons
    name="message"
    size={24}
    color={Colors.primary}
  />
  <Text style={styles.opcaoLabel}>Mensagens</Text>
  <MaterialCommunityIcons
    name="chevron-right"
    size={24}
    color={Colors.textMuted}
  />
</TouchableOpacity>
```

## 5️⃣ Modificar `navigation/AppNavigator.js` (se necessário)

```javascript
// ✅ GARANTIR QUE AUTH ESTÁ SENDO PASSADA
// Se você passa auth via contexto, certifique-se que:

<AuthContext.Provider value={{ currentUser, ...authMethods }}>
  {/* Sua navegação aqui */}
  <MainNavigator auth={authContext} />
</AuthContext.Provider>

// Ou via params:
navigation.navigate("MainNavigator", { auth: firebaseAuth });
```

---

## ✅ CHECKLIST FINAL

- [ ] Criar `navigation/MessageStack.js`
- [ ] Importar MessageStack em MainNavigator
- [ ] Adicionar Tab.Screen para MessagesTab
- [ ] Adicionar imports em TelaFeed
- [ ] Adicionar estados em TelaFeed
- [ ] Adicionar hook useStories em TelaFeed
- [ ] Adicionar StoriesCarousel no JSX
- [ ] Adicionar StoryViewer no JSX
- [ ] Adicionar StoryCriador no JSX
- [ ] Testar se Stories aparecem
- [ ] Testar se pode criar story
- [ ] Testar se pode ver story
- [ ] Testar se abas de mensagens aparecem
- [ ] Testar se pode ver conversas
- [ ] Testar se pode enviar mensagem
- [ ] Testar se mensagens atualizam em tempo real

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### Problema: "Cannot find module 'react-native-vector-icons'"
**Solução**: As icons vêm de `@expo/vector-icons`, já está instalado

### Problema: "auth is undefined"
**Solução**: Certifique-se que está passando `auth` via `route.params` ou contexto

### Problema: "Stories não aparecem"
**Solução**: Verifique se `userData?.seguindo` tem usuários

### Problema: "Mensagens não sincronizam"
**Solução**: Verifique Firestore rules e network

### Problema: "useStories is not a function"
**Solução**: Importou correto? `import { useStories } from '../hooks/useStories'`

### Problema: "Cannot find module './MessageStack'"
**Solução**: Certifique-se que criou o arquivo `navigation/MessageStack.js`

---

## 📞 SUPORTE VISUAL

Se não conseguir integrar, execute:
```bash
# Instalar dependências faltantes (se houver)
npm install

# Limpar cache
npm start -- --clear

# Ou com expo
expo start --clear
```

---

## 🎉 APÓS COMPLETAR

1. ✅ Teste Stories no seu celular
2. ✅ Teste DM no seu celular
3. ✅ Verifique se sincroniza em tempo real
4. ✅ Verifique badges de não lidas
5. ✅ Teste editar/deletar mensagens
6. ✅ Teste auto-delete de stories após 24h
7. ✅ Aproveite as 50+ novas funcionalidades! 🚀

---

**Pronto para ir ao vivo!** ✅
