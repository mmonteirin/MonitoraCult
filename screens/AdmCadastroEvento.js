import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Image,
	ScrollView,
	Modal,
	ActivityIndicator,
	StyleSheet,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { db, auth } from "../firebaseConfig";



import { useAuth } from "../context/AuthContext";

import { uploadImagem } from "../services/uploadService";

import { geocodeAddress } from "../services/geocodingService";

import { Colors } from "../styles/Colors";

import { BlurView } from "expo-blur";

import ConfirmModal from "../components/ConfirmModal";

/* 🔥 MASKS */
const maskCEP = (t) =>
	t
		.replace(/\D/g, "")
		.replace(/^(\d{5})(\d)/, "$1-$2")
		.slice(0, 9);

const maskData = (t) =>
	t
		.replace(/\D/g, "")
		.replace(/^(\d{2})(\d)/, "$1/$2")
		.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
		.slice(0, 10);

const maskHora = (t) =>
	t
		.replace(/\D/g, "")
		.replace(/^(\d{2})(\d)/, "$1:$2")
		.slice(0, 5);

const parseMoney = (value) => {
	if (value == null) return 0;

	const normalized = String(value)
		.replace(/\./g, "")
		.replace(",", ".")
		.replace(/[^\d.]/g, "");

	return Number(normalized) || 0;
};

const parseInteger = (value) =>
	Number(String(value || "").replace(/\D/g, "")) || 0;

/* 🔥 SELECT */
const SelectModal = ({ label, value, options, onSelect }) => {
	const [visible, setVisible] = useState(false);

	return (
		<>
			<Text style={styles.label}>{label}</Text>

			<TouchableOpacity onPress={() => setVisible(true)} style={styles.select}>
				<Text
					style={{
						color: value ? Colors.textPrimary : Colors.textMuted,
					}}
				>
					{value || "Selecione..."}
				</Text>

				<MaterialCommunityIcons
					name="chevron-down"
					size={22}
					color={Colors.primary}
				/>
			</TouchableOpacity>

			<Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
				<View style={styles.selectOverlay}>
					<BlurView intensity={50} tint="dark" style={styles.selectCard}>
						<LinearGradient
							colors={["rgba(108,92,231,0.15)", "rgba(49,46,129,0.05)"]}
							style={styles.selectBox}
						>
							<Text style={styles.selectTitle}>{label}</Text>
							{options.map((item) => {
								const ativo = value === item;

								return (
									<TouchableOpacity
										key={item}
										onPress={() => {
											onSelect(item);
											setVisible(false);
										}}
										style={[
											styles.selectItem,
											ativo && { backgroundColor: "rgba(108,92,231,0.18)" }
										]}
									>
										<Text
											style={{
												color: ativo ? Colors.primaryLight : Colors.textPrimary,
												fontWeight: ativo ? "bold" : "normal",
												fontSize: 15,
											}}
										>
											{item}
										</Text>
										{ativo && (
											<MaterialCommunityIcons
												name="check"
												size={20}
												color={Colors.primaryLight}
											/>
										)}
									</TouchableOpacity>
								);
							})}

							<TouchableOpacity
								style={styles.selectCancelBtn}
								onPress={() => setVisible(false)}
							>
								<Text style={styles.selectCancelText}>
									Cancelar
								</Text>
							</TouchableOpacity>
						</LinearGradient>
					</BlurView>
				</View>
			</Modal>
		</>
	);
};

/* 📅 VALIDA DATA */
const isDataValida = (data) => {
	if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
		return false;
	}

	const [dia, mes, ano] = data.split("/").map(Number);

	const date = new Date(ano, mes - 1, dia);

	return (
		date.getFullYear() === ano &&
		date.getMonth() === mes - 1 &&
		date.getDate() === dia
	);
};

/* ⏰ VALIDA HORA */
const isHoraValida = (hora) => {
	if (!/^\d{2}:\d{2}$/.test(hora)) {
		return false;
	}

	const [h, m] = hora.split(":").map(Number);

	return h >= 0 && h <= 23 && m >= 0 && m <= 59;
};

