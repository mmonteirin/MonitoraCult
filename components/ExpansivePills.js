import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";

/**
 * ═══════════════════════════════════════════════════════════════════
 * EXPANDABLE PILLS COMPONENT - MonitoraCult Edition
 * 
 * Componente de navegação premium reutilizável com pills que se
 * expandem ao serem ativadas. Suporta customização completa,
 * badges de notificação e animações fluidas com Moti.
 * 
 * Props:
 *   - tabs: Array de {name, icon, iconActive, label, isCenter, color}
 *   - activeIndex: Índice da aba ativa
 *   - onTabPress: Callback ao pressionar tab
 *   - isDark: Modo escuro (boolean)
 *   - primaryColor: Cor primária do tema
 *   - primaryLight: Cor primária clara
 *   - primaryDark: Cor primária escura
 *   - badges: Objeto {tabName: count} para notificações
 *   - customTabColors: Objeto {tabName: color} para cores customizadas
 * 
 * Stack: React Native | Expo | Moti | LinearGradient | BlurView
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Gera tokens de cores dinâmicos baseado no tema
 */
function getPillTokens(isDark, primary, primaryLight, primaryDark) {
  if (isDark) {
    return {
      blurTint: "dark",
      blurIntensity: 70,
      bgColor: "rgba(10,14,26,0.88)",
      borderColor: "rgba(255,255,255,0.12)",
      shadowColor: "#000",
      shadowOpacity: 0.65,
      shadowRadius: 32,
      elevation: 18,
      pillBg: "rgba(108,92,231,0.25)",
      pillBorder: "rgba(108,92,231,0.45)",
      dotColor: primary,
      iconActive: primary,
      iconInactive: "rgba(255,255,255,0.40)",
      labelActive: primary,
      labelInactive: "rgba(255,255,255,0.40)",
      centerRingColor: "rgba(108,92,231,0.55)",
      centerRingWidth: 2.5,
      gradientStart: primaryLight || primary,
      gradientEnd: primaryDark || primary,
      badgeBg: primary,
      badgeText: "#fff",
    };
  }

  return {
    blurTint: "light",
    blurIntensity: 90,
    bgColor: "rgba(255,255,255,0.95)",
    borderColor: "rgba(108,92,231,0.18)",
    shadowColor: "#6C5CE7",
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 18,
    pillBg: "rgba(108,92,231,0.14)",
    pillBorder: "rgba(108,92,231,0.30)",
    dotColor: primary,
    iconActive: primary,
    iconInactive: "rgba(30,30,60,0.40)",
    labelActive: primary,
    labelInactive: "rgba(30,30,60,0.45)",
    centerRingColor: "rgba(108,92,231,0.40)",
    centerRingWidth: 3,
    gradientStart: primaryLight || primary,
    gradientEnd: primaryDark || primary,
    badgeBg: primary,
    badgeText: "#fff",
  };
}

/**
 * Componente individual de Tab expansível
 */
function ExpandablePillTab({
  tab,
  isFocused,
  onPress,
  tokens,
  customColor,
  badge,
}) {
  const tabColor = customColor || tokens.iconActive;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={styles.tabItem}
      accessibilityLabel={tab.label}
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
            backgroundColor: `${tabColor}20`,
            borderColor: `${tabColor}59`,
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
          { backgroundColor: tabColor },
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
          name={isFocused ? tab.iconActive : tab.icon}
          size={25}
          color={isFocused ? tabColor : tokens.iconInactive}
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
              color: isFocused ? tabColor : tokens.labelInactive,
              fontWeight: isFocused ? "700" : "400",
            },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </MotiView>

      {/* Badge de notificação */}
      {badge > 0 && (
        <MotiView
          animate={{
            scale: 1,
          }}
          transition={{
            type: "spring",
            damping: 10,
          }}
          style={[
            styles.badge,
            {
              backgroundColor: tokens.badgeBg,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: tokens.badgeText,
              },
            ]}
          >
            {badge > 99 ? "99+" : badge}
          </Text>
        </MotiView>
      )}
    </TouchableOpacity>
  );
}

/**
 * Componente do botão central elevado (para abas especiais)
 */
