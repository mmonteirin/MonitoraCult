/**
 * ═══════════════════════════════════════════════════════════════════
 * EXEMPLO DE INTEGRAÇÃO - ExpansivePills + Notificações
 * 
 * Este arquivo mostra como integrar o componente ExpansivePills
 * com um Context de notificações para gerenciar badges em tempo real.
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// 1️⃣ CRIAR UM CONTEXT DE NOTIFICAÇÕES (NotificationBadgeContext.js)
// ─────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationBadgeContext = createContext();

export function NotificationBadgeProvider({ children }) {
  const [badges, setBadges] = useState({
    Ingressos: 0,
    Feed: 0,
    Messages: 0,
  });

  const incrementBadge = useCallback((tab, amount = 1) => {
    setBadges((prev) => ({
      ...prev,
      [tab]: (prev[tab] || 0) + amount,
    }));
  }, []);

  const decrementBadge = useCallback((tab, amount = 1) => {
    setBadges((prev) => ({
      ...prev,
      [tab]: Math.max(0, (prev[tab] || 0) - amount),
    }));
  }, []);

  const setBadge = useCallback((tab, count) => {
    setBadges((prev) => ({
      ...prev,
      [tab]: count,
    }));
  }, []);

  const clearBadge = useCallback((tab) => {
    setBadges((prev) => ({
      ...prev,
      [tab]: 0,
    }));
  }, []);

  const value = {
    badges,
    incrementBadge,
    decrementBadge,
    setBadge,
    clearBadge,
  };

  return (
    <NotificationBadgeContext.Provider value={value}>
      {children}
    </NotificationBadgeContext.Provider>
  );
}

export function useNotificationBadges() {
  const context = useContext(NotificationBadgeContext);
  if (!context) {
    throw new Error(
      "useNotificationBadges deve ser usado dentro de NotificationBadgeProvider"
    );
  }
  return context;
}

// ─────────────────────────────────────────────────────────────────
// 2️⃣ USAR NO TABNAVIGATOR.JS
// ─────────────────────────────────────────────────────────────────

/*
import TabNavigator from "./TabNavigator";
import { NotificationBadgeProvider } from "../context/NotificationBadgeContext";

export default function MainNavigator() {
  return (
    <NotificationBadgeProvider>
      <TabNavigator />
    </NotificationBadgeProvider>
  );
}
*/

// ─────────────────────────────────────────────────────────────────
// 3️⃣ ATUALIZAR O TabNavigator.js
// ─────────────────────────────────────────────────────────────────

/*
// Adicionar import
import { useNotificationBadges } from "../context/NotificationBadgeContext";

// Dentro da função TabNavigator
export default function TabNavigator() {
  const { colors, isDark } = useTheme();
  const { badges } = useNotificationBadges(); // ← Usar context

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          badges={badges}
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
  );
}
*/

// ─────────────────────────────────────────────────────────────────
// 4️⃣ USAR O CONTEXT EM QUALQUER TELA
// ─────────────────────────────────────────────────────────────────

/*
import { useNotificationBadges } from "../context/NotificationBadgeContext";

export default function MinhaTelaDeIngressos() {
  const { incrementBadge, clearBadge } = useNotificationBadges();

  // Quando um novo ingresso é comprado
  const handleComprarIngresso = async () => {
    // ... lógica de compra
    incrementBadge("Ingressos", 1); // Adiciona badge
  };

  // Quando entra na aba de ingressos
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      clearBadge("Ingressos"); // Remove badge ao entrar na aba
    });
    return unsubscribe;
  }, [navigation]);

  return (
    // ... componentes
  );
}
*/

// ─────────────────────────────────────────────────────────────────
// 5️⃣ EXEMPLO COMPLETO: FeedStack COM BADGE
// ─────────────────────────────────────────────────────────────────

/*
import { useNotificationBadges } from "../context/NotificationBadgeContext";

export default function FeedScreen() {
  const navigation = useNavigation();
  const { incrementBadge, clearBadge } = useNotificationBadges();
  const [feed, setFeed] = useState([]);

  // Simular notificações chegando em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular nova postagem no feed
      incrementBadge("Feed", 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [incrementBadge]);

  // Limpar badge quando entra na aba
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      clearBadge("Feed");
    });
    return unsubscribe;
  }, [navigation, clearBadge]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        {feed.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </View>
  );
}
*/

// ─────────────────────────────────────────────────────────────────
// 6️⃣ INTEGRAÇÃO COM FIREBASE MESSAGING (PUSH NOTIFICATIONS)
// ─────────────────────────────────────────────────────────────────

/*
import messaging from "@react-native-firebase/messaging";
import { useNotificationBadges } from "../context/NotificationBadgeContext";

export function initializePushNotifications() {
  const { incrementBadge } = useNotificationBadges();

  // Configurar handler para mensagens em primeiro plano
  messaging().onMessage(async (remoteMessage) => {
    if (remoteMessage.data?.type === "ticket") {
      incrementBadge("Ingressos", 1);
    } else if (remoteMessage.data?.type === "feed") {
      incrementBadge("Feed", 1);
    }
  });

  // Configurar handler para mensagens em segundo plano
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // Badge será mostrado quando o app abrir
    if (remoteMessage.data?.type === "ticket") {
      incrementBadge("Ingressos", 1);
    }
  });
}
*/

// ─────────────────────────────────────────────────────────────────
// 7️⃣ EXEMPLO COM AsyncStorage (PERSISTIR BADGES)
// ─────────────────────────────────────────────────────────────────

/*
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotificationBadges } from "../context/NotificationBadgeContext";

// Salvar badges quando mudam
export async function saveBadges(badges) {
  try {
    await AsyncStorage.setItem("tabs_badges", JSON.stringify(badges));
  } catch (error) {
    console.error("Erro ao salvar badges:", error);
  }
}

// Carregar badges ao iniciar
export async function loadBadges() {
  try {
    const saved = await AsyncStorage.getItem("tabs_badges");
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error("Erro ao carregar badges:", error);
    return {};
  }
}

// No Provider:
export function NotificationBadgeProvider({ children }) {
  const [badges, setBadges] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges().then((saved) => {
      setBadges(saved);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      saveBadges(badges);
    }
  }, [badges, loading]);

  // ... resto do código
}
*/

// ─────────────────────────────────────────────────────────────────
// 8️⃣ TESTAR O COMPONENTE NO FIGMA/STORYBOOK
// ─────────────────────────────────────────────────────────────────

/*
import ExpansivePills from "../components/ExpansivePills";

export default function ExpansivePillsStory() {
  const [activeIndex, setActiveIndex] = useState(0);

  const tabs = [
    { name: "Inicio", icon: "home-outline", iconActive: "home", label: "Início" },
    { name: "Busca", icon: "magnify", iconActive: "magnify", label: "Busca" },
    { name: "Feed", icon: "account-group-outline", iconActive: "account-group", label: "Feed", isCenter: true },
    { name: "Ingressos", icon: "ticket-confirmation-outline", iconActive: "ticket-confirmation", label: "Tickets" },
    { name: "Conta", icon: "account-outline", iconActive: "account", label: "Perfil" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F14" }}>
      <ExpansivePills
        tabs={tabs}
        activeIndex={activeIndex}
        onTabPress={(index) => setActiveIndex(index)}
        isDark={true}
        primaryColor="#6C5CE7"
        badges={{
          Ingressos: 3,
          Feed: 2,
        }}
      />
    </View>
  );
}
*/

export default {
  // Este arquivo é apenas para documentação/exemplos
};
