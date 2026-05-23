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
	FlatList,
} from "react-native";

import Animated, {
	FadeInDown,
	FadeInUp,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	interpolate,
	useAnimatedScrollHandler,
	useAnimatedRef,
	useAnimatedReaction,
	runOnJS,
	useDerivedValue,
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

const { width, height } = Dimensions.get("window");

const HEADER_HEIGHT = 360;

const DEFAULT_EVENT_IMAGE =
	"https://placehold.co/600x600/1B1D26/6C5CE7?text=Evento";

const AnimatedFlashList =
	Animated.createAnimatedComponent(
		FlashList
	);

const categorias = [
	"Todos",
	"Shows",
	"Teatro",
	"Arte",
	"Gastronomia",
	"Festival",
];

const LikeButton = memo(
	({ isLiked, onPress }) => {
		const scale =
			useSharedValue(1);

		const animatedStyle =
			useAnimatedStyle(() => ({
				transform: [
					{
						scale: scale.value,
					},
				],
			}));

		const handlePress = () => {
			scale.value =
				withSpring(1.25);

			setTimeout(() => {
				scale.value =
					withSpring(1);
			}, 120);

			onPress();
		};

		return (
			<TouchableOpacity
				style={styles.actionBtn}
				onPress={handlePress}
			>
				<Animated.View
					style={
						animatedStyle
					}
				>
					<MaterialCommunityIcons
						name={
							isLiked
								? "heart"
								: "heart-outline"
						}
						size={25}
						color={
							isLiked
								? "#A855F7"
								: "#FFF"
						}
					/>
				</Animated.View>
			</TouchableOpacity>
		);
	}
);

export default function TelaInicio() {
	const navigation =
		useNavigation();

	const insets =
		useSafeAreaInsets();

	const { user, nome } =
		useAuth();

	const [loading, setLoading] =
		useState(true);

	const [eventos, setEventos] =
		useState([]);

	const [likedIds, setLikedIds] =
		useState([]);

	const [
		subscribedEvents,
		setSubscribedEvents,
	] = useState({});

	const [
		categoriaAtiva,
		setCategoriaAtiva,
	] = useState("Todos");

	const [cidade, setCidade] =
		useState("Fortaleza");

	const [bairro, setBairro] =
		useState("Sua região");

	const [regiao, setRegiao] =
		useState("CE");

	const [painelCidade, setPainelCidade] =
		useState({
			eventos: 0,
			proximos: 0,
			hotspots: 0,
		});

	const scrollY =
		useSharedValue(0);

	const horizontalX =
		useSharedValue(0);

	const scrollHandler =
		useAnimatedScrollHandler({
			onScroll: (event) => {
				scrollY.value =
					event.contentOffset.y;
			},
		});

	const horizontalHandler =
		useAnimatedScrollHandler({
			onScroll: (event) => {
				horizontalX.value =
					event.contentOffset.x;
			},
		});

	const nomeUsuario =
		nome ||
		user?.displayName ||
		user?.email?.split("@")[0] ||
		"Explorador";

	const saudacaoHorario =
		useMemo(() => {
			const hora =
				new Date().getHours();

			if (hora < 12)
				return "Bom dia ☀️";

			if (hora < 18)
				return "Boa tarde 🌤️";

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
			console.log(e);
		} finally {
			setLoading(false);
		}
	}

	async function carregarGeolocalizacao() {
		try {
			const { status } =
				await Location.requestForegroundPermissionsAsync();

			if (status !== "granted")
				return;

			const localizacao =
				await Location.getCurrentPositionAsync(
					{
						accuracy:
							Location.Accuracy
								.Balanced,
					}
				);

			const resumo =
				await getMapaSummary(
					localizacao.coords
						.latitude,
					localizacao.coords
						.longitude
				);

			setPainelCidade({
				eventos:
					resumo.totalEventos ||
					0,

				proximos:
					resumo.proximos ||
					0,

				hotspots:
					resumo.hotspots ||
					0,
			});

			const response =
				await fetch(
					`https://nominatim.openstreetmap.org/reverse?format=json&lat=${localizacao.coords.latitude}&lon=${localizacao.coords.longitude}`
				);

			const data =
				await response.json();

			setCidade(
				data?.address?.city ||
					"Fortaleza"
			);

			setBairro(
				data?.address?.suburb ||
					data?.address
						?.neighbourhood ||
					"Sua região"
			);

			setRegiao(
				data?.address?.state ||
					"CE"
			);
		} catch (e) {
			console.log(e);
		}
	}

	async function carregarFeed() {
		try {
			const eventosQuery =
				query(
					collection(
						db,
						"eventos"
					),
					orderBy(
						"createdAt",
						"desc"
					),
					limit(12)
				);

			const snap =
				await getDocs(
					eventosQuery
				);

			const lista =
				snap.docs.map(
					(doc) => {
						const data =
							doc.data();

						return {
							id: doc.id,
							type: "evento",
							...data,

							imagem:
								data.imagemEvento ||
								DEFAULT_EVENT_IMAGE,

							titulo:
								data.tituloEvento ||
								"Evento",

							local:
								data.localEvento ||
								"Local",

							categoria:
								data.categoria ||
								"Evento",

							score:
								data.likes ||
								0,
						};
					}
				);

			setEventos(lista);
		} catch (e) {
			console.log(e);
		}
	}

	async function carregarLikes() {
		try {
			if (!user?.uid)
				return;

			const likes =
				await getUserFeedLikes(
					user.uid
				);

			setLikedIds(likes);
		} catch (e) {
			console.log(e);
		}
	}

	async function carregarSubscribedEvents() {
		try {
			if (!user?.uid)
				return;

			const eventos =
				await getSubscribedEvents(
					user.uid
				);

			const mapa = {};

			eventos.forEach(
				(evento) => {
					mapa[
						evento.id
					] = true;
				}
			);

			setSubscribedEvents(
				mapa
			);
		} catch (e) {
			console.log(e);
		}
	}

	const toggleLike =
		useCallback(
			async (
				itemId,
				itemType
			) => {
				try {
					const liked =
						await toggleFeedLike(
							itemId,
							itemType,
							user.uid
						);

					if (liked) {
						setLikedIds(
							(prev) => [
								...prev,
								itemId,
							]
						);
					} else {
						setLikedIds(
							(prev) =>
								prev.filter(
									(id) =>
										id !==
										itemId
								)
						);
					}
				} catch (e) {
					console.log(e);
				}
			},
			[user]
		);

	async function toggleNotification(
		evento
	) {
		try {
			const isSubscribed =
				subscribedEvents[
					evento.id
				];

			if (isSubscribed) {
				await unsubscribeFromEvent(
					user.uid,
					evento.id
				);

				setSubscribedEvents(
					(prev) => ({
						...prev,
						[evento.id]:
							false,
					})
				);
			} else {
				await subscribeToEvent(
					user.uid,
					evento
				);

				setSubscribedEvents(
					(prev) => ({
						...prev,
						[evento.id]:
							true,
					})
				);
			}
		} catch (error) {
			console.log(error);
		}
	}

	const eventosFiltrados =
		useMemo(() => {
			if (
				categoriaAtiva ===
				"Todos"
			)
				return eventos;

			return eventos.filter(
				(evento) =>
					evento.categoria
						?.toLowerCase()
						.includes(
							categoriaAtiva.toLowerCase()
						)
			);
		}, [
			eventos,
			categoriaAtiva,
		]);

	const destaques =
		useMemo(() => {
			return eventosFiltrados
				.slice()
				.sort(
					(a, b) =>
						b.score -
						a.score
				)
				.slice(0, 6);
		}, [eventosFiltrados]);

	const headerStyle =
		useAnimatedStyle(() => {
			const translateY =
				interpolate(
					scrollY.value,
					[0, 300],
					[0, -110]
				);

			const scale =
				interpolate(
					scrollY.value,
					[-100, 0],
					[1.1, 1]
				);

			return {
				transform: [
					{
						translateY,
					},
					{
						scale,
					},
				],
			};
		});

	if (loading) {
		return (
			<View
				style={
					styles.loadingContainer
				}
			>
				<ActivityIndicator
					size="large"
					color={
						Colors.primary
					}
				/>

				<Text
					style={
						styles.loadingText
					}
				>
					Carregando
					experiências...
				</Text>
			</View>
		);
	}

	const HeroCard = ({
		item,
		index,
	}) => {
		const scale =
			useSharedValue(1);

		const imageStyle =
			useAnimatedStyle(() => {
				const imageScale =
					interpolate(
						horizontalX.value,
						[
							(index -
								1) *
								(width *
									0.82 +
									18),

							index *
								(width *
									0.82 +
									18),

							(index +
								1) *
								(width *
									0.82 +
									18),
						],
						[
							1,
							1.08,
							1,
						]
					);

				return {
					transform:
						[
							{
								scale:
									imageScale,
							},
						],
				};
			});

		return (
			<Animated.View
				entering={FadeInUp.delay(
					index * 90
				).springify()}
			>
				<TouchableOpacity
					activeOpacity={
						0.95
					}
					style={
						styles.heroCard
					}
					onPress={() =>
						navigation.navigate(
							"Detalhes",
							{
								evento:
									item,
							}
						)
					}
				>
					<Animated.Image
						source={{
							uri: item.imagem,
						}}
						style={[
							styles.heroImage,
							imageStyle,
						]}
					/>

					<LinearGradient
						colors={[
							"transparent",
							"rgba(0,0,0,0.95)",
						]}
						style={
							styles.heroGradient
						}
					/>

					<View
						style={
							styles.heroContent
						}
					>
						<View
							style={
								styles.heroBadge
							}
						>
							<Text
								style={
									styles.heroBadgeText
								}
							>
								{
									item.categoria
								}
							</Text>
						</View>

						<Text
							numberOfLines={
								2
							}
							style={
								styles.heroTitle
							}
						>
							{
								item.titulo
							}
						</Text>

						<Text
							style={
								styles.heroLocation
							}
						>
							📍{" "}
							{
								item.local
							}
						</Text>
					</View>
				</TouchableOpacity>
			</Animated.View>
		);
	};

	return (
		<View style={styles.container}>
			<StatusBar
				barStyle="light-content"
			/>

			<Animated.ScrollView
				onScroll={scrollHandler}
				scrollEventThrottle={
					16
				}
				showsVerticalScrollIndicator={
					false
				}
				contentContainerStyle={{
					paddingBottom:
						140,
				}}
			>
				{/* HEADER */}
				<Animated.View
					style={[
						headerStyle,
					]}
				>
					<LinearGradient
						colors={[
							"#111827",
							"#0F172A",
							"#05060A",
						]}
						style={
							styles.header
						}
					>
						<View
							style={
								styles.headerGlow
							}
						/>

						<View
							style={
								styles.headerTop
							}
						>
							<View>
								<Text
									style={
										styles.greeting
									}
								>
									{
										saudacaoHorario
									}
								</Text>

								<Text
									style={
										styles.name
									}
								>
									{
										nomeUsuario
									}
								</Text>

								<View
									style={
										styles.locationRow
									}
								>
									<MaterialCommunityIcons
										name="map-marker-radius"
										size={
											16
										}
										color="#A78BFA"
									/>

									<Text
										style={
											styles.locationTextHeader
										}
									>
										{
											bairro
										}{" "}
										•{" "}
										{
											cidade
										}
									</Text>
								</View>
							</View>

							<View
								style={
									styles.headerButtons
								}
							>
								<TouchableOpacity
									style={
										styles.headerBtn
									}
									onPress={() =>
										navigation.navigate(
											"CriarPost"
										)
									}
								>
									<MaterialCommunityIcons
										name="plus"
										size={
											22
										}
										color="#FFF"
									/>
								</TouchableOpacity>

								<TouchableOpacity
									style={
										styles.headerBtn
									}
									onPress={() =>
										navigation.navigate(
											"EventosApp"
										)
									}
								>
									<MaterialCommunityIcons
										name="bell-outline"
										size={
											22
										}
										color="#FFF"
									/>
								</TouchableOpacity>
							</View>
						</View>

						<View
							style={
								styles.cityCard
							}
						>
							<View
								style={
									styles.cityTop
								}
							>
								<View>
									<Text
										style={
											styles.cityLabel
										}
									>
										SUA
										REGIÃO
									</Text>

									<Text
										style={
											styles.cityTitle
										}
									>
										{
											cidade
										}
									</Text>

									<Text
										style={
											styles.citySub
										}
									>
										{
											bairro
										}{" "}
										•{" "}
										{
											regiao
										}
									</Text>
								</View>

								<View
									style={
										styles.livePill
									}
								>
									<View
										style={
											styles.liveDot
										}
									/>

									<Text
										style={
											styles.liveText
										}
									>
										AO
										VIVO
									</Text>
								</View>
							</View>

							<View
								style={
									styles.statsRow
								}
							>
								<View
									style={
										styles.statItem
									}
								>
									<Text
										style={
											styles.statNumber
										}
									>
										{
											painelCidade.eventos
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
										styles.statItem
									}
								>
									<Text
										style={
											styles.statNumber
										}
									>
										{
											painelCidade.proximos
										}
									</Text>

									<Text
										style={
											styles.statLabel
										}
									>
										Próximos
									</Text>
								</View>

								<View
									style={
										styles.statItem
									}
								>
									<Text
										style={
											styles.statNumber
										}
									>
										{
											painelCidade.hotspots
										}
									</Text>

									<Text
										style={
											styles.statLabel
										}
									>
										Hotspots
									</Text>
								</View>
							</View>

							<TouchableOpacity
								style={
									styles.mapButton
								}
								onPress={() =>
									navigation.navigate(
										"MapaVivo"
									)
								}
							>
								<MaterialCommunityIcons
									name="radar"
									size={
										20
									}
									color="#FFF"
								/>

								<Text
									style={
										styles.mapButtonText
									}
								>
									Explorar
									mapa
									cultural
								</Text>
							</TouchableOpacity>
						</View>
					</LinearGradient>
				</Animated.View>

				{/* CATEGORIAS */}
				<FlatList
					data={
						categorias
					}
					horizontal
					showsHorizontalScrollIndicator={
						false
					}
					contentContainerStyle={{
						paddingHorizontal:
							18,
						marginTop:
							24,
					}}
					keyExtractor={(
						item
					) => item}
					renderItem={({
						item,
					}) => {
						const active =
							categoriaAtiva ===
							item;

						return (
							<TouchableOpacity
								onPress={() =>
									setCategoriaAtiva(
										item
									)
								}
								style={[
									styles.categoryPill,
									active &&
										styles.categoryPillActive,
								]}
							>
								<Text
									style={[
										styles.categoryText,
										active &&
											styles.categoryTextActive,
									]}
								>
									{
										item
									}
								</Text>
							</TouchableOpacity>
						);
					}}
				/>

				{/* SECTION */}
				<View
					style={
						styles.sectionHeader
					}
				>
					<Text
						style={
							styles.sectionTitle
						}
					>
						Destaques
					</Text>

					<Text
						style={
							styles.sectionSub
						}
					>
						Eventos em alta
						na sua região
					</Text>
				</View>

				<AnimatedFlashList
					data={destaques}
					horizontal
					renderItem={({
						item,
						index,
					}) => (
						<HeroCard
							item={item}
							index={
								index
							}
						/>
					)}
					keyExtractor={(
						item
					) =>
						item.id.toString()
					}
					estimatedItemSize={
						320
					}
					showsHorizontalScrollIndicator={
						false
					}
					contentContainerStyle={{
						paddingHorizontal:
							18,
					}}
					onScroll={
						horizontalHandler
					}
					scrollEventThrottle={
						16
					}
				/>

				{/* FEED */}
				<View
					style={
						styles.sectionHeader
					}
				>
					<Text
						style={
							styles.sectionTitle
						}
					>
						Feed Cultural
					</Text>

					<Text
						style={
							styles.sectionSub
						}
					>
						O que está
						acontecendo agora
					</Text>
				</View>

				<FlatList
					data={
						eventosFiltrados
					}
					scrollEnabled={
						false
					}
					keyExtractor={(
						item
					) =>
						item.id.toString()
					}
					renderItem={({
						item,
						index,
					}) => (
						<Animated.View
							entering={FadeInDown.delay(
								index *
									60
							).springify()}
						>
							<View
								style={
									styles.feedCard
								}
							>
								<Image
									source={{
										uri: item.imagem,
									}}
									style={
										styles.feedImage
									}
								/>

								<LinearGradient
									colors={[
										"transparent",
										"rgba(0,0,0,0.95)",
									]}
									style={
										styles.feedGradient
									}
								/>

								<View
									style={
										styles.feedContent
									}
								>
									<Text
										style={
											styles.feedTitle
										}
									>
										{
											item.titulo
										}
									</Text>

									<Text
										style={
											styles.feedLocation
										}
									>
										📍{" "}
										{
											item.local
										}
									</Text>

									<View
										style={
											styles.feedActions
										}
									>
										<View
											style={
												styles.leftActions
											}
										>
											<LikeButton
												isLiked={likedIds.includes(
													item.id
												)}
												onPress={() =>
													toggleLike(
														item.id,
														item.type
													)
												}
											/>

											<TouchableOpacity
												style={
													styles.actionBtn
												}
												onPress={() =>
													navigation.navigate(
														"Detalhes",
														{
															evento:
																item,
														}
													)
												}
											>
												<MaterialCommunityIcons
													name="comment-outline"
													size={
														24
													}
													color="#FFF"
												/>
											</TouchableOpacity>
										</View>

										<TouchableOpacity
											onPress={() =>
												toggleNotification(
													item
												)
											}
										>
											<MaterialCommunityIcons
												name={
													subscribedEvents[
														item.id
													]
														? "bell-ring"
														: "bell-outline"
												}
												size={
													24
												}
												color={
													subscribedEvents[
														item.id
													]
														? Colors.primary
														: "#FFF"
												}
											/>
										</TouchableOpacity>
									</View>
								</View>
							</View>
						</Animated.View>
					)}
				/>
			</Animated.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor:
			"#05060A",
	},

	loadingContainer: {
		flex: 1,
		justifyContent:
			"center",
		alignItems: "center",
		backgroundColor:
			"#05060A",
	},

	loadingText: {
		color:
			"rgba(255,255,255,0.6)",
		marginTop: 16,
		fontSize: 15,
	},

	header: {
		paddingTop: 64,
		paddingBottom: 34,
		paddingHorizontal: 20,
		borderBottomLeftRadius: 34,
		borderBottomRightRadius: 34,
		overflow: "hidden",
	},

	headerGlow: {
		position: "absolute",
		width: 260,
		height: 260,
		borderRadius: 180,
		backgroundColor:
			"rgba(139,92,246,0.16)",
		top: -120,
		right: -80,
	},

	headerTop: {
		flexDirection: "row",
		justifyContent:
			"space-between",
	},

	greeting: {
		color:
			"rgba(255,255,255,0.6)",
		fontSize: 15,
	},

	name: {
		color: "#FFF",
		fontSize: 34,
		fontWeight: "800",
		marginTop: 4,
	},

	locationRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
	},

	locationTextHeader: {
		color:
			"rgba(255,255,255,0.65)",
		marginLeft: 6,
		fontSize: 14,
	},

	headerButtons: {
		flexDirection: "row",
	},

	headerBtn: {
		width: 48,
		height: 48,
		borderRadius: 18,
		backgroundColor:
			"rgba(255,255,255,0.08)",
		justifyContent:
			"center",
		alignItems: "center",
		marginLeft: 10,
	},

	cityCard: {
		marginTop: 28,
		backgroundColor:
			"rgba(255,255,255,0.06)",
		borderRadius: 28,
		padding: 20,
		borderWidth: 1,
		borderColor:
			"rgba(255,255,255,0.08)",
	},

	cityTop: {
		flexDirection: "row",
		justifyContent:
			"space-between",
	},

	cityLabel: {
		color:
			"rgba(255,255,255,0.4)",
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.2,
	},

	cityTitle: {
		color: "#FFF",
		fontSize: 30,
		fontWeight: "800",
		marginTop: 4,
	},

	citySub: {
		color:
			"rgba(255,255,255,0.6)",
		marginTop: 4,
	},

	livePill: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor:
			"rgba(34,197,94,0.14)",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 18,
	},

	liveDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor:
			"#22C55E",
	},

	liveText: {
		color: "#22C55E",
		fontWeight: "700",
		fontSize: 11,
		marginLeft: 6,
	},

	statsRow: {
		flexDirection: "row",
		justifyContent:
			"space-between",
		marginTop: 26,
	},

	statItem: {
		alignItems: "center",
		flex: 1,
	},

	statNumber: {
		color: "#FFF",
		fontSize: 26,
		fontWeight: "800",
	},

	statLabel: {
		color:
			"rgba(255,255,255,0.45)",
		fontSize: 12,
		marginTop: 6,
	},

	mapButton: {
		marginTop: 22,
		height: 56,
		borderRadius: 20,
		backgroundColor:
			"rgba(139,92,246,0.24)",
		flexDirection: "row",
		alignItems: "center",
		justifyContent:
			"center",
	},

	mapButtonText: {
		color: "#FFF",
		fontWeight: "700",
		fontSize: 15,
		marginLeft: 10,
	},

	categoryPill: {
		height: 42,
		paddingHorizontal: 18,
		borderRadius: 21,
		backgroundColor:
			"rgba(255,255,255,0.06)",
		justifyContent:
			"center",
		alignItems: "center",
		marginRight: 10,
	},

	categoryPillActive: {
		backgroundColor:
			Colors.primary,
	},

	categoryText: {
		color:
			"rgba(255,255,255,0.65)",
		fontWeight: "600",
	},

	categoryTextActive: {
		color: "#FFF",
	},

	sectionHeader: {
		paddingHorizontal: 18,
		marginTop: 30,
		marginBottom: 16,
	},

	sectionTitle: {
		color: "#FFF",
		fontSize: 26,
		fontWeight: "800",
	},

	sectionSub: {
		color:
			"rgba(255,255,255,0.5)",
		marginTop: 5,
	},

	heroCard: {
		width: width * 0.82,
		height: 320,
		marginRight: 18,
		borderRadius: 32,
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
		left: 22,
		right: 22,
		bottom: 22,
	},

	heroBadge: {
		alignSelf: "flex-start",
		backgroundColor:
			Colors.primary,
		paddingHorizontal: 12,
		paddingVertical: 7,
		borderRadius: 20,
		marginBottom: 14,
	},

	heroBadgeText: {
		color: "#FFF",
		fontWeight: "700",
		fontSize: 11,
	},

	heroTitle: {
		color: "#FFF",
		fontSize: 28,
		fontWeight: "800",
	},

	heroLocation: {
		color:
			"rgba(255,255,255,0.72)",
		marginTop: 8,
	},

	feedCard: {
		height: 420,
		borderRadius: 30,
		overflow: "hidden",
		marginHorizontal: 18,
		marginBottom: 22,
		backgroundColor:
			"#111827",
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
		left: 20,
		right: 20,
		bottom: 20,
	},

	feedTitle: {
		color: "#FFF",
		fontSize: 30,
		fontWeight: "800",
	},

	feedLocation: {
		color:
			"rgba(255,255,255,0.7)",
		marginTop: 8,
	},

	feedActions: {
		marginTop: 18,
		flexDirection: "row",
		justifyContent:
			"space-between",
		alignItems: "center",
	},

	leftActions: {
		flexDirection: "row",
		alignItems: "center",
	},

	actionBtn: {
		padding: 8,
	},
});