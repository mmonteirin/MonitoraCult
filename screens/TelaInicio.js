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

import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

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

    const { colors, isDark } = useTheme();
    const styles = useThemedStyles(createThemedScreenStyles);
    const blurTint = isDark ? "dark" : "light";

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

    const dataAtual = useMemo(() => {
        const hoje = new Date();
        const opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
        return hoje.toLocaleDateString('pt-BR', opcoes);
    }, []);

    useEffect(() => {
        carregarHome();
    }, [usuarioId]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

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
                ["rgba(0,0,0,0)", colors.background]
            ),

            opacity: interpolate(
                scrollY.value,
                [0, 120],
                [1, 0.98],
                Extrapolate.CLAMP
            ),
        };
    }, [colors.background]);

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
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <MaterialCommunityIcons
                    name="calendar-star"
                    size={60}
                    color={colors.primary}
                />

                <Text style={styles.loadingText}>
                    Carregando eventos...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
                        tintColor={colors.primary}
                    />
                }
            >
                {/* HEADER */}
                <Animated.View
                    entering={FadeInDown.duration(800).delay(100)}
                    style={headerStyle}
                >
                    <LinearGradient
                        colors={[
                            colors.background,
                            colors.backgroundSecondary,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.headerContainer,
                            {
                                paddingTop: insets.top + 12,
                            },
                        ]}
                    >
                        <View style={styles.header}>
                            <View style={styles.headerCopy}>
                                <Animated.View entering={FadeInDown.duration(600).delay(150)}>
                                    <Text style={styles.greeting}>
                                        {saudacaoHorario}
                                    </Text>

                                    <Text
                                        style={styles.name}
                                        numberOfLines={2}
                                    >
                                        {nomeUsuario}
                                    </Text>

                                    <Text style={styles.date}>
                                        {dataAtual}
                                    </Text>

                                    <View style={styles.eventCountContainer}>
                                        <MaterialCommunityIcons
                                            name="calendar-check"
                                            size={14}
                                            color={colors.primary}
                                        />
                                        <Text style={styles.eventCountText}>
                                            {eventosFiltrados.length} eventos hoje
                                        </Text>
                                    </View>
                                </Animated.View>
                            </View>

                            <Animated.View
                                entering={FadeInRight.duration(600).delay(300)}
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
                                        tint={blurTint}
                                        style={styles.headerBlur}
                                    >
                                        <MaterialCommunityIcons
                                            name="magnify"
                                            size={22}
                                            color={colors.textPrimary}
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
                                        tint={blurTint}
                                        style={styles.headerBlur}
                                    >
                                        <MaterialCommunityIcons
                                            name="bell-outline"
                                            size={22}
                                            color={colors.textPrimary}
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
                    <BlurView intensity={70} tint={blurTint} style={StyleSheet.absoluteFill}>
                        <LinearGradient
                            colors={
                                isDark
                                    ? ["rgba(10, 8, 20, 0.96)", "rgba(139, 92, 246, 0.12)", "rgba(7, 11, 20, 0.98)"]
                                    : ["rgba(255, 255, 255, 0.96)", "rgba(108, 92, 231, 0.08)", "rgba(248, 249, 250, 0.98)"]
                            }
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
                                <BlurView intensity={25} tint={blurTint} style={styles.modalCloseBlur}>
                                    <MaterialCommunityIcons name="close" size={20} color={colors.textPrimary} />
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

function createThemedScreenStyles(c) {
    return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: c.background,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        color: c.textPrimary,
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
        borderColor: c.glassBorder,
        backgroundColor: c.glass,
    },

    notificationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: c.primary,
        position: "absolute",
        right: 13,
        top: 13,
    },

    greeting: {
        color: c.textSecondary,
        fontSize: 15,
    },

    name: {
        color: c.textPrimary,
        fontSize: 28,
        fontWeight: "800",
        marginTop: 4,
        lineHeight: 34,
    },

    date: {
        color: c.textSecondary,
        fontSize: 13,
        marginTop: 6,
        textTransform: 'capitalize',
    },

    eventCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },

    eventCountText: {
        color: c.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },

    /* CULTURAL AI NEW STYLES */
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        backgroundColor: c.overlayDark,
    },

    modalContent: {
        width: "100%",
        height: "82%",
        backgroundColor: c.card,
        borderRadius: 32,
        padding: 22,
        borderWidth: 1,
        borderColor: c.glassBorder,
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
        borderColor: c.glassBorder,
        backgroundColor: c.glass,
    },

    typewriterBox: {
        backgroundColor: c.primarySoft,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: c.glassBorder,
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
        color: c.textPrimary,
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "600",
    },

    cursor: {
        color: c.primaryLight,
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
        borderColor: c.glassBorder,
        backgroundColor: c.glass,
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
        color: c.textMuted,
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
    },

    aiCardTitle: {
        color: c.textPrimary,
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
        color: c.textSecondary,
        fontSize: 13,
        fontWeight: "500",
    },

    aiReasonBubble: {
        backgroundColor: c.overlayLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: c.glassBorder,
    },

    aiReasonText: {
        color: c.primaryLight,
        fontSize: 12,
        fontWeight: "600",
        lineHeight: 18,
    },

    modalExploreButton: {
        backgroundColor: c.primary,
        height: 52,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
        shadowColor: c.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },

    modalExploreButtonText: {
        color: c.onPrimary,
        fontWeight: "bold",
        fontSize: 14,
    },
});
}