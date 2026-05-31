import React, { useEffect, useState } from "react";

import {
	View,
	TouchableOpacity,
	FlatList,
	StyleSheet,
	ActivityIndicator,
	Alert,
	Platform,
	StatusBar,
} from "react-native";

import {
	collection,
	query,
	orderBy,
	onSnapshot,
	deleteDoc,
	doc,
	getDoc,
} from "firebase/firestore";

import { LinearGradient } from "expo-linear-gradient";

import { BlurView } from "expo-blur";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { auth, db } from "../firebaseConfig";

import AppText from "../components/AppText";

import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";


export default function PerfilHistorico({
	navigation,
}) {
	const { colors, gradients, isDark } = useTheme();
	const styles = useThemedStyles(createThemedScreenStyles);
	const blurTint = isDark ? "dark" : "light";
	const insets =
		useSafeAreaInsets();

	const [tab, setTab] =
		useState("avaliacoes");

	const [avaliacoes, setAvaliacoes] =
		useState([]);

	const [ocorrencias, setOcorrencias] =
		useState([]);

	const [loadingAval, setLoadingAval] =
		useState(true);

	const [loadingOcorr, setLoadingOcorr] =
		useState(true);

	const userId =
		auth.currentUser?.uid;

	const confirmarAcao = (
		mensagem,
		callback
	) => {
		if (Platform.OS === "web") {
			const confirmado =
				window.confirm(
					mensagem
				);

			if (confirmado) {
				callback();
			}
		} else {
			Alert.alert(
				"Confirmar",
				mensagem,
				[
					{
						text: "Cancelar",
						style: "cancel",
					},
					{
						text: "Confirmar",
						style:
							"destructive",
						onPress:
							callback,
					},
				]
			);
		}
	};

	const deletarAvaliacao =
		async (item) => {
			try {
				await deleteDoc(
					doc(
						db,
						"users",
						userId,
						"avaliacoes",
						item.id
					)
				);

				if (
					item.eventoId &&
					item.avaliacaoId
				) {
					await deleteDoc(
						doc(
							db,
							"eventos",
							item.eventoId,
							"avaliacoes",
							item.avaliacaoId
						)
					);
				}
			} catch (e) {
				console.log(e);

				Alert.alert(
					"Erro",
					"Não foi possível remover."
				);
			}
		};

	const deletarOcorrencia =
		async (item) => {
			try {
				await deleteDoc(
					doc(
						db,
						"users",
						userId,
						"ocorrencias",
						item.id
					)
				);

				if (
					item.eventoId &&
					item.ocorrenciaId
				) {
					await deleteDoc(
						doc(
							db,
							"eventos",
							item.eventoId,
							"ocorrencias",
							item.ocorrenciaId
						)
					);
				}
			} catch (e) {
				console.log(e);

				Alert.alert(
					"Erro",
					"Não foi possível remover."
				);
			}
		};

	const abrirEvento =
		async (eventoId) => {
			try {
				const eventoRef = doc(
					db,
					"eventos",
					eventoId
				);

				const snap =
					await getDoc(
						eventoRef
					);

				if (!snap.exists()) {
					Alert.alert(
						"Erro",
						"Evento não encontrado."
					);

					return;
				}

				navigation.navigate(
					"Detalhes",
					{
						evento: {
							id: snap.id,
							...snap.data(),
						},
					}
				);
			} catch (e) {
				console.log(e);

				Alert.alert(
					"Erro",
					"Não foi possível abrir o evento."
				);
			}
		};

	/* ⭐ AVALIAÇÕES */
	useEffect(() => {
		if (!userId) return;

		const q = query(
			collection(
				db,
				"users",
				userId,
				"avaliacoes"
			),
			orderBy(
				"createdAt",
				"desc"
			)
		);

		const unsub =
			onSnapshot(
				q,
				(snapshot) => {
					setAvaliacoes(
						snapshot.docs.map(
							(d) => ({
								id: d.id,
								...d.data(),
							})
						)
					);

					setLoadingAval(
						false
					);
				},
				(err) => {
					console.log(
						"Erro avaliações:",
						err
					);

					setLoadingAval(
						false
					);
				}
			);

		return () => unsub();
	}, [userId]);

	/* 🚨 OCORRÊNCIAS */
	useEffect(() => {
		if (!userId) return;

		const q = query(
			collection(
				db,
				"users",
				userId,
				"ocorrencias"
			),
			orderBy(
				"createdAt",
				"desc"
			)
		);

		const unsub =
			onSnapshot(
				q,
				(snapshot) => {
					setOcorrencias(
						snapshot.docs.map(
							(d) => ({
								id: d.id,
								...d.data(),
							})
						)
					);

					setLoadingOcorr(
						false
					);
				},
				(err) => {
					console.log(
						"Erro ocorrências:",
						err
					);

					setLoadingOcorr(
						false
					);
				}
			);

		return () => unsub();
	}, [userId]);

	const isLoading =
		tab === "avaliacoes"
			? loadingAval
			: loadingOcorr;

	const dados =
		tab === "avaliacoes"
			? avaliacoes
			: ocorrencias;

	const renderItem = ({
		item,
		index,
	}) => (
		<TouchableOpacity
			activeOpacity={0.9}
			style={styles.cardWrapper}
			onPress={() =>
				abrirEvento(
					item.eventoId
				)
			}
		>
			<BlurView
				intensity={45}
				tint={blurTint}
				style={styles.card}
			>
				{/* Glow */}
				<LinearGradient
					colors={[
						isDark ? "rgba(108,92,231,0.15)" : "rgba(108,92,231,0.06)",
						"transparent",
					]}
					style={
						styles.cardGlow
					}
				/>

				<View
					style={
						styles.cardHeader
					}
				>
					<View
						style={{
							flex: 1,
						}}
					>
						<View
							style={
								styles.eventBadge
							}
						>
							<MaterialCommunityIcons
								name={
									tab ===
									"avaliacoes"
										? "star"
										: "alert-circle"
								}
								size={14}
								color={colors.primary}
							/>

							<AppText
								style={
									styles.eventBadgeText
								}
							>
								{tab ===
								"avaliacoes"
									? "Avaliação"
									: "Ocorrência"}
							</AppText>
						</View>

						<AppText
							style={
								styles.localText
							}
						>
							📍{" "}
							{item.tituloEvento ||
								item.local ||
								"Evento"}
						</AppText>
					</View>

					<TouchableOpacity
						style={
							styles.deleteBtn
						}
						onPress={() =>
							confirmarAcao(
								tab ===
									"avaliacoes"
									? "Deseja apagar esta avaliação?"
									: "Deseja apagar esta ocorrência?",
								() =>
									tab ===
									"avaliacoes"
										? deletarAvaliacao(
												item
										  )
										: deletarOcorrencia(
												item
										  )
							)
						}
					>
						<MaterialCommunityIcons
							name="trash-can-outline"
							size={20}
							color={
								colors.error
							}
						/>
					</TouchableOpacity>
				</View>

				{/* AVALIAÇÃO */}
				{tab ===
					"avaliacoes" && (
					<>
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
									<AppText
										key={
											n
										}
										style={[
											styles.star,
											{
												color:
													n <=
													item.nota
														? "#FACC15"
														: isDark
														? "rgba(255,255,255,0.15)"
														: "rgba(0,0,0,0.12)",
											},
										]}
									>
										★
									</AppText>
								)
							)}

							<AppText
								style={
									styles.notaText
								}
							>
								{item.nota}
								/5
							</AppText>
						</View>

						<AppText
							style={
								styles.cardText
							}
						>
							{item.comentario ||
								"—"}
						</AppText>
					</>
				)}

				{/* OCORRÊNCIA */}
				{tab ===
					"ocorrencias" && (
					<>
						{item.tipo ? (
							<View
								style={
									styles.tipoBadge
								}
							>
								<AppText
									style={
										styles.tipoText
									}
								>
									{
										item.tipo
									}
								</AppText>
							</View>
						) : null}

						<AppText
							style={
								styles.cardText
							}
						>
							{item.descricao ||
								"—"}
						</AppText>
					</>
				)}

				{/* FOOTER */}
				<View
					style={
						styles.footerRow
					}
				>
					<AppText
						style={
							styles.dataText
						}
					>
						{item.createdAt
							?.toDate &&
							item.createdAt
								.toDate()
								.toLocaleDateString(
									"pt-BR"
								)}
					</AppText>

					<View
						style={
							styles.openRow
						}
					>
						<AppText
							style={
								styles.openText
							}
						>
							Abrir evento
						</AppText>

						<MaterialCommunityIcons
							name="chevron-right"
							size={18}
							color={
								colors.primary
							}
						/>
					</View>
				</View>
			</BlurView>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<StatusBar
				barStyle={isDark ? "light-content" : "dark-content"}
			/>

			{/* HEADER */}
			<LinearGradient
				colors={gradients.header}
				style={[
					styles.header,
					{
						paddingTop:
							insets.top +
							10,
					},
				]}
			>
				<View
					style={
						styles.headerRow
					}
				>
					<TouchableOpacity
						style={
							styles.backBtn
						}
						onPress={() =>
							navigation.goBack()
						}
					>
						<MaterialCommunityIcons
							name="arrow-left"
							size={24}
							color={colors.textPrimary}
						/>
					</TouchableOpacity>

					<View
						style={{
							flex: 1,
						}}
					>
						<AppText
							style={
								styles.title
							}
						>
							Meu Histórico
						</AppText>

						<AppText
							style={
								styles.subtitle
							}
						>
							Acompanhe suas avaliações e ocorrências
						</AppText>
					</View>
				</View>

				{/* TABS */}
				<View
					style={
						styles.tabsWrapper
					}
				>
					{[
						"avaliacoes",
						"ocorrencias",
					].map((t) => (
						<TouchableOpacity
							key={t}
							onPress={() =>
								setTab(
									t
								)
							}
							style={[
								styles.tab,
								tab ===
									t &&
									styles.activeTab,
							]}
						>
							<LinearGradient
								colors={
									tab === t
										? gradients.primaryButton
										: [
												"transparent",
												"transparent",
										  ]
								}
								style={
									styles.tabGradient
								}
							>
								<MaterialCommunityIcons
									name={
										t ===
										"avaliacoes"
											? "star"
											: "alert-circle"
									}
									size={16}
									color={
										tab ===
										t
											? colors.onPrimary
											: colors.textMuted
									}
								/>

								<AppText
									style={[
										styles.tabText,
										tab ===
											t &&
											styles.activeTabText,
									]}
								>
									{t ===
									"avaliacoes"
										? `Avaliações (${avaliacoes.length})`
										: `Ocorrências (${ocorrencias.length})`}
								</AppText>
							</LinearGradient>
						</TouchableOpacity>
					))}
				</View>
			</LinearGradient>

			{/* LISTA */}
			{isLoading ? (
				<View
					style={
						styles.loadingBox
					}
				>
					<ActivityIndicator
						size="large"
						color={
							colors.primary
						}
					/>
				</View>
			) : (
				<FlatList
					contentContainerStyle={
						styles.list
					}
					data={dados}
					keyExtractor={(
						item
					) => item.id}
					showsVerticalScrollIndicator={
						false
					}
					renderItem={
						renderItem
					}
					ListEmptyComponent={
						<View
							style={
								styles.emptyBox
							}
						>
							<View
								style={
									styles.emptyIcon
								}
							>
								<MaterialCommunityIcons
									name={
										tab ===
										"avaliacoes"
											? "star-outline"
											: "alert-circle-outline"
									}
									size={42}
									color={
										colors.primary
									}
								/>
							</View>

							<AppText
								style={
									styles.emptyTitle
								}
							>
								{tab ===
								"avaliacoes"
									? "Nenhuma avaliação"
									: "Nenhuma ocorrência"}
							</AppText>

							<AppText
								style={
									styles.emptyText
								}
							>
								{tab ===
								"avaliacoes"
									? "Você ainda não avaliou eventos."
									: "Você ainda não registrou ocorrências."}
							</AppText>
						</View>
					}
				/>
			)}
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
			paddingBottom: 24,
			paddingHorizontal: 20,
		},

		headerRow: {
			flexDirection: "row",
			alignItems: "center",
			marginBottom: 24,
		},

		backBtn: {
			width: 46,
			height: 46,
			borderRadius: 16,
			backgroundColor: c.glass,
			borderWidth: 1,
			borderColor: c.glassBorder,
			justifyContent: "center",
			alignItems: "center",
			marginRight: 14,
		},

		title: {
			color: c.textPrimary,
			fontSize: 26,
			fontWeight: "800",
		},

		subtitle: {
			color: c.textSecondary,
			fontSize: 13,
			marginTop: 4,
		},

		tabsWrapper: {
			flexDirection: "row",
			backgroundColor: c.glass,
			padding: 6,
			borderRadius: 22,
			borderWidth: 1,
			borderColor: c.glassBorder,
		},

		tab: {
			flex: 1,
			borderRadius: 18,
			overflow: "hidden",
		},

		activeTab: {},

		tabGradient: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			paddingVertical: 14,
			borderRadius: 18,
			gap: 8,
		},

		tabText: {
			color: c.textMuted,
			fontSize: 12,
			fontWeight: "700",
		},

		activeTabText: {
			color: c.onPrimary,
		},

		list: {
			padding: 18,
			paddingBottom: 120,
		},

		cardWrapper: {
			marginBottom: 16,
		},

		card: {
			borderRadius: 28,
			padding: 18,
			overflow: "hidden",
			backgroundColor: c.card,
			borderWidth: 1,
			borderColor: c.border,
		},

		cardGlow: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			height: 120,
		},

		cardHeader: {
			flexDirection: "row",
			alignItems: "flex-start",
			marginBottom: 14,
		},

		eventBadge: {
			alignSelf: "flex-start",
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: c.primarySoft,
			paddingHorizontal: 10,
			paddingVertical: 6,
			borderRadius: 20,
			marginBottom: 10,
		},

		eventBadgeText: {
			color: c.primary,
			fontSize: 11,
			fontWeight: "700",
			marginLeft: 6,
		},

		localText: {
			color: c.textPrimary,
			fontSize: 16,
			fontWeight: "800",
			lineHeight: 22,
		},

		deleteBtn: {
			width: 40,
			height: 40,
			borderRadius: 14,
			backgroundColor: "rgba(239,68,68,0.08)",
			justifyContent: "center",
			alignItems: "center",
		},

		starsRow: {
			flexDirection: "row",
			alignItems: "center",
			marginBottom: 12,
		},

		star: {
			fontSize: 18,
		},

		notaText: {
			color: c.textSecondary,
			marginLeft: 10,
			fontSize: 13,
			fontWeight: "700",
		},

		tipoBadge: {
			backgroundColor: c.backgroundSecondary,
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 18,
			alignSelf: "flex-start",
			marginBottom: 12,
		},

		tipoText: {
			color: c.textSecondary,
			fontSize: 11,
			fontWeight: "700",
			textTransform: "uppercase",
		},

		cardText: {
			color: c.textSecondary,
			fontSize: 14,
			lineHeight: 24,
		},

		footerRow: {
			marginTop: 18,
			paddingTop: 14,
			borderTopWidth: 1,
			borderTopColor: c.divider,
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
		},

		dataText: {
			color: c.textMuted,
			fontSize: 12,
		},

		openRow: {
			flexDirection: "row",
			alignItems: "center",
		},

		openText: {
			color: c.primary,
			fontSize: 13,
			fontWeight: "700",
		},

		loadingBox: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},

		emptyBox: {
			alignItems: "center",
			marginTop: 90,
			paddingHorizontal: 30,
		},

		emptyIcon: {
			width: 90,
			height: 90,
			borderRadius: 45,
			backgroundColor: c.primarySoft,
			justifyContent: "center",
			alignItems: "center",
			marginBottom: 20,
		},

		emptyTitle: {
			color: c.textPrimary,
			fontSize: 18,
			fontWeight: "800",
			marginBottom: 10,
		},

		emptyText: {
			color: c.textSecondary,
			fontSize: 14,
			textAlign: "center",
			lineHeight: 22,
		},
	});
}