import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { MotiView, MotiText } from "moti";

import HomeStack from "./HomeStack";
import BuscaStack from "./BuscaStack";
import FeedStack from "./FeedStack";
import EventoStack from "./EventoStack";
import PerfilStack from "./PerfilStack";

import { useTheme } from "../context/ThemeContext";

const Tab = createBottomTabNavigator();

/**
 * ═══════════════════════════════════════════════════════════════════
 * EXPANDABLE PILL TAB BAR - MonitoraCult Edition
 * 
 * Componente de navegação premium com pills que se expandem ao serem
 * ativadas, revelando ícone + label. Animações fluidas com Moti.
 * 
 * Stack: React Native | Expo | Moti | LinearGradient | BlurView
 * ═══════════════════════════════════════════════════════════════════
 */

const TAB_META = {
  Inicio: {
    iconFocused: "home",
    iconDefault: "home-outline",
    label: "Início",
  },
  Busca: {
    iconFocused: "magnify",
    iconDefault: "magnify",
    label: "Busca",
  },
  Feed: {
    iconFocused: "account-group",
    iconDefault: "account-group-outline",
    label: "Feed",
    isCenter: true,  // 👈 Botão central elevado
  },
  Eventos: {
    iconFocused: "calendar-star",
    iconDefault: "calendar-star-outline",
    label: "Eventos",
  },
  Conta: {
    iconFocused: "account-circle",
    iconDefault: "account-circle-outline",
    label: "Conta",
  },
};

/**
 * Paleta de cores dinâmica baseada no tema
 * Suporta light/dark mode automaticamente
 */
function getPillTokens(isDark, primary, primaryLight, primaryDark) {
  if (isDark) {
    return {
      // Fundo: superfície escura semi-transparente
      blurTint: "dark",
      blurIntensity: 60,
      bgColor: "rgba(12,16,28,0.80)",
      borderColor: "rgba(255,255,255,0.09)",
      // Sombra
      shadowColor: "#000",
      shadowOpacity: 0.50,
      shadowRadius: 28,
      elevation: 14,
      // Indicador ativo
      pillBg: "rgba(108,92,231,0.20)",
      pillBorder: "rgba(108,92,231,0.35)",
      dotColor: primary,
      // Texto e ícone
      iconActive: primary,
      iconInactive: "rgba(255,255,255,0.35)",
      labelActive: primary,
      labelInactive: "rgba(255,255,255,0.35)",
      // Botão central
      centerRingColor: "rgba(108,92,231,0.40)",
      centerRingWidth: 2,
      // Gradientes
      gradientStart: primaryLight || primary,
      gradientEnd: primaryDark || primary,
    };
  }
  
  return {
    // Fundo: branco fosco limpo
    blurTint: "light",
    blurIntensity: 85,
    bgColor: "rgba(255,255,255,0.92)",
    borderColor: "rgba(108,92,231,0.13)",
    // Sombra suave
    shadowColor: "#6C5CE7",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 14,
    // Indicador ativo
    pillBg: "rgba(108,92,231,0.10)",
    pillBorder: "rgba(108,92,231,0.22)",
    dotColor: primary,
    // Texto e ícone
    iconActive: primary,
    iconInactive: "rgba(30,30,60,0.35)",
    labelActive: primary,
    labelInactive: "rgba(30,30,60,0.38)",
    // Botão central
    centerRingColor: "rgba(108,92,231,0.30)",
    centerRingWidth: 2.5,
    // Gradientes
    gradientStart: primaryLight || primary,
    gradientEnd: primaryDark || primary,
  };
}

/**
 * CUSTOM TAB BAR - Expandable Pills com animações Moti
 * 
 * Comportamento:
 * - Inativo: mostra apenas ícone (compacto)
 * - Ativo: expande e mostra ícone + label (pill)
 * - Animações spring suaves
 * - Indicador visual em topo
 */
