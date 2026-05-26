import React, { useEffect, useMemo, useState, useRef } from "react";

import {
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    ScrollView,
    Dimensions,
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

    const [modalAIVisivel, setModalAIVisivel] = useState(false);
    const [insightsGerados, setInsightsGerados] = useState([]);
    const [textoTypewriter, setTextoTypewriter] = useState("");
    const intervalRef = useRef(null);

    const gerarIntroducaoIA = (nome, termo, clima, eventosCount) => {
        const saudacao = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";
        const focoMap = {
            orla: "focado na Orla e Praias 🏖️",
            gratuito: "com foco em Eventos Gratuitos 🎟️",
            show: "especial para curtir Shows e Música ao Vivo 🎸",
            teatro: "recheado de Teatro e Artes Cênicas 🎭"
        };
        const focoText = focoMap[termo] || "super especial e sob medida 🎨";
        
        if (eventosCount === 0) {
            return `Olá, ${nome}! ${saudacao}. Analisei o pulso cultural de Fortaleza hoje mas não encontrei eventos ativos correspondentes a essa categoria específica no momento. Que tal tentarmos outro foco? ✨`;
        }

        return `Olá, ${nome}! ${saudacao}. Analisei os eventos ativos em Fortaleza e, baseado no clima de ${clima}, montei este roteiro exclusivo ${focoText} com ${eventosCount} paradas perfeitas para você curtir hoje! 👇`;
    };

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

            // 1. Gera os roteiros contextuais pela IA com sinais do usuário
            const roteiroSugerido = await gerarInsightsCulturais(
                termoBusca,
                eventosFiltrados,
                sinaisUsuario
            );

            setInsightsGerados(roteiroSugerido);

            // 2. Abre o modal glassmorphic
            setModalAIVisivel(true);

            // 3. Inicia o efeito typewriter de digitação em tempo real
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            const introducao = gerarIntroducaoIA(
                nomeUsuario,
                termoBusca,
                "29°C",
                roteiroSugerido.length
            );

            setTextoTypewriter("");
            let index = 0;
            intervalRef.current = setInterval(() => {
                if (index < introducao.length) {
                    setTextoTypewriter((prev) => prev + introducao.charAt(index));
                    index++;
                } else {
                    clearInterval(intervalRef.current);
                }
            }, 10);
        } catch (error) {
            console.log("Erro ao gerar roteiro na IA:", error);
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
                                "TelaExploreCidade",
                                { eventos: eventosFiltrados }
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

            {/* MODAL CULTURAL AI HOLOGRÁFICO GLASSMORPHIC */}
            <Modal
                visible={modalAIVisivel}
                animationType="fade"
                transparent={true}
                onRequestClose={() => {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setModalAIVisivel(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
                        <LinearGradient
                            colors={["rgba(10, 8, 20, 0.96)", "rgba(139, 92, 246, 0.12)", "rgba(7, 11, 20, 0.98)"]}
                            style={StyleSheet.absoluteFill}
                        />
                    </BlurView>

                    <Animated.View 
                        entering={FadeInDown.springify().damping(18)}
                        style={styles.modalContent}
                    >
                        {/* Header do Modal */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalAiBadge}>
                                <MaterialCommunityIcons name="robot" size={16} color="#FFF" />
                                <Text style={styles.modalAiBadgeText}>ASSISTENTE CULTURAL AI</Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.modalCloseButton}
                                onPress={() => {
                                    if (intervalRef.current) clearInterval(intervalRef.current);
                                    setModalAIVisivel(false);
                                }}
                            >
                                <BlurView intensity={25} tint="light" style={styles.modalCloseBlur}>
                                    <MaterialCommunityIcons name="close" size={20} color="#FFF" />
                                </BlurView>
                            </TouchableOpacity>
                        </View>

                        {/* Efeito Typewriter */}
                        <View style={styles.typewriterBox}>
                            <MaterialCommunityIcons name="comment-text-multiple-outline" size={18} color="#C084FC" style={styles.quoteIcon} />
                            <Text style={styles.typewriterText}>
                                {textoTypewriter}
                                <Text style={styles.cursor}>|</Text>
                            </Text>
                        </View>

                        {/* Roteiro Carousel */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalCardsScroll}
                        >
                            {insightsGerados.map((evento, index) => (
                                <Animated.View
                                    key={evento.id || index}
                                    entering={FadeInDown.delay(200 + index * 100).springify().damping(16)}
                                    style={styles.aiEventCardOuter}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.92}
                                        style={styles.aiEventCard}
                                        onPress={() => {
                                            setModalAIVisivel(false);
                                            abrirEvento(evento);
                                        }}
                                    >
                                        <LinearGradient
                                            colors={["rgba(255, 255, 255, 0.04)", "rgba(255, 255, 255, 0.01)"]}
                                            style={styles.aiEventGlow}
                                        >
                                            {/* Match Badge */}
                                            <View style={styles.aiCardTop}>
                                                <View style={styles.matchBadge}>
                                                    <MaterialCommunityIcons name="heart-flash" size={12} color="#FFF" />
                                                    <Text style={styles.matchBadgeText}>
                                                        {evento.matchPercent || 88}% Match
                                                    </Text>
                                                </View>

                                                <Text style={styles.aiCardCategory} numberOfLines={1}>
                                                    {evento.categoria || "Cultura"}
                                                </Text>
                                            </View>

                                            <Text style={styles.aiCardTitle} numberOfLines={1}>
                                                {evento.tituloEvento || evento.titulo || evento.name || "Evento Recomendado"}
                                            </Text>

                                            <View style={styles.aiCardLocalRow}>
                                                <MaterialCommunityIcons name="map-marker-outline" size={14} color="#C084FC" />
                                                <Text style={styles.aiCardLocalText} numberOfLines={1}>
                                                    {evento.localEvento || evento.local || "Fortaleza, CE"}
                                                </Text>
                                            </View>

                                            {/* AI Reason Bubble */}
                                            <View style={styles.aiReasonBubble}>
                                                <Text style={styles.aiReasonText}>
                                                    {evento.aiReason || "✨ Recomendação inteligente baseada no seu perfil."}
                                                </Text>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </ScrollView>

                        {/* Botão de Rodapé */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.modalExploreButton}
                            onPress={() => {
                                setModalAIVisivel(false);
                                navigation.navigate("Busca", {
                                    screen: "BuscaHome",
                                });
                            }}
                        >
                            <Text style={styles.modalExploreButtonText}>
                                Abrir no Mapa de Busca Completo 🧭
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
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

    /* CULTURAL AI NEW STYLES */
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        backgroundColor: "rgba(0,0,0,0.6)",
    },

    modalContent: {
        width: "100%",
        height: "82%",
        backgroundColor: "rgba(18, 14, 36, 0.92)",
        borderRadius: 32,
        padding: 22,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        overflow: "hidden",
        justifyContent: "space-between",
    },

    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },

    modalAiBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(139, 92, 246, 0.35)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: "rgba(192, 132, 252, 0.2)",
    },

    modalAiBadgeText: {
        color: "#E9D5FF",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.5,
    },

    modalCloseButton: {
        zIndex: 10,
    },

    modalCloseBlur: {
        width: 38,
        height: 38,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.05)",
    },

    typewriterBox: {
        backgroundColor: "rgba(139, 92, 246, 0.08)",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(139, 92, 246, 0.12)",
        marginBottom: 18,
        flexDirection: "row",
        alignItems: "flex-start",
    },

    quoteIcon: {
        marginRight: 10,
        marginTop: 2,
    },

    typewriterText: {
        flex: 1,
        color: "#F3E8FF",
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "600",
    },

    cursor: {
        color: "#C084FC",
        fontWeight: "bold",
    },

    modalCardsScroll: {
        gap: 12,
        paddingBottom: 16,
    },

    aiEventCardOuter: {
        borderRadius: 22,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        marginBottom: 12,
    },

    aiEventCard: {
        width: "100%",
    },

    aiEventGlow: {
        padding: 16,
    },

    aiCardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },

    matchBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#8B5CF6",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },

    matchBadgeText: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "800",
    },

    aiCardCategory: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
    },

    aiCardTitle: {
        color: "#FFF",
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 6,
    },

    aiCardLocalRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
    },

    aiCardLocalText: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 13,
        fontWeight: "500",
    },

    aiReasonBubble: {
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.03)",
    },

    aiReasonText: {
        color: "#D8B4FE",
        fontSize: 12,
        fontWeight: "600",
        lineHeight: 18,
    },

    modalExploreButton: {
        backgroundColor: Colors.primary,
        height: 52,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },

    modalExploreButtonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 14,
    },
});