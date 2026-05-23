import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
} from "react";

import {
	View,
	Text,
	Image,
	TouchableOpacity,
	ScrollView,
	TextInput,
	StyleSheet,
	ActivityIndicator,
	Modal,
	Animated,
	StatusBar,
	Dimensions,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlurView } from "expo-blur";

import { MotiView } from "moti";

import {
	collection,
	addDoc,
	onSnapshot,
	query,
	orderBy,
	serverTimestamp,
	where,
	getDocs,
	deleteDoc,
	doc,
} from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

import { Colors } from "../styles/Colors";

import ConfirmModal from "../components/ConfirmModal";

import {
	getUserLikes,
	toggleEventoLike,
	incrementEventoViews,
} from "../services/eventosAppService";

const { width } = Dimensions.get("window");

/* ───────────────────────────── */
/* PALAVRÕES */
/* ───────────────────────────── */

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
	let t = texto;

	PALAVROES.forEach((p) => {
		const escaped = p.replace(
			/[.*+?^${}()|[\]\\]/g,
			"\\$&"
		);

		t = t.replace(
			new RegExp(
				`\\b${escaped}\\b`,
				"gi"
			),
			"*".repeat(p.length)
		);
	});

	return t;
};

/* ───────────────────────────── */
/* LIKE BUTTON */
/* ───────────────────────────── */

function LikeButton({
	liked,
	onPress,
}) {
	const scale = useRef(
		new Animated.Value(1)
	).current;

	const handlePress = () => {
		Animated.sequence([
			Animated.spring(scale, {
				toValue: 1.3,
				useNativeDriver: true,
				speed: 50,
			}),
			Animated.spring(scale, {
				toValue: 1,
				useNativeDriver: true,
				speed: 50,
			}),
		]).start();

		onPress();
	};

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={handlePress}
			style={styles.metricBtn}
		>
			<Animated.View
				style={{
					transform: [{ scale }],
				}}
			>
				<MaterialCommunityIcons
					name={
						liked
							? "heart"
							: "heart-outline"
					}
					size={18}
					color={
						liked
							? "#FF4D6D"
							: "#FFF"
					}
				/>
			</Animated.View>
		</TouchableOpacity>
	);
}

