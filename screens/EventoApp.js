import React, { useEffect, useState } from "react";

import {
	View,
	Text,
	Image,
	FlatList,
	TouchableOpacity,
	Animated,
	Alert,
	StyleSheet,
	StatusBar,
	ImageBackground,
	ActivityIndicator,
} from "react-native";

import {
	collection,
	query,
	where,
	orderBy,
	onSnapshot,
	deleteDoc,
	doc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

import { useAuth } from "../context/AuthContext";

import { useNavigation } from "@react-navigation/native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Swipeable } from "react-native-gesture-handler";

import { LinearGradient } from "expo-linear-gradient";

import { BlurView } from "expo-blur";

import { MotiView } from "moti";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { Colors } from "../styles/Colors";

export default function EventosApp() {
	const { user, nome, foto } = useAuth();

	const navigation = useNavigation();

	const insets = useSafeAreaInsets();

	const tabBarHeight = useBottomTabBarHeight();

	const [eventos, setEventos] = useState([]);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user?.uid) return;

		const q = query(
			collection(db, "users", user.uid, "subscribedEvents"),
			orderBy("dataEventoTimestamp", "asc")
		);

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const lista = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));

			setEventos(lista);
      setLoading(false);
		});

		return unsubscribe;
	}, [user?.uid]);

	const cancelarInscricao = (id) => {
		Alert.alert(
			"Cancelar inscrição",
			"Deseja cancelar sua inscrição neste evento?",
			[
				{
					text: "Não",
					style: "cancel",
				},

				{
					text: "Sim",

					style: "destructive",

					onPress: async () => {
						try {
							await deleteDoc(
								doc(db, "users", user.uid, "subscribedEvents", id)
							);
						} catch (error) {
							Alert.alert("Erro", "Não foi possível cancelar.");
						}
					},
				},
			]
		);
	};

	const renderRightActions = (id, progress) => {
		const scale = progress.interpolate({
			inputRange: [0, 1],

			outputRange: [0.7, 1],
		});

		return (
			<Animated.View
				style={[
					styles.swipeDelete,

					{
						transform: [
							{
								scale,
							},
						],
					},
				]}
			>
				<TouchableOpacity onPress={() => cancelarInscricao(id)}>
					<MaterialCommunityIcons name="trash-can" size={28} color="#FFF" />
				</TouchableOpacity>
			</Animated.View>
		);
	};

	const renderItem = ({ item, index }) => {
		return (
			<Swipeable
				overshootRight={false}
				renderRightActions={(progress) => renderRightActions(item.id, progress)}
			>
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
						duration: 500,
						delay: index * 80,
					}}
				>
					<View style={styles.card}>
						{/* IMAGEM */}
						<ImageBackground
							source={{
								uri:
									item.imagemEvento ||
									"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200",
							}}
							style={styles.image}
						>
						</ImageBackground>

						{/* CONTENT */}
						<BlurView intensity={50} tint="dark" style={styles.content}>
							<Text style={styles.titulo} numberOfLines={1}>
								{item.tituloEvento}
							</Text>

							{/* DATA */}
							<View style={styles.infoRow}>
								<MaterialCommunityIcons
									name="calendar"
									size={17}
									color={Colors.primary}
								/>

								<Text style={styles.infoText}>{item.dataEvento}</Text>
							</View>

							{/* LOCAL */}
							<View style={styles.infoRow}>
								<MaterialCommunityIcons
									name="map-marker"
									size={17}
									color={Colors.primary}
								/>

								<Text style={styles.infoText} numberOfLines={1}>
									{item.localEvento}
								</Text>
							</View>

							{/* BUTTONS */}
							<View style={styles.actions}>
								<TouchableOpacity
									activeOpacity={0.85}
									onPress={() =>
										navigation.navigate("EventoPublico", {
											evento: item,
										})
									}
								>
									<LinearGradient
										colors={["#7C3AED", "#5B21B6"]}
										style={styles.eventBtn}
									>
										<MaterialCommunityIcons name="eye" size={18} color="#FFF" />

										<Text style={styles.eventBtnText}>Ver Evento</Text>
									</LinearGradient>
								</TouchableOpacity>

								<TouchableOpacity onPress={() => cancelarInscricao(item.id)}>
									<Text style={styles.cancelar}>Cancelar</Text>
								</TouchableOpacity>
							</View>
						</BlurView>
					</View>
				</MotiView>
			</Swipeable>
		);
	};

	if (loading) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color={Colors.primary} />

				<Text style={styles.loadingText}>Carregando eventos...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />

			{/* HEADER */}
			<LinearGradient
				colors={["#0F172A", "#111827", "#1E1B4B"]}
				style={[
					styles.header,
					{
						paddingTop: insets.top + 10,
					},
				]}
			>
				<TouchableOpacity
					style={styles.backBtn}
					onPress={() => navigation.goBack()}
				>
					<MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
				</TouchableOpacity>

				<Text style={styles.headerTitle}>Meus Eventos</Text>
			</LinearGradient>

			{/* PERFIL */}
			<MotiView
				from={{
					opacity: 0,
					scale: 0.9,
				}}
				animate={{
					opacity: 1,
					scale: 1,
				}}
				transition={{
					type: "timing",
					duration: 600,
				}}
			>
				<BlurView intensity={60} tint="dark" style={styles.profileCard}>
					{/* LEFT */}
					<View style={styles.profileLeft}>
						<LinearGradient
							colors={["#7C3AED", "#5B21B6"]}
							style={styles.avatarBorder}
						>
							<Image
								source={{
									uri: foto || "https://i.pravatar.cc/150",
								}}
								style={styles.avatar}
							/>
						</LinearGradient>

						<View style={styles.profileInfo}>
							<Text style={styles.nome}>{nome}</Text>

							<Text style={styles.subtitle}>Eventos inscritos</Text>
						</View>
					</View>

					{/* RIGHT */}
					<View style={styles.profileBadge}>
						<MaterialCommunityIcons
							name="ticket-confirmation"
							size={18}
							color="#A78BFA"
						/>

						<Text style={styles.profileBadgeText}>{eventos.length}</Text>
					</View>
				</BlurView>
			</MotiView>

			{/* LISTA */}
			<FlatList
				data={eventos}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					padding: 20,
					paddingTop: 10,
					paddingBottom: tabBarHeight + 40,
					flexGrow: 1,
				}}
				ListEmptyComponentStyle={{
					flex: 1,
					justifyContent: "center",
				}}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<MaterialCommunityIcons
							name="calendar-remove"
							size={70}
							color="rgba(255,255,255,0.2)"
						/>

						<Text style={styles.empty}>
							Você ainda não se inscreveu em eventos
						</Text>
					</View>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#070B14",
	},

	/* HEADER */
	header: {
		paddingBottom: 24,
		paddingHorizontal: 20,

		flexDirection: "row",
		alignItems: "center",

		borderBottomLeftRadius: 32,
		borderBottomRightRadius: 32,
	},

	backBtn: {
		width: 46,
		height: 46,

		borderRadius: 18,

		backgroundColor: "rgba(255,255,255,0.08)",

		justifyContent: "center",
		alignItems: "center",
	},

	headerTitle: {
		color: "#FFF",

		fontSize: 22,

		fontFamily: "PoppinsBold",

		marginLeft: 16,
	},

	/* PROFILE */
	profileCard: {
		marginHorizontal: 20,
		marginTop: 20,
		marginBottom: 10,

		borderRadius: 28,

		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",

		paddingVertical: 20,
		paddingHorizontal: 18,

		overflow: "hidden",

		borderWidth: 1,

		borderColor: "rgba(255,255,255,0.08)",

		backgroundColor: "rgba(255,255,255,0.04)",
	},

	profileLeft: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},

	profileInfo: {
		marginLeft: 16,
		flex: 1,
	},

	profileBadge: {
		width: 54,
		height: 54,

		borderRadius: 18,

		backgroundColor: "rgba(124,58,237,0.16)",

		justifyContent: "center",
		alignItems: "center",

		borderWidth: 1,

		borderColor: "rgba(255,255,255,0.06)",
	},

	profileBadgeText: {
		color: "#FFF",

		marginTop: 2,

		fontSize: 12,

		fontFamily: "PoppinsBold",
	},

	avatarBorder: {
		padding: 4,
		borderRadius: 60,
	},

	avatar: {
		width: 74,
		height: 74,
		borderRadius: 40,
	},

	nome: {
		color: "#FFF",

		fontSize: 22,

		fontFamily: "PoppinsBold",
	},

	subtitle: {
		color: "rgba(255,255,255,0.65)",

		marginTop: 4,

		fontFamily: "PoppinsRegular",
	},

	/* CARD */
	card: {
		marginBottom: 22,

		borderRadius: 28,

		overflow: "hidden",

		backgroundColor: "rgba(255,255,255,0.04)",

		borderWidth: 1,

		borderColor: "rgba(255,255,255,0.06)",
	},

	image: {
		height: 190,
		justifyContent: "flex-end",
	},

	overlay: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 16,
	},

	content: {
		padding: 18,
	},

	titulo: {
		color: "#FFF",

		fontSize: 20,

		marginBottom: 14,

		fontFamily: "PoppinsBold",
	},

	infoRow: {
		flexDirection: "row",
		alignItems: "center",

		marginBottom: 10,
	},

	infoText: {
		color: "rgba(255,255,255,0.72)",

		marginLeft: 8,

		fontSize: 13,

		flex: 1,

		fontFamily: "PoppinsRegular",
	},

	/* STATUS */
	statusConfirmado: {
		alignSelf: "flex-start",

		backgroundColor: "rgba(34,197,94,0.95)",

		paddingHorizontal: 12,
		paddingVertical: 7,

		borderRadius: 18,
	},

	statusPendente: {
		alignSelf: "flex-start",

		backgroundColor: "rgba(245,158,11,0.95)",

		paddingHorizontal: 12,
		paddingVertical: 7,

		borderRadius: 18,
	},

	statusText: {
		color: "#FFF",

		fontSize: 12,

		fontFamily: "PoppinsBold",
	},

	/* ACTIONS */
	actions: {
		marginTop: 18,

		flexDirection: "row",

		justifyContent: "space-between",

		alignItems: "center",
	},

	eventBtn: {
		flexDirection: "row",
		alignItems: "center",

		paddingVertical: 12,
		paddingHorizontal: 18,

		borderRadius: 18,

		gap: 8,
	},

	eventBtnText: {
		color: "#FFF",

		fontSize: 13,

		fontFamily: "PoppinsBold",
	},

	cancelar: {
		color: "#EF4444",

		fontSize: 14,

		fontFamily: "PoppinsBold",
	},

	/* SWIPE */
	swipeDelete: {
		justifyContent: "center",
		alignItems: "center",

		width: 90,

		borderRadius: 24,

		backgroundColor: "#DC2626",

		marginBottom: 22,
	},

	/* EMPTY */
	emptyContainer: {
		flex: 1,

		justifyContent: "center",
		alignItems: "center",

		paddingTop: 40,
		paddingBottom: 80,
	},

	empty: {
		color: "rgba(255,255,255,0.55)",

		marginTop: 16,

		fontSize: 15,

		textAlign: "center",

		fontFamily: "PoppinsRegular",
	},

	/* LOADING */
	loading: {
		flex: 1,

		justifyContent: "center",
		alignItems: "center",

		backgroundColor: "#070B14",
	},

	loadingText: {
		color: "rgba(255,255,255,0.65)",

		marginTop: 14,

		fontFamily: "PoppinsRegular",
	},
});
