import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import AppText from "../components/AppText";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebaseConfig";
import { uploadImagem } from "../services/uploadService";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

export default function PerfilEditar({ navigation }) {
	const insets = useSafeAreaInsets();
	const { user, nome: nomeContext, foto: fotoContext, refreshProfile } = useAuth();
	const { colors } = useTheme();
	const styles = useThemedStyles(createPerfilEditarStyles);

	const Section = ({ title, children }) => (
		<View style={styles.section}>
			<AppText style={styles.sectionTitle}>{title}</AppText>
			<View style={styles.sectionCard}>{children}</View>
		</View>
	);

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

	useEffect(() => {
		async function carregar() {
			try {
				const ref = doc(db, "users", user.uid);
				const snap = await getDoc(ref);

				if (snap.exists()) {
					const data = snap.data();
					setTelefone(data.telefone || "");
					setCpf(data.cpf || "");
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
			Alert.alert("Permissão necessária");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.5,
			allowsEditing: true,
			aspect: [1, 1],
		});

		if (!result.canceled) {
			setFoto(result.assets[0].uri);
		}
	}

	async function salvar() {
		if (!nome.trim()) {
			Alert.alert("Informe seu nome");
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
					nome,
					username,
					bio,
					cidade,
					telefone,
					cpf,
					instagram,
					facebook,
					x,
					spotify,
					tiktok,
					website,
					foto: fotoFinal,
					email: user.email,
					updatedAt: serverTimestamp(),
				},
				{ merge: true }
			);

			await refreshProfile();
			Alert.alert("Sucesso", "Perfil atualizado!");
			navigation.goBack();
		} catch (error) {
			console.log(error);
			Alert.alert("Erro", error.message);
		} finally {
			setLoading(false);
		}
	}

	const renderInput = ({
		icon,
		label,
		value,
		onChangeText,
		multiline,
		keyboardType,
		autoCapitalize = "sentences",
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
				/>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={[colors.backgroundSecondary, colors.surface, colors.background]}
				style={[styles.header, { paddingTop: insets.top + 12 }]}
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
			</LinearGradient>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom + 34 }}
			>
				<View style={styles.content}>
					<Section title="Perfil social">
						{renderInput({
							icon: "account-outline",
							label: "Nome",
							value: nome,
							onChangeText: setNome,
						})}
						{renderInput({
							icon: "at",
							label: "Username",
							value: username,
							onChangeText: setUsername,
							autoCapitalize: "none",
						})}
						{renderInput({
							icon: "text-account",
							label: "Bio",
							value: bio,
							onChangeText: setBio,
							multiline: true,
						})}
					</Section>

					<Section title="Informações">
						{renderInput({
							icon: "map-marker-outline",
							label: "Cidade",
							value: cidade,
							onChangeText: setCidade,
						})}
						{renderInput({
							icon: "phone-outline",
							label: "Telefone",
							value: telefone,
							onChangeText: setTelefone,
							keyboardType: "phone-pad",
						})}
						{renderInput({
							icon: "card-account-details-outline",
							label: "CPF",
							value: cpf,
							onChangeText: setCpf,
							keyboardType: "number-pad",
						})}
					</Section>

					<Section title="Links sociais">
						{renderInput({
							icon: "instagram",
							label: "Instagram",
							value: instagram,
							onChangeText: setInstagram,
							autoCapitalize: "none",
						})}
						{renderInput({
							icon: "facebook",
							label: "Facebook",
							value: facebook,
							onChangeText: setFacebook,
							autoCapitalize: "none",
						})}
						{renderInput({
							icon: "twitter",
							label: "X / Twitter",
							value: x,
							onChangeText: setX,
							autoCapitalize: "none",
						})}
						{renderInput({
							icon: "spotify",
							label: "Spotify",
							value: spotify,
							onChangeText: setSpotify,
							autoCapitalize: "none",
						})}
						{renderInput({
							icon: "music-note",
							label: "TikTok",
							value: tiktok,
							onChangeText: setTiktok,
							autoCapitalize: "none",
						})}
						{renderInput({
							icon: "web",
							label: "Website",
							value: website,
							onChangeText: setWebsite,
							autoCapitalize: "none",
						})}
					</Section>

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
				</View>
			</ScrollView>
		</View>
	);
}

function createPerfilEditarStyles(c) {
	return StyleSheet.create({
	container: { flex: 1, backgroundColor: c.background },
	header: {
		paddingHorizontal: 18,
		paddingBottom: 18,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
	},
	headerTop: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	headerBtn: {
		width: 42,
		height: 42,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: c.glass,
		borderWidth: 1,
		borderColor: c.glassBorder,
	},
	headerTitle: { color: c.textPrimary, fontSize: 20, fontWeight: "800" },
	disabled: { opacity: 0.55 },
	previewCard: {
		flexDirection: "row",
		alignItems: "center",
		padding: 14,
		borderRadius: 24,
		backgroundColor: c.glass,
		borderWidth: 1,
		borderColor: c.glassBorder,
	},
	avatarWrap: { position: "relative" },
	avatar: {
		width: 82,
		height: 82,
		borderRadius: 41,
		borderWidth: 2,
		borderColor: c.primary,
		backgroundColor: c.card,
	},
	camera: {
		position: "absolute",
		right: -2,
		bottom: 0,
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: c.primary,
		borderWidth: 2,
		borderColor: c.surface,
	},
	previewCopy: { flex: 1, marginLeft: 14 },
	previewName: { color: c.textPrimary, fontSize: 19, fontWeight: "800" },
	previewHandle: { color: c.primaryLight, fontSize: 13, marginTop: 2, fontWeight: "700" },
	previewBio: { color: c.textMuted, fontSize: 12, lineHeight: 17, marginTop: 8 },
	content: { paddingHorizontal: 16, paddingTop: 18 },
	section: { marginBottom: 18 },
	sectionTitle: {
		color: c.textMuted,
		fontSize: 12,
		fontWeight: "800",
		textTransform: "uppercase",
		marginBottom: 10,
		marginLeft: 4,
	},
	sectionCard: {
		borderRadius: 24,
		overflow: "hidden",
		backgroundColor: c.surface,
		borderWidth: 1,
		borderColor: c.border,
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
		width: 42,
		height: 42,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: c.primarySoft,
		marginRight: 12,
	},
	inputCopy: { flex: 1 },
	inputLabel: { color: c.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 3 },
	input: {
		color: c.textPrimary,
		fontSize: 15,
		paddingVertical: 2,
	},
	inputMultiline: {
		minHeight: 70,
		textAlignVertical: "top",
		lineHeight: 20,
		paddingTop: 2,
	},
	saveBtn: {
		borderRadius: 20,
		overflow: "hidden",
		marginTop: 2,
		marginBottom: 10,
	},
	saveGradient: {
		height: 56,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 9,
	},
	saveText: { color: c.onPrimary, fontSize: 16, fontWeight: "800" },
});
}
