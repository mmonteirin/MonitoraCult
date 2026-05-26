import React, {
	useState,
	useEffect,
} from "react";

import {
	View,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	StyleSheet,
	ScrollView,
	ImageBackground,
	StatusBar,
	Image,
} from "react-native";

import {
	collection,
	addDoc,
	serverTimestamp,
} from "firebase/firestore";

import {
	auth,
	db,
} from "../firebaseConfig";

import {
	MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
	LinearGradient,
} from "expo-linear-gradient";

import {
	useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
	BlurView,
} from "expo-blur";

import {
	MotiView,
} from "moti";

import AppText from "../components/AppText";

import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { Status } from "../styles/Colors";


const PALAVROES = [
	"porra",
	"poha",
	"caralho",
	"krl",
	"merda",
	"bosta",
	"puta",
	"vagabunda",
	"vadia",
	"prostituta",
	"cu",
	"buceta",
	"xereca",
	"foda",
	"fuder",
	"fodeu",
	"viado",
	"bicha",
	"bixona",
	"viadinho",
	"filho da puta",
	"fdp",
	"cacete",
	"arrombado",
	"desgraça",
	"desgraçado",
];

const censurarTexto = (texto) => {
	let textoLimpo = texto;

	PALAVROES.forEach((palavra) => {
		const palavraEscapada =
			palavra.replace(
				/[.*+?^${}()|[\]\\]/g,
				"\\$&"
			);

		const regex =
			new RegExp(
				`\\b${palavraEscapada}\\b`,
				"gi"
			);

		textoLimpo =
			textoLimpo.replace(
				regex,
				"*".repeat(
					palavra.length
				)
			);
	});

	return textoLimpo;
};

