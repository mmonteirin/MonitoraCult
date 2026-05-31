/**
 * 🎨 TAB NAVIGATOR — MonitoraCult
 *
 * Barra de navegação inferior com:
 *   • Label abaixo do ícone (estilo padrão refinado)
 *   • Indicador animado (bolinha deslizante sob o ícone ativo)
 *   • Ícone ativo escala e sobe levemente ao selecionar (spring)
 *   • Badge de notificação opcional via tabBadges prop
 *   • Suporte total a Light/Dark mode via ThemeContext
 *   • Compatível com iOS safe area (useSafeAreaInsets)
 *   • Sem dependências extras — usa apenas Animated (RN core)
 */

import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

import HomeStack from "./HomeStack";
import BuscaStack from "./BuscaStack";
import FeedStack from "./FeedStack";
import EventoStack from "./EventoStack";
import PerfilStack from "./PerfilStack";

const Tab = createBottomTabNavigator();

// ─── Configuração das abas ────────────────────────────────────────────────────

const TABS = [
  {
    name: "Inicio",
    label: "Início",
    icon: "home-variant",
    iconOutline: "home-variant-outline",
    component: HomeStack,
  },
  {
    name: "Busca",
    label: "Buscar",
    icon: "magnify",
    iconOutline: "magnify",
    component: BuscaStack,
  },
  {
    name: "Feed",
    label: "Social",
    icon: "account-group",
    iconOutline: "account-group-outline",
    component: FeedStack,
  },
  {
    name: "Eventos",
    label: "Eventos",
    icon: "calendar-star",
    iconOutline: "calendar-star-outline",
    component: EventoStack,
  },
  {
    name: "Conta",
    label: "Perfil",
    icon: "account-circle",
    iconOutline: "account-circle-outline",
    component: PerfilStack,
  },
];

// ─── Componente de aba individual ─────────────────────────────────────────────

function TabItem({ tab, isActive, onPress, colors, isDark, user }) {
  // Animação de escala + translação vertical do ícone
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(isActive ? -3 : 0)).current;
  // Opacidade do label
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0.5)).current;
  // Escala do dot indicador
  const dotScale = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.18 : 1,
        useNativeDriver: true,
        tension: 180,
        friction: 10,
      }),
      Animated.spring(translateY, {
        toValue: isActive ? -3 : 0,
        useNativeDriver: true,
        tension: 180,
        friction: 10,
      }),
      Animated.timing(labelOpacity, {
        toValue: isActive ? 1 : isDark ? 0.72 : 0.88,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(dotScale, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        tension: 200,
        friction: 12,
      }),
    ]).start();
  }, [isActive]);

  const handlePress = useCallback(() => {
    if (!isActive) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [isActive, onPress]);

  const inactiveColor = isDark ? colors.textMuted : "#334155";
  const activeBackground = isDark
    ? "rgba(108,92,231,0.18)"
    : "rgba(108,92,231,0.14)";
  const iconColor = isActive ? colors.primary : inactiveColor;
  const iconName = isActive ? tab.icon : tab.iconOutline;
  const isProfileTab = tab.name === "Conta";
  const userPhoto = user?.photoURL;

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
    >
      {/* Fundo suave ao redor do ícone quando ativo */}
      {isActive && (
        <Animated.View
          style={[
            styles.iconBackground,
            {
              backgroundColor: activeBackground,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
      )}

      {/* Ícone animado ou Avatar */}
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { translateY },
          ],
        }}
      >
        {isProfileTab && userPhoto ? (
          <Image
            source={{ uri: userPhoto }}
            style={[
              styles.avatar,
              { borderColor: isActive ? colors.primary : "transparent" },
            ]}
          />
        ) : (
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={iconColor}
          />
        )}
      </Animated.View>

      {/* Label animado */}
      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color: isActive ? colors.primary : inactiveColor,
            fontFamily: isActive ? "PoppinsSemiBold" : "PoppinsRegular",
            opacity: labelOpacity,
          },
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Animated.Text>

      {/* Dot indicador abaixo do label */}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: colors.primary,
            transform: [{ scale: dotScale }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

// ─── Barra de navegação customizada ──────────────────────────────────────────

function MonitoraCultTabBar({ state, navigation, colors, isDark, insets, user }) {
  const barBackground = isDark
    ? "rgba(15,23,42,0.92)"
    : "rgba(255,255,255,0.96)";
  const borderColor = isDark
    ? "rgba(148,163,184,0.16)"
    : "rgba(51,65,85,0.20)";
  const topBorderColor = isDark
    ? "rgba(108,92,231,0.35)"
    : "rgba(108,92,231,0.45)";

  return (
    <View
      style={[
        styles.tabBarWrapper,
        {
          paddingBottom: Math.max(insets.bottom, 4),
          backgroundColor: barBackground,
          borderColor,
        },
      ]}
    >
      {/* Fundo: blur no iOS/macOS, cor sólida com transparência no Android/web */}
      {Platform.OS === "ios" ? (
        <>
          <BlurView
            intensity={isDark ? 50 : 35}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: barBackground },
            ]}
          />
        </>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: barBackground },
          ]}
        />
      )}

      {/* Linha decorativa no topo da barra */}
      <View
        style={[
          styles.topBorder,
          {
            backgroundColor: topBorderColor,
          },
        ]}
      />

      {/* Abas */}
      <View style={styles.tabRow}>
        {TABS.map((tab, index) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={state.index === index}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: state.routes[index].key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(state.routes[index].name);
              }
            }}
            colors={colors}
            isDark={isDark}
            user={user}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Navigator principal ──────────────────────────────────────────────────────

export default function TabNavigator() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const renderTabBar = useCallback(
    (props) => (
      <MonitoraCultTabBar
        {...props}
        colors={colors}
        isDark={isDark}
        insets={insets}
        user={user}
      />
    ),
    [colors, isDark, insets, user]
  );

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
        />
      ))}
    </Tab.Navigator>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Wrapper da barra inteira
  tabBarWrapper: {
    position: "absolute",
    bottom: 10,
    left: 16,
    right: 16,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    // Sombra nativa
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.2,
        shadowRadius: 28,
      },
      android: {
        elevation: 28,
      },
    }),
  },

  // Linha roxa fina no topo
  topBorder: {
    height: 1.5,
    width: "100%",
  },

  // Linha de abas
  tabRow: {
    flexDirection: "row",
    paddingTop: 6,
  },

  // Cada item de aba
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
    minHeight: 48,
    position: "relative",
  },

  // Fundo circular suave ao redor do ícone ativo
  iconBackground: {
    position: "absolute",
    top: 0,
    width: 44,
    height: 36,
    borderRadius: 13,
  },

  // Avatar do usuário
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
  },

  // Label da aba
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.3,
    textAlign: "center",
    fontWeight: "600",
  },

  // Bolinha indicadora
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
});
