import React, { useEffect, useMemo, useState } from "react";

import {
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import Animated, {
    interpolate,
    interpolateColor,
    Extrapolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeInLeft,
    FadeInRight,
    withSpring,
} from "react-native-reanimated";

import { BlurView } from "expo-blur";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import {
    getEventosApp,
    trackUserEventInteraction,
} from "../services/eventosAppService";

import { getUserLocation } from "../services/locationService";

import { calcularDistancia } from "../utils/distance";

import { useAuth } from "../context/AuthContext";

import { Colors } from "../styles/Colors";

import CategoryPills from "../components/home/CategoryPills";

import CulturalAISection from "../components/home/CulturalAISection";

import ExploreCitySection from "../components/home/ExploreCitySection";

import HeroSection from "../components/home/HeroSection";

import LiveMapCard from "../components/home/LiveMapCard";

import NearbySection from "../components/home/NearbySection";

import RecommendationSection from "../components/home/RecommendationSection";

import SectionHeader from "../components/home/SectionHeader";

import StoryBar from "../components/home/StoryBar";

import TrendingCarousel from "../components/home/TrendingCarousel";

import {
    categoriasHome,
    normalizeEvento,
} from "../components/home/homeUtils";

import useRecomendacoes from "../hooks/useRecomendacoes";

import { gerarInsightsCulturais } from "../services/aiService";

export default function TelaInicio() {
    const navigation = useNavigation();

    const insets = useSafeAreaInsets();

    const { user, nome } = useAuth();

    const [eventos, setEventos] = useState([]);

    const [loading, setLoading] = useState(true);

    const [categoriaAtiva, setCategoriaAtiva] =
        useState("Todos");

    const [location, setLocation] = useState(null);

    const scrollY = useSharedValue(0);

    const scrollX = useSharedValue(0);

    const usuarioId = user?.uid;

    const nomeUsuario =
        nome ||
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "Explorador";

    const saudacaoHorario = useMemo(() => {
        const hora = new Date().getHours();

        if (hora < 12) return "Bom dia";

        if (hora < 18) return "Boa tarde";

        return "Boa noite";
    }, []);

    useEffect(() => {
        carregarHome();
    }, [usuarioId]);

    const carregarHome = async () => {
        try {
            setLoading(true);

            const [eventosData, usuario] =
                await Promise.all([
                    getEventosApp(),
                    getUserLocation(),
                ]);

            const normalizados =
                eventosData.map(normalizeEvento);

            setEventos(normalizados);

            setLocation(usuario);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const eventosComDistancia = useMemo(() => {
        return eventos.map((item) => ({
            ...item,

            distancia:
                location &&
                item.latitude != null &&
                item.longitude != null
                    ? calcularDistancia(
                          location.latitude,
                          location.longitude,
                          item.latitude,
                          item.longitude
                      )
                    : null,
        }));
    }, [eventos, location]);

    const eventosFiltrados = useMemo(() => {
        if (categoriaAtiva === "Todos") {
            return eventosComDistancia;
        }

        return eventosComDistancia.filter((evento) =>
            evento.categoria
                ?.toLowerCase()
                .includes(categoriaAtiva.toLowerCase())
        );
    }, [categoriaAtiva, eventosComDistancia]);

    const {
        recomendados,
        sinaisUsuario,
        loading: loadingRecomendacoes,
        refresh: refreshRecomendacoes,
    } = useRecomendacoes(
        eventosFiltrados,
        usuarioId
    );

    const destaques = useMemo(() => {
        return eventosFiltrados
            .slice()
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    }, [eventosFiltrados]);

    const proximos = useMemo(() => {
        const comDistancia = eventosFiltrados.filter(
            (item) => typeof item.distancia === "number"
        );

        return (comDistancia.length
            ? comDistancia
            : eventosFiltrados
        )
            .slice()
            .sort((a, b) => {
                if (a.distancia == null) return 1;

                if (b.distancia == null) return -1;

                return a.distancia - b.distancia;
            })
            .slice(0, 10);
    }, [eventosFiltrados]);

    const verticalScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const horizontalScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const headerStyle = useAnimatedStyle(() => {
        const backgroundOpacity = interpolate(
            scrollY.value,
            [0, 120],
            [0, 1],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [0, 180],
                        [0, -12],
                        Extrapolate.CLAMP
                    ),
                },
            ],

            backgroundColor: interpolateColor(
                backgroundOpacity,
                [0, 1],
                ["rgba(0,0,0,0)", Colors.background]
            ),

            opacity: interpolate(
                scrollY.value,
                [0, 120],
                [1, 0.98],
                Extrapolate.CLAMP
            ),
        };
    });

    const momentStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    scale: interpolate(
                        scrollY.value,
                        [-160, 0, 250],
                        [1.08, 1, 0.94],
                        Extrapolate.CLAMP
                    ),
                },

                {
                    translateY: interpolate(
                        scrollY.value,
                        [0, 300],
                        [0, 18],
                        Extrapolate.CLAMP
                    ),
                },
            ],

            opacity: interpolate(
                scrollY.value,
                [0, 320],
                [1, 0.85],
                Extrapolate.CLAMP
            ),
        };
    });

    const abrirEvento = async (evento) => {
        try {
            await Haptics.selectionAsync();
        } catch (e) {}

        const original = evento.original || evento;

        trackUserEventInteraction({
            evento: {
                ...original,
                id: evento.id,
            },

            usuarioId,

            action: "click",
        });

        navigation.navigate("Detalhes", {
            evento: original,
        });
    };

    const lidarComAIGerada = async (termoBusca) => {
        try {
            try {
                await Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Medium
                );
            } catch (e) {}

            let textoPesquisaInput = "";

            if (termoBusca === "orla")
                textoPesquisaInput = "Orla";

            if (termoBusca === "gratuito")
                textoPesquisaInput = "Gratuito";

            if (termoBusca === "show")
                textoPesquisaInput = "Show";

            if (termoBusca === "teatro")
                textoPesquisaInput = "Teatro";

            const roteiroSugerido =
                await gerarInsightsCulturais(
                    termoBusca,
                    eventosFiltrados
                );

            navigation.navigate("Busca", {
                screen: "BuscaHome",

                params: {
                    queryIA: textoPesquisaInput,

                    resultadosIA: roteiroSugerido,
                },
            });
        } catch (error) {
            console.log(error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <MaterialCommunityIcons
                    name="calendar-star"
                    size={60}
                    color={Colors.primary}
                />

                <Text style={styles.loadingText}>
                    Carregando eventos...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <Animated.ScrollView
                entering={FadeIn.duration(700)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 140,
                }}
                onScroll={verticalScroll}
                scrollEventThrottle={16}
                bounces
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={() => {
                            carregarHome();
                            refreshRecomendacoes();
                        }}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* HEADER */}
                <Animated.View
                    entering={FadeInDown.duration(700)}
                    style={headerStyle}
                >
                    <LinearGradient
                        colors={[
                            Colors.backgroundSecondary,
                            Colors.surface,
                            Colors.background,
                        ]}
                        style={[
                            styles.headerContainer,
                            {
                                paddingTop: insets.top + 12,
                            },
                        ]}
                    >
                        <View style={styles.header}>
                            <View style={styles.headerCopy}>
                                <Text style={styles.greeting}>
                                    {saudacaoHorario}
                                </Text>

                                <Text
                                    style={styles.name}
                                    numberOfLines={1}
                                >
                                    {nomeUsuario}
                                </Text>

                                <Text style={styles.city}>
                                    Fortaleza, CE
                                </Text>
                            </View>

                            <Animated.View
                                entering={FadeInRight.delay(250)}
                                style={styles.headerActions}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.headerButton}
                                    onPress={() =>
                                        navigation.navigate(
                                            "Busca"
                                        )
                                    }
                                >
                                    <BlurView
                                        intensity={35}
                                        tint="dark"
                                        style={styles.headerBlur}
                                    >
                                        <MaterialCommunityIcons
                                            name="magnify"
                                            size={22}
                                            color="#FFF"
                                        />
                                    </BlurView>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.headerButton}
                                    onPress={() =>
                                        navigation.navigate(
                                            "EventosApp"
                                        )
                                    }
                                >
                                    <BlurView
                                        intensity={35}
                                        tint="dark"
                                        style={styles.headerBlur}
                                    >
                                        <MaterialCommunityIcons
                                            name="bell-outline"
                                            size={22}
                                            color="#FFF"
                                        />

                                        <View
                                            style={
                                                styles.notificationDot
                                            }
                                        />
                                    </BlurView>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* HERO */}
                <Animated.View
                    entering={FadeInUp.delay(120).springify()}
                >
                    <HeroSection
                        evento={destaques[0]}
                        animatedStyle={momentStyle}
                        onPress={abrirEvento}
                    />
                </Animated.View>

                {/* STORIES */}
                <Animated.View
                    entering={FadeInLeft.delay(180).springify()}
                >
                    <StoryBar
                        eventos={destaques}
                        onPress={abrirEvento}
                    />
                </Animated.View>

                {/* CATEGORIAS */}
                <Animated.View
                    entering={FadeInRight.delay(220).springify()}
                >
                    <CategoryPills
                        categorias={categoriasHome}
                        ativa={categoriaAtiva}
                        onChange={setCategoriaAtiva}
                    />
                </Animated.View>

                {/* IA */}
                <Animated.View
                    entering={FadeInUp.delay(260).springify()}
                >
                    <CulturalAISection
                        onPressInsight={lidarComAIGerada}
                    />
                </Animated.View>

                {/* RECOMENDAÇÕES */}
                <Animated.View
                    entering={FadeInUp.delay(320).springify()}
                >
                    <RecommendationSection
                        eventos={recomendados}
                        signals={sinaisUsuario}
                        loading={loadingRecomendacoes}
                        onPress={abrirEvento}
                    />
                </Animated.View>

                <SectionHeader
                    title="Destaques"
                    subtitle="Eventos em alta agora"
                />

                {/* TRENDING */}
                <Animated.View
                    entering={FadeInUp.delay(380).springify()}
                >
                    <TrendingCarousel
                        eventos={destaques}
                        scrollX={scrollX}
                        onScroll={horizontalScroll}
                        onPress={abrirEvento}
                    />
                </Animated.View>

                {/* MAPA */}
                <Animated.View
                    entering={FadeInUp.delay(440).springify()}
                >
                    <LiveMapCard
                        activeCount={proximos.length}
                        onPress={() =>
                            navigation.navigate("MapaVivo")
                        }
                    />
                </Animated.View>

                {/* EXPLORE */}
                <Animated.View
                    entering={FadeInUp.delay(500).springify()}
                >
                    <ExploreCitySection
                        eventos={eventosFiltrados}
                        onPress={() =>
                            navigation.navigate(
                                "TelaExploreCidade"
                            )
                        }
                    />
                </Animated.View>

                {/* PRÓXIMOS */}
                <Animated.View
                    entering={FadeInUp.delay(560).springify()}
                >
                    <NearbySection
                        eventos={proximos}
                        onPress={abrirEvento}
                        onViewAll={() =>
                            navigation.navigate("Busca", {
                                screen: "BuscaHome",
                            })
                        }
                    />
                </Animated.View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        color: Colors.textPrimary,
        fontSize: 15,
        fontWeight: "600",
        marginTop: 16,
    },

    headerContainer: {
        paddingBottom: 18,
    },

    header: {
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    headerCopy: {
        flex: 1,
        paddingRight: 14,
    },

    headerActions: {
        flexDirection: "row",
        alignItems: "center",
    },

    headerButton: {
        marginLeft: 10,
    },

    headerBlur: {
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.04)",
    },

    notificationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        position: "absolute",
        right: 13,
        top: 13,
    },

    greeting: {
        color: Colors.textSecondary,
        fontSize: 15,
    },

    name: {
        color: Colors.textPrimary,
        fontSize: 32,
        fontWeight: "800",
        marginTop: 4,
    },

    city: {
        color: Colors.textMuted,
        fontSize: 14,
        marginTop: 6,
    },
});