export default function EventoDetalhes({
	route,
	navigation,
}) {
	const { evento } =
		route.params;

	const insets =
		useSafeAreaInsets();

	const eventoId =
		evento?.id ||
		evento?.eventoId;

	/* ───────────────────────────── */
	/* STATES */
	/* ───────────────────────────── */

	const [comentario, setComentario] =
		useState("");

	const [
		notaSelecionada,
		setNotaSelecionada,
	] = useState(0);

	const [avaliacoes, setAvaliacoes] =
		useState([]);

	const [loadingAval, setLoadingAval] =
		useState(true);

	const [enviando, setEnviando] =
		useState(false);

	const [jaAvaliou, setJaAvaliou] =
		useState(false);

	const [liked, setLiked] =
		useState(false);

	const [likesCount, setLikesCount] =
		useState(
			evento?.likes || 0
		);

	const [viewsCount, setViewsCount] =
		useState(
			evento?.views || 0
		);

	/* ───────────────────────────── */
	/* MODAL */
	/* ───────────────────────────── */

	const [modalVisible, setModalVisible] =
		useState(false);

	const [modalTitle, setModalTitle] =
		useState("");

	const [modalMessage, setModalMessage] =
		useState("");

	const showModal = (
		title,
		message
	) => {
		setModalTitle(title);
		setModalMessage(message);
		setModalVisible(true);
	};

	/* ───────────────────────────── */
	/* DADOS */
	/* ───────────────────────────── */

	const precoBase = Number(
		evento?.precoInteira ??
			evento?.preco ??
			evento?.valor ??
			0
	);

	const eventoGratuito =
		evento?.gratuito === true ||
		evento?.tipoEvento === "gratuito" ||
		precoBase === 0;

	const eventoComIngressos =
		evento?.ingressosAtivos !== false &&
		(evento?.tipoEvento === "gratuito" ||
			evento?.tipoEvento === "pago" ||
			evento?.capacidade > 0 ||
			evento?.precoInteira !== undefined ||
			evento?.preco !== undefined);

	const capacidadeRestante =
		evento?.capacidade > 0
			? Math.max(
					0,
					(evento?.capacidade || 0) -
						(evento?.ingressosVendidos ||
							0)
			  )
			: null;

	/* ───────────────────────────── */
	/* EFFECTS */
	/* ───────────────────────────── */

	useEffect(() => {
		if (!eventoId) return;

		const q = query(
			collection(
				db,
				"eventos",
				eventoId,
				"avaliacoes"
			),
			orderBy(
				"createdAt",
				"desc"
			)
		);

		const unsub = onSnapshot(
			q,
			(snap) => {
				setAvaliacoes(
					snap.docs.map((d) => ({
						id: d.id,
						...d.data(),
					}))
				);

				setLoadingAval(
					false
				);
			}
		);

		return () => unsub();
	}, [eventoId]);

	useEffect(() => {
		if (
			!eventoId ||
			!auth.currentUser
		)
			return;

		const check = async () => {
			const q = query(
				collection(
					db,
					"eventos",
					eventoId,
					"avaliacoes"
				),
				where(
					"userId",
					"==",
					auth.currentUser.uid
				)
			);

			const snap =
				await getDocs(q);

			setJaAvaliou(
				!snap.empty
			);
		};

		check();
	}, [eventoId]);

	useEffect(() => {
		if (
			!eventoId ||
			!auth.currentUser
		)
			return;

		const carregarLikes =
			async () => {
				try {
					const ids =
						await getUserLikes(
							auth.currentUser
								.uid
						);

					setLiked(
						ids.includes(
							eventoId
						)
					);
				} catch (e) {
					console.log(e);
				}
			};

		carregarLikes();
	}, [eventoId]);

	useEffect(() => {
		if (!eventoId) return;

		incrementEventoViews(
			eventoId
		).then(() =>
			setViewsCount(
				(p) => p + 1
			)
		);
	}, [eventoId]);

	/* ───────────────────────────── */
	/* LIKE */
	/* ───────────────────────────── */

	const handleToggleLike =
		async () => {
			if (
				!auth.currentUser
			) {
				showModal(
					"Login necessário",
					"Faça login para curtir este evento."
				);

				return;
			}

			try {
				const novoStatus =
					!liked;

				await toggleEventoLike(
					eventoId,
					auth.currentUser
						.uid,
					novoStatus
				);

				setLiked(
					novoStatus
				);

				setLikesCount(
					(p) =>
						p +
						(novoStatus
							? 1
							: -1)
				);
			} catch (e) {
				showModal(
					"Erro",
					"Não foi possível atualizar o like."
				);
			}
		};

	/* ───────────────────────────── */
	/* AVALIAR */
	/* ───────────────────────────── */

	const enviarAvaliacao =
		async () => {
			if (
				!comentario.trim()
			) {
				showModal(
					"Atenção",
					"Digite uma avaliação."
				);

				return;
			}

			if (
				!notaSelecionada
			) {
				showModal(
					"Atenção",
					"Selecione uma nota."
				);

				return;
			}

			if (jaAvaliou) {
				showModal(
					"Aviso",
					"Você já avaliou este evento."
				);

				return;
			}

			try {
				setEnviando(
					true
				);

				const user =
					auth.currentUser;

				const avaliacaoData =
					{
						userId:
							user.uid,

						nome:
							user.displayName ||
							"Anônimo",

						foto:
							user.photoURL ||
							"https://i.pravatar.cc/100",

						nota:
							notaSelecionada,

						comentario:
							censurarTexto(
								comentario.trim()
							),

						createdAt:
							serverTimestamp(),
					};

				const ref =
					await addDoc(
						collection(
							db,
							"eventos",
							eventoId,
							"avaliacoes"
						),
						avaliacaoData
					);

				await addDoc(
					collection(
						db,
						"users",
						user.uid,
						"avaliacoes"
					),
					{
						avaliacaoId:
							ref.id,

						...avaliacaoData,

						eventoId,

						tituloEvento:
							evento.tituloEvento ||
							"Evento",
					}
				);

				setComentario(
					""
				);

				setNotaSelecionada(
					0
				);

				setJaAvaliou(
					true
				);

				showModal(
					"Sucesso 🎉",
					"Avaliação enviada!"
				);
			} catch (e) {
				showModal(
					"Erro",
					"Não foi possível enviar."
				);
			} finally {
				setEnviando(
					false
				);
			}
		};

	/* ───────────────────────────── */
	/* DELETE */
	/* ───────────────────────────── */

	const deletarAvaliacao =
		async (
			avaliacaoId
		) => {
			try {
				const user =
					auth.currentUser;

				await deleteDoc(
					doc(
						db,
						"eventos",
						eventoId,
						"avaliacoes",
						avaliacaoId
					)
				);

				const q = query(
					collection(
						db,
						"users",
						user.uid,
						"avaliacoes"
					),
					where(
						"avaliacaoId",
						"==",
						avaliacaoId
					)
				);

				const snap =
					await getDocs(q);

				for (const d of snap.docs) {
					await deleteDoc(
						doc(
							db,
							"users",
							user.uid,
							"avaliacoes",
							d.id
						)
					);
				}

				setJaAvaliou(
					false
				);

				showModal(
					"Sucesso",
					"Avaliação removida."
				);
			} catch (e) {
				console.log(e);
			}
		};

	/* ───────────────────────────── */
	/* MEDIA */
	/* ───────────────────────────── */

	const media =
		avaliacoes.length >
		0
			? (
					avaliacoes.reduce(
						(
							acc,
							a
						) =>
							acc +
							a.nota,
						0
					) /
					avaliacoes.length
			  ).toFixed(1)
			: null;

	if (!evento) {
		return (
			<View
				style={
					styles.center
				}
			>
				<Text
					style={{
						color:
							Colors.textPrimary,
					}}
				>
					Evento não encontrado
				</Text>
			</View>
		);
	}

	return (
		<View
			style={
				styles.container
			}
		>
			<StatusBar
				barStyle="light-content"
			/>

			<ScrollView
				showsVerticalScrollIndicator={
					false
				}
				contentContainerStyle={{
					paddingBottom:
						120,
				}}
			>
				{/* HERO */}

				<View>
					<Image
						source={{
							uri:
								evento.imagemEvento ||
								"https://placehold.co/600x300/121212/ffffff?text=Evento",
						}}
						style={
							styles.image
						}
					/>

					<LinearGradient
						colors={[
							"transparent",
							"rgba(0,0,0,0.96)",
						]}
						style={
							styles.overlay
						}
					/>

					<TouchableOpacity
						activeOpacity={
							0.8
						}
						style={[
							styles.back,
							{
								top:
									insets.top +
									10,
							},
						]}
						onPress={() =>
							navigation.goBack()
						}
					>
						<BlurView
							intensity={
								40
							}
							tint="dark"
							style={
								styles.blurBtn
							}
						>
							<MaterialCommunityIcons
								name="arrow-left"
								size={
									22
								}
								color="#FFF"
							/>
						</BlurView>
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
							duration: 700,
						}}
						style={
							styles.headerText
						}
					>
						<Text
							style={
								styles.title
							}
						>
							{
								evento.tituloEvento
							}
						</Text>

						<Text
							style={
								styles.local
							}
						>
							📍{" "}
							{evento.localEvento ||
								"Local"}
						</Text>

						<View
							style={
								styles.metricRow
							}
						>
							<View
								style={
									styles.metricBox
								}
							>
								<LikeButton
									liked={
										liked
									}
									onPress={
										handleToggleLike
									}
								/>

								<Text
									style={
										styles.metricText
									}
								>
									{
										likesCount
									}
								</Text>
							</View>

							<View
								style={
									styles.metricBox
								}
							>
								<MaterialCommunityIcons
									name="eye-outline"
									size={
										18
									}
									color="#FFF"
								/>

								<Text
									style={
										styles.metricText
									}
								>
									{
										viewsCount
									}
								</Text>
							</View>
						</View>
					</MotiView>
				</View>

				{/* CONTENT */}

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
						type: "timing",
						duration: 700,
						delay: 200,
					}}
					style={
						styles.content
					}
				>
					{/* DATA */}

					{evento.dataEvento && (
						<View
							style={
								styles.infoPill
							}
						>
							<MaterialCommunityIcons
								name="calendar"
								size={
									16
								}
								color={
									Colors.primary
								}
							/>

							<Text
								style={
									styles.infoText
								}
							>
								{
									evento.dataEvento
								}
							</Text>

							{evento.horaInicio && (
								<>
									<MaterialCommunityIcons
										name="clock-outline"
										size={
											16
										}
										color={
											Colors.primary
										}
									/>

									<Text
										style={
											styles.infoText
										}
									>
										{
											evento.horaInicio
										}
									</Text>
								</>
							)}
						</View>
					)}

					{/* DESCRIÇÃO */}

					<Text
						style={
							styles.section
						}
					>
						Descrição
					</Text>

					<Text
						style={
							styles.description
						}
					>
						{evento.descricao ||
							"Sem descrição"}
					</Text>

					{/* INGRESSOS */}

					{eventoComIngressos && (
						<View
							style={
								styles.ingressoSection
							}
						>
							<View
								style={
									styles.ingressoHeader
								}
							>
								<View
									style={
										styles.ingressoHeaderLeft
									}
								>
									<MaterialCommunityIcons
										name="ticket-confirmation"
										size={
											20
										}
										color={
											Colors.primary
										}
									/>

									<Text
										style={
											styles.ingressoTitle
										}
									>
										Ingressos
									</Text>
								</View>

								<View
									style={
										styles.dispBadge
									}
								>
									<Text
										style={
											styles.dispText
										}
									>
										{capacidadeRestante ===
										null
											? "Disponível"
											: `${capacidadeRestante} vagas`}
									</Text>
								</View>
							</View>

							<Text
								style={
									styles.precoLabel
								}
							>
								A partir de
							</Text>

							<Text
								style={
									styles.precoValor
								}
							>
								{eventoGratuito
									? "Gratuito"
									: `R$ ${Number(
											precoBase
									  ).toFixed(
											2
									  )}`}
							</Text>

							<TouchableOpacity
								activeOpacity={
									0.9
								}
								style={
									styles.btnComprar
								}
								onPress={() => {
									if (
										!auth.currentUser
									) {
										showModal(
											"Login necessário",
											"Faça login para comprar ingressos."
										);

										return;
									}

									if (
										capacidadeRestante ===
										0
									) {
										showModal(
											"Ingressos esgotados",
											"Não há ingressos disponíveis para este evento."
										);

										return;
									}

									navigation.navigate(
										"TelaIngressos",
										{
											evento,
										}
									);
								}}
							>
								<LinearGradient
									colors={[
										"#7C3AED",
										"#A855F7",
									]}
									start={{
										x: 0,
										y: 0,
									}}
									end={{
										x: 1,
										y: 0,
									}}
									style={
										styles.btnComprarGradient
									}
								>
									<MaterialCommunityIcons
										name="ticket-outline"
										size={
											20
										}
										color="#fff"
									/>

									<Text
										style={
											styles.btnComprarText
										}
									>
										{eventoGratuito
											? "Reservar ingresso gratuito"
											: "Comprar ingressos"}
									</Text>

									<MaterialCommunityIcons
										name="chevron-right"
										size={
											20
										}
										color="#fff"
									/>
								</LinearGradient>
							</TouchableOpacity>
						</View>
					)}

					{/* OCORRÊNCIA */}

					<TouchableOpacity
						style={styles.ocorrenciaBtn}
						onPress={() =>
							navigation.navigate("NovaOcorrencia", {
								eventoId,
								nomeEvento:
									evento?.tituloEvento,
									evento,
							})
						}
						activeOpacity={0.85}
					>
						<MaterialCommunityIcons
							name="alert-circle-outline"
							size={20}
							color="#fff"
						/>

						<Text
							style={
								styles.ocorrenciaText
							}
						>
							Declarar Ocorrência
						</Text>
					</TouchableOpacity>

					{/* AVALIAÇÕES */}

					<View
						style={
							styles.avalSection
						}
					>
						<View
							style={
								styles.avalHeader
							}
						>
							<Text
								style={
									styles.section
								}
							>
								Avaliações
							</Text>

							{media && (
								<Text
									style={
										styles.media
									}
								>
									⭐{" "}
									{
										media
									}
								</Text>
							)}
						</View>

						{!jaAvaliou ? (
							<View
								style={
									styles.avalInputBox
								}
							>
								<View
									style={
										styles.starsRow
									}
								>
									{[
										1,
										2,
										3,
										4,
										5,
									].map(
										(
											n
										) => (
											<TouchableOpacity
												key={
													n
												}
												onPress={() =>
													setNotaSelecionada(
														n
													)
												}
											>
												<Text
													style={[
														styles.star,
														{
															color:
																n <=
																notaSelecionada
																	? Colors.warning
																	: Colors.border,
														},
													]}
												>
													★
												</Text>
											</TouchableOpacity>
										)
									)}
								</View>

								<View
									style={
										styles.inputRow
									}
								>
									<TextInput
										placeholder="Escreva sua avaliação..."
										placeholderTextColor={
											Colors.textMuted
										}
										style={
											styles.input
										}
										value={
											comentario
										}
										onChangeText={
											setComentario
										}
										multiline
									/>

									<TouchableOpacity
										style={
											styles.sendBtn
										}
										onPress={
											enviarAvaliacao
										}
									>
										{enviando ? (
											<ActivityIndicator
												size="small"
												color="#fff"
											/>
										) : (
											<MaterialCommunityIcons
												name="send"
												size={
													20
												}
												color="#fff"
											/>
										)}
									</TouchableOpacity>
								</View>
							</View>
						) : (
							<View
								style={
									styles.jaAvaliadoBox
								}
							>
								<Text
									style={
										styles.jaAvaliadoText
									}
								>
									✅ Você já avaliou este evento
								</Text>
							</View>
						)}

						{loadingAval ? (
							<ActivityIndicator
								size="small"
								color={
									Colors.primary
								}
								style={{
									marginTop: 16,
								}}
							/>
						) : (
							<View
								style={
									styles.avalList
								}
							>
								{avaliacoes.map(
									(
										item
									) => (
										<View
											key={
												item.id
											}
											style={
												styles.avalCard
											}
										>
											<Image
												source={{
													uri:
														item.foto,
												}}
												style={
													styles.avalAvatar
												}
											/>

											<View
												style={{
													flex: 1,
												}}
											>
												<View
													style={
														styles.avalTop
													}
												>
													<Text
														style={
															styles.avalNome
														}
													>
														{
															item.nome
														}
													</Text>

													<Text
														style={
															styles.starMini
														}
													>
														{"★".repeat(
															item.nota
														)}
													</Text>
												</View>

												<Text
													style={
														styles.avalTexto
													}
												>
													{
														item.comentario
													}
												</Text>
											</View>

											{item.userId ===
												auth
													.currentUser
													?.uid && (
												<TouchableOpacity
													onPress={() =>
														deletarAvaliacao(
															item.id
														)
													}
												>
													<MaterialCommunityIcons
														name="trash-can-outline"
														size={
															18
														}
														color={
															Colors.error
														}
													/>
												</TouchableOpacity>
											)}
										</View>
									)
								)}
							</View>
						)}
					</View>
				</MotiView>
			</ScrollView>

			{/* MODAL */}
			<ConfirmModal
				visible={modalVisible}
				title={modalTitle}
				message={modalMessage}
				type="info"
				confirmText="OK"
				onConfirm={() => setModalVisible(false)}
			/>
		</View>
	);
}

