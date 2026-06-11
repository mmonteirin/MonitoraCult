import React, { useEffect, useState } from "react";

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
	StatusBar,
	KeyboardAvoidingView,
	Platform,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as ImagePicker from "expo-image-picker";

import {
	collection,
	addDoc,
	updateDoc,
	serverTimestamp,
	doc,
	Timestamp,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { uploadImagem } from "../services/uploadService";
import { geocodeAddress } from "../services/geocodingService";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import ConfirmModal from "../components/ConfirmModal";

/* =========================
   MASKS
========================= */

const maskCEP = (t = "") =>
	t
		.replace(/\D/g, "")
		.replace(/^(\d{5})(\d)/, "$1-$2")
		.slice(0, 9);

const maskData = (t = "") =>
	t
		.replace(/\D/g, "")
		.replace(/^(\d{2})(\d)/, "$1/$2")
		.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
		.slice(0, 10);

const maskHora = (t = "") =>
	t
		.replace(/\D/g, "")
		.replace(/^(\d{2})(\d)/, "$1:$2")
		.slice(0, 5);

/* =========================
   VALIDATIONS
========================= */

const isDataValida = (data) => {
	if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return false;

	const [dia, mes, ano] = data.split("/").map(Number);

	const d = new Date(ano, mes - 1, dia);

	return (
		d.getFullYear() === ano &&
		d.getMonth() === mes - 1 &&
		d.getDate() === dia
	);
};

const isHoraValida = (hora) => {
	if (!/^\d{2}:\d{2}$/.test(hora)) return false;

	const [h, m] = hora.split(":").map(Number);

	return h >= 0 && h <= 23 && m >= 0 && m <= 59;
};

const criarDataHora = (data, hora) => {
	const [dia, mes, ano] = data.split("/").map(Number);
	const [h, m] = hora.split(":").map(Number);

	return new Date(ano, mes - 1, dia, h, m);
};

const toDateFromFirestore = (valor) => {
	if (!valor) return null;
	if (typeof valor?.toDate === "function") return valor.toDate();
	if (valor instanceof Date) return valor;
	return null;
};

const normalizarCampoData = (valor) => {
	if (!valor) return "";
	if (typeof valor === "string") {
		if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return valor;
		const match = valor.match(/(\d{2}\/\d{2}\/\d{4})/);
		return match ? match[1] : "";
	}
	const date = toDateFromFirestore(valor);
	if (!date || Number.isNaN(date.getTime())) return "";
	const dia = String(date.getDate()).padStart(2, "0");
	const mes = String(date.getMonth() + 1).padStart(2, "0");
	const ano = date.getFullYear();
	return `${dia}/${mes}/${ano}`;
};

const normalizarCampoHora = (valor) => {
	if (!valor) return "";
	if (typeof valor === "string") {
		if (/^\d{2}:\d{2}$/.test(valor)) return valor;
		const match = valor.match(/(\d{2}:\d{2})/);
		return match ? match[1] : "";
	}
	const date = toDateFromFirestore(valor);
	if (!date || Number.isNaN(date.getTime())) return "";
	return `${String(date.getHours()).padStart(2, "0")}:${String(
		date.getMinutes()
	).padStart(2, "0")}`;
};

const montarDataEvento = (dataInicio, horaInicio) => {
	if (!dataInicio) return "";
	return horaInicio
		? `${dataInicio} · ${horaInicio}`
		: dataInicio;
};

const eventoParaFormulario = (evento) => {
	const dataDeTimestamp = normalizarCampoData(
		evento?.dataEventoTimestamp
	);
	const horaDeTimestamp = normalizarCampoHora(
		evento?.dataEventoTimestamp
	);

	const dataInicio =
		normalizarCampoData(evento?.dataInicio) ||
		dataDeTimestamp ||
		normalizarCampoData(evento?.dataEvento);

	const dataFim =
		normalizarCampoData(evento?.dataFim) ||
		dataInicio;

	const horaInicio =
		normalizarCampoHora(evento?.horaInicio) ||
		horaDeTimestamp;

	const horaFim =
		normalizarCampoHora(evento?.horaFim) ||
		horaInicio;

	const cepBruto = String(evento?.cep || "").replace(/\D/g, "");

	return {
		tipoEvento: evento?.tipoEvento || "gratuito",
		classificacao: evento?.classificacao || "Livre",
		categoriaEvento: evento?.categoriaEvento || "cultural",
		tituloEvento: evento?.tituloEvento || "",
		descricao: evento?.descricao || "",
		categoria: evento?.categoria || "",
		dataInicio,
		dataFim,
		horaInicio,
		horaFim,
		localEvento: evento?.localEvento || "",
		cep: cepBruto ? maskCEP(cepBruto) : "",
		bairro: evento?.bairro || "",
		cidade: evento?.cidade || "",
		uf: evento?.uf || "",
		atracoes: evento?.atracoes || "",
		capacidade: evento?.capacidade?.toString() || "",
		precoIngresso: evento?.precoIngresso?.toString() || "",
		linkIngresso: evento?.linkIngresso || "",
	};
};

/* =========================
   SELECT MODAL
========================= */

const SelectModal = ({
	label,
	value,
	options,
	onSelect,
}) => {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const blurTint = isDark ? "dark" : "light";
	const [visible, setVisible] = useState(false);

	return (
		<>
			<Text style={styles.inputLabel}>
				{label}
			</Text>

			<TouchableOpacity
				style={styles.select}
				onPress={() => setVisible(true)}
				activeOpacity={0.8}
			>
				<Text
					style={{
						color: value
							? "#FFF"
							: colors.textMuted ||
							  "#64748B",
						fontSize: 15,
					}}
				>
					{value || "Selecione"}
				</Text>

				<MaterialCommunityIcons
					name="chevron-down"
					size={22}
					color={
						colors.primary || "#7C3AED"
					}
				/>
			</TouchableOpacity>

			<Modal
				visible={visible}
				transparent
				animationType="fade"
			>
				<View style={styles.selectOverlay}>
					<BlurView
						intensity={35}
						tint={blurTint}
						style={StyleSheet.absoluteFill}
					/>

					<View style={styles.selectBox}>
						<Text style={styles.selectTitle}>
							Selecione uma opção
						</Text>

						{options.map((item) => {
							const active =
								value === item;

							return (
								<TouchableOpacity
									key={item}
									style={[
										styles.selectItem,
										active &&
											styles.selectItemActive,
									]}
									onPress={() => {
										onSelect(item);
										setVisible(false);
									}}
								>
									<Text
										style={{
											color: "#FFF",
											fontWeight:
												active
													? "700"
													: "500",
										}}
									>
										{item}
									</Text>

									{active && (
										<MaterialCommunityIcons
											name="check"
											size={18}
											color="#FFF"
										/>
									)}
								</TouchableOpacity>
							);
						})}

						<TouchableOpacity
							style={
								styles.selectCancelBtn
							}
							onPress={() =>
								setVisible(false)
							}
						>
							<Text
								style={
									styles.selectCancelText
								}
							>
								Cancelar
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</>
	);
};

/* =========================
   SCREEN
========================= */

export default function AdmCadastroEvento({
	navigation,
	route,
}) {
	const { colors, isDark } = useTheme();
	const styles = useThemedStyles(createThemedScreenStyles);
	const blurTint = isDark ? "dark" : "light";
	const insets = useSafeAreaInsets();

	const { user, profile } = useAuth();

	const eventoEditando =
		route?.params?.evento || null;

	const eventoDocId =
		eventoEditando?.id ||
		route?.params?.eventoId ||
		null;

	const isEditing =
		Boolean(route?.params?.isEditing && eventoDocId);

	const [form, setForm] = useState({
		tipoEvento: "gratuito",
		classificacao: "Livre",
		categoriaEvento: "cultural",

		tituloEvento: "",
		descricao: "",
		categoria: "",

		dataInicio: "",
		dataFim: "",

		horaInicio: "",
		horaFim: "",

		localEvento: "",
		cep: "",
		bairro: "",
		cidade: "",
		uf: "",

		atracoes: "",
		capacidade: "",

		precoIngresso: "",
		linkIngresso: "",
	});

	const [imagem, setImagem] =
		useState(null);

	const [loading, setLoading] =
		useState(false);

	const [uploadProgress, setUploadProgress] =
		useState(0);

	const [focusedField, setFocusedField] =
		useState(null);

	const [erros, setErros] = useState({});

	const [feedbackModal, setFeedbackModal] = useState({
		visible: false,
		title: "",
		message: "",
		type: "info",
		confirmText: "OK",
		onConfirm: null,
	});

	const openFeedback = ({
		title,
		message,
		type = "error",
		confirmText = "OK",
		onConfirm,
	}) => {
		setFeedbackModal({
			visible: true,
			title,
			message,
			type,
			confirmText,
			onConfirm:
				onConfirm ||
				(() =>
					setFeedbackModal((prev) => ({
						...prev,
						visible: false,
					}))),
		});
	};

	/* =========================
	   EDIT MODE
	========================= */

	useEffect(() => {
		if (isEditing && eventoEditando) {
			setForm(eventoParaFormulario(eventoEditando));
			setImagem(eventoEditando.imagemEvento || null);
		}
	}, [isEditing, eventoEditando]);

	/* =========================
	   HELPERS
	========================= */

	const setField = (key, value) => {
		setForm((prev) => ({
			...prev,
			[key]: value,
		}));

		if (erros[key]) {
			setErros((prev) => ({
				...prev,
				[key]: null,
			}));
		}
	};

	// Resetar categoria quando tipo de evento mudar
	useEffect(() => {
		if (form.categoriaEvento) {
			setForm((prev) => ({
				...prev,
				categoria: "",
			}));
		}
	}, [form.categoriaEvento]);

	const pickImage = async () => {
		try {
			const permission =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permission.granted) {
				openFeedback({
					title: "Permissão necessária",
					message: "Permita acesso à galeria para escolher a imagem do evento.",
					type: "warning",
				});
				return;
			}

			const result =
				await ImagePicker.launchImageLibraryAsync(
					{
						mediaTypes:
							ImagePicker.MediaTypeOptions.Images,
						allowsEditing: true,
						aspect: [16, 9],
						quality: 0.7,
					}
				);

			if (!result.canceled) {
				setImagem(
					result.assets?.[0]?.uri
				);
			}
		} catch (e) {
			console.log(e);
			openFeedback({
				title: "Erro",
				message: "Não foi possível selecionar a imagem.",
				type: "error",
			});
		}
	};

	const buscarCEP = async () => {
		try {
			const cep = form.cep.replace(
				/\D/g,
				""
			);

			if (cep.length !== 8) {
				openFeedback({
					title: "CEP inválido",
					message: "Informe um CEP com 8 dígitos.",
					type: "warning",
				});
				return;
			}

			const response = await fetch(
				`https://viacep.com.br/ws/${cep}/json/`
			);

			const data = await response.json();

			if (data.erro) {
				openFeedback({
					title: "CEP não encontrado",
					message: "Não encontramos este CEP. Verifique e tente novamente.",
					type: "warning",
				});
				return;
			}

			setForm((prev) => ({
				...prev,
				localEvento:
					data.logradouro || "",
				bairro:
					data.bairro || "",
				cidade:
					data.localidade || "",
				uf: data.uf || "",
			}));
		} catch (e) {
			console.log(e);

			openFeedback({
				title: "Erro",
				message: "Não foi possível buscar o CEP. Tente novamente.",
				type: "error",
			});
		}
	};

	/* =========================
	   SUBMIT
	========================= */

	const handleSubmit = async () => {
		const listaErros = {};

		if (!form.tituloEvento.trim()) {
			listaErros.tituloEvento =
				"Título obrigatório.";
		}

		if (!form.descricao.trim()) {
			listaErros.descricao =
				"Descrição obrigatória.";
		}

		if (!form.categoria) {
			listaErros.categoria =
				"Selecione uma categoria.";
		}

		if (!form.localEvento.trim()) {
			listaErros.localEvento =
				"Informe o local.";
		}

		if (!form.cidade.trim()) {
			listaErros.cidade =
				"Informe a cidade.";
		}

		if (!isDataValida(form.dataInicio)) {
			listaErros.dataInicio =
				"Data inválida.";
		}

		if (!isDataValida(form.dataFim)) {
			listaErros.dataFim =
				"Data inválida.";
		}

		if (!isHoraValida(form.horaInicio)) {
			listaErros.horaInicio =
				"Hora inválida.";
		}

		if (!isHoraValida(form.horaFim)) {
			listaErros.horaFim =
				"Hora inválida.";
		}

		if (
			form.tipoEvento === "pago"
		) {
			if (!form.precoIngresso) {
				listaErros.precoIngresso =
					"Preço obrigatório.";
			}

			if (!form.linkIngresso) {
				listaErros.linkIngresso =
					"Link obrigatório.";
			}
		}

		if (
			Object.keys(listaErros)
				.length > 0
		) {
			setErros(listaErros);

			openFeedback({
				title: "Campos inválidos",
				message: "Corrija os campos destacados e tente novamente.",
				type: "warning",
			});

			return;
		}

		try {
			setLoading(true);

			let imageUrl =
				eventoEditando?.imagemEvento ||
				"";

			if (
				imagem &&
				imagem !==
					eventoEditando?.imagemEvento
			) {
				imageUrl =
					await uploadImagem(
						imagem,
						user?.uid,
						(progress) =>
							setUploadProgress(
								progress
							)
					);
			}

			let coords = null;

			try {
				coords =
					await geocodeAddress(
						form.localEvento
					);
			} catch (e) {
				console.log(e);
			}

			const inicioCompleto =
				criarDataHora(
					form.dataInicio,
					form.horaInicio
				);

			const fimCompleto =
				criarDataHora(
					form.dataFim,
					form.horaFim
				);

			const nomeOrganizador =
				profile?.nome ||
				user?.displayName ||
				"Organizador";

			const dataEventoExibicao = montarDataEvento(
				form.dataInicio,
				form.horaInicio
			);

			const dadosEvento = {
				tituloEvento:
					form.tituloEvento.trim(),

				descricao:
					form.descricao.trim(),

				imagemEvento: imageUrl,

				dataInicio:
					form.dataInicio,

				dataFim:
					form.dataFim,

				horaInicio:
					form.horaInicio,

				horaFim: form.horaFim,

				dataEvento: dataEventoExibicao,

				dataEventoTimestamp:
					Timestamp.fromDate(inicioCompleto),

				dataFimTimestamp:
					Timestamp.fromDate(fimCompleto),

				localEvento:
					form.localEvento.trim(),

				categoriaEvento:
					form.categoriaEvento,

				categoria:
					form.categoria,

				tipoEvento:
					form.tipoEvento,

				cep: form.cep.replace(
					/\D/g,
					""
				),

				bairro:
					form.bairro.trim(),

				cidade:
					form.cidade.trim(),

				uf: form.uf
					.trim()
					.toUpperCase(),

				latitude:
					coords?.latitude ??
					(isEditing
						? eventoEditando?.latitude ?? null
						: null),

				longitude:
					coords?.longitude ??
					(isEditing
						? eventoEditando?.longitude ?? null
						: null),

				atracoes:
					form.atracoes.trim(),

				capacidade:
					form.capacidade
						? Number(
								form.capacidade
						  )
						: null,

				classificacao:
					form.classificacao,

				precoIngresso:
					form.tipoEvento ===
					"pago"
						? Number(
								form.precoIngresso
						  )
						: 0,

				linkIngresso:
					form.tipoEvento ===
					"pago"
						? form.linkIngresso.trim()
						: "",

				updatedAt:
					serverTimestamp(),
			};

			if (isEditing && eventoDocId) {
				await updateDoc(
					doc(db, "eventos", eventoDocId),
					dadosEvento
				);
			} else {
			const fotoFailsafe =
				profile?.foto ||
				user?.photoURL ||
				`https://ui-avatars.com/api/?name=${encodeURIComponent(
					nomeOrganizador
				)}&background=7C3AED&color=fff`;

			await addDoc(
				collection(db, "eventos"),
				{
					...dadosEvento,

					status: "ativo",

					likes: 0,

					comentarios: 0,

					uidEvento:
						user?.uid || "",

					organizador: {
						uid:
							user?.uid || "",

						nome:
							nomeOrganizador,

						foto:
							fotoFailsafe,

						email:
							user?.email || "",

						role:
							profile?.role ||
							"user",
					},

					createdAt:
						serverTimestamp(),
				}
			);
			}

			openFeedback({
				title: isEditing
					? "Evento atualizado"
					: "Evento criado",
				message: isEditing
					? "Evento atualizado com sucesso."
					: "Seu evento foi publicado.",
				type: "success",
				onConfirm: () => {
					setFeedbackModal((prev) => ({
						...prev,
						visible: false,
					}));
					navigation.goBack();
				},
			});
		} catch (e) {
			console.log(e);

			openFeedback({
				title: "Erro",
				message:
					e?.message ||
					"Erro ao salvar evento.",
				type: "error",
			});
		} finally {
			setLoading(false);
			setUploadProgress(0);
		}
	};

	/* =========================
	   RENDER
	========================= */

	return (
		<View style={styles.container}>
			<StatusBar
				barStyle="light-content"
			/>

			<LinearGradient
				colors={[
					colors.backgroundSecondary ||
						"#18122B",
					colors.surface ||
						"#10131F",
				]}
				style={[
					styles.header,
					{
						paddingTop:
							insets.top + 12,
					},
				]}
			>
				<View
					style={
						styles.headerContentRow
					}
				>
					<TouchableOpacity
						style={
							styles.backButton
						}
						onPress={() =>
							navigation.goBack()
						}
					>
						<MaterialCommunityIcons
							name="arrow-left"
							size={24}
							color="#FFF"
						/>
					</TouchableOpacity>

					<Text
						style={
							styles.headerTitle
						}
					>
						{isEditing
							? "Editar Evento"
							: "Criar Evento"}
					</Text>

					<View
						style={{ width: 24 }}
					/>
				</View>
			</LinearGradient>

			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={
					Platform.OS === "ios"
						? "padding"
						: undefined
				}
			>
				<ScrollView
					showsVerticalScrollIndicator={
						false
					}
					contentContainerStyle={{
						padding: 20,
						paddingBottom:
							insets.bottom + 120,
					}}
				>
					{/* IMAGE */}
					<TouchableOpacity
						style={
							styles.imagePicker
						}
						onPress={pickImage}
						activeOpacity={0.85}
					>
						{imagem ? (
							<Image
								source={{
									uri: imagem,
								}}
								style={
									styles.imagemEvento
								}
							/>
						) : (
							<View
								style={
									styles.imagemPlaceholder
								}
							>
								<MaterialCommunityIcons
									name="image-plus"
									size={40}
									color={
										colors.primary ||
										"#7C3AED"
									}
								/>

								<Text
									style={
										styles.imagePickerText
									}
								>
									Selecionar imagem
								</Text>
							</View>
						)}
					</TouchableOpacity>

					{/* TITLE */}
					<Text
						style={
							styles.inputLabel
						}
					>
						Título do Evento *
					</Text>

					<TextInput
						style={[
							styles.textInput,
							erros.tituloEvento &&
								styles.inputError,
							focusedField ===
								"tituloEvento" &&
								styles.inputFocused,
						]}
						placeholder="Festival de Música"
						placeholderTextColor={
							colors.textMuted ||
							"#64748B"
						}
						value={
							form.tituloEvento
						}
						onChangeText={(v) =>
							setField(
								"tituloEvento",
								v
							)
						}
						onFocus={() =>
							setFocusedField(
								"tituloEvento"
							)
						}
						onBlur={() =>
							setFocusedField(
								null
							)
						}
					/>

					{/* DESCRIPTION */}
					<Text
						style={
							styles.inputLabel
						}
					>
						Descrição *
					</Text>

					<TextInput
						style={[
							styles.textArea,
							focusedField ===
								"descricao" &&
								styles.inputFocused,
						]}
						placeholder="Descreva seu evento..."
						placeholderTextColor={
							colors.textMuted ||
							"#64748B"
						}
						multiline
						numberOfLines={4}
						value={
							form.descricao
						}
						onChangeText={(v) =>
							setField(
								"descricao",
								v
							)
						}
						onFocus={() =>
							setFocusedField(
								"descricao"
							)
						}
						onBlur={() =>
							setFocusedField(
								null
							)
						}
					/>

					{/* CATEGORY EVENTO */}
					<SelectModal
						label="Tipo de Evento"
						value={
							form.categoriaEvento
						}
						options={[
							"Cultural",
							"Esportivo",
						]}
						onSelect={(v) =>
							setField("categoriaEvento", v)
						}
					/>

					{/* CATEGORY */}
					<SelectModal
						label="Categoria"
						value={
							form.categoria
						}
						options={
							form.categoriaEvento === "esportivo"
								? [
									"Futebol",
									"Basquete",
									"Vôlei",
									"Tênis",
									"Atletismo",
									"Natação",
									"Corrida",
									"Ciclismo",
									"Outro",
								]
								: [
									"Shows",
									"Teatro",
									"Cinema",
									"Dança",
									"Literatura",
									"Fotografia",
									"Gastronomia",
									"Outro",
								]
						}
						onSelect={(v) =>
							setField(
								"categoria",
								v
							)
						}
					/>

					{/* DATE */}
					<Text
						style={
							styles.inputLabel
						}
					>
						Data Inicial *
					</Text>

					<TextInput
						style={
							styles.textInput
						}
						placeholder="DD/MM/YYYY"
						placeholderTextColor={
							colors.textMuted ||
							"#64748B"
						}
						keyboardType="numeric"
						maxLength={10}
						value={
							form.dataInicio
						}
						onChangeText={(v) =>
							setField(
								"dataInicio",
								maskData(v)
							)
						}
					/>

					<Text
						style={
							styles.inputLabel
						}
					>
						Hora Inicial *
					</Text>

					<TextInput
						style={
							styles.textInput
						}
						placeholder="HH:MM"
						placeholderTextColor={
							colors.textMuted ||
							"#64748B"
						}
						keyboardType="numeric"
						maxLength={5}
						value={
							form.horaInicio
						}
						onChangeText={(v) =>
							setField(
								"horaInicio",
								maskHora(v)
							)
						}
					/>

					<Text
						style={
							styles.inputLabel
						}
					>
						Data Final *
					</Text>

					<TextInput
						style={
							styles.textInput
						}
						placeholder="DD/MM/YYYY"
						placeholderTextColor={
							colors.textMuted ||
							"#64748B"
						}
						keyboardType="numeric"
						maxLength={10}
						value={
							form.dataFim
						}
						onChangeText={(v) =>
							setField(
								"dataFim",
								maskData(v)
							)
						}
					/>

					<Text
						style={
							styles.inputLabel
						}
					>
						Hora Final *
					</Text>

					<TextInput
						style={
							styles.textInput
						}
						placeholder="HH:MM"
						placeholderTextColor={
							colors.textMuted ||
							"#64748B"
						}
						keyboardType="numeric"
						maxLength={5}
						value={
							form.horaFim
						}
						onChangeText={(v) =>
							setField(
								"horaFim",
								maskHora(v)
							)
						}
					/>

					{/* CEP */}
					<Text
						style={
							styles.inputLabel
						}
					>
						CEP
					</Text>

					<View
						style={styles.cepRow}
					>
						<TextInput
							style={[
								styles.textInput,
								{ flex: 1 },
							]}
							placeholder="00000-000"
							placeholderTextColor={
								colors.textMuted ||
								"#64748B"
							}
							keyboardType="numeric"
							maxLength={9}
							value={form.cep}
							onChangeText={(v) =>
								setField(
									"cep",
									maskCEP(v)
								)
							}
						/>

						<TouchableOpacity
							style={
								styles.cepButton
							}
							onPress={buscarCEP}
						>
							<MaterialCommunityIcons
								name="magnify"
								size={22}
								color="#FFF"
							/>
						</TouchableOpacity>
					</View>

					{/* LOCATION */}
					<Text
						style={
							styles.inputLabel
						}
					>
						Local *
					</Text>

					<TextInput
						style={
							styles.textInput
						}
						placeholder="Rua, avenida..."
						placeholderTextColor={
							colors.textMuted ||
							"#64748B"
						}
						value={
							form.localEvento
						}
						onChangeText={(v) =>
							setField(
								"localEvento",
								v
							)
						}
					/>

					<Text
						style={
							styles.inputLabel
						}
					>
						Cidade *
					</Text>

					<TextInput
						style={
							styles.textInput
						}
						placeholder="Cidade"
						placeholderTextColor={
							colors.textMuted ||
							"#64748B"
						}
						value={form.cidade}
						onChangeText={(v) =>
							setField(
								"cidade",
								v
							)
						}
					/>

					<Text
						style={
							styles.inputLabel
						}
					>
						UF
					</Text>

					<TextInput
						style={
							styles.textInput
						}
						placeholder="CE"
						placeholderTextColor={
							colors.textMuted ||
							"#64748B"
						}
						maxLength={2}
						value={form.uf}
						onChangeText={(v) =>
							setField(
								"uf",
								v.toUpperCase()
							)
						}
					/>

					{/* EVENT TYPE */}
					<SelectModal
						label="Tipo do Evento"
						value={
							form.tipoEvento
						}
						options={[
							"gratuito",
							"pago",
						]}
						onSelect={(v) =>
							setField(
								"tipoEvento",
								v
							)
						}
					/>

					{/* PRICE */}
					{form.tipoEvento ===
						"pago" && (
						<>
							<Text
								style={
									styles.inputLabel
								}
							>
								Preço
							</Text>

							<TextInput
								style={
									styles.textInput
								}
								placeholder="R$ 0,00"
								placeholderTextColor={
									colors.textMuted ||
									"#64748B"
								}
								keyboardType="decimal-pad"
								value={
									form.precoIngresso
								}
								onChangeText={(
									v
								) =>
									setField(
										"precoIngresso",
										v
									)
								}
							/>

							<Text
								style={
									styles.inputLabel
								}
							>
								Link
							</Text>

							<TextInput
								style={
									styles.textInput
								}
								placeholder="https://"
								placeholderTextColor={
									colors.textMuted ||
									"#64748B"
								}
								value={
									form.linkIngresso
								}
								onChangeText={(
									v
								) =>
									setField(
										"linkIngresso",
										v
									)
								}
							/>
						</>
					)}

					{/* BUTTON */}
					<TouchableOpacity
						activeOpacity={0.85}
						onPress={handleSubmit}
						disabled={loading}
					>
						<LinearGradient
							colors={["#6C5CE7", "#5746D6"]}
							style={[
								styles.submitButton,
								loading &&
									styles.submitButtonDisabled,
							]}
						>
							{loading ? (
								<ActivityIndicator
									size="small"
									color="#FFF"
								/>
							) : (
								<Text
									style={
										styles.submitButtonText
									}
								>
									{isEditing
										? "Atualizar Evento"
										: "Criar Evento"}
								</Text>
							)}
						</LinearGradient>
					</TouchableOpacity>

					{uploadProgress >
						0 &&
						uploadProgress <
							100 && (
							<View
								style={
									styles.progressContainer
								}
							>
								<View
									style={[
										styles.progressBar,
										{
											width: `${uploadProgress}%`,
										},
									]}
								/>

								<Text
									style={
										styles.progressText
									}
								>
									Upload:{" "}
									{Math.round(
										uploadProgress
									)}
									%
								</Text>
							</View>
						)}
				</ScrollView>
			</KeyboardAvoidingView>

			<ConfirmModal
				visible={feedbackModal.visible}
				title={feedbackModal.title}
				message={feedbackModal.message}
				type={feedbackModal.type}
				confirmText={feedbackModal.confirmText}
				onConfirm={feedbackModal.onConfirm}
				onCancel={
					feedbackModal.type === "success"
						? undefined
						: () =>
								setFeedbackModal((prev) => ({
									...prev,
									visible: false,
								}))
				}
			/>
		</View>
	);
}

