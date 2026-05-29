import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	StatusBar,
	ActivityIndicator,
	Dimensions,
	Platform,
} from "react-native";

import Animated, {
	useSharedValue,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	interpolate,
	interpolateColor,
	Extrapolate,
	FadeIn,
	FadeInDown,
	FadeInUp,
	FadeInLeft,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { getEventosApp } from "../services/eventosAppService";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { getUserLocationWithCity } from "../services/locationService";
import { getEventos as getEventosMapaCultural } from "../services/mapaCulturalService";

const { width } = Dimensions.get("window");

/**
 * ═══════════════════════════════════════════════════════════════════
 * TELA EXPLORAR CIDADE - MELHORADA
 * 
 * Correções & Melhorias:
 * ✓ Erro blurTint corrigido (agora dinâmico via theme)
 * ✓ Performance otimizada (useMemo, useCallback, memo)
 * ✓ Responsividade total (small, normal, large screens)
 * ✓ Light/Dark Mode completo
 * ✓ Proteção contra TabBar
 * ✓ Animações mais suaves
 * ✓ Acessibilidade melhorada
 * ✓ Geolocalização integrada
 * ✓ Cidade dinâmica baseada na localização do usuário
 * ✓ Bairros dinâmicos por cidade
 * ✓ Filtragem de eventos por proximidade geográfica
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── UTILITÁRIOS DE GEOLOCALIZAÇÃO ───

/**
 * Calcula distância em km entre duas coordenadas (fórmula de Haversine)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
	const R = 6371; // Raio da Terra em km
	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * (Math.PI / 180)) *
			Math.cos(lat2 * (Math.PI / 180)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

/**
 * Dicionário de bairros por cidade
 */
const BAIRROS_POR_CIDADE = {
	fortaleza: [
		"Praia de Iracema",
		"Benfica",
		"Aldeota",
		"Centro",
		"Meireles",
		"Mucuripe",
		"Varjota",
		"Parque do Cocó",
		"Beira Mar",
	],
	default: [
		"Centro",
		"Zona Norte",
		"Zona Sul",
		"Zona Oeste",
		"Zona Leste",
	],
};

// ─── COMPONENTE MEMOIZADO: Card de Categoria ───
const CategoryCard = memo(({ item, count, onPress, isDark, styles, colors }) => {
	const isSmallScreen = width < 380;
	
	return (
		<TouchableOpacity
			style={[
				styles.categoryCard,
				{
					backgroundColor: colors.surface,
					borderColor: colors.borderLight,
				},
			]}
			activeOpacity={0.85}
			onPress={onPress}
			accessibilityLabel={`${item.nome}, ${count} evento${count !== 1 ? 's' : ''} ativo${count !== 1 ? 's' : ''}`}
			accessibilityRole="button"
			accessible={true}
		>
			<LinearGradient
				colors={[item.cor, isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"]}
				style={[
					styles.categoryIcon,
					{
						width: isSmallScreen ? 48 : 54,
						height: isSmallScreen ? 48 : 54,
					},
				]}
			>
				<MaterialCommunityIcons
					name={item.icon}
					size={isSmallScreen ? 22 : 26}
					color={colors.onPrimary}
				/>
			</LinearGradient>

			<Text
				style={[
					styles.categoryText,
					{
						fontSize: isSmallScreen ? 13 : 15,
						color: colors.textPrimary,
					},
				]}
			>
				{item.nome}
			</Text>

			<View style={[
				styles.countBadge,
				{
					backgroundColor: isDark ? colors.surface + "40" : "rgba(0,0,0,0.05)",
				},
			]}>
				<Text style={[
					styles.categoryCount,
					{
						color: colors.textSecondary,
					},
				]}>
					{count > 0
						? `${count} ${count === 1 ? "ativo" : "ativos"}`
						: "Nenhum ativo"}
				</Text>
			</View>
		</TouchableOpacity>
	);
});

CategoryCard.displayName = "CategoryCard";

// ─── COMPONENTE MEMOIZADO: Card de Bairro ───
const BairroCard = memo(({ bairro, count, onPress, colors, isDark, styles }) => {
	const isSmallScreen = width < 380;
	
	return (
		<TouchableOpacity
			style={[
				styles.bairroCard,
				{
					backgroundColor: colors.surface,
					borderColor: colors.border,
				},
			]}
			activeOpacity={0.85}
			onPress={onPress}
			accessibilityLabel={`${bairro}, ${count} evento${count !== 1 ? 's' : ''} ativo${count !== 1 ? 's' : ''}`}
			accessibilityRole="button"
			accessible={true}
		>
			<View style={styles.bairroInfo}>
				<View
					style={[
						styles.bairroIconWrapper,
						{
							backgroundColor: colors.primary + "14",
							width: isSmallScreen ? 36 : 40,
							height: isSmallScreen ? 36 : 40,
						},
					]}
				>
					<MaterialCommunityIcons
						name="office-building"
						size={isSmallScreen ? 18 : 20}
						color={colors.primary}
					/>
				</View>

				<View style={{ flex: 1 }}>
					<Text
						style={[
							styles.bairroNome,
							{
								color: colors.textPrimary,
								fontSize: isSmallScreen ? 14 : 16,
							},
						]}
					>
						{bairro}
					</Text>

					<Text
						style={[
							styles.bairroDesc,
							{
								color: colors.textMuted,
								fontSize: isSmallScreen ? 11 : 12,
							},
						]}
					>
						{count > 0
							? `${count} ${
									count === 1
										? "evento ativo"
										: "eventos ativos"
							}`
							: "Nenhum evento ativo"}
					</Text>
				</View>
			</View>

			<View
				style={[
					styles.chevronWrapper,
					{
						backgroundColor: colors.primary + "10",
					},
				]}
			>
				<MaterialCommunityIcons
					name="chevron-right"
					size={20}
					color={colors.primary}
				/>
			</View>
		</TouchableOpacity>
	);
});

BairroCard.displayName = "BairroCard";

// ─── MAIN COMPONENT ───
export default function TelaExploreCidade({ navigation, route }) {
	const themeContext = useTheme();
	const colors = themeContext.colors;
	const isDark = themeContext.isDark;
	const insets = useSafeAreaInsets();
	const tabBarHeight = useBottomTabBarHeight();
	const themedStyles = useThemedStyles(createThemedScreenStyles);
	const routeEventos = route.params?.eventos;

	// BLUR TINT - DINÂMICO COM BASE NO TEMA
	const blurTint = isDark ? "dark" : "light";

	// ─── STATE ───
	const [eventos, setEventos] = useState(routeEventos || []);
	const [eventosMapaCultural, setEventosMapaCultural] = useState([]);
	const [loading, setLoading] = useState(!routeEventos);
	const [userLocation, setUserLocation] = useState(null);
	const [cidade, setCidade] = useState("Fortaleza");
	const [estado, setEstado] = useState("Ceará");
	const [locationLoading, setLocationLoading] = useState(true);

	// ─── ANIMATED VALUES ───
	const scrollY = useSharedValue(0);

	const onScroll = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});

	// ─── ANIMATED STYLES ───
	const headerStyle = useAnimatedStyle(() => {
		const borderOpacity = interpolate(
			scrollY.value,
			[0, 50],
			[0, 1],
			Extrapolate.CLAMP
		);

		return {
			borderBottomColor: interpolateColor(
				borderOpacity,
				[0, 1],
				[
					isDark
						? "rgba(255, 255, 255, 0)"
						: "rgba(0, 0, 0, 0)",
					isDark
						? "rgba(255, 255, 255, 0.08)"
						: "rgba(0, 0, 0, 0.08)",
				]
			),
		};
	});

	const blurStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
			scrollY.value,
			[0, 50],
			[0, 1],
			Extrapolate.CLAMP
		);
		return {
			opacity,
		};
	});

	// ─── MEMOIZED DATA ───
	const categorias = useMemo(
		() => [
			{
				nome: "Música",
				icon: "music",
				cor: "#8B5CF6",
			},
			{
				nome: "Gastronomia",
				icon: "silverware-fork-knife",
				cor: "#F59E0B",
			},
			{
				nome: "Teatro",
				icon: "drama-masks",
				cor: "#06B6D4",
			},
			{
				nome: "Exposições",
				icon: "palette",
				cor: "#EC4899",
			},
		],
		[]
	);

	const bairros = useMemo(() => {
		const cidadeLower = cidade.toLowerCase();
		return BAIRROS_POR_CIDADE[cidadeLower] || BAIRROS_POR_CIDADE.default;
	}, [cidade]);

	// ─── FILTRAGEM POR GEOLOCALIZAÇÃO ───
	const eventosFiltrados = useMemo(() => {
		// Combinar eventos do app com eventos do Mapa Cultural
		const todosEventos = [...eventos];
		
		// Adicionar eventos do Mapa Cultural normalizados
		eventosMapaCultural.forEach((eventoMC) => {
			if (eventoMC.location?.latitude && eventoMC.location?.longitude) {
				todosEventos.push({
					id: `mc_${eventoMC.id}`,
					titulo: eventoMC.name || eventoMC.shortDescription,
					categoria: eventoMC.terms?.linguagem?.[0] || "Cultura",
					localEvento: eventoMC.location?.name || eventoMC.shortDescription,
					location: {
						latitude: eventoMC.location.latitude,
						longitude: eventoMC.location.longitude,
					},
					fromMapaCultural: true,
				});
			}
		});

		if (!userLocation || !todosEventos.length) return todosEventos;

		const RAIO_KM = 50; // Raio de 50km para filtrar eventos próximos
		
		return todosEventos.filter((evento) => {
			if (!evento.location?.latitude || !evento.location?.longitude) {
				return true; // Incluir eventos sem localização
			}

			const distancia = calculateDistance(
				userLocation.latitude,
				userLocation.longitude,
				evento.location.latitude,
				evento.location.longitude
			);

			return distancia <= RAIO_KM;
		});
	}, [userLocation, eventos, eventosMapaCultural]);

	// ─── OTIMIZAÇÃO: Cálculo eficiente de contagens ───
	const counts = useMemo(() => {
		const categoriaCounts = {};
		const bairroCounts = {};

		eventosFiltrados.forEach((e) => {
			// Contagem de categoria
			const cat = (e.categoria || "").toLowerCase();
			categorias.forEach((c) => {
				const cNomeLower = c.nome.toLowerCase();
				if (cat.includes(cNomeLower)) {
					categoriaCounts[c.nome] =
						(categoriaCounts[c.nome] || 0) + 1;
				}
			});

			// Contagem de bairro
			const local = (
				e.localEvento ||
				e.nomeLocal ||
				e.local ||
				""
			).toLowerCase();
			bairros.forEach((b) => {
				const bLower = b.toLowerCase();
				if (local.includes(bLower)) {
					bairroCounts[b] = (bairroCounts[b] || 0) + 1;
				}
			});
		});

		return { categoriaCounts, bairroCounts };
	}, [eventosFiltrados, categorias, bairros]);

	// ─── STATS COM MEMOIZAÇÃO ───
	const stats = useMemo(() => {
		const topCategory = Object.entries(
			counts.categoriaCounts
		).sort((a, b) => b[1] - a[1])[0]?.[0] || "Cultura";

		const vibe =
			topCategory.toLowerCase().includes("show") ||
			topCategory.toLowerCase().includes("festival")
				? `${cidade} em modo palco 🎸`
				: "Cidade em descoberta cultural 🎨";

		return {
			topCategory,
			vibe,
			clima: "29°C",
		};
	}, [counts.categoriaCounts, cidade]);

	// ─── EFEITOS ───
	useEffect(() => {
		async function carregarEventos() {
			try {
				const lista = await getEventosApp();
				setEventos(lista);
			} catch (e) {
				console.log(
					"Erro ao carregar eventos no explorador:",
					e
				);
			} finally {
				setLoading(false);
			}
		}

		if (!routeEventos) {
			carregarEventos();
		}
	}, [routeEventos]);

	// ─── GEOLOCALIZAÇÃO ───
	useEffect(() => {
		async function obterLocalizacao() {
			try {
				const locationData = await getUserLocationWithCity();
				if (locationData) {
					setUserLocation({
						latitude: locationData.latitude,
						longitude: locationData.longitude,
					});
					
					if (locationData.city) {
						setCidade(locationData.city);
					}
					
					if (locationData.state) {
						setEstado(locationData.state);
					}

					// Buscar eventos do Mapa Cultural com base na localização
					try {
						const eventosMC = await getEventosMapaCultural({
							lat: locationData.latitude,
							lng: locationData.longitude,
							raio: 50000, // 50km
						});
						setEventosMapaCultural(eventosMC);
					} catch (e) {
						console.log("Erro ao buscar eventos do Mapa Cultural:", e);
					}
				}
			} catch (e) {
				console.log("Erro ao obter localização:", e);
			} finally {
				setLocationLoading(false);
			}
		}

		obterLocalizacao();
	}, []);

	// ─── CALLBACKS ───
	const handleBack = useCallback(() => {
		navigation.goBack();
	}, [navigation]);

	const handleNavigateCategory = useCallback(
		(nomeCat) => {
			navigation.navigate("Busca", {
				screen: "BuscaHome",
				params: {
					categoria: nomeCat,
					localizacao: "",
					query: "",
				},
			});
		},
		[navigation]
	);

	const handleNavigateBairro = useCallback(
		(nomeBairro) => {
			navigation.navigate("Busca", {
				screen: "BuscaHome",
				params: {
					categoria: "Todos",
					localizacao: nomeBairro,
					query: "",
				},
			});
		},
		[navigation]
	);

	// ─── RENDER: LOADING ───
	if (loading) {
		return (
			<View
				style={[
					themedStyles.loadingContainer,
					{ backgroundColor: colors.background },
				]}
			>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text
					style={[
						themedStyles.loadingText,
						{ color: colors.textSecondary },
					]}
				>
					Mapeando pulso urbano...
				</Text>
			</View>
		);
	}

	// ─── RENDER: MAIN ───
	const isSmallScreen = width < 380;

	return (
		<Animated.View
			entering={FadeIn.duration(600)}
			style={[
				themedStyles.container,
				{ backgroundColor: colors.background },
			]}
		>
			<StatusBar
				barStyle={isDark ? "light-content" : "dark-content"}
				backgroundColor={colors.background}
				translucent={false}
			/>

			{/* Glow Background */}
			<View
				style={[
					themedStyles.ambientGlow,
					{
						backgroundColor: colors.primary + "08",
					},
				]}
			/>

			{/* HEADER STICKY */}
			<Animated.View
				style={[
					themedStyles.headerContainer,
					{
						paddingTop: insets.top + 12,
						backgroundColor: colors.background,
					},
					headerStyle,
				]}
			>
				{/* Blur layer que aparece com scroll */}
				<Animated.View
					style={[StyleSheet.absoluteFill, blurStyle]}
				>
					<BlurView
						intensity={35}
						tint={blurTint}
						style={StyleSheet.absoluteFill}
					/>
					<LinearGradient
						colors={[
							colors.background,
							colors.background + "E0",
						]}
						style={StyleSheet.absoluteFill}
					/>
				</Animated.View>

				{/* Header Content */}
				<View
					style={[
						themedStyles.header,
						{ paddingHorizontal: isSmallScreen ? 16 : 20 },
					]}
				>
					<TouchableOpacity
						activeOpacity={0.8}
						style={themedStyles.backButton}
						onPress={handleBack}
						accessibilityLabel="Voltar"
						accessibilityRole="button"
						accessible={true}
					>
						<BlurView
							intensity={35}
							tint={blurTint}
							style={[
								themedStyles.headerBlur,
								{
									borderColor: colors.borderLight,
									backgroundColor: colors.glass,
								},
							]}
						>
							<MaterialCommunityIcons
								name="arrow-left"
								size={22}
								color={colors.textPrimary}
							/>
						</BlurView>
					</TouchableOpacity>

					<View style={themedStyles.headerCopy}>
						<Text
							style={[
								themedStyles.kicker,
								{ color: colors.textSecondary },
							]}
						>
							Fortaleza Hoje
						</Text>
						<Text
							style={[
								themedStyles.title,
								{
									color: colors.textPrimary,
									fontSize: isSmallScreen ? 24 : 28,
								},
							]}
						>
							Explorar
						</Text>
					</View>
				</View>
			</Animated.View>

			{/* SCROLLABLE CONTENT */}
			<Animated.ScrollView
				onScroll={onScroll}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingTop: insets.top + 88,
					paddingBottom: tabBarHeight + 40,
				}}
			>
				{/* OVERVIEW CARD */}
				<Animated.View
					entering={FadeInUp.delay(100)
						.springify()
						.damping(15)}
					style={[
						themedStyles.overviewCardOuter,
						{
							marginHorizontal: isSmallScreen ? 16 : 20,
							borderColor: colors.borderLight,
							backgroundColor: colors.glass,
						},
					]}
				>
					<BlurView
						intensity={25}
						tint={blurTint}
						style={themedStyles.overviewCard}
					>
						{/* Top Section */}
						<View style={themedStyles.overviewTop}>
							<View style={{ flex: 1 }}>
								<Text
									style={[
										themedStyles.overviewLabel,
										{
											color: colors.primary,
										},
									]}
								>
									SUA REGIÃO
								</Text>

								<Text
									style={[
										themedStyles.overviewTitle,
										{
											color: colors.textPrimary,
											fontSize: isSmallScreen ? 24 : 28,
										},
									]}
								>
									{cidade}
								</Text>

								<Text
									style={[
										themedStyles.overviewSub,
										{
											color: colors.textSecondary,
										},
									]}
								>
									{estado} • Brasil
								</Text>
							</View>

							<View
								style={[
									themedStyles.livePill,
									{
										backgroundColor: colors.primary + "1A",
									},
								]}
							>
								<View
									style={[
										themedStyles.liveDot,
										{
											backgroundColor: colors.primary,
										},
									]}
								/>

								<Text
									style={[
										themedStyles.liveText,
										{
											color: colors.primary,
										},
									]}
								>
									AO VIVO
								</Text>
							</View>
						</View>

						{/* Stats Row */}
						<View
							style={[
								themedStyles.statsRow,
								{
									backgroundColor: colors.surface,
									borderColor: colors.borderLight,
								},
							]}
						>
							<View style={themedStyles.statItem}>
								<MaterialCommunityIcons
									name="weather-partly-cloudy"
									size={18}
									color={colors.primary}
								/>

								<Text
									style={[
										themedStyles.statNumber,
										{
											color: colors.textPrimary,
										},
									]}
								>
									{stats.clima}
								</Text>

								<Text
									style={[
										themedStyles.statLabel,
										{
											color: colors.textMuted,
										},
									]}
								>
									Clima
								</Text>
							</View>

							<View
								style={[
									themedStyles.statItemDivider,
									{
										backgroundColor: colors.borderLight,
									},
								]}
							/>

							<View style={themedStyles.statItem}>
								<MaterialCommunityIcons
									name="calendar-star"
									size={18}
									color={colors.primary}
								/>

								<Text
									style={[
										themedStyles.statNumber,
										{
											color: colors.textPrimary,
										},
									]}
								>
									{eventosFiltrados.length}
								</Text>

								<Text
									style={[
										themedStyles.statLabel,
										{
											color: colors.textMuted,
										},
									]}
								>
									Eventos
								</Text>
							</View>

							<View
								style={[
									themedStyles.statItemDivider,
									{
										backgroundColor: colors.borderLight,
									},
								]}
							/>

							<View style={themedStyles.statItem}>
								<MaterialCommunityIcons
									name="music-circle"
									size={18}
									color={colors.primary}
								/>

								<Text
									style={[
										themedStyles.statNumber,
										{
											color: colors.textPrimary,
											fontSize: isSmallScreen ? 14 : 18,
										},
									]}
									numberOfLines={1}
								>
									{stats.topCategory}
								</Text>

								<Text
									style={[
										themedStyles.statLabel,
										{
											color: colors.textMuted,
										},
									]}
								>
									Vibe
								</Text>
							</View>
						</View>

						{/* Vibe Container */}
						<View
							style={[
								themedStyles.vibeContainer,
								{
									backgroundColor: colors.surface,
									borderColor: colors.borderLight,
								},
							]}
						>
							<MaterialCommunityIcons
								name="heart-pulse"
								size={16}
								color={colors.primary}
							/>

							<Text
								style={[
									themedStyles.vibeText,
									{
										color: colors.textPrimary,
									},
								]}
							>
								{stats.vibe}
							</Text>
						</View>
					</BlurView>
				</Animated.View>

				{/* CATEGORIAS SECTION */}
				<Animated.Text
					entering={FadeInLeft.delay(200).springify()}
					style={[
						themedStyles.sectionTitle,
						{
							color: colors.textPrimary,
							marginHorizontal: isSmallScreen ? 16 : 20,
						},
					]}
				>
					Categorias
				</Animated.Text>

				<View
					style={[
						themedStyles.grid,
						{
							paddingHorizontal: isSmallScreen ? 16 : 20,
						},
					]}
				>
					{categorias.map((item, index) => (
						<Animated.View
							key={item.nome}
							entering={FadeInUp.delay(
								250 + index * 100
							)
								.springify()
								.damping(16)}
							style={{ width: "48%" }}
						>
							<CategoryCard
								item={item}
								count={
									counts.categoriaCounts[item.nome] || 0
								}
								onPress={() =>
									handleNavigateCategory(item.nome)
								}
								isDark={isDark}
								styles={themedStyles}
								colors={colors}
							/>
						</Animated.View>
					))}
				</View>

				{/* BAIRROS SECTION */}
				<Animated.Text
					entering={FadeInLeft.delay(350).springify()}
					style={[
						themedStyles.sectionTitle,
						{
							color: colors.textPrimary,
							marginHorizontal: isSmallScreen ? 16 : 20,
						},
					]}
				>
					Explore Bairros
				</Animated.Text>

				{bairros.map((bairro, index) => (
					<Animated.View
						key={bairro}
						entering={FadeInUp.delay(400 + index * 100)
							.springify()
							.damping(16)}
						style={{
							paddingHorizontal: isSmallScreen ? 16 : 20,
							marginBottom: 12,
						}}
					>
						<BairroCard
							bairro={bairro}
							count={counts.bairroCounts[bairro] || 0}
							onPress={() => handleNavigateBairro(bairro)}
							colors={colors}
							isDark={isDark}
							styles={themedStyles}
						/>
					</Animated.View>
				))}
			</Animated.ScrollView>
		</Animated.View>
	);
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * ESTILOS
 * ═══════════════════════════════════════════════════════════════════
 */