const styles =
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor:
				"#070B14",
		},

		center: {
			flex: 1,
			justifyContent:
				"center",
			alignItems:
				"center",
			backgroundColor:
				"#070B14",
		},

		/* HERO */

		image: {
			width: "100%",
			height: 380,
		},

		overlay: {
			position: "absolute",
			bottom: 0,
			width: "100%",
			height: 220,
		},

		back: {
			position: "absolute",
			left: 18,
			borderRadius: 18,
			overflow: "hidden",
		},

		blurBtn: {
			width: 50,
			height: 50,
			justifyContent:
				"center",
			alignItems:
				"center",
			borderRadius: 18,
			borderWidth: 1,
			borderColor:
				"rgba(255,255,255,0.08)",
		},

		headerText: {
			position: "absolute",
			left: 20,
			right: 20,
			bottom: 30,
		},

		title: {
			color: "#FFF",
			fontSize: 32,
			fontWeight: "900",
		},

		local: {
			color:
				"rgba(255,255,255,0.75)",
			fontSize: 14,
			marginTop: 6,
		},

		metricRow: {
			flexDirection:
				"row",
			alignItems:
				"center",
			marginTop: 18,
			gap: 12,
		},

		metricBox: {
			flexDirection:
				"row",
			alignItems:
				"center",
			backgroundColor:
				"rgba(255,255,255,0.12)",
			paddingHorizontal: 14,
			paddingVertical: 10,
			borderRadius: 18,
			gap: 8,
		},

		metricBtn: {
			alignItems:
				"center",
			justifyContent:
				"center",
		},

		metricText: {
			color: "#FFF",
			fontWeight: "700",
			fontSize: 13,
		},

		/* CONTENT */

		content: {
			paddingHorizontal: 20,
			paddingTop: 24,
		},

		infoPill: {
			flexDirection:
				"row",
			alignItems:
				"center",
			backgroundColor:
				"#111827",
			paddingHorizontal: 14,
			paddingVertical: 12,
			borderRadius: 18,
			borderWidth: 1,
			borderColor:
				"rgba(255,255,255,0.06)",
			gap: 8,
		},

		infoText: {
			color:
				Colors.textSecondary,
			fontSize: 13,
			fontWeight: "600",
		},

		section: {
			color:
				Colors.textPrimary,
			fontSize: 20,
			fontWeight: "800",
			marginTop: 24,
			marginBottom: 12,
		},

		description: {
			color:
				Colors.textSecondary,
			fontSize: 15,
			lineHeight: 26,
		},

		/* INGRESSOS */

		ingressoSection: {
			marginTop: 28,
			backgroundColor:
				"#111827",
			borderRadius: 28,
			padding: 22,
			borderWidth: 1,
			borderColor:
				"rgba(255,255,255,0.06)",
		},

		ingressoHeader: {
			flexDirection:
				"row",
			alignItems:
				"center",
			justifyContent:
				"space-between",
		},

		ingressoHeaderLeft: {
			flexDirection:
				"row",
			alignItems:
				"center",
			gap: 10,
		},

		ingressoTitle: {
			color:
				Colors.textPrimary,
			fontSize: 17,
			fontWeight: "800",
		},

		dispBadge: {
			backgroundColor:
				"rgba(34,197,94,0.12)",
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 999,
		},

		dispText: {
			color:
				Colors.success,
			fontWeight: "700",
			fontSize: 12,
		},

		precoLabel: {
			color:
				Colors.textMuted,
			marginTop: 20,
			fontSize: 13,
		},

		precoValor: {
			color:
				Colors.primary,
			fontSize: 34,
			fontWeight: "900",
			marginTop: 4,
		},

		btnComprar: {
			marginTop: 22,
			borderRadius: 22,
			overflow: "hidden",
		},

		btnComprarGradient: {
			flexDirection:
				"row",
			alignItems:
				"center",
			justifyContent:
				"center",
			paddingVertical: 18,
			gap: 10,
		},

		btnComprarText: {
			color: "#FFF",
			fontWeight: "800",
			fontSize: 15,
		},

		/* OCORRENCIA */

		ocorrenciaBtn: {
			marginTop: 20,
			backgroundColor:
				"#DC2626",
			borderRadius: 20,
			paddingVertical: 16,
			flexDirection:
				"row",
			alignItems:
				"center",
			justifyContent:
				"center",
			gap: 8,
		},

		ocorrenciaText: {
			color: "#FFF",
			fontWeight: "800",
			fontSize: 14,
		},

		/* AVALIAÇÕES */

		avalSection: {
			marginTop: 30,
		},

		avalHeader: {
			flexDirection:
				"row",
			alignItems:
				"center",
			justifyContent:
				"space-between",
		},

		media: {
			color:
				Colors.warning,
			fontWeight: "800",
			fontSize: 15,
		},

		avalInputBox: {
			backgroundColor:
				"#111827",
			borderRadius: 24,
			padding: 18,
			marginTop: 16,
			borderWidth: 1,
			borderColor:
				"rgba(255,255,255,0.06)",
		},

		starsRow: {
			flexDirection:
				"row",
			justifyContent:
				"center",
			gap: 4,
			marginBottom: 16,
		},

		star: {
			fontSize: 34,
		},

		inputRow: {
			flexDirection:
				"row",
			alignItems:
				"flex-end",
			gap: 10,
		},

		input: {
			flex: 1,
			backgroundColor:
				"#070B14",
			borderRadius: 18,
			padding: 14,
			minHeight: 90,
			color: "#FFF",
			borderWidth: 1,
			borderColor:
				"rgba(255,255,255,0.06)",
			textAlignVertical:
				"top",
		},

		sendBtn: {
			width: 54,
			height: 54,
			borderRadius: 18,
			backgroundColor:
				Colors.primary,
			justifyContent:
				"center",
			alignItems:
				"center",
		},

		jaAvaliadoBox: {
			backgroundColor:
				"#111827",
			padding: 18,
			borderRadius: 18,
			marginTop: 14,
			alignItems:
				"center",
			borderWidth: 1,
			borderColor:
				"rgba(255,255,255,0.06)",
		},

		jaAvaliadoText: {
			color:
				Colors.success,
			fontWeight: "700",
		},

		avalList: {
			marginTop: 20,
		},

		avalCard: {
			flexDirection:
				"row",
			backgroundColor:
				"#111827",
			padding: 14,
			borderRadius: 22,
			marginBottom: 14,
			gap: 12,
			borderWidth: 1,
			borderColor:
				"rgba(255,255,255,0.06)",
		},

		avalAvatar: {
			width: 48,
			height: 48,
			borderRadius: 24,
		},

		avalTop: {
			flexDirection:
				"row",
			alignItems:
				"center",
			gap: 8,
		},

		avalNome: {
			color: "#FFF",
			fontWeight: "800",
			fontSize: 14,
		},

		starMini: {
			color:
				Colors.warning,
			fontSize: 12,
		},

		avalTexto: {
			color:
				Colors.textSecondary,
			fontSize: 13,
			lineHeight: 21,
			marginTop: 6,
		},

		/* MODAL */


	});
