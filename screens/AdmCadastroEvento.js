import React, { useState } from "react";

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
	ImageBackground,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../firebaseConfig";

import { useAuth } from "../context/AuthContext";

import { uploadImagem } from "../services/uploadService";

import { geocodeAddress } from "../services/geocodingService";

import { Colors } from "../styles/Colors";

import { BlurView } from "expo-blur";

import { useSafeAreaInsets } from "react-native-safe-area-context";

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

/* 🔥 MODAL DE SUCESSO FINAL */
function SuccessModal({ visible, title, message, onConfirm }) {
	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.modalOverlay}>
				<BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />

				<View style={styles.modalBox}>
					<LinearGradient
						colors={["#111827", "#0F172A"]}
						style={styles.modalContent}
					>
						<View style={[styles.modalIcon, { backgroundColor: "#22C55E20" }]}>
							<MaterialCommunityIcons name="check-circle" size={40} color="#22C55E" />
						</View>

						<Text style={styles.modalTitle}>{title}</Text>
						<Text style={styles.modalMessage}>{message}</Text>

						<TouchableOpacity onPress={onConfirm} activeOpacity={0.85}>
							<LinearGradient
								colors={[Colors?.primary || "#7C3AED", "#5B21B6"]}
								style={styles.modalButton}
							>
								<Text style={styles.modalButtonText}>OK</Text>
							</LinearGradient>
						</TouchableOpacity>
					</LinearGradient>
				</View>
			</View>
		</Modal>
	);
}

/* 🔥 SELECT MODAL DE CATEGORIA */
const SelectModal = ({ label, value, options, onSelect }) => {
	const [visible, setVisible] = useState(false);

	return (
		<>
			<Text style={styles.inputLabel}>{label}</Text>

			<TouchableOpacity onPress={() => setVisible(true)} style={styles.select}>
				<Text style={{ color: value ? "#FFF" : Colors?.textMuted || "#64748B", fontSize: 15 }}>
					{value || "Selecione..."}
				</Text>
				<MaterialCommunityIcons name="chevron-down" size={22} color={Colors?.primary || "#7C3AED"} />
			</TouchableOpacity>

			<Modal visible={visible} transparent animationType="fade">
				<View style={styles.selectOverlay}>
					<BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
					<View style={styles.selectBox}>
						<Text style={styles.selectTitle}>Selecione uma Categoria</Text>
						{options.map((item) => {
							const ativo = value === item;
							return (
								<TouchableOpacity
									key={item}
									onPress={() => {
										onSelect(item);
										setVisible(false);
									}}
									style={[styles.selectItem, ativo && styles.selectItemActive]}
								>
									<Text style={{ color: Colors?.textPrimary || "#FFF", fontWeight: ativo ? "700" : "500" }}>
										{item}
									</Text>
									{ativo && <MaterialCommunityIcons name="check" size={18} color="#FFF" />}
								</TouchableOpacity>
							);
						})}
						<TouchableOpacity onPress={() => setVisible(false)} style={styles.selectCancelBtn}>
							<Text style={styles.selectCancelText}>Cancelar</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</>
	);
};

