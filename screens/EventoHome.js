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

import { Colors } from "../styles/Colors";

const { width } = Dimensions.get("window");

export default function EventoHome({ navigation }) {
	const insets = useSafeAreaInsets();

	const tabBarHeight = useBottomTabBarHeight();

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />

			<ImageBackground
				source={require("../assets/fundoTelaLogin.png")}
				style={styles.bg}
				resizeMode="cover"
			>
				<LinearGradient
					colors={[
						"rgba(5,8,18,0.96)",
						"rgba(12,14,25,0.94)",
						"rgba(26,14,58,0.95)",
					]}
					style={styles.overlay}
				>
					<View style={styles.glowTop} />
					<View style={styles.glowBottom} />

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
									<BlurView intensity={40} tint="dark" style={styles.blurBtn}>
										<MaterialCommunityIcons
											name="arrow-left"
											size={22}
											color="#FFF"
										/>
									</BlurView>
								</TouchableOpacity>

								{/* CULTURA VIVA */}
								<TouchableOpacity
									activeOpacity={0.8}
									onPress={() => navigation.navigate("TelaCulturaViva")}
								>
									<BlurView intensity={30} tint="dark" style={styles.badge}>
										<MaterialCommunityIcons
											name="book-open-variant"
											size={16}
											color="#A78BFA"
										/>

										<Text style={styles.badgeText}>
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
										colors={["#8B5CF6", "#5B21B6"]}
										style={styles.heroGradient}
									>
										<MaterialCommunityIcons
											name="ticket-confirmation"
											size={34}
											color="#FFF"
										/>
									</LinearGradient>
								</View>

								<Text style={styles.title}>Eventos</Text>

								<Text style={styles.subtitle}>
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
							<View style={styles.statCard}>
								<MaterialCommunityIcons
									name="calendar-star"
									size={22}
									color="#8B5CF6"
								/>

								<Text style={styles.statNumber}>124</Text>

								<Text style={styles.statLabel}>Eventos</Text>
							</View>

							<View style={styles.statCard}>
								<MaterialCommunityIcons
									name="account-group"
									size={22}
									color="#06B6D4"
								/>

								<Text style={styles.statNumber}>2.3k</Text>

								<Text style={styles.statLabel}>Participantes</Text>
							</View>

							<View style={styles.statCard}>
								<MaterialCommunityIcons
									name="map-marker-radius"
									size={22}
									color="#F59E0B"
								/>

								<Text style={styles.statNumber}>18</Text>

								<Text style={styles.statLabel}>Próximos</Text>
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
									style={styles.card}
									onPress={() => navigation.navigate("EventosApp")}
								>
									<LinearGradient
										colors={[
											"rgba(124,58,237,0.20)",
											"rgba(91,33,182,0.05)",
										]}
										style={styles.cardGlow}
									/>

									<LinearGradient
										colors={["#7C3AED", "#5B21B6"]}
										style={styles.iconBox}
									>
										<MaterialCommunityIcons
											name="cellphone"
											size={30}
											color="#FFF"
										/>
									</LinearGradient>

									<View style={styles.textContainer}>
										<View style={styles.cardTopRow}>
											<Text style={styles.cardTitle}>
												Eventos do App
											</Text>

											<View style={styles.liveBadge}>
												<View style={styles.liveDot} />

												<Text style={styles.liveText}>
													AO VIVO
												</Text>
											</View>
										</View>

										<Text style={styles.cardDesc}>
											Eventos exclusivos criados dentro da plataforma.
										</Text>

										<View style={styles.cardFooter}>
											<MaterialCommunityIcons
												name="calendar"
												size={15}
												color="#A78BFA"
											/>

											<Text style={styles.footerText}>
												Novos eventos hoje
											</Text>
										</View>
									</View>

									<MaterialCommunityIcons
										name="chevron-right"
										size={28}
										color={Colors.primary}
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
									style={styles.card}
									onPress={() => navigation.navigate("EventosPublicos")}
								>
									<LinearGradient
										colors={[
											"rgba(6,182,212,0.18)",
											"rgba(37,99,235,0.04)",
										]}
										style={styles.cardGlow}
									/>

									<LinearGradient
										colors={["#06B6D4", "#2563EB"]}
										style={styles.iconBox}
									>
										<MaterialCommunityIcons
											name="earth"
											size={30}
											color="#FFF"
										/>
									</LinearGradient>

									<View style={styles.textContainer}>
										<View style={styles.cardTopRow}>
											<Text style={styles.cardTitle}>
												Eventos Públicos
											</Text>

											<View style={styles.cityBadge}>
												<Text style={styles.cityText}>
													Fortaleza
												</Text>
											</View>
										</View>

										<Text style={styles.cardDesc}>
											Eventos culturais, públicos e oficiais da cidade.
										</Text>

										<View style={styles.cardFooter}>
											<MaterialCommunityIcons
												name="map-marker"
												size={15}
												color="#67E8F9"
											/>

											<Text style={styles.footerText}>
												Eventos próximos da sua região
											</Text>
										</View>
									</View>

									<MaterialCommunityIcons
										name="chevron-right"
										size={28}
										color={Colors.primary}
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
									style={styles.card}
									onPress={() => navigation.navigate("TelaMapaVivo")}
								>
									<LinearGradient
										colors={[
											"rgba(34,197,94,0.18)",
											"rgba(239,68,68,0.06)",
										]}
										style={styles.cardGlow}
									/>

									<LinearGradient
										colors={["#22C55E", "#EF4444"]}
										style={styles.iconBox}
									>
										<MaterialCommunityIcons
											name="map-marker-radius"
											size={30}
											color="#FFF"
										/>
									</LinearGradient>

									<View style={styles.textContainer}>
										<View style={styles.cardTopRow}>
											<Text style={styles.cardTitle}>
												Mapa Vivo da Cultura
											</Text>

											<View style={styles.heatBadge}>
												<MaterialCommunityIcons
													name="fire"
													size={12}
													color="#FCA5A5"
												/>

												<Text style={styles.heatText}>
													HEATMAP
												</Text>
											</View>
										</View>

										<Text style={styles.cardDesc}>
											Veja eventos no mapa, calor cultural,
											filtros ao vivo e check-in no local.
										</Text>

										<View style={styles.cardFooter}>
											<MaterialCommunityIcons
												name="crosshairs-gps"
												size={15}
												color="#86EFAC"
											/>

											<Text style={styles.footerText}>
												Cultura acontecendo perto de você
											</Text>
										</View>
									</View>

									<MaterialCommunityIcons
										name="chevron-right"
										size={28}
										color={Colors.primary}
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
										colors={[
											"rgba(124,58,237,0.12)",
											"rgba(59,130,246,0.08)",
										]}
										style={styles.infoGradient}
									>
										<View style={styles.infoLeft}>
											<View style={styles.infoIcon}>
												<MaterialCommunityIcons
													name="compass-outline"
													size={24}
													color="#FFF"
												/>
											</View>

											<View style={{ flex: 1 }}>
												<Text style={styles.infoTitle}>
													Explore a cidade
												</Text>

												<Text style={styles.infoDesc}>
													Descubra novos eventos perto de você
												</Text>
											</View>
										</View>

										<TouchableOpacity
											activeOpacity={0.8}
											style={styles.exploreBtn}
											onPress={() =>
												navigation.navigate(
													"TelaExploreCidade"
												)
											}
										>
											<MaterialCommunityIcons
												name="arrow-right"
												size={20}
												color="#FFF"
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
		backgroundColor: "#070B14",
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
		color: "#FFF",
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
		color: "#FFF",
		fontFamily: "PoppinsBold",
		letterSpacing: 0.5,
	},

	subtitle: {
		color: "rgba(255,255,255,0.72)",
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
		color: "#FFF",
		fontSize: 22,
		marginTop: 8,
		fontFamily: "PoppinsBold",
	},

	statLabel: {
		color: "rgba(255,255,255,0.62)",
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
		color: "#FFF",
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
		backgroundColor: "#EF4444",
		marginRight: 5,
	},

	liveText: {
		color: "#EF4444",
		fontSize: 10,
		fontFamily: "PoppinsSemiBold",
	},

	cityBadge: {
		backgroundColor: "rgba(6,182,212,0.16)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 20,
	},

	cityText: {
		color: "#67E8F9",
		fontSize: 10,
		fontFamily: "PoppinsSemiBold",
	},

	heatBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "rgba(239,68,68,0.14)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 20,
	},

	heatText: {
		color: "#FCA5A5",
		fontSize: 10,
		fontFamily: "PoppinsSemiBold",
	},

	cardDesc: {
		color: "rgba(255,255,255,0.65)",
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
		color: "rgba(255,255,255,0.55)",
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
		color: "#FFF",
		fontSize: 16,
		fontFamily: "PoppinsSemiBold",
	},

	infoDesc: {
		color: "rgba(255,255,255,0.65)",
		fontSize: 13,
		marginTop: 4,
		lineHeight: 20,
		fontFamily: "PoppinsRegular",
	},

	exploreBtn: {
		width: 48,
		height: 48,
		borderRadius: 18,
		backgroundColor: "rgba(124,58,237,0.25)",
		justifyContent: "center",
		alignItems: "center",
		marginLeft: 12,
	},
});