function CenterPillTab({
  tab,
  isFocused,
  onPress,
  tokens,
  customColor,
  badge,
}) {
  const tabColor = customColor || tokens.iconActive;

  return (
    <View style={styles.centerTabItem}>
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
            borderColor: `${tabColor}66`,
            borderWidth: tokens.centerRingWidth,
          },
        ]}
      />

      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={styles.centerTouchable}
        accessibilityLabel={tab.label}
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
                ? [tokens.gradientStart, tabColor, tokens.gradientEnd]
                : [tabColor, tokens.gradientEnd]
            }
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[
              styles.centerButton,
              {
                shadowColor: tabColor,
                shadowOpacity: isFocused ? 0.55 : 0.30,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isFocused ? tab.iconActive : tab.icon}
              size={28}
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
                color: isFocused ? tabColor : tokens.labelInactive,
                fontWeight: isFocused ? "700" : "400",
              },
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </Text>
        </MotiView>

        {/* Badge */}
        {badge > 0 && (
          <MotiView
            animate={{
              scale: 1,
            }}
            transition={{
              type: "spring",
              damping: 10,
            }}
            style={[
              styles.centerBadge,
              {
                backgroundColor: tokens.badgeBg,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: tokens.badgeText,
                },
              ]}
            >
              {badge > 99 ? "99+" : badge}
            </Text>
          </MotiView>
        )}
      </TouchableOpacity>
    </View>
  );
}

/**
 * MAIN COMPONENT - ExpansivePills
 */
const ExpansivePills = React.forwardRef(
  (
    {
      tabs,
      activeIndex = 0,
      onTabPress,
      isDark = true,
      primaryColor = "#6C5CE7",
      primaryLight,
      primaryDark,
      badges = {},
      customTabColors = {},
      enableHaptics = true,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const tokens = useMemo(
      () =>
        getPillTokens(
          isDark,
          primaryColor,
          primaryLight,
          primaryDark
        ),
      [isDark, primaryColor, primaryLight, primaryDark]
    );

    const handleTabPress = (index) => {
      if (enableHaptics && Platform.OS !== "web") {
        Haptics.impactAsync(
          activeIndex === index
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Medium
        ).catch(() => {});
      }

      if (onTabPress) {
        onTabPress(index, tabs[index]);
      }
    };

    return (
      <View
        ref={ref}
        style={[
          styles.container,
          {
            bottom: Platform.OS === "ios" ? insets.bottom + 12 : 18,
            shadowColor: tokens.shadowColor,
            shadowOpacity: tokens.shadowOpacity,
            shadowRadius: tokens.shadowRadius,
            elevation: tokens.elevation,
          },
        ]}
      >
        {/* Border Ring */}
        <View style={[styles.borderRing, { borderColor: tokens.borderColor }]}>
          {/* Blur Surface */}
          <BlurView
            intensity={tokens.blurIntensity}
            tint={tokens.blurTint}
            style={[styles.blurSurface, { backgroundColor: tokens.bgColor }]}
          >
            {/* Tab Bar Content */}
            <View style={styles.tabBarContent}>
              {tabs.map((tab, index) => {
                const isFocused = activeIndex === index;
                const badge = badges[tab.name] || 0;
                const customColor = customTabColors[tab.name];

                const onPress = () => handleTabPress(index);

                if (tab.isCenter) {
                  return (
                    <CenterPillTab
                      key={tab.name}
                      tab={tab}
                      isFocused={isFocused}
                      onPress={onPress}
                      tokens={tokens}
                      customColor={customColor}
                      badge={badge}
                    />
                  );
                }

                return (
                  <ExpandablePillTab
                    key={tab.name}
                    tab={tab}
                    isFocused={isFocused}
                    onPress={onPress}
                    tokens={tokens}
                    customColor={customColor}
                    badge={badge}
                  />
                );
              })}
            </View>
          </BlurView>
        </View>
      </View>
    );
  }
);

ExpansivePills.displayName = "ExpansivePills";

/**
 * ═══════════════════════════════════════════════════════════════════
 * ESTILOS
 * ═══════════════════════════════════════════════════════════════════
 */
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 14,
    right: 14,
    shadowOffset: { width: 0, height: 10 },
  },

  borderRing: {
    borderRadius: 32,
    borderWidth: 1.5,
    overflow: "hidden",
  },

  blurSurface: {
    height: 78,
    borderRadius: 32,
    overflow: "hidden",
  },

  tabBarContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 4,
  },

  /* ── Tab Normal ─────────────────────────────────────────────────── */
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 10,
    minHeight: 78,
  },

  activePill: {
    position: "absolute",
    width: 54,
    height: 50,
    borderRadius: 18,
    borderWidth: 1.2,
    top: "10%",
  },

  activeDot: {
    position: "absolute",
    top: 10,
    width: 22,
    height: 3.5,
    borderRadius: 2.5,
  },

  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
    marginTop: 2,
    fontWeight: "500",
  },

  badge: {
    position: "absolute",
    top: 2,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* ── Botão Central ──────────────────────────────────────────────── */
  centerTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },

  centerTouchable: {
    alignItems: "center",
    gap: 3,
  },

  centerButtonWrapper: {
    padding: 3,
  },

  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 18,
  },

  centerGlowRing: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    top: -5,
  },

  centerBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
});

export default ExpansivePills;
