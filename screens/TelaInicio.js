import React, { useEffect, useMemo, useState } from "react";

import {
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import Animated, {
	interpolate,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";

import { BlurView } from "expo-blur";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useNavigation } from "@react-navigation/native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";

import {
	getEventosApp,
	getUserEventInteractions,
	getUserLikes,
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
	buildUserSignals,
	categoriasHome,
	normalizeEvento,
	scoreRecommendation,
} from "../components/home/homeUtils";

export default function TelaInicio() {
	const navigation = useNavigation();

	const insets = useSafeAreaInsets();

	const { user, nome } = useAuth();

	const [eventos, setEventos] = useState([]);

	const [loading, setLoading] = useState(true);

	const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");

	const [location, setLocation] = useState(null);

	const [likes, setLikes] = useState([]);

	const [interactions, setInteractions] = useState([]);

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

			const [
				eventosData,
				usuario,
				likesData,
				interactionsData,
			] = await Promise.all([
				getEventosApp(),
				getUserLocation(),
				getUserLikes(usuarioId),
				getUserEventInteractions(usuarioId),
			]);

			setEventos(eventosData.map(normalizeEvento));

			setLocation(usuario);

			setLikes(likesData);

			setInteractions(interactionsData);
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

	const sinaisUsuario = useMemo(
		() => buildUserSignals({ likes, interactions }),
		[likes, interactions]
	);

	const destaques = useMemo(() => {
		return eventosFiltrados
			.slice()
			.sort((a, b) => b.score - a.score)
			.slice(0, 8);
	}, [eventosFiltrados]);

	const recomendados = useMemo(() => {
		return eventosFiltrados
			.slice()
			.sort(
				(a, b) =>
					scoreRecommendation(
						b,
						sinaisUsuario
					) -
					scoreRecommendation(
						a,
						sinaisUsuario
					)
			)
			.slice(0, 8);
	}, [eventosFiltrados, sinaisUsuario]);

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

	const headerStyle = useAnimatedStyle(() => ({
		transform: [
			{
				translateY: interpolate(
					scrollY.value,
					[0, 140],
					[0, -8],
					"clamp"
				),
			},
		],

		opacity: interpolate(
			scrollY.value,
			[0, 140],
			[1, 0.96],
			"clamp"
		),
	}));

	const momentStyle = useAnimatedStyle(() => ({
		transform: [
			{
				scale: interpolate(
					scrollY.value,
					[-120, 0, 220],
					[1.03, 1, 0.985]
				),
			},
		],
	}));

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

	const abrirMapaVivo = () => {
		navigation.navigate("MapaVivo");
	};

	const abrirExploreCidade = () => {
		navigation.navigate("TelaExploreCidade");
	};

	const abrirEventosProximos = () => {
		navigation.navigate("Busca", {
			screen: "BuscaHome",
		});
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
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: insets.bottom + 140,
				}}
				onScroll={verticalScroll}
				scrollEventThrottle={16}
				bounces
			>
				<Animated.View style={headerStyle}>
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

							<View style={styles.headerActions}>
								<TouchableOpacity
									activeOpacity={0.9}
									style={styles.headerButton}
									onPress={() =>
										navigation.navigate(
											"Busca"
										)
									}
								>
									<BlurView
										intensity={25}
										tint="dark"
										style={styles.headerBlur}
									>
										<MaterialCommunityIcons
											name="magnify"
											size={22}
											color={
												Colors.textPrimary
											}
										/>
									</BlurView>
								</TouchableOpacity>

								<TouchableOpacity
									activeOpacity={0.9}
									style={styles.headerButton}
									onPress={() =>
										navigation.navigate(
											"EventosApp"
										)
									}
								>
									<BlurView
										intensity={25}
										tint="dark"
										style={styles.headerBlur}
									>
										<MaterialCommunityIcons
											name="bell-outline"
											size={22}
											color={
												Colors.textPrimary
											}
										/>

										<View
											style={
												styles.notificationDot
											}
										/>
									</BlurView>
								</TouchableOpacity>
							</View>
						</View>
					</LinearGradient>
				</Animated.View>

				<HeroSection
					evento={destaques[0]}
					animatedStyle={momentStyle}
					onPress={abrirEvento}
				/>

				<StoryBar
					eventos={destaques}
					onPress={abrirEvento}
				/>

				<CategoryPills
					categorias={categoriasHome}
					ativa={categoriaAtiva}
					onChange={setCategoriaAtiva}
				/>

				<CulturalAISection
					eventos={eventosFiltrados}
				/>

				<RecommendationSection
					eventos={recomendados}
					signals={sinaisUsuario}
					onPress={abrirEvento}
				/>

				<SectionHeader
					title="Destaques"
					subtitle="Eventos em alta agora"
				/>

				<TrendingCarousel
					eventos={destaques}
					scrollX={scrollX}
					onScroll={horizontalScroll}
					onPress={abrirEvento}
				/>

				<LiveMapCard
					activeCount={proximos.length}
					onPress={abrirMapaVivo}
				/>

				<ExploreCitySection
					eventos={eventosFiltrados}
					onPress={abrirExploreCidade}
				/>

				<NearbySection
					eventos={proximos}
					onPress={abrirEvento}
					onViewAll={abrirEventosProximos}
				/>
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
		width: 50,
		height: 50,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		borderWidth: 1,
		borderColor: Colors.glassBorder,
		backgroundColor: Colors.glass,
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
