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
      blurIntensity: 60,
      bgColor: "rgba(12,16,28,0.80)",
      borderColor: "rgba(255,255,255,0.09)",
      shadowColor: "#000",
      shadowOpacity: 0.50,
      shadowRadius: 28,
      elevation: 14,
      pillBg: "rgba(108,92,231,0.20)",
      pillBorder: "rgba(108,92,231,0.35)",
      dotColor: primary,
      iconActive: primary,
      iconInactive: "rgba(255,255,255,0.35)",
      labelActive: primary,
      labelInactive: "rgba(255,255,255,0.35)",
      centerRingColor: "rgba(108,92,231,0.40)",
      centerRingWidth: 2,
      gradientStart: primaryLight || primary,
      gradientEnd: primaryDark || primary,
      badgeBg: primary,
      badgeText: "#fff",
    };
  }

  return {
    blurTint: "light",
    blurIntensity: 85,
    bgColor: "rgba(255,255,255,0.92)",
    borderColor: "rgba(108,92,231,0.13)",
    shadowColor: "#6C5CE7",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 14,
    pillBg: "rgba(108,92,231,0.10)",
    pillBorder: "rgba(108,92,231,0.22)",
    dotColor: primary,
    iconActive: primary,
    iconInactive: "rgba(30,30,60,0.35)",
    labelActive: primary,
    labelInactive: "rgba(30,30,60,0.38)",
    centerRingColor: "rgba(108,92,231,0.30)",
    centerRingWidth: 2.5,
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
          size={23}
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
            bottom: Platform.OS === "ios" ? insets.bottom + 10 : 16,
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

  /* ── Tab Normal ─────────────────────────────────────────────────── */
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
    marginTop: -16,
  },

  centerTouchable: {
    alignItems: "center",
    gap: 2,
  },

  centerButtonWrapper: {
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

  centerGlowRing: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    top: -4,
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
