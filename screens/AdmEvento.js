import React, { useEffect, useState } from "react";

import {
	View,
	Text,
	Image,
	TouchableOpacity,
	Platform,
	Alert,
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
} from "firebase/firestore";

import { db } from "../firebaseConfig";

import { useAuth } from "../context/AuthContext";

import { Colors } from "../styles/Colors";

export default function AdmEvento({ navigation }) {
	const { user, nome, foto } = useAuth();

	const [eventos, setEventos] = useState([]);

	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user?.uid) return;

		const q = query(
			collection(db, "eventos"),

			where("uidEvento", "==", user.uid),

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

	const deletarEvento = (id) => {
  // Função interna que executa a exclusão de fato para evitar repetição de código
  const executarExclusao = async () => {
    try {
      await deleteDoc(doc(db, "eventos", id));
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert("Erro ao excluir");
      } else {
        Alert.alert("Erro ao excluir");
      }
    }
  };

  // 1. Comportamento para Web
  if (Platform.OS === 'web') {
    const confirmou = window.confirm("Excluir Evento\n\nDeseja realmente excluir este evento?");
    if (confirmou) {
      executarExclusao();
    }
  } 
  // 2. Comportamento para Mobile (iOS / Android)
  else {
    Alert.alert("Excluir Evento", "Deseja realmente excluir este evento?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: executarExclusao,
      },
    ]);
  }
};

	const renderItem = ({ item, index }) => (
		<MotiView
			from={{
				opacity: 0,
				translateY: 25,
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
				<ImageBackground
					source={{
						uri:
							item.imagemEvento ||
							"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200",
					}}
					style={styles.image}
				>
					<LinearGradient
						colors={["transparent", "rgba(0,0,0,0.92)"]}
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
					</LinearGradient>
				</ImageBackground>

				<BlurView intensity={50} tint="dark" style={styles.content}>
					<Text style={styles.titulo} numberOfLines={1}>
						{item.tituloEvento || "Sem título"}
					</Text>

					<View style={styles.infoRow}>
						<MaterialCommunityIcons
							name="map-marker"
							size={16}
							color={Colors.primary}
						/>

						<Text style={styles.infoText} numberOfLines={1}>
							{item.localEvento || item.nomeLocal || "Local não informado"}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<MaterialCommunityIcons
							name="calendar-month"
							size={16}
							color={Colors.primary}
						/>

						<Text style={styles.infoText}>
							{item.dataEvento || "Data não informada"}
						</Text>
					</View>

					{/* ACTIONS */}
					<View style={styles.actions}>
						<TouchableOpacity
							style={styles.deleteBtn}
							onPress={() => deletarEvento(item.id)}
						>
							<MaterialCommunityIcons
								name="delete-outline"
								size={22}
								color="#FFF"
							/>
						</TouchableOpacity>

						<TouchableOpacity
							activeOpacity={0.85}
							onPress={() =>
								navigation.navigate("Metricas", {
									eventoId: item.id,
								})
							}
						>
							<LinearGradient
								colors={["#7C3AED", "#5B21B6"]}
								style={styles.dashboardBtn}
							>
								<MaterialCommunityIcons
									name="chart-bar"
									size={18}
									color="#FFF"
								/>

								<Text style={styles.dashboardText}>Dashboard</Text>
							</LinearGradient>
						</TouchableOpacity>
					</View>
				</BlurView>
			</View>
		</MotiView>
	);

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
				style={styles.header}
			>
				<TouchableOpacity
					style={styles.backBtn}
					onPress={() => navigation.goBack()}
				>
					<MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
				</TouchableOpacity>

				<View style={styles.profileRow}>
					<Image
						source={{
							uri: foto || "https://i.pravatar.cc/100",
						}}
						style={styles.avatar}
					/>

					<View>
						<Text style={styles.nome}>{nome || "Usuário"}</Text>

						<Text style={styles.sub}>Organizador</Text>
					</View>
				</View>

				<Text style={styles.title}>Meus Eventos</Text>
			</LinearGradient>

			{/* LISTA */}
			<FlatList
				data={eventos}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					padding: 18,
					paddingBottom: 120,
				}}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<MaterialCommunityIcons
							name="calendar-remove"
							size={70}
							color="rgba(255,255,255,0.2)"
						/>

						<Text style={styles.empty}>Nenhum evento cadastrado</Text>
					</View>
				}
			/>

			{/* FAB */}
			<TouchableOpacity
				activeOpacity={0.85}
				style={styles.fab}
				onPress={() => navigation.navigate("CriarEvento")}
			>
				<LinearGradient
					colors={["#7C3AED", "#5B21B6"]}
					style={styles.fabGradient}
				>
					<MaterialCommunityIcons name="plus" size={28} color="#FFF" />
				</LinearGradient>
			</TouchableOpacity>
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
		paddingTop: 58,
		paddingBottom: 24,
		paddingHorizontal: 20,

		borderBottomLeftRadius: 28,
		borderBottomRightRadius: 28,
	},

	backBtn: {
		width: 44,
		height: 44,

		borderRadius: 16,

		backgroundColor: "rgba(255,255,255,0.08)",

		justifyContent: "center",
		alignItems: "center",

		marginBottom: 18,
	},

	profileRow: {
		flexDirection: "row",
		alignItems: "center",
	},

	avatar: {
		width: 58,
		height: 58,

		borderRadius: 29,

		marginRight: 14,

		borderWidth: 2,

		borderColor: Colors.primary,
	},

	nome: {
		color: "#FFF",

		fontSize: 18,
		fontWeight: "bold",
	},

	sub: {
		color: "rgba(255,255,255,0.65)",

		marginTop: 2,
	},

	title: {
		color: "#FFF",

		fontSize: 26,
		fontWeight: "bold",

		marginTop: 22,
	},

	/* CARD */
	card: {
		borderRadius: 28,

		overflow: "hidden",

		marginBottom: 22,

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

	badge: {
		alignSelf: "flex-start",

		flexDirection: "row",
		alignItems: "center",

		backgroundColor: "rgba(124,58,237,0.85)",

		paddingHorizontal: 12,
		paddingVertical: 7,

		borderRadius: 20,

		gap: 6,
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

		fontSize: 20,
		fontWeight: "bold",

		marginBottom: 14,
	},

	infoRow: {
		flexDirection: "row",
		alignItems: "center",

		marginBottom: 8,
	},

	infoText: {
		color: "rgba(255,255,255,0.72)",

		marginLeft: 8,

		fontSize: 13,

		flex: 1,
	},

	/* ACTIONS */
	actions: {
		marginTop: 18,

		flexDirection: "row",

		justifyContent: "space-between",

		alignItems: "center",
	},

	deleteBtn: {
		width: 48,
		height: 48,

		borderRadius: 16,

		backgroundColor: "rgba(239,68,68,0.18)",

		justifyContent: "center",
		alignItems: "center",
	},

	dashboardBtn: {
		flexDirection: "row",
		alignItems: "center",

		paddingVertical: 12,
		paddingHorizontal: 18,

		borderRadius: 18,

		gap: 8,
	},

	dashboardText: {
		color: "#FFF",

		fontWeight: "bold",

		fontSize: 13,
	},

	/* EMPTY */
	emptyContainer: {
		alignItems: "center",

		marginTop: 80,
	},

	empty: {
		color: "rgba(255,255,255,0.55)",

		marginTop: 14,

		fontSize: 15,
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
	},

	/* FAB */
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

		elevation: 10,

		shadowColor: "#7C3AED",

		shadowOpacity: 0.4,
		shadowRadius: 12,
	},
});
