# 🎨 ExpansivePills - Componente de Navegação Premium

Componente de navegação bottom-tab com pills que se expandem ao serem ativadas. Inclui animações fluidas, suporte a badges de notificação e personalização completa.

## 📋 Características

- ✨ **Pills Expansíveis** - Expandem ao serem ativadas, mostrando ícone + label
- 🎬 **Animações Fluidas** - Powered by Moti com springs naturais
- 🏷️ **Badges de Notificação** - Suporte nativo para contadores de notificação
- 🎨 **Temas Personalizáveis** - Light/Dark mode automático
- 🎯 **Botão Central Elevado** - Aba especial com glow pulsante
- ♿ **Acessibilidade** - Labels e roles ARIA completos
- 📱 **Responsive** - Funciona em iOS, Android e Web
- 🔊 **Haptic Feedback** - Vibrações ao pressionar tabs

## 🚀 Uso Rápido

### Componente ExpansivePills Direto

```jsx
import ExpansivePills from "../components/ExpansivePills";
import { useTheme } from "../context/ThemeContext";

export default function MyNavigator() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      name: "Home",
      icon: "home-outline",
      iconActive: "home",
      label: "Home",
    },
    {
      name: "Messages",
      icon: "message-outline",
      iconActive: "message",
      label: "Messages",
    },
    {
      name: "Post",
      icon: "plus",
      iconActive: "plus",
      label: "Post",
      isCenter: true, // 👈 Botão central elevado
    },
    {
      name: "Profile",
      icon: "account-outline",
      iconActive: "account",
      label: "Profile",
    },
  ];

  return (
    <ExpansivePills
      tabs={tabs}
      activeIndex={activeTab}
      onTabPress={(index, tab) => {
        setActiveTab(index);
        // Navegar para a aba
      }}
      isDark={isDark}
      primaryColor={colors.primary}
      primaryLight={colors.primaryLight}
      primaryDark={colors.primaryDark}
      badges={{
        Messages: 3, // Mostra badge com número 3
        Post: 0,
      }}
      enableHaptics={true}
    />
  );
}
```

### Integrado com React Navigation

O `TabNavigator.js` já está configurado para usar o `ExpansivePills` automaticamente:

```jsx
// navigation/TabNavigator.js
import TabNavigator from "./navigation/TabNavigator";

// Usar normalmente com React Navigation
<NavigationContainer>
  <TabNavigator />
</NavigationContainer>
```

## 🎯 Props do ExpansivePills

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `tabs` | `Array<Tab>` | - | Array de abas (obrigatório) |
| `activeIndex` | `Number` | `0` | Índice da aba ativa |
| `onTabPress` | `Function` | - | Callback ao pressionar aba |
| `isDark` | `Boolean` | `true` | Modo escuro |
| `primaryColor` | `String` | `"#6C5CE7"` | Cor primária |
| `primaryLight` | `String` | - | Cor primária clara |
| `primaryDark` | `String` | - | Cor primária escura |
| `badges` | `Object` | `{}` | Badges por aba (`{tabName: count}`) |
| `customTabColors` | `Object` | `{}` | Cores customizadas por aba |
| `enableHaptics` | `Boolean` | `true` | Habilitar vibrações |

## 📱 Estrutura da Tab

```typescript
interface Tab {
  name: string;           // Identificador único
  icon: string;           // Ícone inativo (Material Icons)
  iconActive: string;     // Ícone ativo
  label: string;          // Texto exibido
  isCenter?: boolean;     // True para botão central elevado
}
```

## 🏷️ Gerenciar Badges com useTabBadges Hook

Hook customizado para gerenciar badges facilmente:

```jsx
import { useTabBadges } from "../hooks/useTabBadges";

export default function MyScreen() {
  const {
    badges,
    setBadge,
    incrementBadge,
    decrementBadge,
    clearBadge,
    setTemporaryBadge,
  } = useTabBadges();

  // Adicionar notificação
  const handleNewMessage = () => {
    incrementBadge("Messages");
  };

  // Badge temporário (desaparece em 3s)
  const handleNotification = () => {
    setTemporaryBadge("Feed", 1, 3000);
  };

  // Limpar notificação quando entrar na aba
  const handleMessagesPress = () => {
    clearBadge("Messages");
  };

  return (
    <>
      <Button onPress={handleNewMessage}>Nova Mensagem</Button>
      <Button onPress={handleNotification}>Notificação Temporária</Button>
      <Text>Messages: {badges.Messages || 0}</Text>
    </>
  );
}
```

