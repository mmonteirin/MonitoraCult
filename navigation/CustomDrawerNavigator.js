import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";

import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";

import { Colors } from "../styles/Colors";

export default function CustomDrawerContent(props) {
  const insets =
    useSafeAreaInsets();

  const {
    user,
    nome,
    foto,
    role,
    logout,
  } = useAuth();

  const fadeAnim =
    useRef(
      new Animated.Value(0)
    ).current;

  const slideAnim =
    useRef(
      new Animated.Value(-20)
    ).current;

  const [loadingLogout,
    setLoadingLogout] =
    useState(false);

  const [showLogoutModal,
    setShowLogoutModal] =
    useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(
        fadeAnim,
        {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        slideAnim,
        {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }
      ),
    ]).start();
  }, []);

  const nomeUsuario =
    nome ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const executeLogout =
    async () => {
      try {
        setLoadingLogout(true);

        await logout();

        setShowLogoutModal(false);
      } catch (e) {
        console.log(e);

        setLoadingLogout(false);

        setShowLogoutModal(false);
      }
    };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={[
          Colors.primary,
          "#5B4CF0",
          "#241B4B",
        ]}
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 20,
          },
        ]}
      >
        <View style={styles.glow} />

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            props.navigation.navigate(
              "Perfil"
            )
          }
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY:
                    slideAnim,
                },
              ],
              alignItems:
                "center",
            }}
          >
            {/* FOTO */}
            <View
              style={
                styles.avatarWrapper
              }
            >
              <Image
                source={{
                  uri:
                    foto ||
                    user?.photoURL ||
                    "https://i.pravatar.cc/300",
                }}
                style={
                  styles.avatar
                }
              />

              <View
                style={
                  styles.onlineBadge
                }
              />
            </View>

            {/* NOME */}
            <Text
              style={styles.nome}
            >
              {nomeUsuario}
            </Text>

            {/* EMAIL */}
            <Text
              style={styles.email}
            >
              {user?.email ||
                "Sem email"}
            </Text>

            {/* BADGE */}
            <BlurView
              intensity={40}
              tint="dark"
              style={
                styles.roleBadge
              }
            >
              <MaterialCommunityIcons
                name={
                  role ===
                  "admin"
                    ? "shield-crown"
                    : "account-circle"
                }
                size={14}
                color="#fff"
              />

              <Text
                style={
                  styles.roleText
                }
              >
                {role ===
                "admin"
                  ? "Organizador"
                  : "Participante"}
              </Text>
            </BlurView>
          </Animated.View>
        </TouchableOpacity>
      </LinearGradient>

      {/* MENU */}
      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingTop: 10,
        }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY:
                  slideAnim,
              },
            ],
            paddingHorizontal: 8,
          }}
        >
          <DrawerItemList
            {...props}
          />
        </Animated.View>
      </DrawerContentScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        {/* PAINEL */}
        <TouchableOpacity
          style={
            styles.supportButton
          }
          activeOpacity={0.85}
          onPress={() =>
            props.navigation.navigate(
              "PainelCidade"
            )
          }
        >
          <LinearGradient
            colors={[
              "rgba(124,58,237,0.15)",
              "rgba(91,76,240,0.08)",
            ]}
            style={
              styles.cityButtonGradient
            }
          >
            <View
              style={
                styles.cityIconWrapper
              }
            >
              <MaterialCommunityIcons
                name="city-variant-outline"
                size={20}
                color={
                  Colors.primary
                }
              />
            </View>

            <View
              style={{ flex: 1 }}
            >
              <Text
                style={
                  styles.supportText
                }
              >
                Painel da Cidade
              </Text>

              <Text
                style={
                  styles.citySubText
                }
              >
                Eventos e ocorrências
              </Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={
                Colors.textMuted
              }
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={
            styles.logoutButton
          }
          onPress={() =>
            setShowLogoutModal(
              true
            )
          }
        >
          <MaterialCommunityIcons
            name="logout"
            size={20}
            color={Colors.error}
          />

          <Text
            style={
              styles.logoutText
            }
          >
            Sair da Conta
          </Text>
        </TouchableOpacity>

        {/* VERSION */}
        <Text
          style={styles.version}
        >
          MonitoraCult • v0.6
        </Text>
      </View>

      {/* MODAL LOGOUT — padrão TelaPerfil */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowLogoutModal(false)} />
          <BlurView intensity={50} tint="dark" style={styles.modalCard}>
            <LinearGradient
              colors={["rgba(239,68,68,0.15)", "rgba(127,29,29,0.05)"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalIcon}>
                <MaterialCommunityIcons name="logout" size={34} color="#EF4444" />
              </View>

              <Text style={styles.modalTitle}>Sair da conta?</Text>
              <Text style={styles.modalText}>Você realmente deseja encerrar sua sessão?</Text>

              <View style={styles.modalButtons}>
                <Pressable style={styles.cancelBtn} onPress={() => setShowLogoutModal(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.confirmBtn}
                  onPress={executeLogout}
                  disabled={loadingLogout}
                >
                  <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.confirmGradient}>
                    {loadingLogout ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="logout" size={18} color="#FFF" />
                        <Text style={styles.confirmText}>Sair</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.background,
  },

  header: {
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 120,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    top: -70,
    right: -60,
  },

  avatarWrapper: {
    position: "relative",
    marginBottom: 14,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
    borderWidth: 3,
    borderColor:
      "rgba(255,255,255,0.15)",
  },

  onlineBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },

  nome: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },

  email: {
    color:
      "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginBottom: 14,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 30,
    overflow: "hidden",
  },

  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  footer: {
    padding: 20,
  },

  supportButton: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
  },

  cityButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
  },

  cityIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(124,58,237,0.14)",
    marginRight: 12,
  },

  supportText: {
    color:
      Colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },

  citySubText: {
    color: Colors.textMuted,
    marginTop: 2,
    fontSize: 12,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(239,68,68,0.08)",
    paddingVertical: 16,
    borderRadius: 16,
  },

  logoutText: {
    color: Colors.error,
    fontWeight: "700",
    marginLeft: 10,
    fontSize: 15,
  },

  version: {
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 16,
    fontSize: 12,
  },

  /* MODAL — padrão TelaPerfil */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalGradient: {
    padding: 28,
    alignItems: "center",
  },
  modalIcon: {
    width: 78,
    height: 78,
    borderRadius: 30,
    backgroundColor: "rgba(239,68,68,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  modalText: {
    color: "rgba(255,255,255,0.65)",
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
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cancelText: {
    color: "#FFF",
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 1,
  },
  confirmGradient: {
    height: 52,
    borderRadius: 18,
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