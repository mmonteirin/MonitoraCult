import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from "react-native";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { auth, db } from "../firebaseConfig";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors } from "../styles/Colors";
import {
  adicionarAvaliacaoEvento,
} from "../services/avaliacaoService";

export default function EventoAvaliacao({
  route,
  navigation,
}) {
  const { eventoId, evento } = route.params;

  const insets =
    useSafeAreaInsets();

  const [notaSelecionada, setNotaSelecionada] =
    useState(0);

  const [comentario, setComentario] =
    useState("");

  const [avaliacoes, setAvaliacoes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [jaAvaliou, setJaAvaliou] =
    useState(false);

  /* ⭐ MÉDIA */
  const media =
    avaliacoes.length > 0
      ? (
          avaliacoes.reduce(
            (acc, item) =>
              acc + item.nota,
            0
          ) /
          avaliacoes.length
        ).toFixed(1)
      : 0;

  /* ⭐ CONTADOR */
  const contarNotas = (nota) =>
    avaliacoes.filter(
      (a) => a.nota === nota
    ).length;

  /* ⭐ RENDER STARS */
  const renderStars = (
    nota,
    size = 16
  ) => (
    <View
      style={{
        flexDirection: "row",
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <MaterialCommunityIcons
          key={n}
          name={
            n <= nota
              ? "star"
              : "star-outline"
          }
          size={size}
          color={
            n <= nota
              ? "#FACC15"
              : "rgba(255,255,255,0.2)"
          }
        />
      ))}
    </View>
  );

  /* ⭐ LISTENER */
  useEffect(() => {
    const q = query(
      collection(
        db,
        "eventos",
        eventoId,
        "avaliacoes"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {
        const lista =
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        setAvaliacoes(lista);

        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  /* ⭐ CHECK USER */
  useEffect(() => {
    const check = async () => {
      if (!auth.currentUser?.uid) {
        setJaAvaliou(false);
        return;
      }

      const q = query(
        collection(
          db,
          "eventos",
          eventoId,
          "avaliacoes"
        ),
        where(
          "userId",
          "==",
          auth.currentUser.uid
        )
      );

      const snap =
        await getDocs(q);

      setJaAvaliou(
        !snap.empty
      );
    };

    check();
  }, []);

  /* ⭐ ENVIAR */
  const enviarAvaliacao =
    async () => {
      if (
        !notaSelecionada ||
        !comentario.trim() ||
        jaAvaliou
      )
        return;

      try {
        setEnviando(true);

        const user =
          auth.currentUser;

        if (!user?.uid) {
          return;
        }

        await adicionarAvaliacaoEvento({
          eventoId,
          user,
          nota: notaSelecionada,
          comentario,
          tituloEvento:
            evento?.tituloEvento ||
            evento?.titulo ||
            "Evento",
        });

        setComentario("");
        setNotaSelecionada(0);
        setJaAvaliou(true);
      } catch (e) {
        console.log(e);
      } finally {
        setEnviando(false);
      }
    };

  /* LOADING */
  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color={Colors.primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
      />

      {/* HEADER */}
      <LinearGradient
        colors={[
          "#0F172A",
          "#070B14",
        ]}
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 10,
          },
        ]}
      >
        <View
          style={styles.headerRow}
        >
          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
            style={styles.backBtn}
          >
            <BlurView
              intensity={40}
              tint="dark"
              style={styles.blurBtn}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color="#FFF"
              />
            </BlurView>
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
          >
            Avaliações
          </Text>

          <View
            style={{ width: 48 }}
          />
        </View>

        {/* MÉDIA */}
        <View
          style={styles.ratingHero}
        >
          <Text
            style={
              styles.ratingNumber
            }
          >
            {media}
          </Text>

          {renderStars(
            Math.round(media),
            22
          )}

          <Text
            style={
              styles.ratingSubtitle
            }
          >
            {
              avaliacoes.length
            }{" "}
            avaliações
          </Text>
        </View>
      </LinearGradient>

      {/* CONTENT */}
      <FlatList
        data={avaliacoes}
        keyExtractor={(item) =>
          item.id
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
        ListHeaderComponent={
          <>
            {/* DISTRIBUIÇÃO */}
            <BlurView
              intensity={30}
              tint="dark"
              style={
                styles.distributionCard
              }
            >
              {[5, 4, 3, 2, 1].map(
                (n) => {
                  const total =
                    avaliacoes.length ||
                    1;

                  const width =
                    (contarNotas(
                      n
                    ) /
                      total) *
                    100;

                  return (
                    <View
                      key={n}
                      style={
                        styles.barRow
                      }
                    >
                      <Text
                        style={
                          styles.barLabel
                        }
                      >
                        {n}
                      </Text>

                      <MaterialCommunityIcons
                        name="star"
                        size={14}
                        color="#FACC15"
                      />

                      <View
                        style={
                          styles.barBg
                        }
                      >
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${width}%`,
                            },
                          ]}
                        />
                      </View>

                      <Text
                        style={
                          styles.barCount
                        }
                      >
                        {
                          contarNotas(
                            n
                          )
                        }
                      </Text>
                    </View>
                  );
                }
              )}
            </BlurView>

            {/* FORM */}
            {!jaAvaliou && (
              <BlurView
                intensity={40}
                tint="dark"
                style={styles.formCard}
              >
                <Text
                  style={
                    styles.formTitle
                  }
                >
                  Avaliar evento
                </Text>

                <View
                  style={
                    styles.starsSelect
                  }
                >
                  {[1, 2, 3, 4, 5].map(
                    (n) => (
                      <TouchableOpacity
                        key={n}
                        onPress={() =>
                          setNotaSelecionada(
                            n
                          )
                        }
                      >
                        <MaterialCommunityIcons
                          name={
                            n <=
                            notaSelecionada
                              ? "star"
                              : "star-outline"
                          }
                          size={34}
                          color={
                            n <=
                            notaSelecionada
                              ? "#FACC15"
                              : "rgba(255,255,255,0.25)"
                          }
                        />
                      </TouchableOpacity>
                    )
                  )}
                </View>

                <TextInput
                  placeholder="Conte como foi sua experiência..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={
                    comentario
                  }
                  onChangeText={
                    setComentario
                  }
                  multiline
                  style={
                    styles.input
                  }
                />

                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={
                    enviando
                  }
                  onPress={
                    enviarAvaliacao
                  }
                >
                  <LinearGradient
                    colors={[
                      "#7C3AED",
                      "#5B21B6",
                    ]}
                    style={
                      styles.button
                    }
                  >
                    {enviando ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="send"
                          size={18}
                          color="#FFF"
                        />

                        <Text
                          style={
                            styles.buttonText
                          }
                        >
                          Enviar avaliação
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </BlurView>
            )}

            {jaAvaliou && (
              <View
                style={
                  styles.alreadyBox
                }
              >
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={20}
                  color="#22C55E"
                />

                <Text
                  style={
                    styles.alreadyText
                  }
                >
                  Você já avaliou este evento
                </Text>
              </View>
            )}

            {/* TITLE */}
            <Text
              style={
                styles.sectionTitle
              }
            >
              Comentários
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <BlurView
            intensity={25}
            tint="dark"
            style={styles.reviewCard}
          >
            <View
              style={
                styles.reviewHeader
              }
            >
              <Image
                source={{
                  uri: item.foto,
                }}
                style={
                  styles.avatar
                }
              />

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.userName
                  }
                >
                  {item.nome}
                </Text>

                {renderStars(
                  item.nota,
                  14
                )}
              </View>
            </View>

            <Text
              style={
                styles.reviewText
              }
            >
              {item.comentario}
            </Text>
          </BlurView>
        )}
        ListEmptyComponent={
          <View
            style={
              styles.emptyContainer
            }
          >
            <MaterialCommunityIcons
              name="message-text-outline"
              size={44}
              color="rgba(255,255,255,0.25)"
            />

            <Text
              style={
                styles.emptyText
              }
            >
              Nenhuma avaliação ainda
            </Text>
          </View>
        }
      />
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

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "#070B14",
    },

    header: {
      paddingHorizontal: 20,
      paddingBottom: 25,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    backBtn: {
      alignSelf: "flex-start",
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

    headerTitle: {
      color: "#FFF",
      fontSize: 18,
      fontWeight: "700",
    },

    ratingHero: {
      alignItems: "center",
      marginTop: 30,
    },

    ratingNumber: {
      color: "#FFF",
      fontSize: 54,
      fontWeight: "900",
      marginBottom: 10,
    },

    ratingSubtitle: {
      color:
        "rgba(255,255,255,0.6)",
      marginTop: 8,
      fontSize: 14,
    },

    content: {
      padding: 20,
      paddingBottom: 120,
    },

    distributionCard: {
      borderRadius: 26,
      padding: 20,
      overflow: "hidden",
      backgroundColor:
        "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.06)",
      marginBottom: 20,
    },

    barRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },

    barLabel: {
      color: "#FFF",
      width: 16,
      fontWeight: "700",
    },

    barBg: {
      flex: 1,
      height: 8,
      backgroundColor:
        "rgba(255,255,255,0.08)",
      borderRadius: 999,
      marginHorizontal: 10,
      overflow: "hidden",
    },

    barFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor:
        "#7C3AED",
    },

    barCount: {
      color:
        "rgba(255,255,255,0.6)",
      fontSize: 12,
      width: 22,
      textAlign: "right",
    },

    formCard: {
      borderRadius: 26,
      padding: 20,
      overflow: "hidden",
      backgroundColor:
        "rgba(255,255,255,0.05)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.06)",
      marginBottom: 20,
    },

    formTitle: {
      color: "#FFF",
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 18,
    },

    starsSelect: {
      flexDirection: "row",
      justifyContent:
        "center",
      gap: 10,
      marginBottom: 18,
    },

    input: {
      minHeight: 120,
      backgroundColor:
        "rgba(255,255,255,0.05)",
      borderRadius: 18,
      padding: 16,
      color: "#FFF",
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.08)",
      marginBottom: 18,
      fontSize: 14,
      lineHeight: 22,
    },

    button: {
      borderRadius: 20,
      paddingVertical: 16,
      justifyContent:
        "center",
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
    },

    buttonText: {
      color: "#FFF",
      fontSize: 15,
      fontWeight: "800",
    },

    alreadyBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 10,
      marginBottom: 20,
      backgroundColor:
        "rgba(34,197,94,0.1)",
      borderWidth: 1,
      borderColor:
        "rgba(34,197,94,0.25)",
      paddingVertical: 14,
      borderRadius: 18,
    },

    alreadyText: {
      color: "#22C55E",
      fontWeight: "700",
      fontSize: 13,
    },

    sectionTitle: {
      color: "#FFF",
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 16,
    },

    reviewCard: {
      borderRadius: 24,
      padding: 18,
      overflow: "hidden",
      backgroundColor:
        "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.05)",
      marginBottom: 14,
    },

    reviewHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },

    avatar: {
      width: 52,
      height: 52,
      borderRadius: 999,
      marginRight: 14,
    },

    userName: {
      color: "#FFF",
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 4,
    },

    reviewText: {
      color:
        "rgba(255,255,255,0.72)",
      fontSize: 14,
      lineHeight: 24,
    },

    emptyContainer: {
      alignItems: "center",
      marginTop: 60,
    },

    emptyText: {
      color:
        "rgba(255,255,255,0.45)",
      marginTop: 12,
      fontSize: 14,
    },
  });