/* 📅 VALIDAÇÕES */
const isDataValida = (data) => {
	if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return false;
	const [dia, mes, ano] = data.split("/").map(Number);
	const date = new Date(ano, mes - 1, dia);
	return date.getFullYear() === ano && date.getMonth() === mes - 1 && date.getDate() === dia;
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

export default function AdmCadastroEvento({ navigation }) {
	const insets = useSafeAreaInsets();
	const { user, profile } = useAuth();

	const [form, setForm] = useState({ 
		tipoEvento: "gratuito",
		classificacao: "Livre" 
	}); 
	const [imagem, setImagem] = useState(null);
	const [loading, setLoading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	
	const [focusedField, setFocusedField] = useState(null);
	const [erros, setErros] = useState({});
	const [successVisible, setSuccessVisible] = useState(false);

	const setField = (key, value) => {
		setForm((prev) => ({ ...prev, [key]: value }));
		if (erros[key]) {
			setErros((prev) => ({ ...prev, [key]: null }));
		}
	};

	const pickImage = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			setErros((prev) => ({ ...prev, imagem: "Permissão de galeria necessária." }));
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			quality: 0.5,
			allowsEditing: true,
			aspect: [16, 9],
		});
		if (!result.canceled) {
			setImagem(result.assets[0].uri);
			setErros((prev) => ({ ...prev, imagem: null }));
		}
	};

	const buscarCEP = async () => {
		const cep = form.cep?.replace(/\D/g, "");
		if (!cep || cep.length !== 8) {
			setErros((prev) => ({ ...prev, cep: "Formato de CEP inválido." }));
			return;
		}

		try {
			const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
			const data = await res.json();

			if (data.erro) {
				setErros((prev) => ({ ...prev, cep: "CEP não encontrado." }));
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
			setErros((prev) => ({ ...prev, cep: null }));
		} catch {
			setErros((prev) => ({ ...prev, cep: "Erro ao buscar CEP remoto." }));
		}
	};

	const handleSubmit = async () => {
		let listaErros = {};

		if (!form.tituloEvento) listaErros.tituloEvento = "O título é obrigatório.";
		if (!isDataValida(form.dataInicio || "")) listaErros.dataInicio = "Data inicial inválida.";
		if (!isDataValida(form.dataFim || "")) listaErros.dataFim = "Data final inválida.";
		if (!isHoraValida(form.horaInicio || "")) listaErros.horaInicio = "Horário inicial inválido.";
		if (!isHoraValida(form.horaFim || "")) listaErros.horaFim = "Horário de término inválido.";
		
		if (form.tipoEvento === "pago" && !form.precoIngresso) {
			listaErros.precoIngresso = "Informe o valor do ingresso para eventos pagos.";
		}

		if (Object.keys(listaErros).length > 0) {
			setErros(listaErros);
			alert("Corrija os campos sinalizados antes de continuar.");
			return;
		}

		const inicioCompleto = criarDataHora(form.dataInicio, form.horaInicio);
		const fimCompleto = criarDataHora(form.dataFim, form.horaFim);
		const agora = new Date();

		if (inicioCompleto < agora) {
			setErros((prev) => ({ ...prev, horaInicio: "O evento não pode iniciar no passado." }));
			return;
		}
		if (fimCompleto <= inicioCompleto) {
			setErros((prev) => ({ ...prev, dataFim: "A data/hora de término deve superar o início." }));
			return;
		}

		try {
			setLoading(true);
			let imageUrl = "";

			if (imagem) {
				imageUrl = await uploadImagem(imagem, user?.uid, (p) => setUploadProgress(p));
			}

			const endereco = form.localEvento || form.rua;
			let coords = null;
			if (endereco) {
				coords = await geocodeAddress(endereco);
			}

			const nomeOrganizador = profile?.nome || user?.displayName || "Organizador";
			const fotoFailsafe = profile?.foto || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeOrganizador)}&background=7C3AED&color=fff&size=150&bold=true`;

			await addDoc(collection(db, "eventos"), {
				tituloEvento: form.tituloEvento,
				descricao: form.descricao || "",
				imagemEvento: imageUrl,
				
				// Salvamento do novo escopo cronológico estendido
				dataInicio: form.dataInicio || "",
				dataFim: form.dataFim || "",
				dataEventoTimestamp: inicioCompleto,
				dataFimTimestamp: fimCompleto,
				
				horaInicio: form.horaInicio || "",
				horaFim: form.horaFim || "",
				localEvento: endereco || "",
				categoria: form.categoria || "",
				tipoEvento: form.tipoEvento || "",
				cep: form.cep || "",
				bairro: form.bairro || "",
				cidade: form.cidade || "",
				uf: form.uf || "",
				latitude: coords?.latitude || null,
				longitude: coords?.longitude || null,
				
				atracoes: form.atracoes || "",
				capacidade: form.capacidade ? Number(form.capacidade) : null,
				classificacao: form.classificacao,
				
				// Condicional de preço de ingresso mapeada no banco
				precoIngresso: form.tipoEvento === "pago" ? Number(form.precoIngresso) : 0,
				linkIngresso: form.tipoEvento === "pago" ? form.linkIngresso || "" : "",

				status: "ativo",
				likes: 0,
				comentarios: 0,
				uidEvento: user?.uid || "",
				organizador: {
					uid: user?.uid || "",
					nome: nomeOrganizador,
					foto: fotoFailsafe,
					email: user?.email || "",
					role: profile?.role || "user",
				},
				createdAt: serverTimestamp(),
			});

			setSuccessVisible(true);
		} catch (e) {
			alert(e.message || "Erro ao salvar evento.");
		} finally {
			setLoading(false);
			setUploadProgress(0);
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />

			<LinearGradient
				colors={[Colors?.backgroundSecondary || "#18122B", Colors?.surface || "#10131F"]}
				style={[styles.header, { paddingTop: insets.top + 12 }]}
			>
				<View style={styles.headerContentRow}>
					<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
						<MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Criar Evento</Text>
					<View style={{ width: 24 }} />
				</View>
			</LinearGradient>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120 }}
			>
				{/* BOX CAPA DE IMAGEM */}
				<TouchableOpacity onPress={pickImage} activeOpacity={0.9} style={styles.imageWrapper}>
					{imagem ? (
						<ImageBackground source={{ uri: imagem }} style={styles.image} imageStyle={{ borderRadius: 24 }}>
							<View style={styles.imageOverlayBadge}>
								<MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
								<Text style={styles.imageOverlayBadgeText}>Alterar foto</Text>
							</View>
						</ImageBackground>
					) : (
						<View style={[styles.imagePlaceholder, erros.imagem && styles.inputErrorBorder]}>
							<MaterialCommunityIcons name="image-plus" size={42} color={Colors?.primary || "#7C3AED"} />
							<Text style={styles.imagePlaceholderText}>Adicionar foto de capa</Text>
						</View>
					)}
				</TouchableOpacity>
				{erros.imagem && <Text style={styles.inlineErrorText}>{erros.imagem}</Text>}

				{/* BOX SELETORES */}
				<View style={styles.selectorsGroup}>
					<SelectModal
						label="Categoria do Evento"
						value={form.categoria}
						options={["Shows", "Cinema", "Teatro", "Arte", "Música"]}
						onSelect={(v) => setField("categoria", v)}
					/>

					<Text style={styles.inputLabel}>Tipo de Entrada</Text>
					<View style={styles.chipsRow}>
						{["gratuito", "pago"].map((tipo) => {
							const ativo = form.tipoEvento === tipo;
							return (
								<TouchableOpacity
									key={tipo}
									activeOpacity={0.8}
									style={[styles.inlineChip, ativo && styles.inlineChipActive]}
									onPress={() => setField("tipoEvento", tipo)}
								>
									<Text style={[styles.inlineChipText, ativo && styles.inlineChipTextActive]}>
										{tipo === "gratuito" ? "🎟️ Entrada Grátis" : "💳 Evento Pago"}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>

					<Text style={styles.inputLabel}>Classificação Indicativa</Text>
					<View style={styles.chipsRow}>
						{["Livre", "12+", "16+", "18+"].map((idade) => {
							const ativo = form.classificacao === idade;
							return (
								<TouchableOpacity
									key={idade}
									activeOpacity={0.8}
									style={[styles.inlineChip, ativo && styles.inlineChipActive, { height: 42 }]}
									onPress={() => setField("classificacao", idade)}
								>
									<Text style={[styles.inlineChipText, ativo && styles.inlineChipTextActive, { fontSize: 12 }]}>
										{idade}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>

				{/* DETALHES DO FORMULÁRIO */}
				<Text style={styles.sectionTitle}>Detalhes do Evento</Text>

				<Text style={styles.inputLabel}>Título do Evento *</Text>
				<TextInput
					placeholder="Ex: 17º Campeonato Cearense de Natação"
					placeholderTextColor={Colors?.textMuted || "#64748B"}
					value={form.tituloEvento || ""}
					onFocus={() => setFocusedField("tituloEvento")}
					onBlur={() => setFocusedField(null)}
					onChangeText={(v) => setField("tituloEvento", v)}
					style={[styles.input, focusedField === "tituloEvento" && styles.inputFocused, erros.tituloEvento && styles.inputErrorBorder]}
				/>
				{erros.tituloEvento && <Text style={styles.inlineErrorText}>{erros.tituloEvento}</Text>}

				<Text style={styles.inputLabel}>Artistas / Atrações / Line-up</Text>
				<TextInput
					placeholder="Ex: Atletas convidados, bandas, palestrantes..."
					placeholderTextColor={Colors?.textMuted || "#64748B"}
					value={form.atracoes || ""}
					onFocus={() => setFocusedField("atracoes")}
					onBlur={() => setFocusedField(null)}
					onChangeText={(v) => setField("atracoes", v)}
					style={[styles.input, focusedField === "atracoes" && styles.inputFocused]}
				/>

				<Text style={styles.inputLabel}>Descrição</Text>
				<TextInput
					placeholder="Escreva sobre o cronograma, regulamento ou informações gerais do evento..."
					placeholderTextColor={Colors?.textMuted || "#64748B"}
					multiline
					value={form.descricao || ""}
					onFocus={() => setFocusedField("descricao")}
					onBlur={() => setFocusedField(null)}
					onChangeText={(v) => setField("descricao", v)}
					style={[styles.input, styles.textArea, focusedField === "descricao" && styles.inputFocused]}
				/>

				{/* NOVO ITEM ÚTIL: DATA DE INÍCIO E DATA DE FIM DO EVENTO */}
				<View style={styles.rowInputs}>
					<View style={{ flex: 1 }}>
						<Text style={styles.inputLabel}>Data de Início *</Text>
						<TextInput
							placeholder="DD/MM/AAAA"
							placeholderTextColor={Colors?.textMuted || "#64748B"}
							keyboardType="numeric"
							value={form.dataInicio || ""}
							onFocus={() => setFocusedField("dataInicio")}
							onBlur={() => setFocusedField(null)}
							onChangeText={(v) => setField("dataInicio", maskData(v))}
							style={[styles.input, focusedField === "dataInicio" && styles.inputFocused, erros.dataInicio && styles.inputErrorBorder]}
						/>
						{erros.dataInicio && <Text style={styles.inlineErrorText}>{erros.dataInicio}</Text>}
					</View>

					<View style={{ flex: 1 }}>
						<Text style={styles.inputLabel}>Data de Término *</Text>
						<TextInput
							placeholder="DD/MM/AAAA"
							placeholderTextColor={Colors?.textMuted || "#64748B"}
							keyboardType="numeric"
							value={form.dataFim || ""}
							onFocus={() => setFocusedField("dataFim")}
							onBlur={() => setFocusedField(null)}
							onChangeText={(v) => setField("dataFim", maskData(v))}
							style={[styles.input, focusedField === "dataFim" && styles.inputFocused, erros.dataFim && styles.inputErrorBorder]}
						/>
						{erros.dataFim && <Text style={styles.inlineErrorText}>{erros.dataFim}</Text>}
					</View>
				</View>

				<View style={styles.rowInputs}>
					<View style={{ flex: 1 }}>
						<Text style={styles.inputLabel}>Horário de Abertura *</Text>
						<TextInput
							placeholder="00:00"
							placeholderTextColor={Colors?.textMuted || "#64748B"}
							keyboardType="numeric"
							value={form.horaInicio || ""}
							onFocus={() => setFocusedField("horaInicio")}
							onBlur={() => setFocusedField(null)}
							onChangeText={(v) => setField("horaInicio", maskHora(v))}
							style={[styles.input, focusedField === "horaInicio" && styles.inputFocused, erros.horaInicio && styles.inputErrorBorder]}
						/>
						{erros.horaInicio && <Text style={styles.inlineErrorText}>{erros.horaInicio}</Text>}
					</View>

					<View style={{ flex: 1 }}>
						<Text style={styles.inputLabel}>Horário de Término *</Text>
						<TextInput
							placeholder="00:00"
							placeholderTextColor={Colors?.textMuted || "#64748B"}
							keyboardType="numeric"
							value={form.horaFim || ""}
							onFocus={() => setFocusedField("horaFim")}
							onBlur={() => setFocusedField(null)}
							onChangeText={(v) => setField("horaFim", maskHora(v))}
							style={[styles.input, focusedField === "horaFim" && styles.inputFocused, erros.horaFim && styles.inputErrorBorder]}
						/>
						{erros.horaFim && <Text style={styles.inlineErrorText}>{erros.horaFim}</Text>}
					</View>
				</View>

				<Text style={styles.inputLabel}>Capacidade / Lotação Máxima</Text>
				<TextInput
					placeholder="Ex: 300 pessoas"
					placeholderTextColor={Colors?.textMuted || "#64748B"}
					keyboardType="numeric"
					value={form.capacidade || ""}
					onFocus={() => setFocusedField("capacidade")}
					onBlur={() => setFocusedField(null)}
					onChangeText={(v) => setField("capacidade", v)}
					style={[styles.input, focusedField === "capacidade" && styles.inputFocused]}
				/>

				{/* NOVO ITEM ÚTIL: VALOR DO INGRESSO E LINK SE FOR EVENTO PAGO */}
				{form.tipoEvento === "pago" && (
					<View style={styles.pagoSectionContainer}>
						<Text style={styles.inputLabel}>Preço do Ingresso (R$) *</Text>
						<TextInput
							placeholder="Ex: 50"
							placeholderTextColor={Colors?.textMuted || "#64748B"}
							keyboardType="numeric"
							value={form.precoIngresso || ""}
							onFocus={() => setFocusedField("precoIngresso")}
							onBlur={() => setFocusedField(null)}
							onChangeText={(v) => setField("precoIngresso", v)}
							style={[styles.input, focusedField === "precoIngresso" && styles.inputFocused, erros.precoIngresso && styles.inputErrorBorder]}
						/>
						{erros.precoIngresso && <Text style={styles.inlineErrorText}>{erros.precoIngresso}</Text>}

						<Text style={styles.inputLabel}>Link para Plataforma de Ingressos Externa</Text>
						<TextInput
							placeholder="https://sympla.com.br/seu-evento"
							placeholderTextColor={Colors?.textMuted || "#64748B"}
							autoCapitalize="none"
							keyboardType="url"
							value={form.linkIngresso || ""}
							onFocus={() => setFocusedField("linkIngresso")}
							onBlur={() => setFocusedField(null)}
							onChangeText={(v) => setField("linkIngresso", v)}
							style={[styles.input, focusedField === "linkIngresso" && styles.inputFocused]}
						/>
					</View>
				)}

				<Text style={styles.sectionTitle}>Localização</Text>

				<Text style={styles.inputLabel}>CEP</Text>
				<View style={styles.rowInputs}>
					<TextInput
						placeholder="60000-000"
						placeholderTextColor={Colors?.textMuted || "#64748B"}
						keyboardType="numeric"
						value={form.cep || ""}
						onFocus={() => setFocusedField("cep")}
						onBlur={() => setFocusedField(null)}
						onChangeText={(v) => setField("cep", maskCEP(v))}
						style={[styles.input, { flex: 1 }, focusedField === "cep" && styles.inputFocused, erros.cep && styles.inputErrorBorder]}
					/>
					<TouchableOpacity onPress={buscarCEP} style={styles.btnCep} activeOpacity={0.8}>
						<MaterialCommunityIcons name="magnify" size={22} color="#FFF" />
					</TouchableOpacity>
				</View>
				{erros.cep && <Text style={styles.inlineErrorText}>{erros.cep}</Text>}

				<Text style={styles.inputLabel}>Endereço Completo / Local *</Text>
				<TextInput
					placeholder="Ex: Av. Beira Mar, 1000 - Meireles"
					placeholderTextColor={Colors?.textMuted || "#64748B"}
					value={form.localEvento || ""}
					onFocus={() => setFocusedField("localEvento")}
					onBlur={() => setFocusedField(null)}
					onChangeText={(v) => setField("localEvento", v)}
					style={[styles.input, focusedField === "localEvento" && styles.inputFocused]}
				/>

				{loading && uploadProgress > 0 && (
					<Text style={styles.uploadText}>
						Enviando arquivos de mídia: {Math.round(uploadProgress * 100)}%
					</Text>
				)}

				<TouchableOpacity disabled={loading} onPress={handleSubmit} activeOpacity={0.85} style={{ marginTop: 24 }}>
					<LinearGradient colors={[Colors?.primary || "#7C3AED", "#5B21B6"]} style={styles.button}>
						{loading ? (
							<ActivityIndicator color="#FFF" />
						) : (
							<>
								<MaterialCommunityIcons name="rocket-launch" size={20} color="#FFF" />
								<Text style={styles.buttonText}>Publicar Evento</Text>
							</>
						)}
					</LinearGradient>
				</TouchableOpacity>
			</ScrollView>

			<SuccessModal
				visible={successVisible}
				title="Evento Criado! 🎉"
				message="Seu evento foi publicado com total sucesso no feed do app."
				onConfirm={() => {
					setSuccessVisible(false);
					navigation.goBack();
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors?.background || "#10131F" },
	header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" },
	headerContentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	backButton: { padding: 4 },
	headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
	imageWrapper: { width: "100%", height: 210 },
	image: { width: "100%", height: 210, justifyContent: "flex-end", alignItems: "flex-end" },
	imageOverlayBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, margin: 12, gap: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
	imageOverlayBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
	imagePlaceholder: { height: 210, borderRadius: 24, backgroundColor: Colors?.surface || "#18122B", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "dashed" },
	imagePlaceholderText: { color: "#94A3B8", marginTop: 10, fontSize: 14, fontWeight: "500" },
	selectorsGroup: { marginTop: 24, marginBottom: 14 },
	chipsRow: { flexDirection: "row", gap: 8, marginTop: 6, marginBottom: 4 },
	inlineChip: { flex: 1, height: 50, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
	inlineChipActive: { backgroundColor: "rgba(124, 58, 237, 0.15)", borderColor: "#7C3AED" },
	inlineChipText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
	inlineChipTextActive: { color: "#FFF", fontWeight: "700" },
	sectionTitle: { color: "#FFF", fontSize: 16, fontWeight: "700", marginTop: 28, marginBottom: 4, letterSpacing: 0.3 },
	inputLabel: { color: Colors?.textSecondary || "#94A3B8", fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 14 },
	select: { backgroundColor: Colors?.surface || "#18122B", paddingHorizontal: 16, height: 54, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
	input: { backgroundColor: Colors?.surface || "#18122B", color: "#FFF", paddingHorizontal: 16, height: 54, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", fontSize: 15, marginTop: 2 },
	inputFocused: { borderColor: Colors?.primary || "#7C3AED", backgroundColor: "rgba(124, 58, 237, 0.02)" },
	inputErrorBorder: { borderColor: "#EF4444" },
	inlineErrorText: { color: "#EF4444", fontSize: 12, marginTop: 6, marginLeft: 4, fontWeight: "500" },
	textArea: { height: 110, paddingTop: 14, textAlignVertical: "top" },
	rowInputs: { flexDirection: "row", gap: 12, alignItems: "center" },
	btnCep: { width: 54, height: 54, borderRadius: 18, backgroundColor: Colors?.primary || "#7C3AED", justifyContent: "center", alignItems: "center" },
	button: { height: 56, borderRadius: 18, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
	buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
	uploadText: { color: "#94A3B8", textAlign: "center", marginTop: 14, fontSize: 13 },
	pagoSectionContainer: { width: "100%" },
	modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
	modalBox: { width: "100%" },
	modalContent: { borderRadius: 28, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
	modalIcon: { width: 76, height: 76, borderRadius: 22, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 18 },
	modalTitle: { color: "#FFF", fontSize: 22, fontWeight: "bold", textAlign: "center" },
	modalMessage: { color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 22, marginTop: 10, fontSize: 14 },
	modalButton: { height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginTop: 24 },
	modalButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
	selectOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
	selectBox: { backgroundColor: "#111827", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
	selectTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold", marginBottom: 18, textAlign: "center" },
	selectItem: { paddingHorizontal: 16, height: 52, borderRadius: 14, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)" },
	selectItemActive: { backgroundColor: Colors?.primary || "#7C3AED" },
	selectCancelBtn: { marginTop: 14, height: 50, justifyContent: "center", alignItems: "center" },
	selectCancelText: { color: "#94A3B8", fontSize: 15, fontWeight: "600" },
});