function createThemedScreenStyles(c) {
	return StyleSheet.create({
		container: {
			flex: 1,
		},

		ambientGlow: {
			position: "absolute",
			top: -100,
			right: -80,
			width: 360,
			height: 360,
			borderRadius: 180,
			pointerEvents: "none",
		},

		loadingContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},

		loadingText: {
			marginTop: 14,
			fontSize: 14,
			fontWeight: "600",
		},

		headerContainer: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			zIndex: 100,
			paddingBottom: 16,
			borderBottomWidth: 1,
		},

		header: {
			flexDirection: "row",
			alignItems: "center",
		},

		backButton: {
			marginRight: 14,
		},

		headerBlur: {
			width: 48,
			height: 48,
			borderRadius: 18,
			justifyContent: "center",
			alignItems: "center",
			overflow: "hidden",
			borderWidth: 1,
		},

		headerCopy: {
			flex: 1,
		},

		kicker: {
			fontSize: 12,
			fontWeight: "800",
			textTransform: "uppercase",
			letterSpacing: 1,
		},

		title: {
			fontWeight: "800",
			marginTop: 4,
			letterSpacing: -0.5,
		},

		overviewCardOuter: {
			borderRadius: 24,
			overflow: "hidden",
			borderWidth: 1,
			marginTop: 22,
			marginBottom: 10,
		},

		overviewCard: {
			padding: 20,
		},

		overviewTop: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "flex-start",
			marginBottom: 16,
		},

		overviewLabel: {
			fontSize: 11,
			fontWeight: "800",
			letterSpacing: 1.5,
		},

		overviewTitle: {
			fontSize: 28,
			fontWeight: "800",
			marginTop: 2,
		},

		overviewSub: {
			fontSize: 13,
			marginTop: 2,
		},

		livePill: {
			flexDirection: "row",
			alignItems: "center",
			paddingHorizontal: 10,
			paddingVertical: 5,
			borderRadius: 12,
		},

		liveDot: {
			width: 6,
			height: 6,
			borderRadius: 3,
			marginRight: 5,
		},

		liveText: {
			fontWeight: "800",
			fontSize: 10,
			marginLeft: 5,
		},

		statsRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			marginTop: 12,
			paddingVertical: 12,
			borderRadius: 16,
			borderWidth: 1,
		},

		statItem: {
			alignItems: "center",
			flex: 1,
			paddingHorizontal: 5,
		},

		statItemDivider: {
			width: 1,
			height: 22,
		},

		statNumber: {
			fontSize: 18,
			fontWeight: "800",
			marginTop: 4,
		},

		statLabel: {
			fontSize: 11,
			marginTop: 2,
			textTransform: "uppercase",
			letterSpacing: 0.5,
		},

		vibeContainer: {
			marginTop: 14,
			flexDirection: "row",
			alignItems: "center",
			borderRadius: 12,
			paddingHorizontal: 12,
			paddingVertical: 10,
			borderWidth: 1,
		},

		vibeText: {
			fontSize: 13,
			fontWeight: "600",
			marginLeft: 8,
		},

		sectionTitle: {
			fontSize: 22,
			fontWeight: "800",
			marginTop: 24,
			marginBottom: 14,
		},

		grid: {
			flexDirection: "row",
			flexWrap: "wrap",
			justifyContent: "space-between",
		},

		categoryCard: {
			width: "100%",
			borderRadius: 24,
			paddingVertical: 20,
			alignItems: "center",
			marginBottom: 14,
			borderWidth: 1,
		},

		categoryIcon: {
			borderRadius: 18,
			justifyContent: "center",
			alignItems: "center",
			marginBottom: 10,
		},

		categoryText: {
			fontWeight: "700",
		},

		countBadge: {
			marginTop: 6,
			paddingHorizontal: 8,
			paddingVertical: 3,
			borderRadius: 8,
		},

		categoryCount: {
			fontSize: 11,
			fontWeight: "600",
		},

		bairroCard: {
			borderRadius: 24,
			padding: 16,
			borderWidth: 1,
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},

		bairroInfo: {
			flexDirection: "row",
			alignItems: "center",
			flex: 1,
		},

		bairroIconWrapper: {
			borderRadius: 12,
			justifyContent: "center",
			alignItems: "center",
			marginRight: 12,
		},

		bairroNome: {
			fontWeight: "700",
		},

		bairroDesc: {
			marginTop: 3,
			fontWeight: "500",
		},

		chevronWrapper: {
			width: 30,
			height: 30,
			borderRadius: 10,
			justifyContent: "center",
			alignItems: "center",
		},
	});
}