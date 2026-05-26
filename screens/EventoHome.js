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
											size={22}
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
											size={16}
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
											size={34}
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
								delay: 120,
								duration: 700,
							}}
							style={styles.statsRow}
						>
							<View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.borderLight }]}>
								<MaterialCommunityIcons
									name="calendar-star"
									size={22}
									color={colors.primaryLight}
								/>

								<Text style={[styles.statNumber, { color: colors.textPrimary }]}>124</Text>

								<Text style={[styles.statLabel, { color: colors.textMuted }]}>Eventos</Text>
							</View>

							<View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.borderLight }]}>
								<MaterialCommunityIcons
									name="account-group"
									size={22}
									color={colors.accentCyan}
								/>

								<Text style={[styles.statNumber, { color: colors.textPrimary }]}>2.3k</Text>

								<Text style={[styles.statLabel, { color: colors.textMuted }]}>Participantes</Text>
							</View>

							<View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.borderLight }]}>
								<MaterialCommunityIcons
									name="map-marker-radius"
									size={22}
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
									delay: 180,
									duration: 700,
								}}
							>
								<TouchableOpacity
									activeOpacity={0.92}
									style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.borderLight }]}
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
											size={30}
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
									delay: 320,
									duration: 700,
								}}
							>
								<TouchableOpacity
									activeOpacity={0.92}
									style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.borderLight }]}
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
											size={30}
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
									delay: 450,
									duration: 700,
								}}
							>
								<TouchableOpacity
									activeOpacity={0.92}
									style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.borderLight }]}
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
											size={30}
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
									delay: 580,
									duration: 700,
								}}
							>
								<View style={styles.infoCard}>
									<LinearGradient
										colors={gradients.surface}
										style={[styles.infoGradient, { borderColor: colors.borderLight }]}
									>
										<View style={styles.infoLeft}>
											<View style={[styles.infoIcon, { backgroundColor: colors.glass }]}>
												<MaterialCommunityIcons
													name="compass-outline"
													size={24}
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
											style={[styles.exploreBtn, { backgroundColor: colors.primary + "40" }]}
											onPress={() =>
												navigation.navigate(
													"TelaExploreCidade"
												)
											}
										>
											<MaterialCommunityIcons
												name="arrow-right"
												size={20}
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
		paddingBottom: 24,
	},

	headerTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 28,
	},

	backButton: {
		alignSelf: "flex-start",
	},

	blurBtn: {
		width: 48,
		height: 48,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},

	badge: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 20,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},

	badgeText: {
		marginLeft: 8,
		fontSize: 13,
		fontFamily: "PoppinsMedium",
	},

	hero: {
		marginTop: 10,
	},

	heroIcon: {
		marginBottom: 22,
	},

	heroGradient: {
		width: 88,
		height: 88,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
	},

	title: {
		fontSize: width < 380 ? 34 : 40,
		fontFamily: "PoppinsBold",
		letterSpacing: 0.5,
	},

	subtitle: {
		marginTop: 12,
		fontSize: 15,
		lineHeight: 25,
		fontFamily: "PoppinsRegular",
		maxWidth: "95%",
	},

	statsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 10,
		paddingHorizontal: 22,
		marginTop: 4,
		marginBottom: 24,
	},

	statCard: {
		flex: 1,
		minHeight: 120,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 24,
		paddingVertical: 18,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},

	statNumber: {
		fontSize: 22,
		marginTop: 8,
		fontFamily: "PoppinsBold",
	},

	statLabel: {
		marginTop: 4,
		fontSize: 12,
		textAlign: "center",
		fontFamily: "PoppinsRegular",
	},

	content: {
		paddingHorizontal: 22,
	},

	card: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: 125,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 30,
		padding: 18,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
		overflow: "hidden",
		position: "relative",
	},

	cardGlow: {
		...StyleSheet.absoluteFillObject,
	},

	iconBox: {
		width: 68,
		height: 68,
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
	},

	textContainer: {
		flex: 1,
		marginLeft: 16,
		marginRight: 10,
	},

	cardTopRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		flexWrap: "wrap",
		gap: 8,
	},

	cardTitle: {
		fontSize: 18,
		flexShrink: 1,
		fontFamily: "PoppinsSemiBold",
	},

	liveBadge: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(239,68,68,0.14)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 20,
	},

	liveDot: {
		width: 6,
		height: 6,
		borderRadius: 10,
		marginRight: 5,
	},

	liveText: {
		fontSize: 10,
		fontFamily: "PoppinsSemiBold",
	},

	cityBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 20,
	},

	cityText: {
		fontSize: 10,
		fontFamily: "PoppinsSemiBold",
	},

	heatBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 20,
	},

	heatText: {
		fontSize: 10,
		fontFamily: "PoppinsSemiBold",
	},

	cardDesc: {
		fontSize: 13,
		marginTop: 6,
		lineHeight: 21,
		fontFamily: "PoppinsRegular",
	},

	cardFooter: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 12,
		flexWrap: "wrap",
	},

	footerText: {
		marginLeft: 6,
		fontSize: 12,
		flexShrink: 1,
		fontFamily: "PoppinsRegular",
	},

	infoCard: {
		marginTop: 4,
	},

	infoGradient: {
		borderRadius: 28,
		padding: 20,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
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
		width: 56,
		height: 56,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.10)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 14,
	},

	infoTitle: {
		fontSize: 16,
		fontFamily: "PoppinsSemiBold",
	},

	infoDesc: {
		fontSize: 13,
		marginTop: 4,
		lineHeight: 20,
		fontFamily: "PoppinsRegular",
	},

	exploreBtn: {
		width: 48,
		height: 48,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 12,
	},
});