import React, { useState, useCallback, useMemo } from "react";

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ImageBackground,
  Modal,
  ActivityIndicator,
  Pressable,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { MotiView } from "moti";

import { useAuth } from "../context/AuthContext";

import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

export default function AdmMenu() {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = useMemo(() => isDark ? "dark" : "light", [isDark]);
  const overlayColors = useMemo(() => (
    isDark
      ? [
          "rgba(3,7,18,0.94)",
          "rgba(15,23,42,0.90)",
          "rgba(3,7,18,0.96)",
        ]
      : [
          "rgba(248,250,252,0.98)",
          "rgba(241,245,249,0.96)",
          "rgba(226,232,240,0.98)",
        ]
  ), [isDark]);
  const badgeIconColor = isDark ? colors.onPrimary : colors.primary;
  const navigation = useNavigation();

  const {
    logout,
    nome,
    foto,
  } = useAuth();

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const [loadingLogout, setLoadingLogout] =
    useState(false);

  const goToAdmin = useCallback((screen) => {
    navigation.navigate(screen);
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    try {
      setLoadingLogout(true);

      await logout();

    } catch (error) {
      console.log(error);

    } finally {
      setLoadingLogout(false);
      setShowLogoutModal(false);
    }
  }, [logout]);

  const menuItems = useMemo(() => [
    {
      icon: "plus-circle",
      label: "Criar Evento",
      subtitle: "Novo evento",
      gradient: ["#7C3AED", "#5B21B6"],
      screen: "CriarEvento",
    },
    {
      icon: "calendar",
      label: "Meus Eventos",
      subtitle: "Gerencie",
      gradient: ["#2563EB", "#1D4ED8"],
      screen: "AdmEvento",
    },
    {
      icon: "chart-bar",
      label: "Métricas",
      subtitle: "Analytics",
      gradient: ["#059669", "#047857"],
      screen: "Metricas",
    },
    {
      icon: "headset",
      label: "Atendimento",
      subtitle: "Fila de suporte",
      gradient: ["#EA580C", "#C2410C"],
      screen: "AdmSuporte",
    },
  ], []);

  const handleMenuPress = useCallback((screen) => {
    goToAdmin(screen);
  }, [goToAdmin]);

  return (
    <ImageBackground
      source={require("../assets/fundoTelaLogin.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      {/* OVERLAY */}
      <LinearGradient
        colors={overlayColors}
        style={styles.overlay}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              navigation.goBack()
            }
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
          >
            Área do Organizador
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* PERFIL */}
          <MotiView
            from={{
              opacity: 0,
              translateY: -20,
            }}
            animate={{
              opacity: 1,
              translateY: 0,
            }}
            transition={{
              type: "timing",
              duration: 700,
            }}
          >
            <BlurView
              intensity={60}
              tint={blurTint}
              style={styles.profileCard}
            >
              {/* TOPO */}
              <View
                style={
                  styles.profileRow
                }
              >
                {/* FOTO */}
                <LinearGradient
                  colors={[
                    colors.primary,
                    "#7B5CFF",
                  ]}
                  style={
                    styles.avatarBorder
                  }
                >
                  <Image
                    source={{
                      uri:
                        foto ||
                        "https://i.pravatar.cc/150",
                    }}
                    style={
                      styles.avatar
                    }
                  />
                </LinearGradient>

                {/* INFOS */}
                <View
                  style={
                    styles.profileInfo
                  }
                >
                  <Text
                    style={
                      styles.name
                    }
                    numberOfLines={1}
                  >
                    {nome ||
                      "Organizador"}
                  </Text>

                  <Text
                    style={
                      styles.subtitle
                    }
                  >
                    Gerencie seus eventos
                    e métricas
                  </Text>

                  {/* BADGES */}
                  <View
                    style={
                      styles.badges
                    }
                  >
                    <View
                      style={
                        styles.badge
                      }
                    >
                      <MaterialCommunityIcons
                        name="shield-check"
                        size={14}
                        color={badgeIconColor}
                      />

                      <Text
                        style={
                          styles.badgeText
                        }
                      >
                        Verificado
                      </Text>
                    </View>

                    <View
                      style={
                        styles.badge
                      }
                    >
                      <MaterialCommunityIcons
                        name="star"
                        size={14}
                        color={badgeIconColor}
                      />

                      <Text
                        style={
                          styles.badgeText
                        }
                      >
                        Organizador
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </BlurView>
          </MotiView>

          {/* DASHBOARD */}
          <Text style={styles.section}>
            Painel Principal
          </Text>

          <View style={styles.grid}>
            {menuItems.map((item, index) => (
              <MenuCard
                key={item.screen}
                icon={item.icon}
                label={item.label}
                subtitle={item.subtitle}
                styles={styles}
                colors={colors}
                gradient={item.gradient}
                onPress={() => handleMenuPress(item.screen)}
                index={index}
              />
            ))}
          </View>

          {/* SAIR */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              setShowLogoutModal(true)
            }
          >
            <LinearGradient
              colors={[
                "#DC2626",
                "#991B1B",
              ]}
              style={
                styles.logoutButton
              }
            >
              <MaterialCommunityIcons
                name="logout"
                size={22}
                color="#FFF"
              />

              <Text
                style={
                  styles.logoutText
                }
              >
                Sair da Conta
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* MODAL LOGOUT */}
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <BlurView
              intensity={50}
              tint={blurTint}
              style={styles.modalCard}
            >
              <LinearGradient
                colors={[
                  "rgba(239,68,68,0.15)",
                  "rgba(127,29,29,0.04)",
                ]}
                style={
                  styles.modalGradient
                }
              >
                <View
                  style={
                    styles.modalIcon
                  }
                >
                  <MaterialCommunityIcons
                    name="logout"
                    size={34}
                    color="#EF4444"
                  />
                </View>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Sair da conta?
                </Text>

                <Text
                  style={
                    styles.modalText
                  }
                >
                  Deseja realmente
                  encerrar sua sessão?
                </Text>

                <View
                  style={
                    styles.modalButtons
                  }
                >
                  <Pressable
                    style={
                      styles.cancelBtn
                    }
                    onPress={() =>
                      setShowLogoutModal(
                        false
                      )
                    }
                  >
                    <Text
                      style={
                        styles.cancelText
                      }
                    >
                      Cancelar
                    </Text>
                  </Pressable>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={
                      styles.confirmBtn
                    }
                    onPress={
                      handleLogout
                    }
                    disabled={
                      loadingLogout
                    }
                  >
                    <LinearGradient
                      colors={[
                        "#EF4444",
                        "#DC2626",
                      ]}
                      style={
                        styles.confirmGradient
                      }
                    >
                      {loadingLogout ? (
                        <ActivityIndicator
                          size="small"
                          color="#FFF"
                        />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="logout"
                            size={18}
                            color="#FFF"
                          />

                          <Text
                            style={
                              styles.confirmText
                            }
                          >
                            Sair
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </Modal>
      </LinearGradient>
    </ImageBackground>
  );
}

/* CARD - Acesso Rápido */
const MenuCard = React.memo(function MenuCard({
  icon,
  label,
  subtitle,
  onPress,
  gradient,
  index,
  styles,
  colors,
}) {
  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        type: "timing",
        duration: 500,
        delay: index * 60,
      }}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        style={styles.acaoCard}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={[styles.acaoIconCircle, { backgroundColor: gradient[0] + "20" }]}>
          <MaterialCommunityIcons
            name={icon}
            size={22}
            color={gradient[0]}
          />
        </View>
        <View style={styles.acaoTextContainer}>
          <Text style={styles.acaoLabel}>
            {label}
          </Text>
          <Text style={styles.acaoSubtitle}>
            {subtitle}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={colors.textMuted}
          style={styles.acaoChevron}
        />
      </TouchableOpacity>
    </MotiView>
  );
});

