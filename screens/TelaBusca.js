import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
  ScrollView,
  TextInput,
  StatusBar,
  ImageBackground,
} from "react-native";

import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";

import { BlurView } from "expo-blur";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../styles/Colors";

import {
  getEventosApp,
} from "../services/eventosAppService";

import {
  getEventos,
} from "../services/mapaCulturalService";

const { width } =
  Dimensions.get("window");

const CARD_WIDTH = width * 0.78;

const DEFAULT_IMAGE =
  "https://placehold.co/600x400?text=Evento";

export default function TelaBusca({
  navigation,
}) {
  const insets =
    useSafeAreaInsets();

  const [loading, setLoading] =
    useState(true);

  const [query, setQuery] =
    useState("");

  const [eventos, setEventos] =
    useState([]);

  const [categoria, setCategoria] =
    useState("Todos");

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);

  const [modalMessage, setModalMessage] =
    useState("");

  useEffect(() => {
    carregarEventos();
  }, []);

  async function carregarEventos() {
    try {
      setLoading(true);

      /* EVENTOS DO APP */
      const eventosApp =
        await getEventosApp();

      const listaApp =
        eventosApp.map((item) => ({
          id:
            item.id ||
            Math.random(),

          titulo:
            item.tituloEvento ||
            item.name ||
            "Evento",

          descricao:
            item.descricao ||
            item.shortDescription ||
            "Evento incrível",

          imagem:
            item.imagemEvento ||
            item.files?.header
              ?.url ||
            DEFAULT_IMAGE,

          local:
            item.localEvento ||
            item.nomeLocal ||
            "Local não informado",

          categoria:
            item.categoria ||
            "Outros",

          gratuito:
            item.gratuito === true ||
            item.tipoEvento === "gratuito" ||
            Number(item.precoInteira ?? item.preco ?? 0) === 0,

          likes:
            item.likes || 0,

          views:
            item.views || 0,

          score:
            item.score || 0,

          origem: "app",

          original: item,
        }));

      /* EVENTOS MAPA CULTURAL */
      const response =
        await getEventos();

      const listaMapa =
        Array.isArray(response)
          ? response
          : response?.data ||
            response?.results ||
            [];

      const tratadosMapa =
        listaMapa.map(
          (
            item,
            index
          ) => {
            const imagem =
              item?.image?.url ||
              item?.files
                ?.header?.url ||
              null;

            return {
              id:
                item.id ||
                `mapa-${index}`,

              titulo:
                item.name ||
                "Evento Público",

              descricao:
                item
                  ?.shortDescription ||
                item?.description ||
                "Evento cultural público.",

              imagem:
                imagem ||
                DEFAULT_IMAGE,

              local:
                item?.location
                  ?.name ||
                "Local não informado",

              categoria:
                "Eventos Públicos",

              likes: 0,
              views: 0,
              score: 70,

              origem:
                "mapaCultural",

              possuiImagem:
                !!imagem,

              original: item,
            };
          }
        );

      /* JUNTA TUDO */
      setEventos([
        ...listaApp,
        ...tratadosMapa,
      ]);
    } catch (error) {
      console.log(error);

      setModalMessage(
        "Erro ao carregar eventos."
      );

      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  }

  const categorias =
    useMemo(() => {
      const lista =
        eventos.map(
          (e) => e.categoria
        );

      return [
        "Todos",
        ...new Set(lista),
      ];
    }, [eventos]);

  const eventosFiltrados =
    useMemo(() => {
      let lista = eventos;

      if (categoria !== "Todos") {
        lista = lista.filter(
          (e) =>
            e.categoria ===
            categoria
        );
      }

      if (query.trim()) {
        lista = lista.filter(
          (e) =>
            e.titulo
              .toLowerCase()
              .includes(
                query.toLowerCase()
              ) ||
            e.local
              .toLowerCase()
              .includes(
                query.toLowerCase()
              )
        );
      }

      return lista.sort((a, b) => {
        /* PRIORIDADE:
          1 - Eventos do app (MonitoraCult)
          2 - Score maior
        */

        if (
          a.origem === "app" &&
          b.origem !== "app"
        ) {
          return -1;
        }

        if (
          a.origem !== "app" &&
          b.origem === "app"
        ) {
          return 1;
        }

        return (
          (b.score || 0) -
          (a.score || 0)
        );
      });
    }, [
      eventos,
      categoria,
      query,
    ]);

  const trending =
    eventosFiltrados.slice(0, 5);

  function Card({
    item,
    index,
  }) {
    const scale =
      useSharedValue(1);

    const animatedStyle =
      useAnimatedStyle(() => ({
        transform: [
          {
            scale:
              scale.value,
          },
        ],
      }));

    const abrirEvento =
      () => {
        if (
          item.origem ===
          "mapaCultural"
        ) {
          setModalMessage(
            "Este evento pertence ao Mapa Cultural. Procure mais informações no portal oficial."
          );

          setModalVisible(true);

          return;
        }

        navigation.navigate(
          "Detalhes",
          {
            evento:
              item.original,
          }
        );
      };

    return (
      <Animated.View
        entering={FadeInRight.delay(
          index * 100
        ).springify()}
        style={animatedStyle}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.card}
          onPressIn={() => {
            scale.value =
              withSpring(0.97);
          }}
          onPressOut={() => {
            scale.value =
              withSpring(1);
          }}
          onPress={abrirEvento}
        >
          {item.possuiImagem ===
          false ? (
            <ImageBackground
              source={require("../assets/fundoTelaLogin.png")}
              style={
                styles.cardImage
              }
              resizeMode="cover"
            >
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.55)",
                  "rgba(0,0,0,0.90)",
                ]}
                style={
                  styles.noImageOverlay
                }
              >
                <MaterialCommunityIcons
                  name="image-off-outline"
                  size={42}
                  color="#FFF"
                />

                <Text
                  style={
                    styles.noImageText
                  }
                >
                  Imagem não
                  disponível
                </Text>
              </LinearGradient>
            </ImageBackground>
          ) : (
            <Image
              source={{
                uri: item.imagem,
              }}
              style={
                styles.cardImage
              }
            />
          )}

          <LinearGradient
            colors={[
              "transparent",
              "rgba(0,0,0,0.98)",
            ]}
            style={
              styles.overlay
            }
          />

          <View
            style={
              styles.cardContent
            }
          >
            <BlurView
              intensity={50}
              tint="dark"
              style={
                styles.badge
              }
            >
              <Text
                style={
                  styles.badgeText
                }
              >
                {
                  item.origem !== "app"
                    ? item.categoria
                    : item.gratuito
                    ? `${item.categoria} • Gratuito`
                    : `${item.categoria} • Pago`
                }
              </Text>
            </BlurView>

            <Text
              numberOfLines={2}
              style={
                styles.cardTitle
              }
            >
              {item.titulo}
            </Text>

            <Text
              numberOfLines={2}
              style={
                styles.cardDescription
              }
            >
              {
                item.descricao
              }
            </Text>

            <View
              style={
                styles.footer
              }
            >
              <View
                style={
                  styles.locationRow
                }
              >
                <MaterialCommunityIcons
                  name="map-marker"
                  size={15}
                  color="#FFF"
                />

                <Text
                  numberOfLines={
                    1
                  }
                  style={
                    styles.location
                  }
                >
                  {
                    item.local
                  }
                </Text>
              </View>

              {item.origem ===
                "app" && (
                <View
                  style={
                    styles.metricsRow
                  }
                >
                  <View
                    style={
                      styles.metricBadge
                    }
                  >
                    <MaterialCommunityIcons
                      name="heart"
                      size={13}
                      color="#FF4D6D"
                    />

                    <Text
                      style={
                        styles.metricText
                      }
                    >
                      {
                        item.likes
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.metricBadge
                    }
                  >
                    <MaterialCommunityIcons
                      name="eye"
                      size={13}
                      color="#60A5FA"
                    />

                    <Text
                      style={
                        styles.metricText
                      }
                    >
                      {
                        item.views
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.metricBadge
                    }
                  >
                    <MaterialCommunityIcons
                      name="star"
                      size={13}
                      color="#FFD166"
                    />

                    <Text
                      style={
                        styles.metricText
                      }
                    >
                      {Math.round(
                        item.score
                      )}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <View
        style={
          styles.container
        }
      >
        <StatusBar
          barStyle="light-content"
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <View
            style={
              styles.fakeHero
            }
          />

          <View
            style={
              styles.fakeCard
            }
          />

          <View
            style={
              styles.fakeCard
            }
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
      />

      <LinearGradient
        colors={[
          "#18122B",
          "#10131F",
          Colors.background,
        ]}
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 10,
          },
        ]}
      >
        <Animated.View
          entering={FadeInDown.springify()}
        >
          <Text
            style={
              styles.title
            }
          >
            Descobrir Eventos
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Explore experiências
            únicas ✨
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(
            120
          ).springify()}
        >
          <BlurView
            intensity={45}
            tint="dark"
            style={
              styles.searchBox
            }
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={
                Colors.textMuted
              }
            />

            <TextInput
              value={query}
              onChangeText={
                setQuery
              }
              placeholder="Buscar eventos..."
              placeholderTextColor={
                Colors.textMuted
              }
              style={
                styles.input
              }
            />

            {query.length >
              0 && (
              <TouchableOpacity
                onPress={() =>
                  setQuery("")
                }
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={
                    Colors.textMuted
                  }
                />
              </TouchableOpacity>
            )}
          </BlurView>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(
            200
          ).springify()}
          style={
            styles.trendingContainer
          }
        >
          <Text
            style={
              styles.trendingTitle
            }
          >
            🔥 Em alta agora
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
          >
            {trending.map(
              (
                item,
                index
              ) => (
                <TouchableOpacity
                  key={item.id}
                  style={
                    styles.trendingChip
                  }
                  onPress={() => {
                    if (
                      item.origem ===
                      "mapaCultural"
                    ) {
                      setModalMessage(
                        "Este evento pertence ao Mapa Cultural."
                      );

                      setModalVisible(
                        true
                      );

                      return;
                    }

                    navigation.navigate(
                      "Detalhes",
                      {
                        evento:
                          item.original,
                      }
                    );
                  }}
                >
                  <Text
                    numberOfLines={
                      1
                    }
                    style={
                      styles.trendingChipText
                    }
                  >
                    {
                      item.titulo
                    }
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom: 140,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.categories
          }
        >
          {categorias.map(
            (item) => {
              const ativo =
                categoria ===
                item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.categoryBtn,
                    ativo &&
                      styles.categoryBtnActive,
                  ]}
                  onPress={() =>
                    setCategoria(
                      item
                    )
                  }
                >
                  <Text
                    style={[
                      styles.categoryText,
                      ativo &&
                        styles.categoryTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>

        <Animated.View
          entering={FadeIn.delay(
            250
          )}
          style={
            styles.statsRow
          }
        >
          <View
            style={
              styles.statCard
            }
          >
            <MaterialCommunityIcons
              name="calendar-star"
              size={22}
              color={
                Colors.primary
              }
            />

            <Text
              style={
                styles.statValue
              }
            >
              {
                eventosFiltrados.length
              }
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Eventos
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <MaterialCommunityIcons
              name="fire"
              size={22}
              color="#FF7849"
            />

            <Text
              style={
                styles.statValue
              }
            >
              {
                trending.length
              }
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Em alta
            </Text>
          </View>

          <View
            style={
              styles.statCard
            }
          >
            <MaterialCommunityIcons
              name="shape"
              size={22}
              color="#8B5CF6"
            />

            <Text
              style={
                styles.statValue
              }
            >
              {
                categorias.length -
                1
              }
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Categorias
            </Text>
          </View>
        </Animated.View>

        <View
          style={
            styles.sectionHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Eventos
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Selecionados para
              você
            </Text>
          </View>

          <Text
            style={
              styles.sectionCount
            }
          >
            {
              eventosFiltrados.length
            }{" "}
            encontrados
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
          }}
        >
          {eventosFiltrados.map(
            (
              item,
              index
            ) => (
              <Card
                key={item.id}
                item={item}
                index={index}
              />
            )
          )}
        </ScrollView>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <BlurView
            intensity={80}
            tint="dark"
            style={
              styles.modal
            }
          >
            <MaterialCommunityIcons
              name="alert-circle"
              size={42}
              color="#FF4D6D"
              style={{
                marginBottom: 10,
              }}
            />

            <Text
              style={
                styles.modalTitle
              }
            >
              Aviso
            </Text>

            <Text
              style={
                styles.modalText
              }
            >
              {modalMessage}
            </Text>

            <TouchableOpacity
              style={
                styles.modalButton
              }
              onPress={() =>
                setModalVisible(
                  false
                )
              }
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                Fechar
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        Colors.background,
    },

    header: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },

    title: {
      color: "#FFF",
      fontSize: 34,
      fontWeight: "bold",
    },

    subtitle: {
      color:
        Colors.textSecondary,
      marginTop: 8,
      fontSize: 15,
    },

    searchBox: {
      marginTop: 24,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.08)",
    },

    input: {
      flex: 1,
      marginLeft: 10,
      color: "#FFF",
      fontSize: 15,
    },

    trendingContainer: {
      marginTop: 24,
    },

    trendingTitle: {
      color: "#FFF",
      fontWeight: "700",
      marginBottom: 12,
      fontSize: 15,
    },

    trendingChip: {
      backgroundColor:
        "rgba(255,255,255,0.08)",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.05)",
    },

    trendingChipText: {
      color: "#FFF",
      fontSize: 13,
      maxWidth: 140,
    },

    categories: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
    },

    categoryBtn: {
      backgroundColor:
        Colors.surface,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.05)",
    },

    categoryBtnActive: {
      backgroundColor:
        Colors.primary,
    },

    categoryText: {
      color:
        Colors.textSecondary,
      fontWeight: "600",
      fontSize: 13,
    },

    categoryTextActive: {
      color: "#FFF",
    },

    statsRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      marginTop: 16,
      gap: 12,
    },

    statCard: {
      flex: 1,
      backgroundColor:
        Colors.surface,
      borderRadius: 22,
      paddingVertical: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.04)",
    },

    statValue: {
      color: "#FFF",
      fontSize: 22,
      fontWeight: "bold",
      marginTop: 10,
    },

    statLabel: {
      color:
        Colors.textSecondary,
      marginTop: 6,
      fontSize: 12,
    },

    sectionHeader: {
      paddingHorizontal: 16,
      marginTop: 28,
      marginBottom: 18,
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    sectionTitle: {
      color: "#FFF",
      fontSize: 28,
      fontWeight: "bold",
    },

    sectionSubtitle: {
      color:
        Colors.textSecondary,
      marginTop: 4,
      fontSize: 13,
    },

    sectionCount: {
      color:
        Colors.textMuted,
      fontSize: 12,
    },

    card: {
      width: CARD_WIDTH,
      height: 440,
      borderRadius: 32,
      overflow: "hidden",
      marginRight: 16,
      backgroundColor:
        Colors.surface,
    },

    cardImage: {
      width: "100%",
      height: "100%",
    },

    noImageOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    },

    noImageText: {
      color: "#FFF",
      fontWeight: "600",
      fontSize: 14,
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
    },

    cardContent: {
      position: "absolute",
      left: 18,
      right: 18,
      bottom: 18,
    },

    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 14,
    },

    badgeText: {
      color: "#FFF",
      fontWeight: "700",
      fontSize: 11,
    },

    cardTitle: {
      color: "#FFF",
      fontSize: 26,
      fontWeight: "bold",
    },

    cardDescription: {
      color:
        "rgba(255,255,255,0.72)",
      marginTop: 10,
      lineHeight: 20,
      fontSize: 13,
    },

    footer: {
      marginTop: 18,
    },

    locationRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    location: {
      color: "#FFF",
      marginLeft: 4,
      flex: 1,
      fontSize: 13,
    },

    metricsRow: {
      flexDirection: "row",
      marginTop: 14,
      gap: 10,
      flexWrap: "wrap",
    },

    metricBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "rgba(255,255,255,0.1)",
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 14,
    },

    metricText: {
      color: "#FFF",
      marginLeft: 5,
      fontSize: 12,
      fontWeight: "700",
    },

    loadingContainer: {
      flex: 1,
      padding: 16,
      paddingTop: 80,
    },

    fakeHero: {
      width: "100%",
      height: 120,
      borderRadius: 24,
      backgroundColor:
        "#1D1D1D",
      marginBottom: 24,
    },

    fakeCard: {
      width: "100%",
      height: 260,
      borderRadius: 28,
      marginBottom: 24,
      backgroundColor:
        "#1D1D1D",
    },

    modalOverlay: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "rgba(0,0,0,0.6)",
      padding: 24,
    },

    modal: {
      width: "100%",
      borderRadius: 28,
      padding: 28,
      overflow: "hidden",
      alignItems: "center",
    },

    modalTitle: {
      color: "#FFF",
      fontSize: 24,
      fontWeight: "bold",
    },

    modalText: {
      color:
        "rgba(255,255,255,0.7)",
      marginTop: 12,
      marginBottom: 24,
      textAlign: "center",
      lineHeight: 22,
    },

    modalButton: {
      backgroundColor:
        Colors.primary,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: "center",
      width: "100%",
    },

    modalButtonText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: 15,
    },
  });
