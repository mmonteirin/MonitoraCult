import React, { useEffect, useMemo, useState } from "react";

import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Linking,
	Modal,
	Image,
	ScrollView,
} from "react-native";

import Animated, {
	FadeInDown,
	FadeInRight,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	interpolate,
	useAnimatedScrollHandler,
} from "react-native-reanimated";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";

import { getUserLocation } from "../services/locationService";
import { calcularDistancia } from "../utils/distance";

import { getEventosApp, getUserLikes } from "../services/eventosAppService";

import { useAuth } from "../context/AuthContext";
import { Colors } from "../styles/Colors";

const windowWidth = Dimensions.get("window").width;

const DEFAULT_IMAGE = "https://placehold.co/600x400?text=Evento";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

const categorias = [
	"Todos",
	"Shows",
	"Teatro",
	"Arte",
	"Gastronomia",
	"Festival",
];

export default function TelaInicio() {
	const navigation = useNavigation();

	const { user, nome } = useAuth();

	const [eventos, setEventos] = useState([]);

	const [loading, setLoading] = useState(true);

	const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");

	const [location, setLocation] = useState(null);

	const [showMapErrorModal, setShowMapErrorModal] = useState(false);

	const [mapErrorMessage, setMapErrorMessage] = useState("");

	const scrollX = useSharedValue(0);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollX.value = event.contentOffset.x;
		},
	});

	const nomeUsuario =
		nome || user?.displayName || user?.email?.split("@")[0] || "Explorador";

	// SAUDAÇÃO DINÂMICA
	const saudacaoHorario = useMemo(() => {
		const hora = new Date().getHours();

		if (hora < 12) return "Bom dia ☀️";

		if (hora < 18) return "Boa tarde 🌤️";

		return "Boa noite 🌙";
	}, []);

	useEffect(() => {
		carregarEventos();
	}, []);

	const carregarEventos = async () => {
		try {
			const data = await getEventosApp();

			const tratados = data.map((item) => ({
				id: item.id,

				titulo: item.tituloEvento || item.name || "Evento",

				imagem: item.imagemEvento || item.files?.header?.url || DEFAULT_IMAGE,

				local:
					item.localEvento || item.nomeLocal || item.location?.name || "Local",

				categoria: item.categoria || item.tipoEvento || "Outros",

				latitude: item.latitude ?? null,

				longitude: item.longitude ?? null,

				score: item.score || 0,

				original: item,
			}));

			const usuario = await getUserLocation();

			if (usuario) {
				setLocation(usuario);
			}

			setEventos(tratados);
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
				location && item.latitude != null && item.longitude != null
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
			evento.categoria?.toLowerCase().includes(categoriaAtiva.toLowerCase())
		);
	}, [categoriaAtiva, eventosComDistancia]);

	const destaques = useMemo(() => {
		return eventosFiltrados
			.slice()
			.sort((a, b) => b.score - a.score)
			.slice(0, 8);
	}, [eventosFiltrados]);

	const proximos = useMemo(() => {
		return eventosFiltrados
			.filter((item) => typeof item.distancia === "number")
			.sort((a, b) => a.distancia - b.distancia)
			.slice(0, 6);
	}, [eventosFiltrados]);

	const formatarDistancia = (distancia) => {
		if (distancia == null) return "Distância indisponível";

		if (distancia < 1) {
			return `${Math.round(distancia * 1000)} m`;
		}

		return `${distancia.toFixed(1)} km`;
	};

	const HeroCard = ({ item, index }) => {
		const scale = useSharedValue(1);

		const animatedStyle = useAnimatedStyle(() => ({
			transform: [
				{
					scale: scale.value,
				},
			],
		}));

		const imageStyle = useAnimatedStyle(() => {
			const imageScale = interpolate(
				scrollX.value,
				[
					(index - 1) * (windowWidth * 0.78 + 16),

					index * (windowWidth * 0.78 + 16),

					(index + 1) * (windowWidth * 0.78 + 16),
				],
				[1, 1.08, 1]
			);

			return {
				transform: [
					{
						scale: imageScale,
					},
				],
			};
		});

		return (
			<Animated.View
				entering={FadeInRight.delay(index * 100).springify()}
				style={animatedStyle}
			>
				<TouchableOpacity
					activeOpacity={0.95}
					style={styles.heroCard}
					onPressIn={() => {
						scale.value = withSpring(0.97);
					}}
					onPressOut={() => {
						scale.value = withSpring(1);
					}}
					onPress={() =>
						navigation.navigate("Detalhes", {
							evento: item.original,
						})
					}
				>
					<Animated.Image
						source={{
							uri: item.imagem,
						}}
						style={[styles.heroImage, imageStyle]}
					/>

					<LinearGradient
						colors={["transparent", "rgba(0,0,0,0.95)"]}
						style={styles.heroGradient}
					/>

					<View style={styles.heroContent}>
						<View style={styles.heroBadge}>
							<Text style={styles.heroBadgeText}>{item.categoria}</Text>
						</View>

						<Text style={styles.heroTitle} numberOfLines={2}>
							{item.titulo}
						</Text>

						<Text style={styles.heroLocation}>📍 {item.local}</Text>
					</View>
				</TouchableOpacity>
			</Animated.View>
		);
	};

	const CardEvento = ({ item, index }) => {
		return (
			<Animated.View entering={FadeInDown.delay(index * 100).springify()}>
				<TouchableOpacity
					activeOpacity={0.95}
					style={styles.card}
					onPress={() =>
						navigation.navigate("Detalhes", {
							evento: item.original,
						})
					}
				>
					<Image
						source={{
							uri: item.imagem,
						}}
						style={styles.cardImage}
					/>

					<LinearGradient
						colors={["transparent", "rgba(0,0,0,0.95)"]}
						style={styles.cardGradient}
					/>

					<BlurView intensity={40} tint="dark" style={styles.glassFooter}>
						<Text style={styles.cardTitle}>{item.titulo}</Text>

						<Text style={styles.cardLocation}>📍 {item.local}</Text>

						<View style={styles.cardFooter}>
							<Text style={styles.distance}>
								{formatarDistancia(item.distancia)}
							</Text>

							<View style={styles.rating}>
								<MaterialCommunityIcons name="star" size={14} color="#FFD166" />

								<Text style={styles.ratingText}>{Math.round(item.score)}</Text>
							</View>
						</View>
					</BlurView>
				</TouchableOpacity>
			</Animated.View>
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<MaterialCommunityIcons
					name="calendar-star"
					size={60}
					color={Colors.primary}
				/>

				<Text style={styles.loadingText}>Carregando eventos...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* GLOW BACKGROUND */}
			<View style={styles.glow1} />
			<View style={styles.glow2} />

			<Animated.ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: 120,
				}}
			>
				{/* HEADER */}
				<LinearGradient
					colors={["#10131F", Colors.background]}
					style={styles.header}
				>
					<View>
						<Text style={styles.saudacao}>{saudacaoHorario}</Text>

						<Text style={styles.nome}>{nomeUsuario}</Text>

						<Text style={styles.city}>📍 Fortaleza, CE</Text>
					</View>

					<TouchableOpacity onPress={() => navigation.navigate("EventosApp")}>
						<BlurView intensity={25} tint="dark" style={styles.notificationBtn}>
							<MaterialCommunityIcons
								name="bell-outline"
								size={22}
								color="#FFF"
							/>
						</BlurView>
					</TouchableOpacity>
				</LinearGradient>

				{/* STORIES */}
				{/*{ <ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingBottom: 12,
					}}
				>
					{eventos.slice(0, 10).map((item) => (
						<TouchableOpacity key={item.id} style={styles.storyItem}>
							<LinearGradient
								colors={["#FF0080", "#7928CA"]}
								style={styles.storyBorder}
							>
								<Image
									source={{
										uri: item.imagem,
									}}
									style={styles.storyImage}
								/>
							</LinearGradient>

							<Text numberOfLines={1} style={styles.storyText}>
								{item.titulo}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView> */}

				{/* EVENTO DO MOMENTO */}
				{destaques[0] && (
					<TouchableOpacity
						activeOpacity={0.95}
						style={styles.momentCard}
						onPress={() =>
							navigation.navigate("Detalhes", {
								evento: destaques[0].original,
							})
						}
					>
						<Image
							source={{
								uri: destaques[0].imagem,
							}}
							style={styles.momentImage}
						/>

						<LinearGradient
							colors={["transparent", "rgba(0,0,0,0.95)"]}
							style={styles.momentOverlay}
						/>

						<View style={styles.momentContent}>
							<Text style={styles.momentLabel}>EVENTO DO MOMENTO</Text>

							<Text style={styles.momentTitle}>{destaques[0].titulo}</Text>
						</View>
					</TouchableOpacity>
				)}

				{/* CATEGORIAS */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						paddingHorizontal: 16,
						marginTop: 20,
					}}
				>
					{categorias.map((cat) => {
						const active = categoriaAtiva === cat;

						return (
							<TouchableOpacity
								key={cat}
								onPress={() => setCategoriaAtiva(cat)}
								style={[
									styles.categoryPill,

									active && styles.categoryPillActive,
								]}
							>
								<Text
									style={[
										styles.categoryText,

										active && styles.categoryTextActive,
									]}
								>
									{cat}
								</Text>
							</TouchableOpacity>
						);
					})}
				</ScrollView>

				{/* DESTAQUES */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Destaques</Text>

					<Text style={styles.sectionSub}>Eventos em alta agora</Text>
				</View>

				<AnimatedFlashList
					horizontal
					data={destaques}
					renderItem={({ item, index }) => (
						<HeroCard item={item} index={index} />
					)}
					keyExtractor={(item) => item.id.toString()}
					estimatedItemSize={300}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						paddingHorizontal: 16,
					}}
					onScroll={scrollHandler}
					scrollEventThrottle={16}
				/>

				{/* MAPA AO VIVO */}
				<TouchableOpacity
					style={styles.liveMapCard}
					onPress={() => navigation.navigate("MapaVivo")}
				>
					<LinearGradient
						colors={["#111827", "#1F2937"]}
						style={styles.liveMapGradient}
					>
						<MaterialCommunityIcons
							name="map-marker-radius"
							size={28}
							color="#8B5CF6"
						/>

						<View>
							<Text style={styles.liveMapTitle}>Mapa Cultural Ao Vivo</Text>

							<Text style={styles.liveMapSub}>Veja eventos próximos agora</Text>
						</View>
					</LinearGradient>
				</TouchableOpacity>

				{/* PRÓXIMOS */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Próximos de você</Text>

					<Text style={styles.sectionSub}>Baseado na sua localização</Text>
				</View>

				<FlashList
					data={proximos}
					renderItem={({ item, index }) => (
						<CardEvento item={item} index={index} />
					)}
					keyExtractor={(item) => item.id.toString()}
					estimatedItemSize={260}
					scrollEnabled={false}
					contentContainerStyle={{
						paddingHorizontal: 16,
					}}
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

	glow1: {
		position: "absolute",
		width: 240,
		height: 240,
		borderRadius: 120,
		backgroundColor: "#7C3AED",
		opacity: 0.15,
		top: -60,
		left: -40,
	},

	glow2: {
		position: "absolute",
		width: 180,
		height: 180,
		borderRadius: 90,
		backgroundColor: "#EC4899",
		opacity: 0.12,
		top: 80,
		right: -50,
	},

	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: Colors.background,
	},

	loadingText: {
		color: "#FFF",
		marginTop: 16,
		fontSize: 16,
		fontWeight: "600",
	},

	header: {
		paddingTop: 60,
		paddingHorizontal: 20,
		paddingBottom: 20,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	saudacao: {
		color: Colors.textSecondary,
		fontSize: 16,
	},

	nome: {
		color: "#FFF",
		fontSize: 32,
		fontWeight: "bold",
		marginTop: 4,
	},

	city: {
		color: "rgba(255,255,255,0.6)",
		marginTop: 6,
	},

	notificationBtn: {
		width: 50,
		height: 50,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},

	storyItem: {
		alignItems: "center",
		marginRight: 14,
		width: 74,
	},

	storyBorder: {
		width: 70,
		height: 70,
		borderRadius: 35,
		justifyContent: "center",
		alignItems: "center",
	},

	storyImage: {
		width: 64,
		height: 64,
		borderRadius: 32,
	},

	storyText: {
		color: "#FFF",
		fontSize: 11,
		marginTop: 6,
		textAlign: "center",
	},

	momentCard: {
		height: 240,
		marginHorizontal: 16,
		borderRadius: 28,
		overflow: "hidden",
		marginTop: 12,
	},

	momentImage: {
		width: "100%",
		height: "100%",
	},

	momentOverlay: {
		...StyleSheet.absoluteFillObject,
	},

	momentContent: {
		position: "absolute",
		bottom: 24,
		left: 24,
		right: 24,
	},

	momentLabel: {
		color: "#A78BFA",
		fontWeight: "bold",
		marginBottom: 10,
	},

	momentTitle: {
		color: "#FFF",
		fontSize: 28,
		fontWeight: "bold",
	},

	categoryPill: {
		backgroundColor: "rgba(255,255,255,0.08)",
		paddingHorizontal: 18,
		paddingVertical: 10,
		borderRadius: 20,
		marginRight: 10,
	},

	categoryPillActive: {
		backgroundColor: Colors.primary,
	},

	categoryText: {
		color: "rgba(255,255,255,0.7)",
		fontWeight: "600",
	},

	categoryTextActive: {
		color: "#FFF",
	},

	sectionHeader: {
		paddingHorizontal: 16,
		marginBottom: 14,
		marginTop: 26,
	},

	sectionTitle: {
		color: "#FFF",
		fontSize: 24,
		fontWeight: "bold",
	},

	sectionSub: {
		color: Colors.textSecondary,
		marginTop: 4,
	},

	heroCard: {
		width: windowWidth * 0.78,
		height: 270,
		marginRight: 16,
		borderRadius: 30,
		overflow: "hidden",
	},

	heroImage: {
		width: "100%",
		height: "100%",
	},

	heroGradient: {
		...StyleSheet.absoluteFillObject,
	},

	heroContent: {
		position: "absolute",
		bottom: 18,
		left: 18,
		right: 18,
	},

	heroBadge: {
		alignSelf: "flex-start",
		backgroundColor: Colors.primary,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		marginBottom: 12,
	},

	heroBadgeText: {
		color: "#FFF",
		fontSize: 11,
		fontWeight: "bold",
	},

	heroTitle: {
		color: "#FFF",
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 8,
	},

	heroLocation: {
		color: "rgba(255,255,255,0.75)",
	},

	liveMapCard: {
		marginTop: 24,
		marginHorizontal: 16,
	},

	liveMapGradient: {
		borderRadius: 24,
		padding: 20,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},

	liveMapTitle: {
		color: "#FFF",
		fontSize: 17,
		fontWeight: "bold",
	},

	liveMapSub: {
		color: "rgba(255,255,255,0.65)",
		marginTop: 4,
	},

	card: {
		height: 260,
		borderRadius: 28,
		overflow: "hidden",
		marginBottom: 18,
	},

	cardImage: {
		width: "100%",
		height: "100%",
	},

	cardGradient: {
		...StyleSheet.absoluteFillObject,
	},

	glassFooter: {
		position: "absolute",
		left: 14,
		right: 14,
		bottom: 14,
		borderRadius: 22,
		padding: 16,
		overflow: "hidden",
	},

	cardTitle: {
		color: "#FFF",
		fontSize: 20,
		fontWeight: "bold",
	},

	cardLocation: {
		color: "rgba(255,255,255,0.75)",
		marginTop: 6,
	},

	cardFooter: {
		marginTop: 14,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	distance: {
		color: "#FFF",
		fontWeight: "600",
	},

	rating: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "rgba(255,255,255,0.12)",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 14,
	},

	ratingText: {
		color: "#FFF",
		fontWeight: "bold",
	},
});
