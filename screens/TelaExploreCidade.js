import React, {
	useEffect,
	useMemo,
	useState,
	useCallback,
	memo,
} from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Dimensions,
	Image,
	ActivityIndicator,
	StatusBar,
} from "react-native";
import Animated, {
	FadeInDown,
	FadeInUp,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	interpolate,
	useAnimatedScrollHandler,
} from "react-native-reanimated";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import {
	collection,
	getDocs,
	limit,
	orderBy,
	query,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../styles/Colors";
import { getMapaSummary } from "../services/mapaVivoService";
import {
	subscribeToEvent,
	unsubscribeFromEvent,
	getSubscribedEvents,
} from "../services/subscribedEventsService";
import {
	getUserFeedLikes,
	toggleFeedLike,
} from "../services/feedService";

const { width } = Dimensions.get("window");
const DEFAULT_EVENT_IMAGE = "https://placehold.co/600x600/1B1D26/6C5CE7?text=Evento";

const categorias = ["Todos", "Shows", "Teatro", "Arte", "Gastronomia", "Festival"];

// LikeButton otimizado com Memoization e mola mais fluida
const LikeButton = memo(({ isLiked, onPress }) => {
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handlePress = () => {
		scale.value = withSpring(1.3, { damping: 4 }, () => {
			scale.value = withSpring(1);
		});
		onPress();
	};

	return (
		<TouchableOpacity style={styles.actionBtn} onPress={handlePress} activeOpacity={0.7}>
			<Animated.View style={animatedStyle}>
				<MaterialCommunityIcons
					name={isLiked ? "heart" : "heart-outline"}
					size={26}
					color={isLiked ? "#A855F7" : "#FFF"}
				/>
			</Animated.View>
		</TouchableOpacity>
	);
});

export default function TelaInicio() {
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { user, nome } = useAuth();

	const [loading, setLoading] = useState(true);
	const [eventos, setEventos] = useState([]);
	const [likedIds, setLikedIds] = useState([]);
	const [subscribedEvents, setSubscribedEvents] = useState({});
	const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
	const [cidade, setCidade] = useState("Fortaleza");
	const [bairro, setBairro] = useState("Sua região");
	const [regiao, setRegiao] = useState("CE");
	const [painelCidade, setPainelCidade] = useState({ eventos: 0, proximos: 0, hotspots: 0 });

	const scrollY = useSharedValue(0);
	const horizontalX = useSharedValue(0);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});

	const horizontalHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			horizontalX.value = event.contentOffset.x;
		},
	});

	const nomeUsuario = nome || user?.displayName || user?.email?.split("@")[0] || "Explorador";

	const saudacaoHorario = useMemo(() => {
		const hora = new Date().getHours();
		if (hora < 12) return "Bom dia ☀️";
		if (hora < 18) return "Boa tarde 🌤️";
		return "Boa noite 🌙";
	}, []);

	useEffect(() => {
		carregarTudo();
	}, []);

	async function carregarTudo() {
		try {
			setLoading(true);
			await Promise.all([
				carregarFeed(),
				carregarLikes(),
				carregarSubscribedEvents(),
				carregarGeolocalizacao(),
			]);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}

	async function carregarGeolocalizacao() {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;

			const localizacao = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});

			const resumo = await getMapaSummary(
				localizacao.coords.latitude,
				localizacao.coords.longitude
			);

			setPainelCidade({
				eventos: resumo.totalEventos || 0,
				proximos: resumo.proximos || 0,
				hotspots: resumo.hotspots || 0,
			});

			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${localizacao.coords.latitude}&lon=${localizacao.coords.longitude}`
			);
			const data = await response.json();

			setCidade(data?.address?.city || "Fortaleza");
			setBairro(data?.address?.suburb || data?.address?.neighbourhood || "Sua região");
			setRegiao(data?.address?.state || "CE");
		} catch (e) {
			console.error(e);
		}
	}

	async function carregarFeed() {
		try {
			const eventosQuery = query(collection(db, "eventos"), orderBy("createdAt", "desc"), limit(12));
			const snap = await getDocs(eventosQuery);
			const lista = snap.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					type: "evento",
					...data,
					imagem: data.imagemEvento || DEFAULT_EVENT_IMAGE,
					titulo: data.tituloEvento || "Evento",
					local: data.localEvento || "Local",
					categoria: data.categoria || "Evento",
					score: data.likes || 0,
				};
			});
			setEventos(lista);
		} catch (e) {
			console.error(e);
		}
	}

	async function carregarLikes() {
		try {
			if (!user?.uid) return;
			const likes = await getUserFeedLikes(user.uid);
			setLikedIds(likes);
		} catch (e) {
			console.error(e);
		}
	}

	async function carregarSubscribedEvents() {
		try {
			if (!user?.uid) return;
			const eventosInscritos = await getSubscribedEvents(user.uid);
			const mapa = {};
			eventosInscritos.forEach((ev) => { mapa[ev.id] = true; });
			setSubscribedEvents(mapa);
		} catch (e) {
			console.error(e);
		}
	}

	const toggleLike = useCallback(async (itemId, itemType) => {
		try {
			const liked = await toggleFeedLike(itemId, itemType, user.uid);
			setLikedIds((prev) => liked ? [...prev, itemId] : prev.filter((id) => id !== itemId));
		} catch (e) {
			console.error(e);
		}
	}, [user]);

	async function toggleNotification(evento) {
		try {
			const isSubscribed = subscribedEvents[evento.id];
			if (isSubscribed) {
				await unsubscribeFromEvent(user.uid, evento.id);
				setSubscribedEvents((prev) => ({ ...prev, [evento.id]: false }));
			} else {
				await subscribeToEvent(user.uid, evento);
				setSubscribedEvents((prev) => ({ ...prev, [evento.id]: true }));
			}
		} catch (error) {
			console.error(error);
		}
	}

	const eventosFiltrados = useMemo(() => {
		if (categoriaAtiva === "Todos") return eventos;
		return eventos.filter((ev) => ev.categoria?.toLowerCase().includes(categoriaAtiva.toLowerCase()));
	}, [eventos, categoriaAtiva]);

	const destaques = useMemo(() => {
		return eventosFiltrados.slice().sort((a, b) => b.score - a.score).slice(0, 6);
	}, [eventosFiltrados]);

	// Efeito Parallax Dinâmico e Fade-out suave do cabeçalho ao rolar a lista
	const headerOpacityStyle = useAnimatedStyle(() => {
		const opacity = interpolate(scrollY.value, [0, 200], [1, 0]);
		const translateY = interpolate(scrollY.value, [0, 200], [0, -20]);
		return { opacity, transform: [{ translateY }] };
	});

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={Colors.primary} />
				<Text style={styles.loadingText}>Carregando experiências...</Text>
			</View>
		);
	}

	const HeroCard = ({ item, index }) => {
		const imageStyle = useAnimatedStyle(() => {
			const imageScale = interpolate(
				horizontalX.value,
				[(index - 1) * (width * 0.82 + 18), index * (width * 0.82 + 18), (index + 1) * (width * 0.82 + 18)],
				[1, 1.06, 1]
			);
			return { transform: [{ scale: imageScale }] };
		});

		return (
			<Animated.View entering={FadeInUp.delay(index * 80).springify()}>
				<TouchableOpacity
					activeOpacity={0.9}
					style={styles.heroCard}
					onPress={() => navigation.navigate("Detalhes", { evento: item })}
				>
					<Animated.Image source={{ uri: item.imagem }} style={[styles.heroImage, imageStyle]} />
					<LinearGradient colors={["transparent", "rgba(5, 6, 10, 0.98)"]} style={styles.heroGradient} />
					<View style={styles.heroContent}>
						<View style={styles.heroBadge}>
							<Text style={styles.heroBadgeText}>{item.categoria}</Text>
						</View>
						<Text numberOfLines={2} style={styles.heroTitle}>{item.titulo}</Text>
						<Text style={styles.heroLocation}>📍 {item.local}</Text>
					</View>
				</TouchableOpacity>
			</Animated.View>
		);
	};

	// Transformado em sub-componente interno para manter o escopo e performance da FlashList
	const ListHeader = () => (
		<>
			{/* CONTAINER DO TOPO */}
			<Animated.View style={[headerOpacityStyle, { paddingTop: insets.top + 16, paddingHorizontal: 20 }]}>
				<View style={styles.headerTop}>
					<View>
						<Text style={styles.greeting}>{saudacaoHorario}</Text>
						<Text style={styles.name}>{nomeUsuario}</Text>
						<View style={styles.locationRow}>
							<MaterialCommunityIcons name="map-marker-radius" size={16} color="#A855F7" />
							<Text style={styles.locationTextHeader}>{bairro} • {cidade}</Text>
						</View>
					</View>

					<View style={styles.headerButtons}>
						<TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate("CriarPost")}>
							<MaterialCommunityIcons name="plus" size={22} color="#FFF" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate("EventosApp")}>
							<MaterialCommunityIcons name="bell-outline" size={22} color="#FFF" />
						</TouchableOpacity>
					</View>
				</View>

				{/* CARD PAINEL DA CIDADE ATUALIZADO (GLASSMORPHISM PREMIUM) */}
				<View style={styles.cityCardOuter}>
					<BlurView intensity={25} tint="dark" style={styles.cityCard}>
						<View style={styles.cityTop}>
							<View>
								<Text style={styles.cityLabel}>PAINEL DA CIDADE</Text>
								<Text style={styles.cityTitle}>{cidade}</Text>
								<Text style={styles.citySub}>{bairro} • {regiao}</Text>
							</View>
							<View style={styles.livePill}>
								<View style={styles.liveDot} />
								<Text style={styles.liveText}>AO VIVO</Text>
							</View>
						</View>

						{/* INDICADORES DO PAINEL DA CIDADE */}
						<View style={styles.statsRow}>
							<View style={styles.statItem}>
								<Text style={styles.statNumber}>{painelCidade.eventos}</Text>
								<Text style={styles.statLabel}>Eventos</Text>
							</View>
							<View style={styles.statItemDivider} />
							<View style={styles.statItem}>
								<Text style={styles.statNumber}>{painelCidade.proximos}</Text>
								<Text style={styles.statLabel}>Próximos</Text>
							</View>
							<View style={styles.statItemDivider} />
							<View style={styles.statItem}>
								<Text style={styles.statNumber}>{painelCidade.hotspots}</Text>
								<Text style={styles.statLabel}>Hotspots</Text>
							</View>
						</View>

						<TouchableOpacity style={styles.mapButton} onPress={() => navigation.navigate("MapaVivo")}>
							<LinearGradient
								colors={["#A855F7", "#6D28D9"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={styles.mapGradientBtn}
							>
								<MaterialCommunityIcons name="radar" size={18} color="#FFF" />
								<Text style={styles.mapButtonText}>Explorar mapa cultural</Text>
							</LinearGradient>
						</TouchableOpacity>
					</BlurView>
				</View>
			</Animated.View>

			{/* HORIZONTAL CATEGORIAS */}
			<View style={{ marginTop: 12 }}>
				<Animated.FlatList
					data={categorias}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingHorizontal: 20 }}
					keyExtractor={(item) => item}
					renderItem={({ item }) => {
						const active = categoriaAtiva === item;
						return (
							<TouchableOpacity
								onPress={() => setCategoriaAtiva(item)}
								style={[styles.categoryPill, active && styles.categoryPillActive]}
							>
								<Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item}</Text>
							</TouchableOpacity>
						);
					}}
				/>
			</View>

			{/* DESTAQUES */}
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>Destaques</Text>
				<Text style={styles.sectionSub}>Eventos mais badalados em {cidade}</Text>
			</View>

			<FlashList
				data={destaques}
				horizontal
				renderItem={({ item, index }) => <HeroCard item={item} index={index} />}
				keyExtractor={(item) => item.id.toString()}
				estimatedItemSize={width * 0.82}
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 20 }}
				onScroll={horizontalHandler}
				scrollEventThrottle={16}
			/>

			{/* TITULO DO FEED */}
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>Feed Cultural</Text>
				<Text style={styles.sectionSub}>O que a comunidade está compartilhando</Text>
			</View>
		</>
	);

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="#05060A" translucent />
			
			{/* Brilho neon de fundo sutil */}
			<View style={styles.ambientGlow} />

			{/* SOLUÇÃO DEFINITIVA DE PERFORMANCE: ListHeaderComponent renderiza toda a interface superior, deixando a FlashList gerenciar de forma nativa e limpa a reciclagem dos itens do feed */}
			<FlashList
				data={eventosFiltrados}
				estimatedItemSize={400}
				keyExtractor={(item) => item.id.toString()}
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={ListHeader}
				contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
				renderItem={({ item, index }) => (
					<Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.feedCardContainer}>
						<View style={styles.feedCard}>
							<Image source={{ uri: item.imagem }} style={styles.feedImage} />
							<LinearGradient colors={["transparent", "rgba(5, 6, 10, 0.98)"]} style={styles.feedGradient} />
							
							<View style={styles.feedContent}>
								<Text style={styles.feedTitle}>{item.titulo}</Text>
								<Text style={styles.feedLocation}>📍 {item.local}</Text>

								<View style={styles.feedActions}>
									<View style={styles.leftActions}>
										<LikeButton
											isLiked={likedIds.includes(item.id)}
											onPress={() => toggleLike(item.id, item.type)}
										/>
										<TouchableOpacity
											style={styles.actionBtn}
											onPress={() => navigation.navigate("Detalhes", { evento: item })}
										>
											<MaterialCommunityIcons name="comment-text-outline" size={24} color="#FFF" />
										</TouchableOpacity>
									</View>

									<TouchableOpacity
										style={[styles.bellActionBtn, subscribedEvents[item.id] && styles.bellActionBtnActive]}
										onPress={() => toggleNotification(item)}
									>
										<MaterialCommunityIcons
											name={subscribedEvents[item.id] ? "bell-ring" : "bell-outline"}
											size={22}
											color={subscribedEvents[item.id] ? "#FFF" : "rgba(255,255,255,0.8)"}
										/>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					</Animated.View>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#05060A",
	},
	ambientGlow: {
		position: "absolute",
		top: -100,
		right: -80,
		width: 360,
		height: 360,
		borderRadius: 180,
		backgroundColor: "rgba(168, 85, 247, 0.1)",
		pointerEvents: "none",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#05060A",
	},
	loadingText: {
		color: "rgba(255,255,255,0.5)",
		marginTop: 16,
		fontSize: 14,
	},
	headerTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	greeting: {
		color: "rgba(255,255,255,0.5)",
		fontSize: 14,
		fontWeight: "500",
	},
	name: {
		color: "#FFF",
		fontSize: 32,
		fontWeight: "800",
		letterSpacing: -0.5,
	},
	locationRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},
	locationTextHeader: {
		color: "rgba(255,255,255,0.7)",
		marginLeft: 4,
		fontSize: 13,
	},
	headerButtons: {
		flexDirection: "row",
	},
	headerBtn: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 10,
	},
	cityCardOuter: {
		borderRadius: 24,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
		backgroundColor: "rgba(255,255,255,0.01)",
		marginVertical: 12,
	},
	cityCard: {
		padding: 20,
	},
	cityTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	cityLabel: {
		color: "#A855F7",
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.5,
	},
	cityTitle: {
		color: "#FFF",
		fontSize: 28,
		fontWeight: "800",
		marginTop: 2,
	},
	citySub: {
		color: "rgba(255,255,255,0.5)",
		fontSize: 13,
		marginTop: 2,
	},
	livePill: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(34,197,94,0.15)",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 12,
	},
	liveDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#22C55E",
	},
	liveText: {
		color: "#22C55E",
		fontWeight: "800",
		fontSize: 10,
		marginLeft: 5,
	},
	statsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 20,
		backgroundColor: "rgba(0,0,0,0.25)",
		paddingVertical: 12,
		borderRadius: 16,
	},
	statItem: {
		alignItems: "center",
		flex: 1,
	},
	statItemDivider: {
		width: 1,
		height: 22,
		backgroundColor: "rgba(255,255,255,0.08)",
	},
	statNumber: {
		color: "#FFF",
		fontSize: 22,
		fontWeight: "800",
	},
	statLabel: {
		color: "rgba(255,255,255,0.4)",
		fontSize: 11,
		marginTop: 2,
	},
	mapButton: {
		marginTop: 18,
		borderRadius: 16,
		overflow: "hidden",
	},
	mapGradientBtn: {
		height: 48,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	mapButtonText: {
		color: "#FFF",
		fontWeight: "700",
		fontSize: 14,
		marginLeft: 8,
	},
	categoryPill: {
		height: 38,
		paddingHorizontal: 16,
		borderRadius: 12,
		backgroundColor: "rgba(255,255,255,0.05)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 8,
	},
	categoryPillActive: {
		backgroundColor: "#A855F7",
		borderColor: "#A855F7",
	},
	categoryText: {
		color: "rgba(255,255,255,0.6)",
		fontWeight: "600",
		fontSize: 13,
	},
	categoryTextActive: {
		color: "#FFF",
	},
	sectionHeader: {
		paddingHorizontal: 20,
		marginTop: 28,
		marginBottom: 14,
	},
	sectionTitle: {
		color: "#FFF",
		fontSize: 22,
		fontWeight: "800",
		letterSpacing: -0.3,
	},
	sectionSub: {
		color: "rgba(255,255,255,0.45)",
		fontSize: 13,
		marginTop: 2,
	},
	heroCard: {
		width: width * 0.82,
		height: 280,
		marginRight: 14,
		borderRadius: 24,
		overflow: "hidden",
		backgroundColor: "#111827",
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
		left: 18,
		right: 18,
		bottom: 18,
	},
	heroBadge: {
		alignSelf: "flex-start",
		backgroundColor: "#A855F7",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 8,
		marginBottom: 10,
	},
	heroBadgeText: {
		color: "#FFF",
		fontWeight: "700",
		fontSize: 10,
	},
	heroTitle: {
		color: "#FFF",
		fontSize: 22,
		fontWeight: "800",
		lineHeight: 28,
	},
	heroLocation: {
		color: "rgba(255,255,255,0.65)",
		fontSize: 13,
		marginTop: 6,
	},
	feedCardContainer: {
		paddingHorizontal: 20,
		marginBottom: 18,
	},
	feedCard: {
		height: 380,
		borderRadius: 24,
		overflow: "hidden",
		backgroundColor: "#111827",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
	},
	feedImage: {
		width: "100%",
		height: "100%",
	},
	feedGradient: {
		...StyleSheet.absoluteFillObject,
	},
	feedContent: {
		position: "absolute",
		left: 18,
		right: 18,
		bottom: 18,
	},
	feedTitle: {
		color: "#FFF",
		fontSize: 24,
		fontWeight: "800",
	},
	feedLocation: {
		color: "rgba(255,255,255,0.65)",
		fontSize: 13,
		marginTop: 6,
	},
	feedActions: {
		marginTop: 14,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	leftActions: {
		flexDirection: "row",
		alignItems: "center",
	},
	actionBtn: {
		padding: 6,
		marginRight: 10,
	},
	bellActionBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: "rgba(255,255,255,0.06)",
		justifyContent: "center",
		alignItems: "center",
	},
	bellActionBtnActive: {
		backgroundColor: "#A855F7",
	},
});