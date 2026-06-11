import React from "react";

import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	StatusBar,
	ImageBackground,
	ScrollView,
	Dimensions,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlurView } from "expo-blur";

import { MotiView } from "moti";

import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { useTheme, useGradients } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function EventoHome({ navigation }) {
	const insets = useSafeAreaInsets();
	const tabBarHeight = useBottomTabBarHeight();
	const { colors, isDark } = useTheme();
	const gradients = useGradients();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

			<ImageBackground
				source={require("../assets/fundoTelaLogin.png")}
				style={styles.bg}
				resizeMode="cover"
			>
				<LinearGradient
					colors={gradients.header}
					style={styles.overlay}
				>
					<View style={[styles.glowTop, { backgroundColor: colors.primary + "38" }]} />
					<View style={[styles.glowBottom, { backgroundColor: colors.accentCyan + "1E" }]} />

					<ScrollView
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{
							paddingBottom: tabBarHeight + 35,
						}}
					>
						<View
							style={[
								styles.header,
								{
									paddingTop: insets.top + 10,
								},
							]}
						>
							<View style={styles.headerTop}>
								<TouchableOpacity
									onPress={() => navigation.goBack()}
									activeOpacity={0.8}
									style={styles.backButton}
								>
									<BlurView intensity={40} tint="dark" style={[styles.blurBtn, { borderColor: colors.borderLight }]}>
										<MaterialCommunityIcons
											name="arrow-left"
											size={24}
											color={colors.textPrimary}
										/>
									</BlurView>
								</TouchableOpacity>

								{/* CULTURA VIVA */}
								<TouchableOpacity
									activeOpacity={0.8}
									onPress={() => navigation.navigate("TelaCulturaViva")}
								>
									<BlurView intensity={30} tint="dark" style={[styles.badge, { borderColor: colors.borderLight }]}>
										<MaterialCommunityIcons
											name="book-open-variant"
											size={18}
											color={colors.primaryLight}
										/>

										<Text style={[styles.badgeText, { color: colors.textPrimary }]}>
											Cultura Viva
										</Text>
									</BlurView>
								</TouchableOpacity>
							</View>

							{/* HERO */}
							<MotiView
								from={{
									opacity: 0,
									translateY: 20,
								}}
								animate={{
									opacity: 1,
									translateY: 0,
								}}
								transition={{
									type: "timing",
									duration: 700,
								}}
								style={styles.hero}
							>
								<View style={styles.heroIcon}>
									<LinearGradient
										colors={gradients.primary}
										style={styles.heroGradient}
									>
										<MaterialCommunityIcons
											name="ticket-confirmation"
											size={38}
											color={colors.onPrimary}
										/>
									</LinearGradient>
								</View>

								<Text style={[styles.title, { color: colors.textPrimary }]}>Eventos</Text>

								<Text style={[styles.subtitle, { color: colors.textSecondary }]}>
									Descubra experiências, cultura, shows e eventos incríveis
									próximos de você.
								</Text>
							</MotiView>
						</View>

						{/* STATS */}
						<MotiView
							from={{
								opacity: 0,
								translateY: 30,
							}}
							animate={{
								opacity: 1,
								translateY: 0,
							}}
							transition={{
								delay: 150,
								duration: 800,
							}}
							style={styles.statsRow}
						>
							<View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.borderLight, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }]}>
								<MaterialCommunityIcons
									name="calendar-star"
									size={24}
									color={colors.primaryLight}
								/>

								<Text style={[styles.statNumber, { color: colors.textPrimary }]}>124</Text>

								<Text style={[styles.statLabel, { color: colors.textMuted }]}>Eventos</Text>
							</View>

							<View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.borderLight, shadowColor: colors.accentCyan, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }]}>
								<MaterialCommunityIcons
									name="account-group"
									size={24}
									color={colors.accentCyan}
								/>

								<Text style={[styles.statNumber, { color: colors.textPrimary }]}>2.3k</Text>

								<Text style={[styles.statLabel, { color: colors.textMuted }]}>Participantes</Text>
							</View>

							<View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.borderLight, shadowColor: colors.warning, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }]}>
								<MaterialCommunityIcons
									name="map-marker-radius"
									size={24}
									color={colors.warning}
								/>

								<Text style={[styles.statNumber, { color: colors.textPrimary }]}>18</Text>

								<Text style={[styles.statLabel, { color: colors.textMuted }]}>Próximos</Text>
							</View>
						</MotiView>

						{/* CONTENT */}
						<View style={styles.content}>
							{/* EVENTOS APP */}
							<MotiView
								from={{
									opacity: 0,
									translateY: 30,
								}}
								animate={{
									opacity: 1,
									translateY: 0,
								}}
								transition={{
									delay: 220,
									duration: 800,
								}}
							>
								<TouchableOpacity
									activeOpacity={0.92}
									style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.borderLight, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 }]}
									onPress={() => navigation.navigate("EventosApp")}
								>
									<LinearGradient
										colors={gradients.surface}
										style={styles.cardGlow}
									/>

									<LinearGradient
										colors={gradients.primary}
										style={styles.iconBox}
									>
										<MaterialCommunityIcons
											name="cellphone"
											size={32}
											color={colors.onPrimary}
										/>
									</LinearGradient>

									<View style={styles.textContainer}>
										<View style={styles.cardTopRow}>
											<Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
												Eventos do App
											</Text>

											<View style={[styles.liveBadge, { backgroundColor: colors.error + "22" }]}>
												<View style={[styles.liveDot, { backgroundColor: colors.error }]} />

												<Text style={[styles.liveText, { color: colors.error }]}>
													AO VIVO
												</Text>
											</View>
										</View>

										<Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
											Eventos exclusivos criados dentro da plataforma.
										</Text>

										<View style={styles.cardFooter}>
											<MaterialCommunityIcons
												name="calendar"
												size={15}
												color={colors.primaryLight}
											/>

											<Text style={[styles.footerText, { color: colors.textMuted }]}>
												Novos eventos hoje
											</Text>
										</View>
									</View>

									<MaterialCommunityIcons
										name="chevron-right"
										size={28}
										color={colors.primary}
									/>
								</TouchableOpacity>
							</MotiView>

							{/* EVENTOS PUBLICOS */}
							<MotiView
								from={{
									opacity: 0,
									translateY: 30,
								}}
								animate={{
									opacity: 1,
									translateY: 0,
								}}
								transition={{
									delay: 380,
									duration: 800,
								}}
							>
								<TouchableOpacity
									activeOpacity={0.92}
									style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.borderLight, shadowColor: colors.accentCyan, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 }]}
									onPress={() => navigation.navigate("EventosPublicos")}
								>
									<LinearGradient
										colors={gradients.surface}
										style={styles.cardGlow}
									/>

									<LinearGradient
										colors={[colors.accentCyan, colors.primary]}
										style={styles.iconBox}
									>
										<MaterialCommunityIcons
											name="earth"
											size={32}
											color={colors.onPrimary}
										/>
									</LinearGradient>

									<View style={styles.textContainer}>
										<View style={styles.cardTopRow}>
											<Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
												Eventos Públicos
											</Text>

											<View style={[styles.cityBadge, { backgroundColor: colors.accentCyan + "29" }]}>
												<Text style={[styles.cityText, { color: colors.accentCyan }]}>
													Fortaleza
												</Text>
											</View>
										</View>

										<Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
											Eventos culturais, públicos e oficiais da cidade.
										</Text>

										<View style={styles.cardFooter}>
											<MaterialCommunityIcons
												name="map-marker"
												size={15}
												color={colors.accentCyan}
											/>

											<Text style={[styles.footerText, { color: colors.textMuted }]}>
												Eventos próximos da sua região
											</Text>
										</View>
									</View>

									<MaterialCommunityIcons
										name="chevron-right"
										size={28}
										color={colors.primary}
									/>
								</TouchableOpacity>
							</MotiView>

							{/* MAPA VIVO */}
							<MotiView
								from={{
									opacity: 0,
									translateY: 30,
								}}
								animate={{
									opacity: 1,
									translateY: 0,
								}}
								transition={{
									delay: 540,
									duration: 800,
								}}
							>
								<TouchableOpacity
									activeOpacity={0.92}
									style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.borderLight, shadowColor: colors.error, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 }]}
									onPress={() => navigation.navigate("TelaMapaVivo")}
								>
									<LinearGradient
										colors={gradients.surface}
										style={styles.cardGlow}
									/>

									<LinearGradient
										colors={[colors.success, colors.error]}
										style={styles.iconBox}
									>
										<MaterialCommunityIcons
											name="map-marker-radius"
											size={32}
											color={colors.onPrimary}
										/>
									</LinearGradient>

									<View style={styles.textContainer}>
										<View style={styles.cardTopRow}>
											<Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
												Mapa Vivo da Cultura
											</Text>

											<View style={[styles.heatBadge, { backgroundColor: colors.error + "22" }]}>
												<MaterialCommunityIcons
													name="fire"
													size={12}
													color={colors.error}
												/>

												<Text style={[styles.heatText, { color: colors.error }]}>
													HEATMAP
												</Text>
											</View>
										</View>

										<Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
											Veja eventos no mapa, calor cultural,
											filtros ao vivo e check-in no local.
										</Text>

										<View style={styles.cardFooter}>
											<MaterialCommunityIcons
												name="crosshairs-gps"
												size={15}
												color={colors.success}
											/>

											<Text style={[styles.footerText, { color: colors.textMuted }]}>
												Cultura acontecendo perto de você
											</Text>
										</View>
									</View>

									<MaterialCommunityIcons
										name="chevron-right"
										size={28}
										color={colors.primary}
									/>
								</TouchableOpacity>
							</MotiView>

							{/* EVENTOS ESPORTIVOS */}
							<MotiView
								from={{
									opacity: 0,
									translateY: 30,
								}}
								animate={{
									opacity: 1,
									translateY: 0,
								}}
								transition={{
									delay: 700,
									duration: 800,
								}}
							>
								<TouchableOpacity
									activeOpacity={0.92}
									style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.borderLight, shadowColor: colors.success, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 }]}
									onPress={() => navigation.navigate("EventosEsportivos")}
								>
									<LinearGradient
										colors={gradients.surface}
										style={styles.cardGlow}
									/>

									<LinearGradient
										colors={[colors.success, colors.primary]}
										style={styles.iconBox}
									>
										<MaterialCommunityIcons
											name="trophy"
											size={32}
											color={colors.onPrimary}
										/>
									</LinearGradient>

									<View style={styles.textContainer}>
										<View style={styles.cardTopRow}>
											<Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
												Eventos Esportivos
											</Text>

											<View style={[styles.sportBadge, { backgroundColor: colors.success + "29" }]}>
												<MaterialCommunityIcons
													name="run"
													size={12}
													color={colors.success}
												/>
												<Text style={[styles.sportText, { color: colors.success }]}>
													SPORT
												</Text>
											</View>
										</View>

										<Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
											Jogos, competições e atividades esportivas na sua região.
										</Text>

										<View style={styles.cardFooter}>
											<MaterialCommunityIcons
												name="basketball"
												size={15}
												color={colors.success}
											/>

											<Text style={[styles.footerText, { color: colors.textMuted }]}>
												Próximos jogos e competições
											</Text>
										</View>
									</View>

									<MaterialCommunityIcons
										name="chevron-right"
										size={28}
										color={colors.primary}
									/>
								</TouchableOpacity>
							</MotiView>

							{/* EXPLORE */}
							<MotiView
								from={{
									opacity: 0,
									translateY: 30,
								}}
								animate={{
									opacity: 1,
									translateY: 0,
								}}
								transition={{
									delay: 860,
									duration: 800,
								}}
							>
								<View style={styles.infoCard}>
									<LinearGradient
										colors={gradients.surface}
										style={[styles.infoGradient, { borderColor: colors.borderLight, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 18, elevation: 10 }]}
									>
										<View style={styles.infoLeft}>
											<View style={[styles.infoIcon, { backgroundColor: colors.glass, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 }]}>
												<MaterialCommunityIcons
													name="compass-outline"
													size={26}
													color={colors.textPrimary}
												/>
											</View>

											<View style={{ flex: 1 }}>
												<Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
													Explore a cidade
												</Text>

												<Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
													Descubra novos eventos perto de você
												</Text>
											</View>
										</View>

										<TouchableOpacity
											activeOpacity={0.8}
											style={[styles.exploreBtn, { backgroundColor: colors.primary + "40", shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 12, elevation: 8 }]}
											onPress={() =>
												navigation.navigate(
													"TelaExploreCidade"
												)
											}
										>
											<MaterialCommunityIcons
												name="arrow-right"
												size={22}
												color={colors.textPrimary}
											/>
										</TouchableOpacity>
									</LinearGradient>
								</View>
							</MotiView>
						</View>
					</ScrollView>
				</LinearGradient>
			</ImageBackground>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	bg: {
		flex: 1,
	},

	overlay: {
		flex: 1,
	},

	glowTop: {
		position: "absolute",
		top: -120,
		right: -60,
		width: 280,
		height: 280,
		borderRadius: 200,
		backgroundColor: "rgba(124,58,237,0.22)",
	},

	glowBottom: {
		position: "absolute",
		bottom: -140,
		left: -60,
		width: 260,
		height: 260,
		borderRadius: 200,
		backgroundColor: "rgba(59,130,246,0.12)",
	},

	header: {
		paddingHorizontal: 24,
		paddingBottom: 32,
	},

	headerTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 32,
	},

	backButton: {
		alignSelf: "flex-start",
	},

	blurBtn: {
		width: 52,
		height: 52,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		borderWidth: 1.5,
		borderColor: "rgba(255,255,255,0.12)",
	},

	badge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 22,
		overflow: "hidden",
		borderWidth: 1.5,
		borderColor: "rgba(255,255,255,0.12)",
	},

	badgeText: {
		marginLeft: 8,
		fontSize: 13,
		fontFamily: "PoppinsMedium",
	},

	hero: {
		marginTop: 12,
	},

	heroIcon: {
		marginBottom: 24,
	},

	heroGradient: {
		width: 96,
		height: 96,
		borderRadius: 32,
		justifyContent: "center",
		alignItems: "center",
	},

	title: {
		fontSize: width < 380 ? 36 : 42,
		fontFamily: "PoppinsBold",
		letterSpacing: 0.5,
	},

	subtitle: {
		marginTop: 14,
		fontSize: 16,
		lineHeight: 26,
		fontFamily: "PoppinsRegular",
		maxWidth: "95%",
	},

	statsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 12,
		paddingHorizontal: 22,
		marginTop: 8,
		marginBottom: 28,
	},

	statCard: {
		flex: 1,
		minHeight: 130,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 26,
		paddingVertical: 20,
		alignItems: "center",
		borderWidth: 1.2,
		borderColor: "rgba(255,255,255,0.10)",
	},

	statNumber: {
		fontSize: 24,
		marginTop: 10,
		fontFamily: "PoppinsBold",
	},

	statLabel: {
		marginTop: 6,
		fontSize: 13,
		textAlign: "center",
		fontFamily: "PoppinsRegular",
	},

	content: {
		paddingHorizontal: 22,
	},

	card: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: 135,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 32,
		padding: 20,
		marginBottom: 24,
		borderWidth: 1.2,
		borderColor: "rgba(255,255,255,0.10)",
		overflow: "hidden",
		position: "relative",
	},

	cardGlow: {
		...StyleSheet.absoluteFillObject,
	},

	iconBox: {
		width: 74,
		height: 74,
		borderRadius: 26,
		justifyContent: "center",
		alignItems: "center",
	},

	textContainer: {
		flex: 1,
		marginLeft: 18,
		marginRight: 12,
	},

	cardTopRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		flexWrap: "wrap",
		gap: 8,
	},

	cardTitle: {
		fontSize: 19,
		flexShrink: 1,
		fontFamily: "PoppinsSemiBold",
	},

	liveBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(239,68,68,0.18)",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 22,
	},

	liveDot: {
		width: 7,
		height: 7,
		borderRadius: 10,
		marginRight: 6,
	},

	liveText: {
		fontSize: 11,
		fontFamily: "PoppinsSemiBold",
	},

	cityBadge: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 22,
	},

	cityText: {
		fontSize: 11,
		fontFamily: "PoppinsSemiBold",
	},

	heatBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 22,
	},

	heatText: {
		fontSize: 11,
		fontFamily: "PoppinsSemiBold",
	},

	sportBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 22,
	},

	sportText: {
		fontSize: 11,
		fontFamily: "PoppinsSemiBold",
	},

	cardDesc: {
		fontSize: 14,
		marginTop: 8,
		lineHeight: 22,
		fontFamily: "PoppinsRegular",
	},

	cardFooter: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 14,
		flexWrap: "wrap",
	},

	footerText: {
		marginLeft: 7,
		fontSize: 13,
		flexShrink: 1,
		fontFamily: "PoppinsRegular",
	},

	infoCard: {
		marginTop: 6,
	},

	infoGradient: {
		borderRadius: 30,
		padding: 22,
		borderWidth: 1.2,
		borderColor: "rgba(255,255,255,0.10)",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	infoLeft: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},

	infoIcon: {
		width: 60,
		height: 60,
		borderRadius: 22,
		backgroundColor: "rgba(255,255,255,0.12)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},

	infoTitle: {
		fontSize: 17,
		fontFamily: "PoppinsSemiBold",
	},

	infoDesc: {
		fontSize: 14,
		marginTop: 5,
		lineHeight: 21,
		fontFamily: "PoppinsRegular",
	},

	exploreBtn: {
		width: 52,
		height: 52,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 14,
	},
});