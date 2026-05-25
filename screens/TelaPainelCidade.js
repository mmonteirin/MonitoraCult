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
	ActivityIndicator,
	StatusBar,
	FlatList,
} from "react-native";

import { Image } from "expo-image";

import Animated, {
	FadeInDown,
	FadeInUp,
	FadeInLeft,
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
	where,
	Timestamp,
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

const { width, height } = Dimensions.get("window");

const DEFAULT_EVENT_IMAGE =
	"https://placehold.co/600x600/1B1D26/6C5CE7?text=Evento";

const AnimatedFlashList =
	Animated.createAnimatedComponent(FlashList);

const AnimatedImage =
	Animated.createAnimatedComponent(Image);

const categorias = [
	"Todos",
	"Shows",
	"Teatro",
	"Arte",
	"Gastronomia",
	"Festival",
];

const ACOES_RAPIDAS = [
	{
		id: "mapa",
		icon: "map-marker-radius",
		label: "Mapa Vivo",
		route: "MapaVivo",
		color: "#6C5CE7",
		bg: "rgba(108,92,231,0.18)",
	},
	{
		id: "agenda",
		icon: "calendar-month",
		label: "Agenda",
		route: "HomeTabs",
		nestedScreen: { screen: "Eventos", params: { screen: "AgendaEventos" } },
		color: "#22D3EE",
		bg: "rgba(34,211,238,0.15)",
	},
	{
		id: "busca",
		icon: "magnify",
		label: "Explorar",
		route: "HomeTabs",
		nestedScreen: { screen: "Busca" },
		color: "#F472B6",
		bg: "rgba(244,114,182,0.15)",
	},
	{
		id: "comunidade",
		icon: "account-group",
		label: "Comunidade",
		route: "HomeTabs",
		nestedScreen: { screen: "Feed", params: { screen: "TelaComunidade" } },
		color: "#F97316",
		bg: "rgba(249,115,22,0.15)",
	},
];

// ──────────────────────────────────────────────
// LikeButton
// ──────────────────────────────────────────────
const LikeButton = memo(({ isLiked, onPress }) => {
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handlePress = () => {
		scale.value = withSpring(1.3, { damping: 6 });
		setTimeout(() => {
			scale.value = withSpring(1);
		}, 130);
		onPress();
	};

	return (
		<TouchableOpacity
			style={styles.actionBtn}
			onPress={handlePress}
		>
			<Animated.View style={animatedStyle}>
				<MaterialCommunityIcons
					name={isLiked ? "heart" : "heart-outline"}
					size={24}
					color={isLiked ? "#A855F7" : "#FFF"}
				/>
			</Animated.View>
		</TouchableOpacity>
	);
});

// ──────────────────────────────────────────────
// StatCard
// ──────────────────────────────────────────────
const StatCard = memo(({ value, label, icon, color, delay }) => (
	<Animated.View
		entering={FadeInUp.delay(delay).springify()}
		style={[styles.statCard, { borderColor: color + "30" }]}
	>
		<View style={[styles.statIconWrap, { backgroundColor: color + "20" }]}>
			<MaterialCommunityIcons name={icon} size={18} color={color} />
		</View>
		<Text style={styles.statNumber}>{value}</Text>
		<Text style={styles.statLabel}>{label}</Text>
	</Animated.View>
));

// ──────────────────────────────────────────────
// AcaoRapidaCard
// ──────────────────────────────────────────────
const AcaoRapidaCard = memo(({ acao, onPress, index }) => (
	<Animated.View
		entering={FadeInDown.delay(index * 60).springify()}
		style={styles.acaoCardWrapper}
	>
		<TouchableOpacity
			style={styles.acaoCard}
			onPress={() => onPress(acao.route, acao.nestedScreen)}
			activeOpacity={0.75}
		>
			<View style={[styles.acaoIconCircle, { backgroundColor: acao.bg }]}>
				<MaterialCommunityIcons
					name={acao.icon}
					size={22}
					color={acao.color}
				/>
			</View>
			<Text style={styles.acaoLabel}>
				{acao.label}
			</Text>
			<MaterialCommunityIcons
				name="chevron-right"
				size={18}
				color={Colors.textMuted}
				style={styles.acaoChevron}
			/>
		</TouchableOpacity>
	</Animated.View>
));

// ──────────────────────────────────────────────
// FeedCard vertical
// ──────────────────────────────────────────────
const FeedCard = memo(
	({ item, index, isLiked, isSubscribed, onLike, onNotification, onPress }) => (
		<Animated.View
			entering={FadeInDown.delay(index * 80).springify()}
			style={styles.feedCard}
		>
			<TouchableOpacity activeOpacity={0.92} style={styles.feedCardInner} onPress={() => onPress?.(item)}>
				<AnimatedImage
					source={{ uri: item.imagem }}
					style={styles.feedImage}
					contentFit="cover"
				/>

				<LinearGradient
					colors={["transparent", "rgba(0,0,0,0.92)"]}
					style={styles.feedGradient}
				/>

				{/* Badge categoria */}
				<View style={styles.feedBadge}>
					<Text style={styles.feedBadgeText}>{item.categoria}</Text>
				</View>

				<View style={styles.feedContent}>
					<Text numberOfLines={2} style={styles.feedTitle}>
						{item.titulo}
					</Text>

					<View style={styles.feedMeta}>
						<MaterialCommunityIcons
							name="map-marker"
							size={13}
							color="rgba(255,255,255,0.65)"
						/>
						<Text style={styles.feedLocation} numberOfLines={1}>
							{item.local}
						</Text>
					</View>

					<View style={styles.feedActions}>
						<View style={styles.leftActions}>
							<LikeButton
								isLiked={isLiked}
								onPress={() => onLike(item.id, item.type)}
							/>
							<TouchableOpacity style={styles.actionBtn}>
								<MaterialCommunityIcons
									name="share-variant-outline"
									size={22}
									color="#FFF"
								/>
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							style={[
								styles.notifBtn,
								isSubscribed && styles.notifBtnActive,
							]}
							onPress={() => onNotification(item)}
						>
							<MaterialCommunityIcons
								name={
									isSubscribed
										? "bell-check"
										: "bell-plus-outline"
								}
								size={16}
								color={isSubscribed ? "#6C5CE7" : "#FFF"}
							/>
							<Text
								style={[
									styles.notifBtnText,
									isSubscribed && styles.notifBtnTextActive,
								]}
							>
								{isSubscribed ? "Inscrito" : "Notificar"}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</TouchableOpacity>
		</Animated.View>
	)
);

// ──────────────────────────────────────────────
// MAIN SCREEN
// ──────────────────────────────────────────────
export default function TelaPainelCidade() {
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
	const [painelCidade, setPainelCidade] = useState({
		eventos: 0,
		proximos: 0,
		hotspots: 0,
	});

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

	const nomeUsuario =
		nome ||
		user?.displayName ||
		user?.email?.split("@")[0] ||
		"Explorador";

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
				carregarLikes(),
				carregarSubscribedEvents(),
				carregarGeolocalizacao(),
				carregarFeed(),
			]);
		} catch (e) {
			console.log(e);
		} finally {
			setLoading(false);
		}
	}

	async function carregarGeolocalizacao() {
		try {
			const { status } =
				await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;

			const localizacao = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});

			let resumo = { totalEventos: 0, proximos: 0, hotspots: 0 };
			try {
				resumo = await getMapaSummary(
					localizacao.coords.latitude,
					localizacao.coords.longitude
				);
			} catch (_e) {
				/* fallback silencioso */
			}

			setPainelCidade((prev) => ({
				...prev,
				proximos: resumo.proximos || 0,
				hotspots: resumo.hotspots || 0,
			}));

			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${localizacao.coords.latitude}&lon=${localizacao.coords.longitude}`
			);
			const data = await response.json();

			setCidade(data?.address?.city || "Fortaleza");
			setBairro(
				data?.address?.suburb ||
					data?.address?.neighbourhood ||
					"Sua região"
			);
			const estado = data?.address?.state || "CE";
			const siglaEstado = data?.address?.["ISO3166-2-lvl4"]?.split("-")?.[1] || estado;
			setRegiao(siglaEstado);
		} catch (e) {
			console.log(e);
		}
	}

	async function carregarFeed() {
		try {
			const eventosQuery = query(
				collection(db, "eventos"),
				orderBy("createdAt", "desc"),
				limit(12)
			);
			const snap = await getDocs(eventosQuery);
			const lista = snap.docs.map((doc) => {
				const d = doc.data();
				return {
					id: doc.id,
					type: "evento",
					...d,
					imagem: d.imagemEvento || DEFAULT_EVENT_IMAGE,
					titulo: d.tituloEvento || "Evento",
					local: d.localEvento || "Local",
					categoria: d.categoria || "Evento",
					score: d.likes || 0,
					data: d.dataEvento || null,
				};
			});
			setEventos(lista);

			setPainelCidade((prev) => ({
				...prev,
				eventos: lista.length,
			}));
		} catch (e) {
			console.log(e);
		}
	}

	async function carregarLikes() {
		try {
			if (!user?.uid) return;
			const likes = await getUserFeedLikes(user.uid);
			setLikedIds(likes);
		} catch (e) {
			console.log(e);
		}
	}

	async function carregarSubscribedEvents() {
		try {
			if (!user?.uid) return;
			const eventosInscritos = await getSubscribedEvents(user.uid);
			const mapa = {};
			eventosInscritos.forEach((evento) => {
				mapa[evento.id] = true;
			});
			setSubscribedEvents(mapa);
		} catch (e) {
			console.log(e);
		}
	}

	const toggleLike = useCallback(
		async (itemId, itemType) => {
			try {
				const liked = await toggleFeedLike(itemId, itemType, user?.uid);
				const itemKey = `${itemType}-${itemId}`;
				if (liked) {
					setLikedIds((prev) =>
						prev.includes(itemKey) ? prev : [...prev, itemKey]
					);
				} else {
					setLikedIds((prev) => prev.filter((id) => id !== itemKey));
				}
			} catch (e) {
				console.log(e);
			}
		},
		[user?.uid]
	);

	const toggleNotification = useCallback(
		async (evento) => {
			try {
				const isSubscribed = subscribedEvents[evento.id];
				if (isSubscribed) {
					await unsubscribeFromEvent(user?.uid, evento.id);
					setSubscribedEvents((prev) => ({
						...prev,
						[evento.id]: false,
					}));
				} else {
					await subscribeToEvent(user?.uid, evento);
					setSubscribedEvents((prev) => ({
						...prev,
						[evento.id]: true,
					}));
				}
			} catch (error) {
				console.log(error);
			}
		},
		[user?.uid, subscribedEvents]
	);

	const eventosFiltrados = useMemo(() => {
		if (categoriaAtiva === "Todos") return eventos;
		return eventos.filter((evento) =>
			evento.categoria
				?.toLowerCase()
				.includes(categoriaAtiva.toLowerCase())
		);
	}, [eventos, categoriaAtiva]);

	const destaques = useMemo(
		() =>
			eventosFiltrados
				.slice()
				.sort((a, b) => b.score - a.score)
				.slice(0, 6),
		[eventosFiltrados]
	);

	const proximosEventos = useMemo(
		() => eventosFiltrados.slice(0, 8),
		[eventosFiltrados]
	);

	// ── animated header parallax ──
	const headerStyle = useAnimatedStyle(() => {
		const translateY = interpolate(
			scrollY.value,
			[0, 300],
			[0, -100]
		);
		const scale = interpolate(scrollY.value, [-100, 0], [1.08, 1]);
		return { transform: [{ translateY }, { scale }] };
	});

	// ── sticky top bar opacity ──
	const stickyBarStyle = useAnimatedStyle(() => {
		const opacity = interpolate(scrollY.value, [200, 280], [0, 1]);
		return { opacity };
	});

	// ──────────── LOADING ────────────
	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={Colors.primary} />
				<Text style={styles.loadingText}>
					Carregando experiências...
				</Text>
			</View>
		);
	}

	// ──────────── HeroCard (destaques horizontais) ────────────
	const HeroCard = ({ item, index }) => {
		const imageStyle = useAnimatedStyle(() => {
			const imageScale = interpolate(
				horizontalX.value,
				[
					(index - 1) * (width * 0.78 + 16),
					index * (width * 0.78 + 16),
					(index + 1) * (width * 0.78 + 16),
				],
				[1, 1.06, 1]
			);
			return { transform: [{ scale: imageScale }] };
		});

		return (
			<Animated.View
				entering={FadeInUp.delay(index * 80).springify()}
			>
				<TouchableOpacity
					activeOpacity={0.94}
					style={styles.heroCard}
					onPress={() =>
						navigation.navigate("HomeTabs", {
							screen: "Eventos",
							params: { screen: "Detalhes", params: { evento: item } },
						})
					}
				>
					<AnimatedImage
						source={{ uri: item.imagem }}
						style={[styles.heroImage, imageStyle]}
						contentFit="cover"
					/>
					<LinearGradient
						colors={["transparent", "rgba(0,0,0,0.96)"]}
						style={styles.heroGradient}
					/>
					<View style={styles.heroContent}>
						<View style={styles.heroBadge}>
							<Text style={styles.heroBadgeText}>
								{item.categoria}
							</Text>
						</View>
						<Text numberOfLines={2} style={styles.heroTitle}>
							{item.titulo}
						</Text>
						<Text style={styles.heroLocation}>
							📍 {item.local}
						</Text>
					</View>
				</TouchableOpacity>
			</Animated.View>
		);
	};

	// ──────────── RENDER ────────────
	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />

			{/* Sticky top bar (aparece ao rolar) */}
			<Animated.View
				style={[
					styles.stickyBar,
					{ paddingTop: insets.top },
					stickyBarStyle,
				]}
			>
				<BlurView intensity={60} tint="dark" style={styles.stickyBarBlur}>
					<MaterialCommunityIcons
						name="map-marker-radius"
						size={16}
						color="#A78BFA"
					/>
					<Text style={styles.stickyBarText}>
						{bairro} • {cidade}
					</Text>
				</BlurView>
			</Animated.View>

			<Animated.ScrollView
				onScroll={scrollHandler}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 140 }}
			>
				{/* ── HEADER ── */}
				<Animated.View style={headerStyle}>
					<LinearGradient
						colors={["#111827", "#0F172A", "#05060A"]}
						style={[styles.header, { paddingTop: insets.top + 16 }]}
					>
						{/* Glow decorativo */}
						<View style={styles.headerGlow} />
						<View style={styles.headerGlow2} />

						{/* Top row */}
						<View style={styles.headerTop}>
							<View>
								<Text style={styles.greeting}>
									{saudacaoHorario}
								</Text>
								<Text style={styles.name}>{nomeUsuario}</Text>
								<View style={styles.locationRow}>
									<MaterialCommunityIcons
										name="map-marker-radius"
										size={16}
										color="#A78BFA"
									/>
									<Text style={styles.locationTextHeader}>
										{bairro} • {cidade}
									</Text>
								</View>
							</View>

							<View style={styles.headerButtons}>
								<TouchableOpacity
									style={styles.headerBtn}
									onPress={() =>
										navigation.navigate("HomeTabs", {
											screen: "Feed",
											params: { screen: "CriarPost" },
										})
									}
								>
									<MaterialCommunityIcons
										name="plus"
										size={22}
										color="#FFF"
									/>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.headerBtn}
									onPress={() =>
										navigation.navigate("HomeTabs", {
											screen: "Feed",
											params: { screen: "Notificacoes" },
										})
									}
								>
									<MaterialCommunityIcons
										name="bell-outline"
										size={22}
										color="#FFF"
									/>
								</TouchableOpacity>
							</View>
						</View>

						{/* City Card */}
						<View style={styles.cityCard}>
							<View style={styles.cityTop}>
								<View>
									<Text style={styles.cityLabel}>
										SUA REGIÃO
									</Text>
									<Text style={styles.cityTitle}>
										{cidade}
									</Text>
									<Text style={styles.citySub}>
										{bairro} • {regiao}
									</Text>
								</View>
								<View style={styles.livePill}>
									<View style={styles.liveDot} />
									<Text style={styles.liveText}>AO VIVO</Text>
								</View>
							</View>

							{/* Stats */}
							<View style={styles.statsRow}>
								<StatCard
									value={painelCidade.eventos}
									label="Eventos"
									icon="calendar-star"
									color="#6C5CE7"
									delay={0}
								/>
								<StatCard
									value={painelCidade.proximos}
									label="Próximos"
									icon="clock-fast"
									color="#22D3EE"
									delay={80}
								/>
								<StatCard
									value={painelCidade.hotspots}
									label="Hotspots"
									icon="fire"
									color="#F97316"
									delay={160}
								/>
							</View>

							{/* Botão mapa */}
							<TouchableOpacity
								style={styles.mapButton}
								onPress={() =>
									navigation.navigate("MapaVivo")
								}
							>
								<LinearGradient
									colors={["#6C5CE7", "#5746D6"]}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
									style={styles.mapButtonGradient}
								>
									<MaterialCommunityIcons
										name="radar"
										size={20}
										color="#FFF"
									/>
									<Text style={styles.mapButtonText}>
										Explorar mapa cultural
									</Text>
									<MaterialCommunityIcons
										name="chevron-right"
										size={20}
										color="rgba(255,255,255,0.7)"
									/>
								</LinearGradient>
							</TouchableOpacity>
						</View>
					</LinearGradient>
				</Animated.View>

				{/* ── AÇÕES RÁPIDAS ── */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Acesso rápido</Text>
				</View>
				<View style={styles.acoesGrid}>
					{ACOES_RAPIDAS.map((acao, i) => (
						<AcaoRapidaCard
							key={acao.id}
							acao={acao}
							index={i}
							onPress={(route, nested) =>
							nested
								? navigation.navigate(route, nested)
								: navigation.navigate(route)
						}
						/>
					))}
				</View>

				{/* ── CATEGORIAS ── */}
				<FlatList
					data={categorias}
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.categoriasList}
					keyExtractor={(item) => item}
					renderItem={({ item }) => {
						const active = categoriaAtiva === item;
						return (
							<TouchableOpacity
								onPress={() => setCategoriaAtiva(item)}
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
									{item}
								</Text>
							</TouchableOpacity>
						);
					}}
				/>

				{/* ── DESTAQUES (carrossel horizontal) ── */}
				<View style={styles.sectionHeader}>
					<View>
						<Text style={styles.sectionTitle}>Destaques</Text>
						<Text style={styles.sectionSub}>
							Eventos em alta na sua região
						</Text>
					</View>
					<TouchableOpacity
						onPress={() =>
							navigation.navigate("HomeTabs", {
								screen: "Eventos",
								params: { screen: "EventosApp" },
							})
						}
					>
						<Text style={styles.sectionLink}>Ver todos</Text>
					</TouchableOpacity>
				</View>

				{destaques.length === 0 ? (
					<View style={styles.emptySection}>
						<MaterialCommunityIcons
							name="calendar-blank-outline"
							size={42}
							color="rgba(255,255,255,0.2)"
						/>
						<Text style={styles.emptyText}>
							Nenhum destaque encontrado
						</Text>
					</View>
				) : (
					<AnimatedFlashList
						data={destaques}
						horizontal
						renderItem={({ item, index }) => (
							<HeroCard item={item} index={index} />
						)}
						keyExtractor={(item) => item.id.toString()}
						estimatedItemSize={320}
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingHorizontal: 18 }}
						onScroll={horizontalHandler}
						scrollEventThrottle={16}
					/>
				)}

				{/* ── DIVISOR ── */}
				<View style={styles.divider} />

				{/* ── FEED VERTICAL ── */}
				<View style={styles.sectionHeader}>
					<View>
						<Text style={styles.sectionTitle}>Explorar</Text>
						<Text style={styles.sectionSub}>
							Todos os eventos recentes
						</Text>
					</View>
				</View>

				{proximosEventos.map((item, index) => (
					<FeedCard
						key={item.id}
						item={item}
						index={index}
						isLiked={likedIds.includes(
							`${item.type}-${item.id}`
						)}
						isSubscribed={!!subscribedEvents[item.id]}
						onLike={toggleLike}
						onNotification={toggleNotification}
						onPress={(evt) =>
							navigation.navigate("HomeTabs", {
								screen: "Eventos",
								params: { screen: "Detalhes", params: { evento: evt } },
							})
						}
					/>
				))}

				{proximosEventos.length === 0 && (
					<View style={styles.emptySection}>
						<MaterialCommunityIcons
							name="calendar-search"
							size={42}
							color="rgba(255,255,255,0.2)"
						/>
						<Text style={styles.emptyText}>
							Nenhum evento encontrado para esta categoria
						</Text>
					</View>
				)}
			</Animated.ScrollView>

			{/* ── FAB criar evento ── */}
			<Animated.View
				entering={FadeInDown.delay(400).springify()}
				style={[styles.fab, { bottom: insets.bottom + 90 }]}
			>
				<TouchableOpacity
					onPress={() =>
						navigation.navigate("HomeTabs", {
							screen: "Feed",
							params: { screen: "CriarPost" },
						})
					}
					activeOpacity={0.85}
				>
					<LinearGradient
						colors={["#8B7CFF", "#6C5CE7"]}
						style={styles.fabGradient}
					>
						<MaterialCommunityIcons
							name="plus"
							size={26}
							color="#FFF"
						/>
					</LinearGradient>
				</TouchableOpacity>
			</Animated.View>
		</View>
	);
}

// ──────────────────────────────────────────────
// STYLES
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},

	// ── Loading ──
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: Colors.background,
	},
	loadingText: {
		color: "rgba(255,255,255,0.6)",
		marginTop: 16,
		fontSize: 15,
	},

	// ── Sticky bar ──
	stickyBar: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 100,
	},
	stickyBarBlur: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		gap: 6,
	},
	stickyBarText: {
		color: "rgba(255,255,255,0.8)",
		fontSize: 13,
		fontWeight: "600",
	},

	// ── Header ──
	header: {
		paddingBottom: 34,
		paddingHorizontal: 20,
		borderBottomLeftRadius: 36,
		borderBottomRightRadius: 36,
		overflow: "hidden",
	},
	headerGlow: {
		position: "absolute",
		width: 280,
		height: 280,
		borderRadius: 140,
		backgroundColor: "rgba(139,92,246,0.18)",
		top: -120,
		right: -100,
	},
	headerGlow2: {
		position: "absolute",
		width: 180,
		height: 180,
		borderRadius: 90,
		backgroundColor: "rgba(34,211,238,0.08)",
		top: 40,
		left: -60,
	},
	headerTop: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	greeting: {
		color: "rgba(255,255,255,0.55)",
		fontSize: 15,
	},
	name: {
		color: "#FFF",
		fontSize: 32,
		fontWeight: "800",
		marginTop: 4,
	},
	locationRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
		gap: 5,
	},
	locationTextHeader: {
		color: "rgba(255,255,255,0.6)",
		fontSize: 13,
	},
	headerButtons: {
		flexDirection: "row",
		gap: 10,
	},
	headerBtn: {
		width: 48,
		height: 48,
		borderRadius: 18,
		backgroundColor: "rgba(255,255,255,0.08)",
		justifyContent: "center",
		alignItems: "center",
	},

	// ── City card ──
	cityCard: {
		marginTop: 28,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 28,
		padding: 20,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.09)",
	},
	cityTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},
	cityLabel: {
		color: "rgba(255,255,255,0.4)",
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.4,
	},
	cityTitle: {
		color: "#FFF",
		fontSize: 30,
		fontWeight: "800",
		marginTop: 4,
	},
	citySub: {
		color: "rgba(255,255,255,0.55)",
		marginTop: 4,
		fontSize: 13,
	},
	livePill: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(34,197,94,0.14)",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		gap: 6,
	},
	liveDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#22C55E",
	},
	liveText: {
		color: "#22C55E",
		fontWeight: "700",
		fontSize: 11,
	},

	// ── Stat cards ──
	statsRow: {
		flexDirection: "row",
		gap: 10,
		marginTop: 22,
	},
	statCard: {
		flex: 1,
		backgroundColor: "rgba(255,255,255,0.05)",
		borderRadius: 18,
		padding: 14,
		alignItems: "center",
		borderWidth: 1,
	},
	statIconWrap: {
		width: 36,
		height: 36,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 8,
	},
	statNumber: {
		color: "#FFF",
		fontSize: 24,
		fontWeight: "800",
	},
	statLabel: {
		color: "rgba(255,255,255,0.45)",
		fontSize: 11,
		marginTop: 4,
		textAlign: "center",
	},

	// ── Map button ──
	mapButton: {
		marginTop: 18,
		borderRadius: 20,
		overflow: "hidden",
	},
	mapButtonGradient: {
		height: 56,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	mapButtonText: {
		color: "#FFF",
		fontWeight: "700",
		fontSize: 15,
	},

	// ── Ações rápidas ──
	acoesGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: 18,
		gap: 10,
		marginBottom: 12,
	},
	acaoCardWrapper: {
		width: (width - 46) / 2,
	},
	acaoCard: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderRadius: 16,
		backgroundColor: Colors.surface,
		borderWidth: 1,
		borderColor: Colors.glassBorder,
		gap: 10,
	},
	acaoIconCircle: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	acaoLabel: {
		flex: 1,
		fontSize: 12,
		fontWeight: "700",
		color: Colors.textPrimary,
	},
	acaoChevron: {
		opacity: 0.5,
	},

	// ── Categorias ──
	categoriasList: {
		paddingHorizontal: 18,
		paddingVertical: 8,
		gap: 10,
	},
	categoryPill: {
		height: 40,
		paddingHorizontal: 18,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.07)",
		justifyContent: "center",
		alignItems: "center",
	},
	categoryPillActive: {
		backgroundColor: Colors.primary,
	},
	categoryText: {
		color: "rgba(255,255,255,0.6)",
		fontWeight: "600",
		fontSize: 14,
	},
	categoryTextActive: {
		color: "#FFF",
	},

	// ── Section ──
	sectionHeader: {
		paddingHorizontal: 18,
		marginTop: 28,
		marginBottom: 14,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
	},
	sectionTitle: {
		color: "#FFF",
		fontSize: 24,
		fontWeight: "800",
	},
	sectionSub: {
		color: "rgba(255,255,255,0.45)",
		marginTop: 4,
		fontSize: 13,
	},
	sectionLink: {
		color: Colors.primaryLight,
		fontWeight: "600",
		fontSize: 14,
	},

	// ── Hero card ──
	heroCard: {
		width: width * 0.78,
		height: 300,
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
		left: 20,
		right: 20,
		bottom: 20,
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
		fontWeight: "700",
		fontSize: 11,
	},
	heroTitle: {
		color: "#FFF",
		fontSize: 24,
		fontWeight: "800",
	},
	heroLocation: {
		color: "rgba(255,255,255,0.7)",
		marginTop: 8,
		fontSize: 13,
	},

	// ── Divisor ──
	divider: {
		height: 1,
		backgroundColor: "rgba(255,255,255,0.07)",
		marginHorizontal: 18,
		marginTop: 30,
	},

	// ── Feed card ──
	feedCard: {
		marginHorizontal: 18,
		marginBottom: 18,
		borderRadius: 28,
		overflow: "hidden",
		backgroundColor: "#111827",
	},
	feedCardInner: {
		height: 380,
	},
	feedImage: {
		width: "100%",
		height: "100%",
	},
	feedGradient: {
		...StyleSheet.absoluteFillObject,
	},
	feedBadge: {
		position: "absolute",
		top: 18,
		left: 18,
		backgroundColor: "rgba(108,92,231,0.85)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
	},
	feedBadgeText: {
		color: "#FFF",
		fontWeight: "700",
		fontSize: 11,
	},
	feedContent: {
		position: "absolute",
		left: 18,
		right: 18,
		bottom: 18,
	},
	feedTitle: {
		color: "#FFF",
		fontSize: 26,
		fontWeight: "800",
	},
	feedMeta: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
		gap: 4,
	},
	feedLocation: {
		color: "rgba(255,255,255,0.65)",
		fontSize: 13,
		flex: 1,
	},
	feedActions: {
		marginTop: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	leftActions: {
		flexDirection: "row",
		alignItems: "center",
	},
	actionBtn: {
		padding: 8,
	},
	notifBtn: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255,255,255,0.12)",
		paddingHorizontal: 14,
		paddingVertical: 9,
		borderRadius: 20,
		gap: 6,
	},
	notifBtnActive: {
		backgroundColor: "rgba(108,92,231,0.22)",
	},
	notifBtnText: {
		color: "#FFF",
		fontWeight: "600",
		fontSize: 13,
	},
	notifBtnTextActive: {
		color: "#6C5CE7",
	},

	// ── Empty state ──
	emptySection: {
		alignItems: "center",
		paddingVertical: 40,
		gap: 12,
	},
	emptyText: {
		color: "rgba(255,255,255,0.3)",
		fontSize: 14,
		textAlign: "center",
		paddingHorizontal: 40,
	},

	// ── FAB ──
	fab: {
		position: "absolute",
		right: 22,
		borderRadius: 30,
		overflow: "hidden",
		shadowColor: "#6C5CE7",
		shadowOpacity: 0.5,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 8 },
		elevation: 12,
	},
	fabGradient: {
		width: 58,
		height: 58,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
	},
});