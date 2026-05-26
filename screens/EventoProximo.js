import React, { useState, useCallback } from "react";

import {
  View,
  Text,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
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

import { Colors } from "../styles/Colors";

const { width } = Dimensions.get("window");

const eventosMock = [
  {
    id: "1",

    titulo: "Show de Rock",

    data: "25 Abr - 20:00",

    local: "Centro Cultural",

    status: "confirmado",

    imagem:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200",
  },

  {
    id: "2",

    titulo:
      "Festival de Forró",

    data: "28 Abr - 18:00",

    local:
      "Praia de Iracema",

    status: "pendente",

    imagem:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200",
  },
];

export default function TelaGerenciarEventos() {
  const [eventos, setEventos] =
    useState(eventosMock);

  const cancelarInscricao = (
    id
  ) => {
    Alert.alert(
      "Cancelar inscrição",
      "Deseja cancelar sua inscrição?",
      [
        {
          text: "Não",
          style: "cancel",
        },

        {
          text: "Sim",

          style: "destructive",

          onPress: () => {
            setEventos((prev) =>
              prev.filter(
                (item) =>
                  item.id !== id
              )
            );
          },
        },
      ]
    );
  };

  const renderItem = useCallback(
    ({ item, index }) => {
      const confirmado =
        item.status ===
        "confirmado";

      return (
        <AnimatePresence>
          <MotiView
            from={{
              opacity: 0,
              translateY: 40,
              scale: 0.92,
            }}
            animate={{
              opacity: 1,
              translateY: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.85,
              translateX: width,
            }}
            transition={{
              type: "timing",
              duration: 550,
              delay: index * 120,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.92}
              style={styles.card}
            >
              {/* IMAGEM */}
              <ImageBackground
                source={{
                  uri: item.imagem,
                }}
                style={styles.imagem}
              >
                {/* EFEITO GLOW */}
                <LinearGradient
                  colors={[
                    "rgba(124,58,237,0.20)",
                    "transparent",
                  ]}
                  style={styles.glow}
                />

                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(0,0,0,0.35)",
                    "rgba(0,0,0,0.98)",
                  ]}
                  style={
                    styles.overlay
                  }
                >
                  {/* STATUS */}
                  <MotiView
                    from={{
                      scale: 0.7,
                      opacity: 0,
                    }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{
                      delay:
                        index * 140 +
                        250,
                      type: "spring",
                    }}
                    style={[
                      styles.status,

                      confirmado
                        ? styles.confirmado
                        : styles.pendente,
                    ]}
                  >
                    <View
                      style={
                        styles.statusDot
                      }
                    />

                    <Text
                      style={
                        styles.statusText
                      }
                    >
                      {confirmado
                        ? "Confirmado"
                        : "Pendente"}
                    </Text>
                  </MotiView>

                  {/* FLOATING ACTION */}
                  <TouchableOpacity
                    activeOpacity={
                      0.9
                    }
                    style={
                      styles.floatingBtn
                    }
                  >
                    <BlurView
                      intensity={
                        60
                      }
                      tint="dark"
                      style={
                        styles.floatingBlur
                      }
                    >
                      <MaterialCommunityIcons
                        name="heart-outline"
                        size={20}
                        color="#FFF"
                      />
                    </BlurView>
                  </TouchableOpacity>
                </LinearGradient>
              </ImageBackground>

              {/* CONTEUDO */}
              <BlurView
                intensity={55}
                tint="dark"
                style={
                  styles.conteudo
                }
              >
                {/* TITULO */}
                <Text
                  style={
                    styles.titulo
                  }
                  numberOfLines={1}
                >
                  {item.titulo}
                </Text>

                {/* INFO */}
                <View
                  style={
                    styles.infoContainer
                  }
                >
                  <View
                    style={
                      styles.infoCard
                    }
                  >
                    <MaterialCommunityIcons
                      name="calendar"
                      size={16}
                      color={
                        Colors.primary
                      }
                    />

                    <Text
                      style={
                        styles.infoText
                      }
                    >
                      {item.data}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.infoCard
                    }
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={16}
                      color={
                        Colors.primary
                      }
                    />

                    <Text
                      style={
                        styles.infoText
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {item.local}
                    </Text>
                  </View>
                </View>

                {/* ACTIONS */}
                <View
                  style={
                    styles.actions
                  }
                >
                  <TouchableOpacity
                    activeOpacity={
                      0.9
                    }
                    style={
                      styles.botaoEvento
                    }
                  >
                    <LinearGradient
                      colors={[
                        "#8B5CF6",
                        "#6D28D9",
                      ]}
                      start={{
                        x: 0,
                        y: 0,
                      }}
                      end={{
                        x: 1,
                        y: 1,
                      }}
                      style={
                        styles.gradientBtn
                      }
                    >
                      <MaterialCommunityIcons
                        name="eye-outline"
                        size={18}
                        color="#FFF"
                      />

                      <Text
                        style={
                          styles.textoBtn
                        }
                      >
                        Ver Evento
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={
                      0.7
                    }
                    onPress={() =>
                      cancelarInscricao(
                        item.id
                      )
                    }
                    style={
                      styles.cancelarBtn
                    }
                  >
                    <Text
                      style={
                        styles.cancelar
                      }
                    >
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </TouchableOpacity>
          </MotiView>
        </AnimatePresence>
      );
    },
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
      />

      {/* BG */}
      <LinearGradient
        colors={[
          "#050816",
          "#090F1F",
          "#120F2B",
        ]}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <LinearGradient
        colors={[
          "#111827",
          "#1E1B4B",
          "#312E81",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
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
          <Text
            style={
              styles.headerTitle
            }
          >
            Meus Eventos 🎟️
          </Text>

          <Text
            style={
              styles.headerSub
            }
          >
            Gerencie suas inscrições
          </Text>
        </MotiView>

        {/* BOLHAS */}
        <View
          style={
            styles.circleOne
          }
        />

        <View
          style={
            styles.circleTwo
          }
        />
      </LinearGradient>

      {/* LISTA */}
      <FlatList
        data={eventos}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={
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
              type: "spring",
            }}
            style={
              styles.emptyContainer
            }
          >
            <LinearGradient
              colors={[
                "rgba(124,58,237,0.25)",
                "rgba(255,255,255,0.03)",
              ]}
              style={
                styles.emptyIconBox
              }
            >
              <MaterialCommunityIcons
                name="calendar-remove"
                size={68}
                color="rgba(255,255,255,0.35)"
              />
            </LinearGradient>

            <Text
              style={
                styles.empty
              }
            >
              Você ainda não se
              inscreveu em eventos
            </Text>

            <Text
              style={
                styles.emptySub
              }
            >
              Explore experiências
              incríveis perto de
              você
            </Text>
          </MotiView>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      "#070B14",
  },

  /* HEADER */
  header: {
    paddingTop: 72,
    paddingBottom: 34,
    paddingHorizontal: 24,

    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,

    overflow: "hidden",
  },

  circleOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,

    backgroundColor:
      "rgba(255,255,255,0.05)",

    top: -50,
    right: -40,
  },

  circleTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,

    backgroundColor:
      "rgba(139,92,246,0.18)",

    bottom: -35,
    left: -20,
  },

  headerTitle: {
    color: "#FFF",

    fontSize: 32,

    fontWeight: "800",
  },

  headerSub: {
    color:
      "rgba(255,255,255,0.72)",

    marginTop: 8,

    fontSize: 14,
  },

  /* CARD */
  card: {
    backgroundColor:
      "rgba(255,255,255,0.04)",

    borderRadius: 30,

    overflow: "hidden",

    marginBottom: 24,

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.06)",

    shadowColor: "#000",

    shadowOpacity: 0.25,

    shadowRadius: 20,

    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 10,
  },

  imagem: {
    height: 230,

    justifyContent: "flex-end",
  },

  glow: {
    ...StyleSheet.absoluteFillObject,
  },

  overlay: {
    flex: 1,

    justifyContent:
      "space-between",

    padding: 18,
  },

  conteudo: {
    padding: 20,
    backgroundColor:
      "rgba(12,12,18,0.70)",
  },

  titulo: {
    color: "#FFF",

    fontSize: 23,

    fontWeight: "800",

    marginBottom: 18,
  },

  infoContainer: {
    gap: 12,
  },

  infoCard: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor:
      "rgba(255,255,255,0.05)",

    borderRadius: 16,

    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  infoText: {
    color:
      "rgba(255,255,255,0.78)",

    marginLeft: 10,

    fontSize: 13,

    flex: 1,
  },

  /* STATUS */
  status: {
    alignSelf: "flex-start",

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 14,
    paddingVertical: 8,

    borderRadius: 20,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,

    backgroundColor: "#FFF",

    marginRight: 8,
  },

  confirmado: {
    backgroundColor:
      "rgba(34,197,94,0.95)",
  },

  pendente: {
    backgroundColor:
      "rgba(245,158,11,0.95)",
  },

  statusText: {
    color: "#FFF",

    fontSize: 12,

    fontWeight: "800",
  },

  floatingBtn: {
    position: "absolute",

    top: 18,
    right: 18,

    borderRadius: 22,

    overflow: "hidden",
  },

  floatingBlur: {
    width: 44,
    height: 44,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor:
      "rgba(0,0,0,0.25)",
  },

  /* ACTIONS */
  actions: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",

    marginTop: 24,
  },

  botaoEvento: {
    borderRadius: 18,

    overflow: "hidden",
  },

  gradientBtn: {
    flexDirection: "row",

    alignItems: "center",

    paddingVertical: 14,
    paddingHorizontal: 20,

    gap: 8,
  },

  textoBtn: {
    color: "#FFF",

    fontWeight: "800",

    fontSize: 13,
  },

  cancelarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  cancelar: {
    color: "#EF4444",

    fontWeight: "800",

    fontSize: 14,
  },

  /* EMPTY */
  emptyContainer: {
    alignItems: "center",

    marginTop: 100,

    paddingHorizontal: 30,
  },

  emptyIconBox: {
    width: 130,
    height: 130,

    borderRadius: 65,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 26,
  },

  empty: {
    color: "#FFF",

    textAlign: "center",

    fontSize: 18,

    fontWeight: "700",

    lineHeight: 28,
  },

  emptySub: {
    color:
      "rgba(255,255,255,0.55)",

    marginTop: 10,

    textAlign: "center",

    fontSize: 14,

    lineHeight: 22,
  },
});