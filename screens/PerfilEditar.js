import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Image,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
	Modal,
	Pressable,
	Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

function formatarCPF(value) {
	const apenasDigitos = value.replace(/\D/g, "");
	const cpfLimitado = apenasDigitos.substring(0, 11);
	return cpfLimitado
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(value) {
	const apenasDigitos = value.replace(/\D/g, "");
	const telLimitado = apenasDigitos.substring(0, 11);
	if (telLimitado.length <= 10) {
		return telLimitado
			.replace(/(\d{2})(\d)/, "($1) $2")
			.replace(/(\d{4})(\d)/, "$1-$2");
	} else {
		return telLimitado
			.replace(/(\d{2})(\d)/, "($1) $2")
			.replace(/(\d{5})(\d)/, "$1-$2");
	}
}

function validarCPF(cpfStr) {
	const cpfLimpo = cpfStr.replace(/\D/g, "");
	if (cpfLimpo.length !== 11) return false;
	if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
	let soma = 0;
	for (let i = 0; i < 9; i++) soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
	let resto = 11 - (soma % 11);
	let d1 = resto === 10 || resto === 11 ? 0 : resto;
	if (d1 !== parseInt(cpfLimpo.charAt(9))) return false;
	soma = 0;
	for (let i = 0; i < 10; i++) soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
	resto = 11 - (soma % 11);
	let d2 = resto === 10 || resto === 11 ? 0 : resto;
	if (d2 !== parseInt(cpfLimpo.charAt(10))) return false;
	return true;
}

function validarTelefone(telStr) {
	const telLimpo = telStr.replace(/\D/g, "");
	return telLimpo.length === 10 || telLimpo.length === 11;
}

function validarUsername(usernameStr) {
	const regex = /^[a-z0-9_.]+$/;
	return regex.test(usernameStr);
}

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import AppText from "../components/AppText";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebaseConfig";
import { uploadImagem } from "../services/uploadService";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

function FormSection({ title, children, styles }) {
	return (
		<View style={styles.section}>
			<AppText style={styles.sectionTitle}>{title}</AppText>
			<View style={styles.sectionCard}>{children}</View>
		</View>
	);
}

export default function PerfilEditar({ navigation }) {
	const insets = useSafeAreaInsets();
	const { user, nome: nomeContext, foto: fotoContext, refreshProfile } = useAuth();
	const { colors, isDark } = useTheme();
	const styles = useThemedStyles(createPerfilEditarStyles);
	const blurTint = isDark ? "dark" : "light";

	const [loading, setLoading] = useState(false);
	const [nome, setNome] = useState(nomeContext || "");
	const [username, setUsername] = useState("");
	const [bio, setBio] = useState("");
	const [cidade, setCidade] = useState("");
	const [foto, setFoto] = useState(fotoContext || "");
	const [telefone, setTelefone] = useState("");
	const [cpf, setCpf] = useState("");
	const [instagram, setInstagram] = useState("");
	const [facebook, setFacebook] = useState("");
	const [x, setX] = useState("");
	const [spotify, setSpotify] = useState("");
	const [tiktok, setTiktok] = useState("");
	const [website, setWebsite] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [modalConfig, setModalConfig] = useState({
		title: "",
		message: "",
		icon: "",
		iconColor: colors.primary,
		onConfirm: null,
		showCancel: false,
	});

	useEffect(() => {
		async function carregar() {
			try {
				const ref = doc(db, "users", user.uid);
				const snap = await getDoc(ref);
				if (snap.exists()) {
					const data = snap.data();
					setTelefone(data.telefone ? formatarTelefone(data.telefone) : "");
					setCpf(data.cpf ? formatarCPF(data.cpf) : "");
					setUsername(data.username || "");
					setBio(data.bio || "");
					setCidade(data.cidade || "");
					setInstagram(data.instagram || "");
					setFacebook(data.facebook || "");
					setX(data.x || "");
					setSpotify(data.spotify || "");
					setTiktok(data.tiktok || "");
					setWebsite(data.website || "");
				}
			} catch (error) {
				console.log(error);
			}
		}
		if (user) carregar();
	}, [user]);

	async function escolherFoto() {
		const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permissao.granted) {
			setModalConfig({
				title: "Permissão necessária",
				message: "Precisamos de acesso à sua galeria para selecionar uma foto de perfil.",
				icon: "image-outline",
				iconColor: colors.warning,
				onConfirm: () => setShowModal(false),
				showCancel: false,
			});
			setShowModal(true);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.5,
			allowsEditing: true,
			aspect: [1, 1],
		});
		if (!result.canceled) setFoto(result.assets[0].uri);
	}

	async function salvar() {
		if (!nome.trim()) {
			setModalConfig({
				title: "Nome obrigatório",
				message: "Por favor, informe seu nome para continuar.",
				icon: "account-outline",
				iconColor: colors.warning,
				onConfirm: () => setShowModal(false),
				showCancel: false,
			});
			setShowModal(true);
			return;
		}
		if (username.trim() && !validarUsername(username)) {
			setModalConfig({
				title: "Username inválido",
				message: "O username deve conter apenas letras minúsculas, números, sublinhado (_) ou ponto (.).",
				icon: "at",
				iconColor: colors.error,
				onConfirm: () => setShowModal(false),
				showCancel: false,
			});
			setShowModal(true);
			return;
		}
		if (cpf.trim() && !validarCPF(cpf)) {
			setModalConfig({
				title: "CPF inválido",
				message: "O CPF informado é inválido. Por favor, digite um CPF correto.",
				icon: "card-account-details-outline",
				iconColor: colors.error,
				onConfirm: () => setShowModal(false),
				showCancel: false,
			});
			setShowModal(true);
			return;
		}
		if (telefone.trim() && !validarTelefone(telefone)) {
			setModalConfig({
				title: "Telefone inválido",
				message: "Por favor, insira um telefone válido com DDD (ex: (11) 99999-9999).",
				icon: "phone-outline",
				iconColor: colors.error,
				onConfirm: () => setShowModal(false),
				showCancel: false,
			});
			setShowModal(true);
			return;
		}
		try {
			setLoading(true);
			let fotoFinal = foto;
			if (foto && !foto.startsWith("https")) {
				fotoFinal = await uploadImagem(foto, user.uid);
			}
			await updateProfile(auth.currentUser, {
				displayName: nome,
				photoURL: fotoFinal,
			});
			await setDoc(
				doc(db, "users", user.uid),
				{
					nome, username, bio, cidade, telefone, cpf,
					instagram, facebook, x, spotify, tiktok, website,
					foto: fotoFinal, email: user.email,
					updatedAt: serverTimestamp(),
				},
				{ merge: true }
			);
			await refreshProfile();
			setModalConfig({
				title: "Sucesso!",
				message: "Seu perfil foi atualizado com sucesso.",
				icon: "check-circle",
				iconColor: colors.success,
				onConfirm: () => { setShowModal(false); navigation.goBack(); },
				showCancel: false,
			});
			setShowModal(true);
		} catch (error) {
			console.log(error);
			setModalConfig({
				title: "Erro",
				message: error.message || "Não foi possível atualizar seu perfil. Tente novamente.",
				icon: "alert-circle",
				iconColor: colors.error,
				onConfirm: () => setShowModal(false),
				showCancel: false,
			});
			setShowModal(true);
		} finally {
			setLoading(false);
		}
	}

	const renderInput = ({
		icon, label, value, onChangeText,
		multiline, keyboardType,
		autoCapitalize = "sentences", maxLength,
	}) => (
		<View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
			<View style={styles.inputIcon}>
				<MaterialCommunityIcons name={icon} size={19} color={colors.primary} />
			</View>
			<View style={styles.inputCopy}>
				<AppText style={styles.inputLabel}>{label}</AppText>
				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder={label}
					placeholderTextColor={colors.textMuted}
					style={[styles.input, multiline && styles.inputMultiline]}
					multiline={multiline}
					keyboardType={keyboardType}
					autoCapitalize={autoCapitalize}
					maxLength={maxLength}
					// Garante que o teclado não feche ao digitar
					blurOnSubmit={!multiline}
					returnKeyType={multiline ? "default" : "next"}
				/>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			{/* Header fixo */}
			<LinearGradient
				colors={[colors.backgroundSecondary, colors.surface]}
				style={[styles.headerCompact, { paddingTop: insets.top + 12 }]}
			>
				<View style={styles.headerTop}>
					<TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
						<MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
					</TouchableOpacity>
					<AppText style={styles.headerTitle}>Editar perfil</AppText>
					<TouchableOpacity
						style={[styles.headerBtn, loading && styles.disabled]}
						onPress={salvar}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator size="small" color={colors.primary} />
						) : (
							<MaterialCommunityIcons name="check" size={24} color={colors.primary} />
						)}
					</TouchableOpacity>
				</View>
			</LinearGradient>

			<KeyboardAwareScrollView
				style={styles.formScroll}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
				enableOnAndroid
				enableAutomaticScroll
				extraScrollHeight={Platform.OS === "ios" ? 24 : 92}
				extraHeight={Platform.OS === "ios" ? insets.top + 88 : 120}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + 34 },
				]}
			>
					{/* Preview do perfil */}
					<View style={styles.previewCard}>
						<View style={styles.avatarWrap}>
							<Image
								source={{ uri: foto || "https://i.pravatar.cc/200" }}
								style={styles.avatar}
							/>
							<TouchableOpacity onPress={escolherFoto} style={styles.camera}>
								<MaterialCommunityIcons name="camera" size={17} color={colors.onPrimary} />
							</TouchableOpacity>
						</View>
						<View style={styles.previewCopy}>
							<AppText style={styles.previewName} numberOfLines={1}>
								{nome || "Seu nome"}
							</AppText>
							<AppText style={styles.previewHandle} numberOfLines={1}>
								{username ? `@${username}` : user?.email || "@usuario"}
							</AppText>
							<AppText style={styles.previewBio} numberOfLines={2}>
								{bio || "Adicione uma bio para aparecer melhor na Area Social."}
							</AppText>
						</View>
					</View>

					<FormSection title="Perfil social" styles={styles}>
						{renderInput({ icon: "account-outline", label: "Nome", value: nome, onChangeText: setNome })}
						{renderInput({
							icon: "at", label: "Username", value: username,
							onChangeText: (text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_.]/g, "")),
							autoCapitalize: "none", maxLength: 30,
						})}
						{renderInput({ icon: "text-account", label: "Bio", value: bio, onChangeText: setBio, multiline: true })}
					</FormSection>

					<FormSection title="Informações" styles={styles}>
						{renderInput({ icon: "map-marker-outline", label: "Cidade", value: cidade, onChangeText: setCidade })}
						{renderInput({
							icon: "phone-outline", label: "Telefone", value: telefone,
							onChangeText: (text) => setTelefone(formatarTelefone(text)),
							keyboardType: "phone-pad", maxLength: 15,
						})}
						{renderInput({
							icon: "card-account-details-outline", label: "CPF", value: cpf,
							onChangeText: (text) => setCpf(formatarCPF(text)),
							keyboardType: "number-pad", maxLength: 14,
						})}
					</FormSection>

					<FormSection title="Links sociais" styles={styles}>
						{renderInput({ icon: "instagram", label: "Instagram", value: instagram, onChangeText: setInstagram, autoCapitalize: "none" })}
						{renderInput({ icon: "facebook", label: "Facebook", value: facebook, onChangeText: setFacebook, autoCapitalize: "none" })}
						{renderInput({ icon: "twitter", label: "X / Twitter", value: x, onChangeText: setX, autoCapitalize: "none" })}
						{renderInput({ icon: "spotify", label: "Spotify", value: spotify, onChangeText: setSpotify, autoCapitalize: "none" })}
						{renderInput({ icon: "music-note", label: "TikTok", value: tiktok, onChangeText: setTiktok, autoCapitalize: "none" })}
						{renderInput({ icon: "web", label: "Website", value: website, onChangeText: setWebsite, autoCapitalize: "none" })}
					</FormSection>

					<TouchableOpacity
						onPress={salvar}
						disabled={loading}
						activeOpacity={0.9}
						style={styles.saveBtn}
					>
						<LinearGradient
							colors={[colors.primary, colors.primaryDark]}
							style={styles.saveGradient}
						>
							{loading ? (
								<ActivityIndicator color={colors.onPrimary} />
							) : (
								<>
									<MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.onPrimary} />
									<AppText style={styles.saveText}>Salvar alterações</AppText>
								</>
							)}
						</LinearGradient>
					</TouchableOpacity>
			</KeyboardAwareScrollView>

			{/* Modal de feedback */}
			<Modal
				visible={showModal}
				transparent
				animationType="fade"
				statusBarTranslucent
				onRequestClose={() => setShowModal(false)}
			>
				<View style={styles.modalOverlay}>
					<Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowModal(false)} />
					<BlurView intensity={60} tint={blurTint} style={styles.modalCard}>
						<LinearGradient
							colors={[`${modalConfig.iconColor || colors.primary}1F`, "transparent"]}
							style={styles.modalGradient}
						>
							<View style={styles.modalIcon}>
								<MaterialCommunityIcons
									name={modalConfig.icon}
									size={34}
									color={modalConfig.iconColor}
								/>
							</View>
							<AppText style={styles.modalTitle}>{modalConfig.title}</AppText>
							<AppText style={styles.modalText}>{modalConfig.message}</AppText>
							<View style={styles.modalButtons}>
								{modalConfig.showCancel && (
									<TouchableOpacity
										activeOpacity={0.8}
										style={styles.cancelBtn}
										onPress={() => setShowModal(false)}
									>
										<AppText style={styles.cancelText}>Cancelar</AppText>
									</TouchableOpacity>
								)}
								<TouchableOpacity
									activeOpacity={0.85}
									style={styles.confirmBtn}
									onPress={modalConfig.onConfirm}
								>
									<LinearGradient
										colors={[modalConfig.iconColor || colors.primary, `${modalConfig.iconColor || colors.primary}DD`]}
										style={styles.confirmGradient}
									>
										<AppText style={styles.confirmText}>
											{modalConfig.showCancel ? "Confirmar" : "OK"}
										</AppText>
									</LinearGradient>
								</TouchableOpacity>
							</View>
						</LinearGradient>
					</BlurView>
				</View>
			</Modal>
		</View>
	);
}