export default function PerfilDeclararOcorrencia({
	navigation,
	route,
}) {
	const { colors, isDark } = useTheme();
	const styles = useThemedStyles(createThemedScreenStyles);
	const blurTint = isDark ? "dark" : "light";

	const {
		eventoId,
		nomeEvento,
		evento,
	} = route.params;

	const imagemEvento =
		evento?.imagemEvento ||
		evento?.imagem ||
		null;

	const insets =
		useSafeAreaInsets();

	/* ───────── TABBAR FIX ───────── */
	useEffect(() => {
		const parent =
			navigation.getParent();

		parent?.setOptions({
			tabBarStyle: {
				display: "none",
			},
		});

		return () => {
			parent?.setOptions({
				tabBarStyle: {
					backgroundColor:
						"#0B1020",

					borderTopWidth: 0,

					height: 70,

					paddingBottom: 10,

					paddingTop: 10,
				},
			});
		};
	}, []);

	const [descricao, setDescricao] =
		useState("");

	const [
		tipoSelecionado,
		setTipoSelecionado,
	] = useState(null);

	const [loading, setLoading] =
		useState(false);

	const tipos = [
		{
			id: "segurança",
			label: "Segurança",
			icon: "shield-alert",
			color: "#EF4444",
		},
		{
			id: "infraestrutura",
			label: "Infraestrutura",
			icon: "hammer-wrench",
			color: "#F59E0B",
		},
		{
			id: "comportamento",
			label: "Comportamento",
			icon: "account-alert",
			color: "#8B5CF6",
		},
		{
			id: "outro",
			label: "Outro",
			icon: "file-document-edit",
			color: "#3B82F6",
		},
	];

	const declarar = async () => {

		if (!descricao.trim()) {

			Alert.alert(
				"Atenção",
				"Descreva a ocorrência antes de enviar."
			);

			return;
		}

		try {

			setLoading(true);

			const user =
				auth.currentUser;

			const ocorrenciaData = {

				userId:
					user.uid,

				nome:
					user.displayName ||
					"Anônimo",

				local:
					nomeEvento ||
					"Local não definido",

				descricao:
					censurarTexto(
						descricao.trim()
					),

				tipo:
					tipoSelecionado ||
					"outro",

				createdAt:
					serverTimestamp(),
			};

			const ocorrenciaRef =
				await addDoc(
					collection(
						db,
						"eventos",
						eventoId,
						"ocorrencias"
					),

					ocorrenciaData
				);

			await addDoc(
				collection(
					db,
					"users",
					user.uid,
					"ocorrencias"
				),

				{
					ocorrenciaId:
						ocorrenciaRef.id,

					...ocorrenciaData,

					eventoId,

					tituloEvento:
						nomeEvento ||
						"Evento",
				}
			);

			Alert.alert(
				"Sucesso 🎉",
				"Ocorrência registrada!"
			);

			navigation.goBack();

		} catch (error) {

			console.log(error);

			Alert.alert(
				"Erro",
				"Não foi possível registrar."
			);

		} finally {

			setLoading(false);
		}
	};

	return (

		<View style={styles.container}>

			<StatusBar
				barStyle="light-content"
				translucent
				backgroundColor="transparent"
			/>

			{/* HERO */}
			<View style={styles.heroContainer}>

				<Image
					source={{
						uri:
							imagemEvento ||
							"https://placehold.co/600x400/111827/ffffff?text=Evento",
					}}
					style={styles.heroImage}
					resizeMode="cover"
				/>

				<LinearGradient
					colors={[
						"transparent",
						"rgba(5,8,18,0.95)",
					]}
					style={styles.heroOverlay}
				/>

				<TouchableOpacity
					onPress={() =>
						navigation.goBack()
					}
					style={[
						styles.backButton,
						{
							top:
								insets.top + 10,
						},
					]}
				>
					<MaterialCommunityIcons
						name="arrow-left"
						size={24}
						color="#fff"
					/>
				</TouchableOpacity>

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
						type: "timing",
						duration: 600,
					}}
					style={styles.heroContent}
				>

					<View style={styles.badge}>
						<MaterialCommunityIcons
							name="alert-circle"
							size={16}
							color="#fff"
						/>

						<AppText
							style={styles.badgeText}
						>
							Ocorrência
						</AppText>
					</View>

					<AppText
						style={styles.heroTitle}
					>
						Declarar Problema
					</AppText>

					<AppText
						style={styles.heroSubtitle}
					>
						Ajude a melhorar a
						segurança e organização
						do evento.
					</AppText>
				</MotiView>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={
					false
				}
				contentContainerStyle={
					styles.content
				}
			>

				{/* EVENTO */}
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
					}}
				>
					<BlurView
						intensity={40}
						tint={blurTint}
						style={styles.card}
					>

						<View style={styles.row}>

							<View style={{ flex: 1 }}>

								<AppText
									style={
										styles.label
									}
								>
									Evento
								</AppText>

								<AppText
									style={
										styles.evento
									}
								>
									{nomeEvento ||
										"Evento"}
								</AppText>
							</View>

							<View
								style={
									styles.iconBox
								}
							>
								<MaterialCommunityIcons
									name="alert"
									size={24}
									color={
										colors.primary
									}
								/>
							</View>
						</View>
					</BlurView>
				</MotiView>

				{/* TIPOS */}
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
						delay: 250,
					}}
				>
					<BlurView
						intensity={45}
						tint={blurTint}
						style={styles.card}
					>

						<AppText
							style={styles.label}
						>
							Tipo de ocorrência
						</AppText>

						<View
							style={styles.grid}
						>
							{tipos.map(
								(tipo) => {

									const ativo =
										tipoSelecionado ===
										tipo.id;

									return (

										<TouchableOpacity
											key={
												tipo.id
											}
											activeOpacity={
												0.9
											}
											onPress={() =>
												setTipoSelecionado(
													tipo.id
												)
											}
											style={[
												styles.tipoCard,

												ativo && {
													borderColor:
														tipo.color,

													backgroundColor:
														`${tipo.color}20`,
												},
											]}
										>

											<MaterialCommunityIcons
												name={
													tipo.icon
												}
												size={
													24
												}
												color={
													ativo
														? tipo.color
														: "#aaa"
												}
											/>

											<AppText
												style={[
													styles.tipoText,

													ativo && {
														color:
															tipo.color,
													},
												]}
											>
												{
													tipo.label
												}
											</AppText>
										</TouchableOpacity>
									);
								}
							)}
						</View>
					</BlurView>
				</MotiView>

				{/* DESCRIÇÃO */}
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
						delay: 350,
					}}
				>
					<BlurView
						intensity={45}
						tint={blurTint}
						style={styles.card}
					>

						<AppText
							style={styles.label}
						>
							Detalhes da ocorrência
						</AppText>

						<TextInput
							value={descricao}
							onChangeText={
								setDescricao
							}
							multiline
							maxLength={500}
							placeholder="Explique detalhadamente o que aconteceu..."
							placeholderTextColor="#777"
							style={styles.input}
						/>

						<View
							style={
								styles.counter
							}
						>
							<AppText
								style={
									styles.counterText
								}
							>
								{
									descricao.length
								}
								/500
							</AppText>
						</View>
					</BlurView>
				</MotiView>

				{/* ALERTA */}
				<MotiView
					from={{
						opacity: 0,
						scale: 0.95,
					}}
					animate={{
						opacity: 1,
						scale: 1,
					}}
					transition={{
						delay: 450,
					}}
				>
					<View
						style={
							styles.warningCard
						}
					>

						<MaterialCommunityIcons
							name="shield-check"
							size={18}
							color="#22C55E"
						/>

						<AppText
							style={
								styles.warningText
							}
						>
							Sua denúncia será
							analisada pela equipe
							de organização.
						</AppText>
					</View>
				</MotiView>

				{/* BOTÃO */}
				<MotiView
					from={{
						opacity: 0,
						translateY: 40,
					}}
					animate={{
						opacity: 1,
						translateY: 0,
					}}
					transition={{
						delay: 520,
					}}
				>
					<TouchableOpacity
						activeOpacity={0.9}
						onPress={declarar}
						disabled={loading}
						style={
							styles.buttonContainer
						}
					>

						<LinearGradient
							colors={[
								colors.primary,
								"#7C3AED",
							]}
							style={
								styles.button
							}
						>

							{loading ? (

								<ActivityIndicator color="#fff" />

							) : (

								<>

									<MaterialCommunityIcons
										name="send"
										size={20}
										color="#fff"
									/>

									<AppText
										style={
											styles.buttonText
										}
									>
										Enviar Ocorrência
									</AppText>
								</>
							)}
						</LinearGradient>
					</TouchableOpacity>
				</MotiView>
			</ScrollView>
		</View>
	);
}