/* STYLES */
function createThemedScreenStyles(c, isDark) {
  return StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",

    paddingTop: 58,
    paddingHorizontal: 20,

    marginBottom: 10,
  },

  backButton: {
    width: 44,
    height: 44,

    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor:
      isDark ? "rgba(17,24,39,0.86)" : "rgba(255,255,255,0.94)",

    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(15,23,42,0.18)",
  },

  headerTitle: {
    color: c.textPrimary,

    fontSize: 21,
    fontWeight: "bold",

    marginLeft: 16,
  },

  /* CONTENT */
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  /* PROFILE */
  profileCard: {
    overflow: "hidden",

    borderRadius: 30,

    padding: 20,

    marginBottom: 28,

    borderWidth: 1,

    borderColor:
      isDark ? "rgba(255,255,255,0.20)" : "rgba(15,23,42,0.14)",

    backgroundColor:
      isDark ? "rgba(17,24,39,0.88)" : "rgba(255,255,255,0.94)",

    shadowColor: c.shadow,
    shadowOpacity: isDark ? 0.28 : 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarBorder: {
    padding: 4,

    borderRadius: 60,
  },

  avatar: {
    width: 90,
    height: 90,

    borderRadius: 50,

    backgroundColor: c.surface,
  },

  profileInfo: {
    flex: 1,

    marginLeft: 16,
  },

  name: {
    color: c.textPrimary,

    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: c.textSecondary,

    marginTop: 6,

    lineHeight: 20,

    fontSize: 13,
  },

  /* BADGES */
  badges: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,

    marginTop: 14,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",

    gap: 6,

    backgroundColor:
      isDark ? "rgba(255,255,255,0.14)" : c.primarySoft,

    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.20)" : "rgba(108,92,231,0.28)",

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 30,
  },

  badgeText: {
    color: isDark ? c.textPrimary : c.primaryDark,

    fontSize: 12,

    fontWeight: "600",
  },

  /* SECTION */
  section: {
    color: c.textPrimary,

    fontSize: 18,
    fontWeight: "bold",

    marginBottom: 16,
  },

  /* GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent:
      "space-between",
  },

  /* CARD - Acesso Rápido */
  cardWrapper: {
    width: "48%",

    marginBottom: 12,
  },

  acaoCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    minHeight: 74,
    backgroundColor: isDark ? "rgba(17,24,39,0.94)" : "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.14)",
    gap: 10,
    shadowColor: c.shadow,
    shadowOpacity: isDark ? 0.20 : 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  acaoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  acaoTextContainer: {
    flex: 1,
  },

  acaoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: c.textPrimary,
  },

  acaoSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: c.textSecondary,
    marginTop: 2,
  },

  acaoChevron: {
    opacity: isDark ? 0.75 : 0.62,
  },

  /* LOGOUT */
  logoutButton: {
    marginTop: 20,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 10,

    paddingVertical: 16,

    borderRadius: 16,

    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(127,29,29,0.26)",

    shadowColor: "#991B1B",
    shadowOpacity: isDark ? 0.26 : 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  logoutText: {
    color: "#FFF",

    fontSize: 16,
    fontWeight: "bold",
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,

    backgroundColor:
      isDark ? "rgba(0,0,0,0.65)" : "rgba(15,23,42,0.42)",

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 24,
  },

  modalCard: {
    width: "100%",

    borderRadius: 30,

    overflow: "hidden",

    borderWidth: 1,

    borderColor:
      isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.14)",

    backgroundColor: isDark ? c.surface : "#FFFFFF",
  },

  modalGradient: {
    padding: 28,

    alignItems: "center",
  },

  modalIcon: {
    width: 78,
    height: 78,

    borderRadius: 30,

    backgroundColor:
      "rgba(239,68,68,0.12)",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 18,
  },

  modalTitle: {
    color: c.textPrimary,

    fontSize: 22,

    fontWeight: "bold",
  },

  modalText: {
    color: c.textSecondary,

    textAlign: "center",

    marginTop: 10,

    fontSize: 14,

    lineHeight: 22,
  },

  modalButtons: {
    flexDirection: "row",

    marginTop: 26,

    width: "100%",
  },

  cancelBtn: {
    flex: 1,

    height: 54,

    borderRadius: 16,

    backgroundColor:
      c.glassStrong,

    borderWidth: 1,
    borderColor: c.glassBorder,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 10,
  },

  cancelText: {
    color: c.textPrimary,

    fontWeight: "600",
  },

  confirmBtn: {
    flex: 1,
  },

  confirmGradient: {
    height: 54,

    borderRadius: 16,

    flexDirection: "row",

    justifyContent: "center",
    alignItems: "center",

    gap: 8,
  },

  confirmText: {
    color: "#FFF",

    fontWeight: "bold",
  },
});
}