function createPerfilEditarStyles(c) {
	return StyleSheet.create({
		container: { flex: 1, backgroundColor: c.background },
		formScroll: { flex: 1 },
		headerCompact: {
			paddingHorizontal: 18,
			paddingBottom: 12,
			borderBottomLeftRadius: 20,
			borderBottomRightRadius: 20,
			borderBottomWidth: 1,
			borderColor: c.divider,
		},
		headerTop: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		headerBtn: {
			width: 42, height: 42, borderRadius: 14,
			alignItems: "center", justifyContent: "center",
			backgroundColor: c.glass,
			borderWidth: 1, borderColor: c.glassBorder,
		},
		headerTitle: { color: c.textPrimary, fontSize: 20, fontWeight: "800" },
		disabled: { opacity: 0.55 },

		// Padding no content container preserva o calculo de scroll com teclado.
		scrollContent: {
			paddingHorizontal: 16,
			paddingTop: 18,
		},

		previewCard: {
			flexDirection: "row",
			alignItems: "center",
			padding: 14,
			borderRadius: 24,
			backgroundColor: c.glass,
			borderWidth: 1, borderColor: c.glassBorder,
			marginBottom: 18,
		},
		avatarWrap: { position: "relative" },
		avatar: {
			width: 82, height: 82, borderRadius: 41,
			borderWidth: 2, borderColor: c.primary,
			backgroundColor: c.card,
		},
		camera: {
			position: "absolute", right: -2, bottom: 0,
			width: 32, height: 32, borderRadius: 16,
			alignItems: "center", justifyContent: "center",
			backgroundColor: c.primary,
			borderWidth: 2, borderColor: c.surface,
		},
		previewCopy: { flex: 1, marginLeft: 14 },
		previewName: { color: c.textPrimary, fontSize: 19, fontWeight: "800" },
		previewHandle: { color: c.primaryLight, fontSize: 13, marginTop: 2, fontWeight: "700" },
		previewBio: { color: c.textMuted, fontSize: 12, lineHeight: 17, marginTop: 8 },

		section: { marginBottom: 18 },
		sectionTitle: {
			color: c.textMuted, fontSize: 12, fontWeight: "800",
			textTransform: "uppercase", marginBottom: 10, marginLeft: 4,
		},
		sectionCard: {
			borderRadius: 24, overflow: "hidden",
			backgroundColor: c.surface,
			borderWidth: 1, borderColor: c.border,
		},
		inputRow: {
			flexDirection: "row",
			alignItems: "center",
			minHeight: 70,
			paddingHorizontal: 14,
			paddingVertical: 10,
			borderBottomWidth: 1,
			borderBottomColor: c.divider,
		},
		inputRowMultiline: { alignItems: "flex-start" },
		inputIcon: {
			width: 42, height: 42, borderRadius: 15,
			alignItems: "center", justifyContent: "center",
			backgroundColor: c.primarySoft,
			marginRight: 12,
		},
		inputCopy: { flex: 1 },
		inputLabel: { color: c.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 3 },
		input: { color: c.textPrimary, fontSize: 15, paddingVertical: 2 },
		inputMultiline: {
			minHeight: 70, textAlignVertical: "top",
			lineHeight: 20, paddingTop: 2,
		},

		saveBtn: { borderRadius: 20, overflow: "hidden", marginTop: 2, marginBottom: 10 },
		saveGradient: {
			height: 56, flexDirection: "row",
			alignItems: "center", justifyContent: "center", gap: 9,
		},
		saveText: { color: c.onPrimary, fontSize: 16, fontWeight: "800" },

		modalOverlay: {
			flex: 1,
			backgroundColor: c.overlayStronger,
			justifyContent: "center",
			alignItems: "center",
			paddingHorizontal: 24,
		},
		modalCard: {
			width: "100%", borderRadius: 28, overflow: "hidden",
			borderWidth: 1, borderColor: c.glassBorder,
		},
		modalGradient: { padding: 24, alignItems: "center" },
		modalIcon: {
			width: 72, height: 72, borderRadius: 24,
			backgroundColor: "rgba(255,255,255,0.1)",
			justifyContent: "center", alignItems: "center",
			marginBottom: 16,
		},
		modalTitle: { color: c.textPrimary, fontSize: 22, fontWeight: "bold" },
		modalText: {
			color: c.textSecondary, textAlign: "center",
			marginTop: 10, fontSize: 14, lineHeight: 22, paddingHorizontal: 12,
		},
		modalButtons: { flexDirection: "row", marginTop: 24, width: "100%", gap: 12 },
		cancelBtn: {
			flex: 1, height: 50, borderRadius: 16,
			backgroundColor: c.glass,
			justifyContent: "center", alignItems: "center",
			borderWidth: 1, borderColor: c.glassBorder,
		},
		cancelText: { color: c.textPrimary, fontWeight: "600", fontSize: 14 },
		confirmBtn: { flex: 1, height: 50, borderRadius: 16, overflow: "hidden" },
		confirmGradient: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" },
		confirmText: { color: c.onPrimary, fontWeight: "bold", fontSize: 14 },
	});
}
