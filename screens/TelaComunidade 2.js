```jsx
import React, {
  useState,
  useEffect,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  ImageBackground,
  Dimensions,
} from "react-native";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  BlurView,
} from "expo-blur";

import {
  MotiView,
  AnimatePresence,
} from "moti";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  useBottomTabBarHeight,
} from "@react-navigation/bottom-tabs";

import { Colors } from "../styles/Colors";

const { width } =
  Dimensions.get("window");

const GENEROS = [
  "Todos",
  "Música",
  "Dança",
  "Teatro",
  "Cinema",
  "Literatura",
  "Artes Visuais",
  "Gastronomia",
];

export default function TelaComunidade({
  navigation,
}) {
  const insets =
    useSafeAreaInsets();

  const tabBarHeight =
    useBottomTabBarHeight();

  const [activeTab, setActiveTab] =
    useState("grupos");

  const [
    selectedGenre,
    setSelectedGenre,
  ] = useState("Todos");

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
      />

      <ImageBackground
        source={require("../assets/fundoTelaLogin.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(5,8,18,0.96)",
            "rgba(12,14,25,0.94)",
            "rgba(26,14,58,0.95)",
          ]}
          style={styles.overlay}
        >
          {/* GLOW FX */}
          <View
            style={styles.glowTop}
          />

          <View
            style={
              styles.glowBottom
            }
          />

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={{
              paddingBottom:
                tabBarHeight + 40,
            }}
          >
            {/* HEADER */}
            <View
              style={[
                styles.header,
                {
                  paddingTop:
                    insets.top + 10,
                },
              ]}
            >
              <View
                style={
                  styles.headerTop
                }
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={
                    styles.notificationButton
                  }
                >
                  <BlurView
                    intensity={40}
                    tint="dark"
                    style={
                      styles.blurBtn
                    }
                  >
                    <MaterialCommunityIcons
                      name="bell-outline"
                      size={22}
                      color="#FFF"
                    />
                  </BlurView>
                </TouchableOpacity>
              </View>

              {/* HERO */}
              <MotiView
                from={{
                  opacity: 0,
                  translateY: 20,
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
                <View
                  style={
                    styles.heroIcon
                  }
                >
                  <LinearGradient
                    colors={[
                      "#8B5CF6",
                      "#5B21B6",
                    ]}
                    style={
                      styles.heroGradient
                    }
                  >
                    <MaterialCommunityIcons
                      name="account-group"
                      size={34}
                      color="#FFF"
                    />
                  </LinearGradient>
                </View>

                <Text
                  style={
                    styles.title
                  }
                >
                  Comunidade
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  Descubra grupos,
                  criadores, fóruns e
                  cultura viva perto
                  de você.
                </Text>
              </MotiView>
            </View>

            {/* TABS */}
            <MotiView
              from={{
                opacity: 0,
                translateY: 30,
              }}
              animate={{
                opacity: 1,
                translateY: 0,
              }}
              transition={{
                delay: 150,
                duration: 700,
              }}
              style={
                styles.tabsContainer
              }
            >
              {[
                "grupos",
                "criadores",
                "noticias",
              ].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab ===
                      tab &&
                      styles.tabActive,
                  ]}
                  onPress={() =>
                    setActiveTab(tab)
                  }
                  activeOpacity={0.8}
                >
                  {activeTab ===
                    tab && (
                    <LinearGradient
                      colors={[
                        "#8B5CF6",
                        "#6D28D9",
                      ]}
                      style={
                        styles.activeTabBg
                      }
                    />
                  )}

                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab ===
                        tab &&
                        styles.tabLabelActive,
                    ]}
                  >
                    {tab ===
                      "grupos" &&
                      "Grupos"}

                    {tab ===
                      "criadores" &&
                      "Criadores"}

                    {tab ===
                      "noticias" &&
                      "Notícias"}
                  </Text>
                </TouchableOpacity>
              ))}
            </MotiView>

            {/* GENEROS */}
            {activeTab ===
              "grupos" && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                style={
                  styles.genreScroll
                }
                contentContainerStyle={{
                  paddingHorizontal: 20,
                }}
              >
                {GENEROS.map(
                  (genre, index) => (
                    <MotiView
                      key={genre}
                      from={{
                        opacity: 0,
                        translateY: 15,
                      }}
                      animate={{
                        opacity: 1,
                        translateY: 0,
                      }}
                      transition={{
                        delay:
                          index * 80,
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.genreFilter,

                          selectedGenre ===
                            genre &&
                            styles.genreFilterActive,
                        ]}
                        onPress={() =>
                          setSelectedGenre(
                            genre
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.genreText,

                            selectedGenre ===
                              genre &&
                              styles.genreTextActive,
                          ]}
                        >
                          {genre}
                        </Text>
                      </TouchableOpacity>
                    </MotiView>
                  )
                )}
              </ScrollView>
            )}

            {/* CONTENT */}
            <View
              style={styles.content}
            >
              <AnimatePresence>
                <MotiView
                  key={activeTab}
                  from={{
                    opacity: 0,
                    translateY: 30,
                  }}
                  animate={{
                    opacity: 1,
                    translateY: 0,
                  }}
                  exit={{
                    opacity: 0,
                    translateY: -20,
                  }}
                  transition={{
                    type: "timing",
                    duration: 450,
                  }}
                >
                  {/* RENDERIZA AQUI */}
                </MotiView>
              </AnimatePresence>
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#070B14",
    },

    bg: {
      flex: 1,
    },

    overlay: {
      flex: 1,
    },

    glowTop: {
      position: "absolute",
      top: -120,
      right: -60,
      width: 280,
      height: 280,
      borderRadius: 200,
      backgroundColor:
        "rgba(124,58,237,0.22)",
    },

    glowBottom: {
      position: "absolute",
      bottom: -140,
      left: -60,
      width: 260,
      height: 260,
      borderRadius: 200,
      backgroundColor:
        "rgba(59,130,246,0.12)",
    },

    header: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },

    headerTop: {
      flexDirection: "row",
      justifyContent:
        "flex-end",
      marginBottom: 20,
    },

    blurBtn: {
      width: 48,
      height: 48,
      borderRadius: 18,
      justifyContent:
        "center",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.08)",
    },

    heroIcon: {
      marginBottom: 22,
    },

    heroGradient: {
      width: 88,
      height: 88,
      borderRadius: 30,
      justifyContent:
        "center",
      alignItems: "center",
    },

    title: {
      fontSize:
        width < 380 ? 34 : 40,
      color: "#FFF",
      fontWeight: "800",
      letterSpacing: 0.5,
    },

    subtitle: {
      color:
        "rgba(255,255,255,0.72)",
      marginTop: 12,
      fontSize: 15,
      lineHeight: 25,
      maxWidth: "95%",
    },

    tabsContainer: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor:
        "rgba(255,255,255,0.05)",
      borderRadius: 22,
      padding: 6,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.08)",
    },

    tab: {
      flex: 1,
      height: 48,
      borderRadius: 16,
      justifyContent:
        "center",
      alignItems: "center",
      overflow: "hidden",
    },

    activeTabBg: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 16,
    },

    tabLabel: {
      color:
        "rgba(255,255,255,0.55)",
      fontSize: 13,
      fontWeight: "700",
    },

    tabLabelActive: {
      color: "#FFF",
    },

    genreScroll: {
      marginBottom: 22,
    },

    genreFilter: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      marginRight: 10,
      borderRadius: 20,
      backgroundColor:
        "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.08)",
    },

    genreFilterActive: {
      backgroundColor:
        "#8B5CF6",
      borderColor:
        "#8B5CF6",
    },

    genreText: {
      color:
        "rgba(255,255,255,0.65)",
      fontSize: 13,
      fontWeight: "700",
    },

    genreTextActive: {
      color: "#FFF",
    },

    content: {
      paddingHorizontal: 20,
    },
  });
```