## 🎨 API do useTabBadges

```typescript
interface UseTabBadgesReturn {
  badges: Object;                                    // Objeto com badges atuais
  setBadge: (tabName: string, count: number) => void;
  updateBadges: (newBadges: Object) => void;         // Atualizar múltiplos
  incrementBadge: (tabName: string, amount?: number) => void;
  decrementBadge: (tabName: string, amount?: number) => void;
  clearBadge: (tabName: string) => void;
  clearAllBadges: () => void;
  setTemporaryBadge: (tabName: string, count: number, durationMs?: number) => void;
  getBadge: (tabName: string) => number;
  hasBadge: (tabName: string) => boolean;
}
```

## 🌈 Cores Customizadas por Aba

```jsx
<ExpansivePills
  tabs={tabs}
  activeIndex={activeTab}
  onTabPress={handleTabPress}
  isDark={isDark}
  primaryColor={colors.primary}
  customTabColors={{
    Home: "#3498db",      // Azul
    Messages: "#e74c3c",  // Vermelho
    Profile: "#9b59b6",   // Roxo
  }}
/>
```

## 🎬 Animações

O componente usa Moti para animações suaves:

- **Pills**: Spring com damping=18, stiffness=320
- **Ícones**: Scale animado ao ativar
- **Labels**: Fade-in com slide-up
- **Botão Central**: Scale + glow pulsante
- **Badges**: Pulse suave ao aparecer

## 🔌 Integração com React Navigation

```jsx
// No seu TabNavigator.js customizado:
import ExpansivePills from "../components/ExpansivePills";

function MyCustomTabBar({ state, navigation }) {
  return (
    <ExpansivePills
      tabs={mapRoutesToTabs(state.routes)}
      activeIndex={state.index}
      onTabPress={(index) => {
        navigation.navigate(state.routes[index].name);
      }}
      // ... outras props
    />
  );
}

// Usar com Tab.Navigator
<Tab.Navigator tabBar={(props) => <MyCustomTabBar {...props} />}>
  {/* Tab.Screen components */}
</Tab.Navigator>
```

## 📱 Responsividade

O componente é totalmente responsivo:

- **Padding**: Ajusta automaticamente com insets de safe-area (iOS notch)
- **Tamanho**: Espalhado uniformemente entre as abas
- **Temas**: Detecta automaticamente light/dark mode
- **Plataformas**: Funciona em iOS, Android e Web

## 🎯 Exemplo Completo: TabNavigator

O `navigation/TabNavigator.js` já implementa o `ExpansivePills` com:

```jsx
// Usando o novo componente:
<Tab.Navigator
  tabBar={(props) => (
    <CustomTabBar
      {...props}
      badges={mockBadges}
      colors={colors}
      isDark={isDark}
    />
  )}
  screenOptions={{ headerShown: false }}
>
  <Tab.Screen name="Inicio" component={HomeStack} />
  <Tab.Screen name="Busca" component={BuscaStack} />
  <Tab.Screen name="Feed" component={FeedStack} />
  <Tab.Screen name="Ingressos" component={EventoStack} />
  <Tab.Screen name="Conta" component={PerfilStack} />
</Tab.Navigator>
```

## 🐛 Troubleshooting

### Pills não aparecem
- Verificar se `isDark` está correto
- Confirmar que `tabs` array não está vazio
- Validar que `activeIndex` é entre 0 e tabs.length - 1

### Badges não aparecem
- Confirmar estrutura: `{ tabName: count }`
- Usar nomes exatos das abas
- Count deve ser > 0

### Animações lentas
- Reduzir `damping` para animações mais rápidas
- Aumentar `stiffness` para menos bounce
- Verificar performance do device

## 📚 Referências

- [Moti Documentation](https://moti.fyi/)
- [React Navigation](https://reactnavigation.org/)
- [Material Community Icons](https://materialdesignicons.com/)
- [Expo BlurView](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [LinearGradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)

## 📝 Notas de Desenvolvimento

- Componente é React.forwardRef para acesso ao ref se necessário
- Usa `useMemo` para otimizar recálculos de cores
- Implementa `useCallback` para callbacks otimizados
- Suporta acessibilidade com roles e labels ARIA
- Platform.OS específico para iOS/Android/Web

---

**Última atualização**: 2026-05-26
