import React, { useMemo, useCallback } from "react";
import { View } from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeStack from "./HomeStack";
import BuscaStack from "./BuscaStack";
import FeedStack from "./FeedStack";
import EventoStack from "./EventoStack";
import PerfilStack from "./PerfilStack";

import ExpansivePills from "../components/ExpansivePills";
import { useTheme } from "../context/ThemeContext";
import { useTabBadges } from "../hooks/useTabBadges";

const Tab = createBottomTabNavigator();

/**
 * ═══════════════════════════════════════════════════════════════════
 * TAB NAVIGATOR - MonitoraCult Edition
 * 
 * Navegação principal com componente ExpansivePills reutilizável.
 * Pills expandem ao serem ativadas com animações fluidas.
 * Suporte a notificações (badges) por tab.
 * 
 * Stack: React Native | Expo | ExpansivePills
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Configuração das abas da aplicação
 */
const TAB_CONFIG = [
  {
    name: "Inicio",
    icon: "home-outline",
    iconActive: "home",
    label: "Início",
  },
  {
    name: "Busca",
    icon: "magnify",
    iconActive: "magnify",
    label: "Busca",
  },
  {
    name: "Feed",
    icon: "account-group-outline",
    iconActive: "account-group",
    label: "Feed",
    isCenter: true,
  },
  {
    name: "Ingressos",
    icon: "ticket-confirmation-outline",
    iconActive: "ticket-confirmation",
    label: "Tickets",
  },
  {
    name: "Conta",
    icon: "account-outline",
    iconActive: "account",
    label: "Perfil",
  },
];

export default function TabNavigator() {
  const { colors, isDark } = useTheme();
  const { badges } = useTabBadges({
    // Inicializar com badges vazios
    // Em produção, isso viria de um Context de notificações
  });

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

/**
 * Custom Tab Bar usando ExpansivePills
 */
function CustomTabBar({ state, navigation, badges, colors, isDark }) {
  // Mapear routes para tabs
  const tabs = useMemo(() => {
    return state.routes.map((route) => {
      const tabConfig = TAB_CONFIG.find((t) => t.name === route.name);
      return {
        name: route.name,
        ...tabConfig,
      };
    });
  }, [state.routes]);

  const handleTabPress = useCallback(
    (index, tab) => {
      const route = state.routes[index];
      const isFocused = state.index === index;

      // Navigate if not already on this tab
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [state.index, state.routes, navigation]
  );

  return (
    <ExpansivePills
      tabs={tabs}
      activeIndex={state.index}
      onTabPress={handleTabPress}
      isDark={isDark}
      primaryColor={colors.primary}
      primaryLight={colors.primaryLight}
      primaryDark={colors.primaryDark}
      badges={badges}
      enableHaptics={true}
    />
  );
}