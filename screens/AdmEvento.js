import React, { useEffect, useState } from "react";

import {
	View,
	Text,
	Image,
	TouchableOpacity,
	Platform,
	ActivityIndicator,
	StyleSheet,
	StatusBar,
	ImageBackground,
} from "react-native";

import { FlatList } from "react-native-gesture-handler";

import { LinearGradient } from "expo-linear-gradient";

import { BlurView } from "expo-blur";

import { MotiView } from "moti";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
	collection,
	query,
	where,
	onSnapshot,
	deleteDoc,
	doc,
	orderBy,
	or,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

import { useAuth } from "../context/AuthContext";

import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

import ConfirmModal from "../components/ConfirmModal";

const formatarDataEventoLista = (item) => {
	if (item?.dataEvento) return item.dataEvento;
	if (item?.dataInicio) {
		return item.horaInicio
			? `${item.dataInicio} · ${item.horaInicio}`
			: item.dataInicio;
	}
	return "Data não informada";
};

export default function AdmEvento({ navigation }) {
	const { colors, isDark } = useTheme();
	const styles = useThemedStyles(createThemedScreenStyles);
	const { user, foto } = useAuth();
	const blurTint = isDark ? "dark" : "light";

	const [eventos, setEventos] = useState([]);

	const [loading, setLoading] = useState(true);

	const [refreshing, setRefreshing] = useState(false);

	const [deleteModal, setDeleteModal] = useState({
		visible: false,
		id: null,
	});

	const [errorModal, setErrorModal] = useState({
		visible: false,
		message: "",
	});

	useEffect(() => {
		if (!user?.uid) return;

		// Buscar eventos onde usuário é o proprietário (uidEvento ou organizador.uid)
		const q = query(
			collection(db, "eventos"),
			or(
				where("uidEvento", "==", user.uid),
				where("organizador.uid", "==", user.uid)
			),
			orderBy("createdAt", "desc")
		);

		const unsub = onSnapshot(
			q,
			(snapshot) => {
				const lista = snapshot.docs.map((d) => ({
					id: d.id,
					...d.data(),
				}));

				setEventos(lista);

				setLoading(false);
			},
			(err) => {
				console.log(err);

				setLoading(false);
			}
		);

		return () => unsub();
	}, [user?.uid]);

	const onRefresh = async () => {
		setRefreshing(true);

		setTimeout(() => {
			setRefreshing(false);
		}, 1200);
	};

	const deletarEvento = (id) => {
		setDeleteModal({ visible: true, id });
	};

	const confirmarExclusao = async () => {
		const id = deleteModal.id;
		if (!id) return;

		setDeleteModal({ visible: false, id: null });

		try {
			await deleteDoc(doc(db, "eventos", id));
		} catch (error) {
			console.log(error);
			setErrorModal({
				visible: true,
				message: "Não foi possível excluir o evento. Tente novamente.",
			});
		}
	};

	const renderItem = ({ item, index }) => (
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
				duration: 450,
				delay: index * 70,
			}}
		>
			<View style={styles.card}>
				<ImageBackground
					source={{
						uri:
							item.imagemEvento ||
							"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200",
					}}
					style={styles.image}
				>
					<LinearGradient
						colors={["transparent", "rgba(0,0,0,0.95)"]}
						style={styles.overlay}
					>
						<View style={styles.badge}>
							<MaterialCommunityIcons
								name="calendar-star"
								size={15}
								color="#FFF"
							/>

							<Text style={styles.badgeText}>Evento</Text>
						</View>

						<View style={[styles.badge, styles.priceBadge]}>
							<MaterialCommunityIcons
								name={
									item.gratuito ||
									item.tipoEvento === "gratuito" ||
									Number(item.precoInteira || 0) === 0
										? "ticket-confirmation"
										: "cash"
								}
								size={15}
								color="#FFF"
							/>

							<Text style={styles.badgeText}>
								{item.gratuito ||
								item.tipoEvento === "gratuito" ||
								Number(item.precoInteira || 0) === 0
									? "Gratuito"
									: "Pago"}
							</Text>
						</View>
					</LinearGradient>
				</ImageBackground>

				<BlurView intensity={40} tint={blurTint} style={styles.content}>
					<Text style={styles.titulo} numberOfLines={1}>
						{item.tituloEvento || "Sem título"}
					</Text>

					<View style={styles.infoRow}>
						<MaterialCommunityIcons
							name="map-marker"
							size={16}
							color="#A855F7"
						/>

						<Text style={styles.infoText} numberOfLines={1}>
							{item.localEvento || item.nomeLocal || "Local não informado"}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<MaterialCommunityIcons
							name="calendar-month"
							size={16}
							color="#A855F7"
						/>

						<Text style={styles.infoText}>
							{formatarDataEventoLista(item)}
						</Text>
					</View>

					<View style={styles.actions}>
						<View style={styles.leftActions}>
							<TouchableOpacity
								style={styles.editBtn}
								onPress={() =>
									navigation.navigate("CriarEvento", {
										eventoId: item.id,
										evento: item,
										isEditing: true,
									})
								}
							>
								<MaterialCommunityIcons
									name="pencil-outline"
									size={22}
									color="#60A5FA"
								/>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.deleteBtn}
								onPress={() => deletarEvento(item.id)}
							>
								<MaterialCommunityIcons
									name="delete-outline"
									size={22}
									color="#F87171"
								/>
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							activeOpacity={0.75}
							style={styles.dashboardBtn}
							onPress={() =>
								navigation.navigate("AdmEventoDashIndividual", {
									eventoId: item.id,
									evento: item,
								})
							}
						>
							<View style={[styles.dashboardIconCircle, { backgroundColor: "rgba(108,92,231,0.2)" }]}>
								<MaterialCommunityIcons
									name="chart-bar"
									size={22}
									color="#6C5CE7"
								/>
							</View>
							<Text style={styles.dashboardLabel}>Dashboard</Text>
							<MaterialCommunityIcons
								name="chevron-right"
								size={18}
								color={colors.textMuted}
								style={styles.dashboardChevron}
							/>
						</TouchableOpacity>
					</View>
				</BlurView>
			</View>
		</MotiView>
	);

	if (loading) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator size="large" color="#9333EA" />

				<Text style={styles.loadingText}>
					Carregando seus eventos...
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<StatusBar
				translucent
				backgroundColor="transparent"
				barStyle="light-content"
			/>

			{/* HEADER */}
			<LinearGradient
				colors={["#240046", "#3C096C", "#5A189A"]}
				style={styles.header}
			>
				<BlurView intensity={35} tint={blurTint} style={styles.headerBlur}>
					<View style={styles.headerTop}>
						<TouchableOpacity
							style={styles.backBtn}
							onPress={() => navigation.goBack()}
						>
							<MaterialCommunityIcons
								name="arrow-left"
								size={24}
								color="#FFF"
							/>
						</TouchableOpacity>

						<View style={styles.headerCenter}>
							<Text style={styles.title}>Meus Eventos</Text>

							<Text style={styles.subtitle}>
								{eventos.length} evento
								{eventos.length !== 1 ? "s" : ""}
							</Text>
						</View>

						<Image
							source={{
								uri:
									foto ||
									"https://ui-avatars.com/api/?name=Admin",
							}}
							style={styles.avatar}
						/>
					</View>
				</BlurView>
			</LinearGradient>

			{/* LISTA */}
			<FlatList
				data={eventos}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					padding: 18,
					paddingBottom: 140,
				}}
				refreshing={refreshing}
				onRefresh={onRefresh}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<MaterialCommunityIcons
							name="calendar-remove"
							size={72}
							color="rgba(255,255,255,0.18)"
						/>

						<Text style={styles.empty}>
							Você ainda não criou nenhum evento
						</Text>

						<Text style={styles.emptySub}>
							Toque no botão + para começar
						</Text>
					</View>
				}
			/>

			{/* FAB */}
			<TouchableOpacity
				activeOpacity={0.9}
				style={styles.fab}
				onPress={() => navigation.navigate("CriarEvento")}
			>
				<LinearGradient
					colors={["#8B7CFF", "#6C5CE7"]}
					style={styles.fabGradient}
				>
					<MaterialCommunityIcons
						name="plus"
						size={30}
						color="#FFF"
					/>
				</LinearGradient>
			</TouchableOpacity>

			<ConfirmModal
				visible={deleteModal.visible}
				title="Excluir evento?"
				message="Deseja realmente excluir este evento? Esta ação não pode ser desfeita."
				confirmText="Excluir"
				cancelText="Cancelar"
				type="danger"
				icon="delete-outline"
				onCancel={() =>
					setDeleteModal({ visible: false, id: null })
				}
				onConfirm={confirmarExclusao}
			/>

			<ConfirmModal
				visible={errorModal.visible}
				title="Erro"
				message={errorModal.message}
				confirmText="OK"
				type="error"
				onConfirm={() =>
					setErrorModal({ visible: false, message: "" })
				}
			/>
		</View>
	);
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.background,
	},

	header: {
		paddingTop: Platform.OS === "ios" ? 58 : 46,
		paddingBottom: 18,
		paddingHorizontal: 20,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		overflow: "hidden",
	},

	headerBlur: {
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		overflow: "hidden",
	},

	headerTop: {
		flexDirection: "row",
		alignItems: "center",
	},

	headerCenter: {
		flex: 1,
		marginLeft: 16,
	},

	backBtn: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: c.glassStrong,
		justifyContent: "center",
		alignItems: "center",
	},

	title: {
		color: "#FFF",
		fontSize: 24,
		fontWeight: "bold",
	},

	subtitle: {
		color: "rgba(255,255,255,0.68)",
		fontSize: 13,
		marginTop: 3,
	},

	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.16)",
	},

	card: {
		borderRadius: 30,
		overflow: "hidden",
		marginBottom: 22,
		backgroundColor: "rgba(255,255,255,0.045)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.05)",
		shadowColor: "#7C3AED",
		shadowOpacity: 0.16,
		shadowRadius: 18,
		elevation: 10,
	},

	image: {
		height: 200,
		justifyContent: "flex-end",
	},

	overlay: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 18,
	},

	badge: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(124,58,237,0.88)",
		paddingHorizontal: 12,
		paddingVertical: 7,
		borderRadius: 20,
		gap: 6,
	},

	priceBadge: {
		marginTop: 8,
		backgroundColor: "rgba(34,197,94,0.82)",
	},

	badgeText: {
		color: "#FFF",
		fontWeight: "600",
		fontSize: 12,
	},

	content: {
		padding: 18,
	},

	titulo: {
		color: "#FFF",
		fontSize: 21,
		fontWeight: "bold",
		marginBottom: 14,
	},

	infoRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
	},

	infoText: {
		color: "rgba(255,255,255,0.74)",
		marginLeft: 8,
		fontSize: 13,
		flex: 1,
	},

	actions: {
		marginTop: 22,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	leftActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},

	editBtn: {
		width: 50,
		height: 50,
		borderRadius: 14,
		backgroundColor: "rgba(59,130,246,0.16)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(59,130,246,0.24)",
	},

	deleteBtn: {
		width: 50,
		height: 50,
		borderRadius: 14,
		backgroundColor: "rgba(239,68,68,0.16)",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "rgba(239,68,68,0.24)",
	},

	dashboardBtn: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderRadius: 16,
		backgroundColor: c.surface,
		borderWidth: 1,
		borderColor: c.glassBorder,
		gap: 10,
	},

	dashboardIconCircle: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},

	dashboardLabel: {
		flex: 1,
		fontSize: 13,
		fontWeight: "700",
		color: c.textPrimary,
	},

	dashboardChevron: {
		opacity: 0.5,
	},

	loading: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: c.background,
	},

	loadingText: {
		color: "rgba(255,255,255,0.65)",
		marginTop: 14,
		fontSize: 14,
	},

	emptyContainer: {
		alignItems: "center",
		marginTop: 100,
		paddingHorizontal: 30,
	},

	empty: {
		color: "rgba(255,255,255,0.62)",
		marginTop: 18,
		fontSize: 16,
		textAlign: "center",
		fontWeight: "600",
	},

	emptySub: {
		color: "rgba(255,255,255,0.34)",
		marginTop: 8,
		fontSize: 13,
		textAlign: "center",
	},

	fab: {
		position: "absolute",
		bottom: 28,
		right: 24,
	},

	fabGradient: {
		width: 68,
		height: 68,
		borderRadius: 34,
		justifyContent: "center",
		alignItems: "center",
		elevation: 12,
		shadowColor: "#6C5CE7",
		shadowOpacity: 0.45,
		shadowRadius: 18,
	},
});
}