/* =========================
   STYLES
========================= */

function createThemedScreenStyles(c) {
  return StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor:
			c.background ||
			"#10131F",
	},

	header: {
		paddingHorizontal: 20,
		paddingBottom: 20,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
	},

	headerContentRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	backButton: {
		padding: 4,
	},

	headerTitle: {
		color: "#FFF",
		fontSize: 20,
		fontWeight: "bold",
	},

	imagePicker: {
		borderRadius: 20,
		overflow: "hidden",
		marginBottom: 10,
	},

	imagemEvento: {
		width: "100%",
		height: 220,
	},

	imagemPlaceholder: {
		width: "100%",
		height: 220,
		borderRadius: 20,
		backgroundColor:
			"rgba(255,255,255,0.05)",
		borderWidth: 1,
		borderColor:
			c.glassStrong,
		justifyContent: "center",
		alignItems: "center",
	},

	imagePickerText: {
		color:
			c.textMuted ||
			"#64748B",
		marginTop: 8,
		fontWeight: "600",
	},

	inputLabel: {
		color:
			c.textPrimary ||
			"#FFF",
		fontSize: 13,
		fontWeight: "700",
		marginTop: 18,
		marginBottom: 8,
		textTransform: "uppercase",
	},

	textInput: {
		backgroundColor:
			"rgba(255,255,255,0.05)",
		borderWidth: 1,
		borderColor:
			c.glassStrong,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 14,
		color: "#FFF",
		fontSize: 15,
	},

	textArea: {
		backgroundColor:
			"rgba(255,255,255,0.05)",
		borderWidth: 1,
		borderColor:
			c.glassStrong,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 14,
		color: "#FFF",
		fontSize: 15,
		minHeight: 120,
		textAlignVertical: "top",
	},

	inputFocused: {
		borderColor:
			c.primary ||
			"#7C3AED",
	},

	inputError: {
		borderColor: "#EF4444",
	},

	errorText: {
		color: "#EF4444",
		fontSize: 12,
		marginTop: 6,
	},

	select: {
		backgroundColor:
			"rgba(255,255,255,0.05)",
		borderWidth: 1,
		borderColor:
			c.glassStrong,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	selectOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
		backgroundColor:
			"rgba(0,0,0,0.5)",
	},

	selectBox: {
		width: "100%",
		backgroundColor:
			c.surface ||
			"#161B2E",
		borderRadius: 24,
		padding: 20,
	},

	selectTitle: {
		color: "#FFF",
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 14,
	},

	selectItem: {
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderRadius: 12,
		marginBottom: 8,
		backgroundColor:
			c.glass,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	selectItemActive: {
		backgroundColor:
			"rgba(124,58,237,0.22)",
		borderWidth: 1,
		borderColor:
			c.primary ||
			"#7C3AED",
	},

	selectCancelBtn: {
		marginTop: 12,
		paddingVertical: 14,
		alignItems: "center",
	},

	selectCancelText: {
		color:
			c.textMuted ||
			"#94A3B8",
		fontWeight: "700",
	},

	cepRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},

	cepButton: {
		width: 56,
		height: 56,
		borderRadius: 14,
		backgroundColor:
			c.primary ||
			"#6C5CE7",
		justifyContent: "center",
		alignItems: "center",
	},

	submitButton: {
		height: 56,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 24,
	},

	submitButtonDisabled: {
		opacity: 0.6,
	},

	submitButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "bold",
	},

	progressContainer: {
		marginTop: 16,
	},

	progressBar: {
		height: 8,
		borderRadius: 999,
		backgroundColor:
			c.primary ||
			"#7C3AED",
	},

	progressText: {
		color:
			c.textMuted ||
			"#64748B",
		marginTop: 8,
		textAlign: "center",
		fontSize: 13,
	},

});
}