function CustomTabBar({ state, navigation }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const t = getPillTokens(isDark, colors.primary, colors.primaryLight, colors.primaryDark);

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          bottom: Platform.OS === "ios" ? insets.bottom + 10 : 16,
          shadowColor: t.shadowColor,
          shadowOpacity: t.shadowOpacity,
          shadowRadius: t.shadowRadius,
          elevation: t.elevation,
        },
      ]}
    >
      {/* ═══ Border Ring Fino ═══ */}
      <View style={[styles.borderRing, { borderColor: t.borderColor }]}>
        {/* ═══ Blur Surface ═══ */}
        <BlurView
          intensity={t.blurIntensity}
          tint={t.blurTint}
          style={[styles.blurSurface, { backgroundColor: t.bgColor }]}
        >
          {/* ═══ Tab Bar Content ═══ */}
          <View style={styles.tabBarContent}>
            {state.routes.map((route, index) => {
              const meta = TAB_META[route.name];
              const isFocused = state.index === index;

              const onPress = () => {
                // Haptic feedback
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(
                    isFocused
                      ? Haptics.ImpactFeedbackStyle.Light
                      : Haptics.ImpactFeedbackStyle.Medium
                  ).catch(() => {});
                }

                // Navigate
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              // ─── BOTÃO CENTRAL ELEVADO ───
              if (meta.isCenter) {
                return (
                  <View key={route.key} style={styles.centerTabItem}>
                    {/* Anel de glow pulsante quando ativo */}
                    <MotiView
                      animate={{
                        scale: isFocused ? [1, 1.15, 1] : 1,
                        opacity: isFocused ? [0.6, 0.3, 0.6] : 0,
                      }}
                      transition={
                        isFocused
                          ? {
                              loop: true,
                              type: "timing",
                              duration: 2000,
                            }
                          : { type: "timing", duration: 200 }
                      }
                      style={[
                        styles.centerGlowRing,
                        {
                          borderColor: t.centerRingColor,
                          borderWidth: t.centerRingWidth,
                        },
                      ]}
                    />

                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={onPress}
                      style={styles.centerTouchable}
                      accessibilityLabel={meta.label}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isFocused }}
                    >
                      {/* Botão com gradiente */}
                      <MotiView
                        animate={{ scale: isFocused ? 1.07 : 1 }}
                        transition={{
                          type: "spring",
                          damping: 12,
                          stiffness: 260,
                        }}
                        style={styles.centerButtonWrapper}
                      >
                        <LinearGradient
                          colors={
                            isFocused
                              ? [t.gradientStart, colors.primary, t.gradientEnd]
                              : [colors.primary, t.gradientEnd]
                          }
                          start={{ x: 0.2, y: 0 }}
                          end={{ x: 0.8, y: 1 }}
                          style={[
                            styles.centerButton,
                            {
                              shadowColor: colors.primary,
                              shadowOpacity: isFocused ? 0.55 : 0.30,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              isFocused
                                ? meta.iconFocused
                                : meta.iconDefault
                            }
                            size={26}
                            color="#FFF"
                          />
                        </LinearGradient>
                      </MotiView>

                      {/* Label */}
                      <MotiView
                        animate={{ opacity: isFocused ? 1 : 0.5 }}
                        transition={{ type: "timing", duration: 180 }}
                      >
                        <Text
                          style={[
                            styles.tabLabel,
                            {
                              color: isFocused
                                ? t.labelActive
                                : t.labelInactive,
                              fontWeight: isFocused ? "700" : "400",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {meta.label}
                        </Text>
                      </MotiView>
                    </TouchableOpacity>
                  </View>
                );
              }

              // ─── TABS NORMAIS (EXPANDABLE PILLS) ───
              return (
                <TouchableOpacity
                  key={route.key}
                  activeOpacity={0.75}
                  onPress={onPress}
                  style={styles.tabItem}
                  accessibilityLabel={meta.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isFocused }}
                >
                  {/* Pílula de fundo com borda sutil */}
                  <MotiView
                    animate={{
                      opacity: isFocused ? 1 : 0,
                      scale: isFocused ? 1 : 0.7,
                    }}
                    transition={{
                      type: "spring",
                      damping: 18,
                      stiffness: 320,
                    }}
                    style={[
                      styles.activePill,
                      {
                        backgroundColor: t.pillBg,
                        borderColor: t.pillBorder,
                      },
                    ]}
                  />

                  {/* Ponto indicador no topo */}
                  <MotiView
                    animate={{
                      opacity: isFocused ? 1 : 0,
                      scaleX: isFocused ? 1 : 0,
                    }}
                    transition={{
                      type: "spring",
                      damping: 20,
                      stiffness: 400,
                    }}
                    style={[
                      styles.activeDot,
                      { backgroundColor: t.dotColor },
                    ]}
                  />

                  {/* Ícone - Escala e muda cor */}
                  <MotiView
                    animate={{
                      scale: isFocused ? 1.13 : 1,
                      translateY: isFocused ? -1 : 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 340,
                      damping: 20,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={
                        isFocused
                          ? meta.iconFocused
                          : meta.iconDefault
                      }
                      size={23}
                      color={
                        isFocused
                          ? t.iconActive
                          : t.iconInactive
                      }
                    />
                  </MotiView>

                  {/* Label - Aparece com slide-up */}
                  <MotiView
                    animate={{
                      opacity: isFocused ? 1 : 0.65,
                      translateY: isFocused ? 0 : 1,
                    }}
                    transition={{
                      type: "spring",
                      damping: 22,
                      stiffness: 300,
                    }}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isFocused
                            ? t.labelActive
                            : t.labelInactive,
                          fontWeight: isFocused ? "700" : "400",
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {meta.label}
                    </Text>
                  </MotiView>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

/**
 * MAIN NAVIGATOR COMPONENT
 */
export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio" component={HomeStack} />
      <Tab.Screen name="Busca" component={BuscaStack} />
      <Tab.Screen name="Feed" component={FeedStack} />
      <Tab.Screen name="Eventos" component={EventoStack} />
      <Tab.Screen name="Conta" component={PerfilStack} />
    </Tab.Navigator>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * ESTILOS
 * ═══════════════════════════════════════════════════════════════════
 */
const styles = StyleSheet.create({
  // ── Container flutuante ──────────────────────────────────────────
  tabBarContainer: {
    position: "absolute",
    left: 14,
    right: 14,
    shadowOffset: { width: 0, height: 10 },
  },

  // Anel de borda fina (fora do overflow:hidden)
  borderRing: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },

  blurSurface: {
    height: 70,
    borderRadius: 28,
    overflow: "hidden",
  },

  tabBarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 4,
  },

  // ── Item normal ──────────────────────────────────────────────────
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 8,
    minHeight: 70,
  },

  activePill: {
    position: "absolute",
    width: 50,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    top: "8%",
  },

  // Traço/ponto indicador no topo da pílula
  activeDot: {
    position: "absolute",
    top: 8,
    width: 18,
    height: 3,
    borderRadius: 2,
  },

  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
    marginTop: 1,
  },

  // ── Botão central elevado ────────────────────────────────────────
  centerTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16,
  },

  centerTouchable: {
    alignItems: "center",
    gap: 2,
  },

  centerButtonWrapper: {
    // espaço para a sombra respirar
    padding: 2,
  },

  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 14,
  },

  // Anel de glow pulsante em torno do botão central
  centerGlowRing: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    top: -4,
  },
});