function createThemedScreenStyles(c) {
	return StyleSheet.create({

	container: {
		flex: 1,
		backgroundColor: c.background,
	},

	heroContainer: {
		height: 320,
		position: "relative",
	},

	heroImage: {
		width: "100%",
		height: "100%",
	},

	heroOverlay: {
		position: "absolute",
		bottom: 0,
		width: "100%",
		height: 180,
	},

	backButton: {
		position: "absolute",
		left: 18,
		width: 46,
		height: 46,
		borderRadius: 16,
		backgroundColor:
			"rgba(0,0,0,0.35)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
	},

	heroContent: {
		position: "absolute",
		bottom: 28,
		left: 20,
		right: 20,
	},

	badge: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
		backgroundColor:
			"rgba(239,68,68,0.20)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		gap: 6,
		marginBottom: 14,
	},

	badgeText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "700",
	},

	heroTitle: {
		color: "#fff",
		fontSize: 30,
		fontWeight: "bold",
	},

	heroSubtitle: {
		color:
			"rgba(255,255,255,0.75)",
		fontSize: 14,
		lineHeight: 22,
		marginTop: 8,
	},

	content: {
		padding: 18,
		paddingBottom: 60,
		marginTop: -25,
	},

	card: {
		borderRadius: 26,
		padding: 18,
		marginBottom: 18,
		overflow: "hidden",
		borderWidth: 1,
		borderColor:
			"rgba(255,255,255,0.08)",
		backgroundColor:
			"rgba(255,255,255,0.03)",
	},

	row: {
		flexDirection: "row",
		justifyContent:
			"space-between",
		alignItems: "center",
	},

	label: {
		color: "#8B93A7",
		fontSize: 13,
		marginBottom: 8,
	},

	evento: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "bold",
	},

	iconBox: {
		width: 56,
		height: 56,
		borderRadius: 18,
		backgroundColor:
			"rgba(124,58,237,0.18)",
		justifyContent: "center",
		alignItems: "center",
	},

	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginTop: 5,
	},

	tipoCard: {
		width: "47%",
		paddingVertical: 18,
		borderRadius: 20,
		borderWidth: 1,
		borderColor:
			"rgba(255,255,255,0.08)",
		backgroundColor:
			"rgba(255,255,255,0.03)",
		alignItems: "center",
	},

	tipoText: {
		color: "#aaa",
		fontSize: 13,
		marginTop: 10,
		fontWeight: "600",
	},

	input: {
		height: 170,
		borderRadius: 20,
		padding: 16,
		color: "#fff",
		fontSize: 15,
		backgroundColor:
			"rgba(255,255,255,0.04)",
		borderWidth: 1,
		borderColor:
			"rgba(255,255,255,0.06)",
		textAlignVertical: "top",
	},

	counter: {
		alignItems: "flex-end",
		marginTop: 8,
	},

	counterText: {
		color: "#777",
		fontSize: 11,
	},

	warningCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		backgroundColor:
			"rgba(34,197,94,0.10)",
		borderWidth: 1,
		borderColor:
			"rgba(34,197,94,0.25)",
		padding: 14,
		borderRadius: 18,
		marginBottom: 22,
	},

	warningText: {
		color: "#D1D5DB",
		fontSize: 12,
		flex: 1,
		lineHeight: 18,
	},

	buttonContainer: {
		borderRadius: 24,
		overflow: "hidden",
	},

	button: {
		paddingVertical: 20,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 10,
	},

	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
});
}
