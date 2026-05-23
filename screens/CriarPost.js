import React, { useState } from "react";

import {
	View,
	TouchableOpacity,
	Image,
	TextInput,
	StyleSheet,
	ActivityIndicator,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	StatusBar,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { BlurView } from "expo-blur";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { MotiView } from "moti";

import { useAuth } from "../context/AuthContext";

import AppText from "../components/AppText";

import { Colors } from "../styles/Colors";

import ConfirmModal from "../components/ConfirmModal";

import { db } from "../firebaseConfig";

import { uploadImagem } from "../services/uploadService";

export default function CriarPost({ navigation }) {
	const { user, profile } = useAuth();

	const insets = useSafeAreaInsets();

	const [imagem, setImagem] = useState(null);

	const [descricao, setDescricao] = useState("");

	const [loading, setLoading] = useState(false);

	const [uploadProgress, setUploadProgress] = useState(0);

	const [modalVisible, setModalVisible] = useState(false);

	const [modalData, setModalData] = useState({
		title: "",
		message: "",
		type: "success",
	});

	const showModal = (title, message, type = "success") => {
		setModalData({
			title,
			message,
			type,
		});

		setModalVisible(true);
	};

	/* ESCOLHER IMAGEM */
	const escolherImagem = async () => {
		try {
			const permission =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permission.granted) {
				showModal(
					"Permissão necessária",
					"Permita acesso à galeria.",
					"error"
				);

				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,

				quality: 0.7,

				allowsEditing: true,
			});

			if (!result.canceled) {
				setImagem(result.assets[0].uri);
			}
		} catch (e) {
			console.log(e);

			showModal(
				"Erro",
				"Não foi possível abrir a galeria.",
				"error"
			);
		}
	};

	/* PUBLICAR */
	const publicar = async () => {
		if (!imagem) {
			showModal(
				"Atenção",
				"Selecione uma imagem.",
				"error"
			);

			return;
		}

		if (!descricao.trim()) {
			showModal(
				"Atenção",
				"Digite uma descrição.",
				"error"
			);

			return;
		}

		try {
			setLoading(true);

			const imageUrl = await uploadImagem(
				imagem,
				user?.uid,
				(p) => setUploadProgress(p)
			);

			await addDoc(collection(db, "posts"), {
				userId: user?.uid,

				autor: {
					uid: user?.uid,

					nome:
						profile?.nome ||
						user?.displayName ||
						"Usuário",

					foto:
						profile?.foto ||
						user?.photoURL ||
						"https://i.pravatar.cc/100",

					email: user?.email || "",

					role: profile?.role || "user",
				},

				imagemUrl: imageUrl,

				descricao: descricao.trim(),

				likes: 0,

				comentarios: 0,

				createdAt: serverTimestamp(),
			});

			showModal(
				"Sucesso 🎉",
				"Post publicado com sucesso!"
			);

			setTimeout(() => {
				setModalVisible(false);

				navigation.goBack();
			}, 1500);
		} catch (e) {
			console.log(e);

			showModal(
				"Erro",
				"Não foi possível publicar o post.",
				"error"
			);
		} finally {
			setLoading(false);

			setUploadProgress(0);
		}
	};

	const podePublicar = imagem && descricao.trim();

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />

			<View
				style={{
					height: insets.top,
					backgroundColor: "#070B14",
				}}
			/>

			{/* HEADER */}
			<LinearGradient
				colors={["#070B14", "#111827"]}
				style={styles.header}
			>
				<View style={styles.headerRow}>
					<TouchableOpacity
						onPress={() => navigation.goBack()}
					>
						<BlurView
							intensity={60}
							tint="dark"
							style={styles.backBtn}
						>
							<MaterialCommunityIcons
								name="arrow-left"
								size={24}
								color="#FFF"
							/>
						</BlurView>
					</TouchableOpacity>

					<AppText style={styles.title}>
						Novo Post
					</AppText>

					<TouchableOpacity
						disabled={!podePublicar || loading}
						onPress={publicar}
					>
						<LinearGradient
							colors={
								podePublicar
									? ["#7C3AED", "#5B21B6"]
									: ["#333", "#333"]
							}
							style={styles.publishBtn}
						>
							{loading ? (
								<ActivityIndicator
									color="#FFF"
									size="small"
								/>
							) : (
								<AppText
									style={styles.publishText}
								>
									Publicar
								</AppText>
							)}
						</LinearGradient>
					</TouchableOpacity>
				</View>

				{/* PROGRESS */}
				{loading &&
					uploadProgress > 0 &&
					uploadProgress < 1 && (
						<View style={styles.progressContainer}>
							<View style={styles.progressBarBg}>
								<View
									style={[
										styles.progressBar,
										{
											width: `${
												uploadProgress * 100
											}%`,
										},
									]}
								/>
							</View>

							<AppText
								style={styles.progressText}
							>
								Enviando imagem{" "}
								{Math.round(
									uploadProgress * 100
								)}
								%
							</AppText>
						</View>
					)}
			</LinearGradient>

			{/* CONTEÚDO */}
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={
					Platform.OS === "ios"
						? "padding"
						: undefined
				}
			>
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{
						paddingBottom:
							insets.bottom + 140,
					}}
				>
					<MotiView
						from={{
							opacity: 0,
							translateY: 40,
							scale: 0.96,
						}}
						animate={{
							opacity: 1,
							translateY: 0,
							scale: 1,
						}}
						transition={{
							type: "timing",
							duration: 650,
						}}
					>
						{/* IMAGEM */}
						<TouchableOpacity
							activeOpacity={0.9}
							style={styles.imageBox}
							onPress={escolherImagem}
						>
							{imagem ? (
								<>
									<Image
										source={{
											uri: imagem,
										}}
										style={styles.image}
										resizeMode="contain"
									/>

									<LinearGradient
										colors={[
											"transparent",
											"rgba(0,0,0,0.85)",
										]}
										style={
											styles.imageOverlay
										}
									>
										<View
											style={
												styles.changePhoto
											}
										>
											<MaterialCommunityIcons
												name="camera"
												size={18}
												color="#FFF"
											/>

											<AppText
												style={
													styles.changePhotoText
												}
											>
												Alterar foto
											</AppText>
										</View>
									</LinearGradient>
								</>
							) : (
								<View
									style={styles.placeholder}
								>
									<LinearGradient
										colors={[
											"#7C3AED",
											"#5B21B6",
										]}
										style={
											styles.placeholderIcon
										}
									>
										<MaterialCommunityIcons
											name="image-plus"
											size={42}
											color="#FFF"
										/>
									</LinearGradient>

									<AppText
										style={
											styles.placeholderTitle
										}
									>
										Adicionar imagem
									</AppText>

									<AppText
										style={
											styles.placeholderText
										}
									>
										Escolha uma imagem incrível
										para o seu post
									</AppText>
								</View>
							)}
						</TouchableOpacity>

						{/* INPUT */}
						<View
							style={styles.inputContainer}
						>
							<View
								style={styles.inputHeader}
							>
								<MaterialCommunityIcons
									name="text-box-outline"
									size={20}
									color={Colors.primary}
								/>

								<AppText
									style={styles.inputLabel}
								>
									Descrição
								</AppText>
							</View>

							<TextInput
								placeholder="Escreva algo sobre esse momento..."
								placeholderTextColor={
									Colors.textMuted
								}
								value={descricao}
								onChangeText={setDescricao}
								multiline
								maxLength={500}
								style={styles.input}
							/>

							<View
								style={styles.counterRow}
							>
								<AppText
									style={styles.counter}
								>
									{descricao.length}/500
								</AppText>
							</View>
						</View>
					</MotiView>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* MODAL */}
			<ConfirmModal
				visible={modalVisible}
				title={modalData.title}
				message={modalData.message}
				type={modalData.type}
				confirmText="OK"
				onConfirm={() =>
					setModalVisible(false)
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

	header: {
		paddingHorizontal: 18,
		paddingBottom: 18,
	},

	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	backBtn: {
		width: 48,
		height: 48,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},

	title: {
		color: "#FFF",
		fontSize: 20,
		fontWeight: "800",
	},

	publishBtn: {
		paddingHorizontal: 18,
		paddingVertical: 12,
		borderRadius: 16,
		minWidth: 110,
		alignItems: "center",
	},

	publishText: {
		color: "#FFF",
		fontWeight: "800",
		fontSize: 14,
	},

	progressContainer: {
		marginTop: 16,
	},

	progressBarBg: {
		height: 8,
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 20,
		overflow: "hidden",
	},

	progressBar: {
		height: "100%",
		backgroundColor: "#7C3AED",
		borderRadius: 20,
	},

	progressText: {
		color: "rgba(255,255,255,0.72)",
		fontSize: 12,
		marginTop: 8,
		textAlign: "center",
	},

	imageBox: {
		height: 340,
		marginHorizontal: 18,
		marginTop: 24,
		borderRadius: 30,
		backgroundColor: "#111827",
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
		justifyContent: "center",
		alignItems: "center",
	},

	image: {
		width: "100%",
		height: "100%",
	},

	imageOverlay: {
		position: "absolute",
		bottom: 0,
		width: "100%",
		padding: 20,
	},

	changePhoto: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
		backgroundColor: "rgba(255,255,255,0.14)",
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: 18,
		gap: 8,
	},

	changePhotoText: {
		color: "#FFF",
		fontWeight: "700",
	},

	placeholder: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 30,
	},

	placeholderIcon: {
		width: 90,
		height: 90,
		borderRadius: 28,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 20,
	},

	placeholderTitle: {
		color: "#FFF",
		fontSize: 20,
		fontWeight: "800",
	},

	placeholderText: {
		color: "rgba(255,255,255,0.65)",
		fontSize: 14,
		textAlign: "center",
		lineHeight: 22,
		marginTop: 10,
	},

	inputContainer: {
		marginTop: 24,
		marginHorizontal: 18,
		marginBottom: 20,
		backgroundColor: "#111827",
		borderRadius: 26,
		padding: 20,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},

	inputHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 14,
	},

	inputLabel: {
		color: "#FFF",
		fontWeight: "700",
		fontSize: 15,
	},

	input: {
		color: "#FFF",
		fontSize: 15,
		lineHeight: 24,
		minHeight: 140,
		textAlignVertical: "top",
	},

	counterRow: {
		alignItems: "flex-end",
		marginTop: 10,
	},

	counter: {
		color: "rgba(255,255,255,0.45)",
		fontSize: 12,
	},
});