/* 🕒 DATA/HORA FUTURA */
const criarDataHora = (data, hora) => {
	const [dia, mes, ano] = data.split("/").map(Number);

	const [h, m] = hora.split(":").map(Number);

	return new Date(ano, mes - 1, dia, h, m);
};

export default function AdmCadastroEvento({ navigation }) {
	const [form, setForm] = useState({});

	const { user, profile } = useAuth();

	const [imagem, setImagem] = useState(null);

	const [loading, setLoading] = useState(false);

	const [uploadProgress, setUploadProgress] = useState(0);

	const [modal, setModal] = useState({
		visible: false,
		title: "",
		message: "",
		type: "info",
	});

	const setField = (key, value) =>
		setForm((prev) => ({
			...prev,
			[key]: value,
		}));

	/* 📸 PICK IMAGE */
	const pickImage = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			setModal({
				visible: true,
				title: "Permissão necessária",
				message: "Permita acesso à galeria.",
				type: "error",
			});

			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			quality: 0.5,
			allowsEditing: true,
			aspect: [16, 9],
		});

		if (!result.canceled) {
			setImagem(result.assets[0].uri);
		}
	};

	/* 🔍 CEP */
	const buscarCEP = async () => {
		const cep = form.cep?.replace(/\D/g, "");

		if (!cep || cep.length !== 8) {
			setModal({
				visible: true,
				title: "CEP inválido",
				message: "Digite um CEP válido.",
				type: "error",
			});

			return;
		}

		try {
			const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

			const data = await res.json();

			if (data.erro) {
				setModal({
					visible: true,
					title: "CEP não encontrado",
					message: "Não foi possível localizar este CEP.",
					type: "error",
				});

				return;
			}

			setForm((prev) => ({
				...prev,

				rua: data.logradouro || "",

				bairro: data.bairro || "",

				cidade: data.localidade || "",

				uf: data.uf || "",

				localEvento: data.logradouro || "",
			}));
		} catch {
			setModal({
				visible: true,
				title: "Erro",
				message: "Erro ao buscar CEP.",
				type: "error",
			});
		}
	};

	/* 🚀 SUBMIT */
	const handleSubmit = async () => {
		if (!form.tituloEvento) {
			setModal({
				visible: true,
				title: "Campo obrigatório",
				message: "Preencha o nome do evento.",
				type: "error",
			});

			return;
		}

		/* 📅 DATA */
		if (!isDataValida(form.dataEvento || "")) {
			setModal({
				visible: true,
				title: "Data inválida",
				message: "Digite a data completa no formato DD/MM/AAAA.",
				type: "error",
			});

			return;
		}

		/* ⏰ HORA INÍCIO */
		if (!isHoraValida(form.horaInicio || "")) {
			setModal({
				visible: true,
				title: "Hora inválida",
				message: "Digite a hora inicial completa no formato HH:MM.",
				type: "error",
			});

			return;
		}

		/* ⏰ HORA FIM */
		if (!isHoraValida(form.horaFim || "")) {
			setModal({
				visible: true,
				title: "Hora inválida",
				message: "Digite a hora final completa no formato HH:MM.",
				type: "error",
			});

			return;
		}

		/* 🕒 DATAS */
		const inicioEvento = criarDataHora(form.dataEvento, form.horaInicio);

		const fimEvento = criarDataHora(form.dataEvento, form.horaFim);

		const agora = new Date();

		/* 🚫 EVENTO PASSADO */
		if (inicioEvento < agora) {
			setModal({
				visible: true,
				title: "Horário inválido",
				message: "O evento não pode começar em uma data/hora passada.",
				type: "error",
			});

			return;
		}

		/* 🚫 FIM MENOR QUE INÍCIO */
		if (fimEvento <= inicioEvento) {
			setModal({
				visible: true,
				title: "Horário inválido",
				message: "A hora final deve ser maior que a hora inicial.",
				type: "error",
			});

			return;
		}

		const tipoEvento = form.tipoEvento || "gratuito";
		const gratuito = tipoEvento === "gratuito";
		const precoInteira = gratuito ? 0 : parseMoney(form.precoInteira);
		const capacidade = parseInteger(form.capacidade);

		if (capacidade <= 0) {
			setModal({
				visible: true,
				title: "Capacidade obrigatória",
				message: "Informe a quantidade de ingressos disponíveis.",
				type: "error",
			});

			return;
		}

		if (!gratuito && precoInteira <= 0) {
			setModal({
				visible: true,
				title: "Preço obrigatório",
				message: "Informe o valor do ingresso inteiro para eventos pagos.",
				type: "error",
			});

			return;
		}

		try {
			setLoading(true);

			let imageUrl = "";

			if (imagem) {
				imageUrl = await uploadImagem(imagem, user?.uid, (p) =>
					setUploadProgress(p)
				);
			}

			const endereco = form.localEvento || form.rua;

			let coords = null;

			if (endereco) {
				coords = await geocodeAddress(endereco);
			}

			const dataEventoTimestamp = criarDataHora(
				form.dataEvento,
				form.horaInicio
			);

			await addDoc(collection(db, "eventos"), {
				tituloEvento: form.tituloEvento,

				descricao: form.descricao || "",

				imagemEvento: imageUrl,

				dataEvento: form.dataEvento || "",

				dataEventoTimestamp,

				horaInicio: form.horaInicio || "",

				horaFim: form.horaFim || "",

				localEvento: endereco || "",

				categoria: form.categoria || "",

				tipoEvento,

				gratuito,

				precoInteira,

				preco: precoInteira,

				capacidade,

				ingressosVendidos: 0,

				ingressosAtivos: true,

				cep: form.cep || "",

				bairro: form.bairro || "",

				cidade: form.cidade || "",

				uf: form.uf || "",

				latitude: coords?.latitude || null,

				longitude: coords?.longitude || null,

				status: "ativo",

				likes: 0,
				comentarios: 0,

				uidEvento: user?.uid || "",

				/* 👤 ORGANIZADOR */
				organizador: {
					uid: user?.uid || "",

					nome: profile?.nome || user?.displayName || "Usuário",

					foto: profile?.foto || user?.photoURL || "https://i.pravatar.cc/150",

					email: user?.email || "",

					role: profile?.role || "user",
				},

				createdAt: serverTimestamp(),
			});

			setModal({
				visible: true,
				title: "Evento criado",
				message: "Seu evento foi publicado com sucesso.",
				type: "success",
			});
		} catch (e) {
			setModal({
				visible: true,
				title: "Erro",
				message: e.message || "Erro ao salvar evento.",
				type: "error",
			});
		} finally {
			setLoading(false);

			setUploadProgress(0);
		}
	};

	return (
		<View style={styles.container}>
			{/* HEADER */}
			<LinearGradient
				colors={[Colors.background, Colors.surface]}
				style={styles.header}
			>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<MaterialCommunityIcons
						name="arrow-left"
						size={26}
						color={Colors.primary}
					/>
				</TouchableOpacity>

				<Text style={styles.title}>Criar Evento</Text>
			</LinearGradient>

			<ScrollView
				contentContainerStyle={{
					padding: 20,
					paddingBottom: 120,
				}}
			>
				{/* IMAGE */}
				<TouchableOpacity onPress={pickImage}>
					{imagem ? (
						<Image
							source={{
								uri: imagem,
							}}
							style={styles.image}
						/>
					) : (
						<View style={styles.imagePlaceholder}>
							<MaterialCommunityIcons
								name="image-plus"
								size={42}
								color={Colors.primary}
							/>

							<Text
								style={{
									color: Colors.textSecondary,

									marginTop: 8,
								}}
							>
								Adicionar imagem
							</Text>
						</View>
					)}
				</TouchableOpacity>

				{/* SELECTS */}
				<View
					style={{
						marginTop: 16,
					}}
				>
					<SelectModal
						label="Categoria"
						value={form.categoria}
						options={["Shows", "Cinema", "Teatro", "Arte", "Música"]}
						onSelect={(v) => setField("categoria", v)}
					/>

					<View
						style={{
							marginTop: 14,
						}}
					>
						<SelectModal
							label="Tipo"
							value={form.tipoEvento || "gratuito"}
							options={["gratuito", "pago"]}
							onSelect={(v) =>
								setForm((prev) => ({
									...prev,
									tipoEvento: v,
									precoInteira:
										v === "gratuito"
											? "0"
											: prev.precoInteira,
								}))
							}
						/>
					</View>
				</View>

				{/* INPUTS */}
				<TextInput
					placeholder="Nome do evento"
					placeholderTextColor={Colors.textMuted}
					value={form.tituloEvento || ""}
					onChangeText={(v) => setField("tituloEvento", v)}
					style={styles.input}
				/>

				<TextInput
					placeholder="Descrição"
					placeholderTextColor={Colors.textMuted}
					multiline
					value={form.descricao || ""}
					onChangeText={(v) => setField("descricao", v)}
					style={[
						styles.input,
						{
							height: 110,
							textAlignVertical: "top",
						},
					]}
				/>

				<TextInput
					placeholder="Data"
					placeholderTextColor={Colors.textMuted}
					keyboardType="numeric"
					value={form.dataEvento || ""}
					onChangeText={(v) => setField("dataEvento", maskData(v))}
					style={styles.input}
				/>

				<View
					style={{
						flexDirection: "row",
						gap: 10,
					}}
				>
					<TextInput
						placeholder="Início"
						placeholderTextColor={Colors.textMuted}
						keyboardType="numeric"
						value={form.horaInicio || ""}
						onChangeText={(v) => setField("horaInicio", maskHora(v))}
						style={[styles.input, { flex: 1 }]}
					/>

					<TextInput
						placeholder="Fim"
						placeholderTextColor={Colors.textMuted}
						keyboardType="numeric"
						value={form.horaFim || ""}
						onChangeText={(v) => setField("horaFim", maskHora(v))}
						style={[styles.input, { flex: 1 }]}
					/>
				</View>

				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
					}}
				>
					<TextInput
						placeholder="CEP"
						placeholderTextColor={Colors.textMuted}
						keyboardType="numeric"
						value={form.cep || ""}
						onChangeText={(v) => setField("cep", maskCEP(v))}
						style={[
							styles.input,
							{
								flex: 1,
								marginRight: 10,
							},
						]}
					/>

					<TouchableOpacity onPress={buscarCEP} style={styles.btnCep}>
						<MaterialCommunityIcons name="magnify" size={22} color="#FFF" />
					</TouchableOpacity>
				</View>

				<TextInput
					placeholder="Rua / Local"
					placeholderTextColor={Colors.textMuted}
					value={form.localEvento || ""}
					onChangeText={(v) => setField("localEvento", v)}
					style={styles.input}
				/>

				<TextInput
					placeholder="Quantidade de ingressos disponíveis"
					placeholderTextColor={Colors.textMuted}
					keyboardType="numeric"
					value={form.capacidade || ""}
					onChangeText={(v) => setField("capacidade", v.replace(/\D/g, ""))}
					style={styles.input}
				/>

				{form.tipoEvento === "pago" ? (
					<TextInput
						placeholder="Valor do ingresso inteiro (R$)"
						placeholderTextColor={Colors.textMuted}
						keyboardType="decimal-pad"
						value={form.precoInteira || ""}
						onChangeText={(v) => setField("precoInteira", v)}
						style={styles.input}
					/>
				) : (
					<View style={styles.freeTicketBox}>
						<MaterialCommunityIcons
							name="ticket-confirmation"
							size={20}
							color={Colors.success}
						/>

						<Text style={styles.freeTicketText}>
							Evento gratuito: o público poderá reservar ingresso sem cobrança.
						</Text>
					</View>
				)}

				{/* UPLOAD */}
				{loading && uploadProgress > 0 && (
					<Text style={styles.uploadText}>
						Upload: {Math.round(uploadProgress * 100)}%
					</Text>
				)}

				{/* BUTTON */}
				<TouchableOpacity
					disabled={loading}
					onPress={handleSubmit}
					activeOpacity={0.85}
				>
					<LinearGradient colors={["#7C3AED", "#5B21B6"]} style={styles.button}>
						{loading ? (
							<ActivityIndicator color="#FFF" />
						) : (
							<>
								<MaterialCommunityIcons name="check" size={20} color="#FFF" />

								<Text style={styles.buttonText}>Criar Evento</Text>
							</>
						)}
					</LinearGradient>
				</TouchableOpacity>
			</ScrollView>

			{/* MODAL */}
			<ConfirmModal
				visible={modal.visible}
				title={modal.title}
				message={modal.message}
				type={modal.type}
				confirmText="OK"
				onConfirm={() => {
					setModal({
						...modal,
						visible: false,
					});

					if (modal.type === "success") {
						navigation.goBack();
					}
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,

		backgroundColor: Colors.background,
	},

	header: {
		paddingTop: 55,

		paddingHorizontal: 20,

		paddingBottom: 22,

		borderBottomLeftRadius: 28,

		borderBottomRightRadius: 28,
	},

	title: {
		color: Colors.textPrimary,

		fontSize: 28,

		fontWeight: "bold",

		marginTop: 14,
	},

	image: {
		height: 220,

		borderRadius: 24,
	},

	imagePlaceholder: {
		height: 220,

		borderRadius: 24,

		backgroundColor: Colors.surface,

		justifyContent: "center",

		alignItems: "center",

		borderWidth: 1,

		borderColor: "rgba(255,255,255,0.06)",
	},

	label: {
		color: Colors.textPrimary,

		marginBottom: 8,
	},

	select: {
		backgroundColor: Colors.surface,

		padding: 16,

		borderRadius: 18,

		borderWidth: 1,

		borderColor: "rgba(255,255,255,0.06)",

		flexDirection: "row",

		justifyContent: "space-between",
	},

	input: {
		backgroundColor: Colors.surface,

		color: Colors.textPrimary,

		padding: 16,

		borderRadius: 18,

		marginTop: 14,

		borderWidth: 1,

		borderColor: "rgba(255,255,255,0.05)",
	},

	freeTicketBox: {
		marginTop: 14,
		padding: 14,
		borderRadius: 18,
		backgroundColor: "rgba(34,197,94,0.12)",
		borderWidth: 1,
		borderColor: "rgba(34,197,94,0.28)",
		flexDirection: "row",
		alignItems: "center",
	},

	freeTicketText: {
		flex: 1,
		color: Colors.textSecondary,
		fontSize: 13,
		lineHeight: 18,
		marginLeft: 10,
	},

	btnCep: {
		width: 56,
		height: 56,

		borderRadius: 18,

		backgroundColor: Colors.primary,

		justifyContent: "center",

		alignItems: "center",

		marginTop: 14,
	},

	button: {
		height: 58,

		borderRadius: 20,

		marginTop: 24,

		flexDirection: "row",

		justifyContent: "center",

		alignItems: "center",

		gap: 10,
	},

	buttonText: {
		color: "#FFF",

		fontWeight: "bold",

		fontSize: 16,
	},

	uploadText: {
		color: Colors.textSecondary,

		textAlign: "center",

		marginTop: 14,
	},

	/* SELECT */
	selectOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.65)",
		justifyContent: "center",
		paddingHorizontal: 24,
	},

	selectCard: {
		width: "100%",
		borderRadius: 30,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},

	selectBox: {
		padding: 24,
	},

	selectTitle: {
		color: "#FFF",
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 18,
		textAlign: "center",
	},

	selectItem: {
		padding: 16,
		borderRadius: 14,
		marginBottom: 8,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	selectCancelBtn: {
		marginTop: 18,
		height: 52,
		borderRadius: 18,
		backgroundColor: "rgba(255,255,255,0.06)",
		justifyContent: "center",
		alignItems: "center",
	},

	selectCancelText: {
		color: "#FFF",
		fontSize: 15,
		fontWeight: "600",
	},
});
