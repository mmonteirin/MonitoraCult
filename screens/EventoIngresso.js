/**
 * 🎫 TELA DE COMPRA DE INGRESSOS
 *
 * Fluxo completo:
 *  1. Hero com info do evento
 *  2. Seletor de tipos/quantidade (SeletorIngressos)
 *  3. Carrinho com resumo (CarrinhoIngressos)
 *  4. Confirmação com código do ingresso gerado
 */

import React, { useState, useCallback, useMemo } from "react";
import {
	View,
	Text,
	ImageBackground,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	StatusBar,
	Modal,
	Share,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useIngressos } from "../hooks/useIngressos";

import SeletorIngressos from "../components/SeletorIngressos";
import CarrinhoIngressos from "../components/CarrinhoIngressos";
import ConfirmModal from "../components/ConfirmModal";

import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import AppText from "../components/AppText";

/* ──────────────────────────────────────────────
   HELPER — preços extraídos do documento evento
   Campo canônico: precoIngresso (AdmCadastroEvento)
   Fallbacks: precoInteira → valor (legado)
   ──────────────────────────────────────────── */
const extrairPrecos = (evento) => {
	const base = Number(
		evento?.precoIngresso ??  // campo salvo pelo AdmCadastroEvento
		evento?.precoInteira  ??  // alias alternativo
		evento?.valor         ??  // legado
		0
	);
	const gratuito = evento?.tipoEvento === "gratuito" || base === 0;

	if (gratuito) {
		return {
			inteira: 0,
			meia: 0,
			estudante: 0,
			senior: 0,
			promocional: 0,
		};
	}

	return {
		inteira: base,
		// Campos específicos por tipo têm prioridade; senão aplica desconto sobre a base
		meia: Number(evento?.precoMeia || base * 0.5),
		estudante: Number(evento?.precoEstudante || base * 0.7),
		senior: Number(evento?.precoSenior || base * 0.5),
		promocional: Number(evento?.precoPromocional || base * 0.5),
	};
};

/* ──────────────────────────────────────────────
   MODAL DE CONFIRMAÇÃO COM CÓDIGO(S)
   ──────────────────────────────────────────── */
function ModalConfirmacao({ visible, resultado, nomeEvento, onFechar }) {
	if (!resultado) return null;

	const { ingressos = [], compraId } = resultado;

	const handleCompartilhar = async () => {
		const codigos = ingressos
			.map((ing, i) => `#${i + 1} ${ing.codigoIngresso}`)
			.join("\n");

		await Share.share({
			message: `🎫 Meus ingressos para ${nomeEvento}:\n${codigos}\n\nApresente este código na entrada do evento.`,
		});
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onFechar}
		>
			<View style={conf.overlay}>
				<MotiView
					from={{ opacity: 0, scale: 0.85 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: "spring", damping: 18 }}
					style={conf.card}
				>
					{/* Ícone de sucesso */}
					<LinearGradient
						colors={["#22C55E", "#16A34A"]}
						style={conf.iconCircle}
					>
						<MaterialCommunityIcons
							name="check-bold"
							size={36}
							color="#FFF"
						/>
					</LinearGradient>

					<Text style={conf.titulo}>
						{ingressos.length > 1 ? "Ingressos confirmados!" : "Ingresso confirmado!"}
					</Text>

					<Text style={conf.subtitulo}>
						{nomeEvento}
					</Text>

					{/* Lista de códigos */}
					<View style={conf.codigosContainer}>
						{ingressos.map((ing, idx) => (
							<View key={ing.codigoIngresso} style={conf.codigoRow}>
								<MaterialCommunityIcons
									name="ticket-confirmation-outline"
									size={16}
									color={colors.primary}
								/>

								<View style={conf.codigoInfo}>
									<Text style={conf.codigoTipo}>
										Ingresso {idx + 1} —{" "}
										{ing.tipo.charAt(0).toUpperCase() + ing.tipo.slice(1)}
									</Text>

									<Text style={conf.codigoCodigo}>{ing.codigoIngresso}</Text>
								</View>
							</View>
						))}
					</View>

					<Text style={conf.aviso}>
						Apresente este código na entrada do evento.{"\n"}
						Salve ou compartilhe agora.
					</Text>

					{/* Botões */}
					<TouchableOpacity
						style={conf.btnCompartilhar}
						onPress={handleCompartilhar}
					>
						<MaterialCommunityIcons name="share-variant" size={18} color="#FFF" />
						<Text style={conf.btnCompartilharText}>Compartilhar ingressos</Text>
					</TouchableOpacity>

					<TouchableOpacity style={conf.btnFechar} onPress={onFechar}>
						<Text style={conf.btnFecharText}>Ver meus ingressos</Text>
					</TouchableOpacity>
				</MotiView>
			</View>
		</Modal>
	);
}

/* ──────────────────────────────────────────────
   TELA PRINCIPAL
   ──────────────────────────────────────────── */
// EventoIngresso agora é um alias para TelaIngressos (tela canônica de compra).
// Mantido no stack para compatibilidade de links antigos.
export default function EventoIngresso({ route, navigation }) {
  React.useEffect(() => {
    navigation.replace("TelaIngressos", route.params);
  }, []);

  return null;
}

// ─── Implementação original preservada abaixo (não exportada) ───
function _EventoIngressoOriginal({ route, navigation }) {
	const { evento } = route.params;
	const { user, profile } = useAuth();
	const insets = useSafeAreaInsets();

	const {
		carrinho,
		loading,
		error,
		adicionarAoCarrinho,
		removerDoCarrinho,
		comprar,
		total,
		quantidadeTotal,
	} = useIngressos();

	const [modalConfirmacao, setModalConfirmacao] = useState(false);
	const [resultado, setResultado] = useState(null);
	const [modalAlerta, setModalAlerta] = useState({ visible: false, title: "", message: "", type: "error" });
	const [modalCarrinho, setModalCarrinho] = useState(false);

	const gratuito = evento?.tipoEvento === "gratuito" || !evento?.precoIngresso && !evento?.precoInteira && !evento?.valor;
	const precos = useMemo(() => extrairPrecos(evento), [evento]);
	const eventoId = evento?.id || evento?.eventoId;

	/* Segurança: evento não encontrado */
	if (!evento || !eventoId) {
		return (
			<View style={styles.center}>
				<MaterialCommunityIcons
					name="alert-circle-outline"
					size={52}
					color={colors.error}
				/>
				<AppText style={styles.errorText}>Evento não encontrado</AppText>

				<TouchableOpacity
					style={styles.btnVoltar}
					onPress={() => navigation.goBack()}
				>
					<AppText style={styles.btnVoltarText}>Voltar</AppText>
				</TouchableOpacity>
			</View>
		);
	}

	/* Verificar capacidade antes de exibir */
	const ingressosDisponiveis = useMemo(() => {
		if (!evento.capacidade) return null; // sem limite
		return Math.max(0, (evento.capacidade || 0) - (evento.ingressosVendidos || 0));
	}, [evento]);

	const semVagas = ingressosDisponiveis !== null && ingressosDisponiveis === 0;

	/* ── Handler de compra ── */
	const handleComprar = useCallback(async () => {
		if (!user?.uid) {
			setModalAlerta({
				visible: true,
				title: "Faça login",
				message: "Você precisa estar logado para adquirir ingressos.",
				type: "error",
			});
			return;
		}

		if (carrinho.length === 0) {
			setModalAlerta({
				visible: true,
				title: "Carrinho vazio",
				message: "Selecione pelo menos um ingresso antes de continuar.",
				type: "error",
			});
			return;
		}

		try {
			const res = await comprar(
				eventoId,
				user.uid,
				profile?.nome || user.displayName || "Usuário",
				profile?.email || user.email || "",
				profile?.foto || user.photoURL || "",
				"credit_card"
			);

			setResultado(res);
			setModalConfirmacao(true);
		} catch (err) {
			const mensagem =
				err.message?.includes("Capacidade limite")
					? "Ingressos esgotados. Não há mais vagas disponíveis."
					: err.message || "Não foi possível concluir a compra. Tente novamente.";

			setModalAlerta({
				visible: true,
				title: "Erro na compra",
				message: mensagem,
				type: "error",
			});
		}
	}, [user, profile, carrinho, comprar, eventoId]);

	const handleFecharConfirmacao = () => {
		setModalConfirmacao(false);
		navigation.navigate("TelaIngressos");
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

			{/* ── MODAL ALERTA ── */}
			<ConfirmModal
				visible={modalAlerta.visible}
				title={modalAlerta.title}
				message={modalAlerta.message}
				type={modalAlerta.type}
				confirmText="Entendi"
				onConfirm={() => setModalAlerta((p) => ({ ...p, visible: false }))}
			/>

			{/* ── MODAL CONFIRMAÇÃO ── */}
			<ModalConfirmacao
				visible={modalConfirmacao}
				resultado={resultado}
				nomeEvento={evento.tituloEvento}
				onFechar={handleFecharConfirmacao}
			/>

			{/* ── HERO ── */}
			<ImageBackground
				source={{
					uri:
						evento.imagemEvento ||
						"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200",
				}}
				style={styles.hero}
			>
				<LinearGradient
					colors={["rgba(0,0,0,0.10)", "rgba(7,11,20,0.98)"]}
					style={styles.overlay}
				>
					{/* BACK */}
					<View style={[styles.header, { paddingTop: insets.top + 10 }]}>
						<TouchableOpacity
							onPress={() =>
								navigation.canGoBack()
									? navigation.goBack()
									: navigation.navigate("Inicio")
							}
							style={styles.backBtn}
						>
							<BlurView intensity={60} tint={blurTint} style={styles.blurBtn}>
								<MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
							</BlurView>
						</TouchableOpacity>

						{/* Badge de vagas */}
						{ingressosDisponiveis !== null && (
							<BlurView intensity={50} tint={blurTint} style={styles.vagasBadge}>
								<MaterialCommunityIcons
									name={semVagas ? "ticket-remove" : "ticket-account"}
									size={14}
									color={semVagas ? colors.error : colors.success}
								/>

								<Text style={[styles.vagasText, semVagas && { color: colors.error }]}>
									{semVagas
										? "Esgotado"
										: `${ingressosDisponiveis} vaga${ingressosDisponiveis !== 1 ? "s" : ""}`}
								</Text>
							</BlurView>
						)}
					</View>

					{/* HERO CONTENT */}
					<MotiView
						from={{ opacity: 0, translateY: 28 }}
						animate={{ opacity: 1, translateY: 0 }}
						transition={{ type: "timing", duration: 650 }}
					>
						<View style={styles.heroContent}>
							{/* Badge tipo */}
							<View style={styles.badge}>
								<MaterialCommunityIcons name="ticket-confirmation" size={14} color="#FFF" />
								<Text style={styles.badgeText}>
									{gratuito ? "Evento Gratuito" : "Ingresso Pago"}
								</Text>
							</View>

							<Text style={styles.titulo} numberOfLines={2}>
								{evento.tituloEvento}
							</Text>

							<View style={styles.metaRow}>
								<MaterialCommunityIcons
									name="calendar"
									size={14}
									color="rgba(255,255,255,0.6)"
								/>
								<Text style={styles.metaText}>
									{evento.dataEvento || "Data não informada"}
									{evento.horaInicio ? ` · ${evento.horaInicio}` : ""}
								</Text>
							</View>

							<View style={styles.metaRow}>
								<MaterialCommunityIcons
									name="map-marker"
									size={14}
									color="rgba(255,255,255,0.6)"
								/>
								<Text style={styles.metaText} numberOfLines={1}>
									{evento.localEvento || "Local não informado"}
								</Text>
							</View>
						</View>
					</MotiView>
				</LinearGradient>
			</ImageBackground>

			{/* ── CONTENT ── */}
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 32 },
				]}
			>
				{semVagas ? (
					/* Evento esgotado */
					<MotiView
						from={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 200, type: "timing", duration: 500 }}
					>
						<View style={styles.esgotadoCard}>
							<MaterialCommunityIcons
								name="ticket-remove"
								size={44}
								color={colors.error}
							/>
							<Text style={styles.esgotadoTitulo}>Ingressos esgotados</Text>
							<Text style={styles.esgotadoSub}>
								Todas as vagas para este evento já foram preenchidas.
							</Text>
						</View>
					</MotiView>
				) : (
					<>
						{/* SELETOR */}
						<MotiView
							from={{ opacity: 0, translateY: 20 }}
							animate={{ opacity: 1, translateY: 0 }}
							transition={{ delay: 200, duration: 600 }}
						>
							<SeletorIngressos
								precos={precos}
								carrinho={carrinho}
								onAdionar={adicionarAoCarrinho}
								onRemover={removerDoCarrinho}
								gratuito={gratuito}
							/>
						</MotiView>

						{/* CARRINHO MODAL */}
						<Modal
							visible={modalCarrinho}
							transparent
							animationType="slide"
							onRequestClose={() => setModalCarrinho(false)}
						>
							<View style={styles.carrinhoModalOverlay}>
								<View style={styles.carrinhoModalContent}>
									<TouchableOpacity
										style={styles.carrinhoCloseBtn}
										onPress={() => setModalCarrinho(false)}
									>
										<BlurView intensity={60} tint={blurTint} style={styles.blurBtn}>
											<MaterialCommunityIcons name="close" size={24} color="#FFF" />
										</BlurView>
									</TouchableOpacity>
									<CarrinhoIngressos
										carrinho={carrinho}
										total={total}
										quantidadeTotal={quantidadeTotal}
										loading={loading}
										onRemover={removerDoCarrinho}
										onComprar={handleComprar}
										nomeEvento={evento.tituloEvento}
										dataEvento={evento.dataEvento}
										gratuito={gratuito}
									/>
								</View>
							</View>
						</Modal>

						{/* FLOATING CART BUTTON */}
						{carrinho.length > 0 && (
							<TouchableOpacity
								style={[styles.floatingCartBtn, { bottom: insets.bottom + 16 }]}
								onPress={() => setModalCarrinho(true)}
							>
								<BlurView intensity={60} tint={blurTint} style={styles.floatingBlur}>
									<MaterialCommunityIcons name="cart" size={20} color="#FFF" />
									<View style={styles.cartBadge}>
										<Text style={styles.cartBadgeText}>{quantidadeTotal}</Text>
									</View>
									<Text style={styles.floatingCartText}>
										{gratuito || total === 0 ? "Gratuito" : `R$ ${total.toFixed(2)}`}
									</Text>
								</BlurView>
							</TouchableOpacity>
						)}

						{/* Aviso de erro vindo do hook */}
						{!!error && (
							<View style={styles.erroRow}>
								<MaterialCommunityIcons
									name="alert-circle-outline"
									size={16}
									color={colors.error}
								/>
								<Text style={styles.erroText}>{error}</Text>
							</View>
						)}

						{/* Política */}
						<Text style={styles.politica}>
							Cancelamento disponível até 24h antes do evento.
							Ingressos são pessoais e intransferíveis.
						</Text>
					</>
				)}
			</ScrollView>
		</View>
	);
}

/* ──────────────────────────────────────────────
   STYLES
   ──────────────────────────────────────────── */
function createThemedScreenStyles(c) {
  return StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.background,
	},

	/* Hero */
	hero: {
		height: 340,
	},

	overlay: {
		flex: 1,
		justifyContent: "space-between",
	},

	header: {
		paddingHorizontal: 20,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
	},

	backBtn: {
		alignSelf: "flex-start",
	},

	blurBtn: {
		width: 48,
		height: 48,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		borderWidth: 1,
		borderColor: c.glassStrong,
	},

	vagasBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: c.glassStrong,
	},

	vagasText: {
		color: c.success,
		fontSize: 12,
		fontWeight: "700",
	},

	heroContent: {
		padding: 24,
		paddingBottom: 36,
	},

	badge: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255,255,255,0.12)",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		marginBottom: 14,
		gap: 6,
	},

	badgeText: {
		color: "#FFF",
		fontWeight: "600",
		fontSize: 12,
	},

	titulo: {
		color: "#FFF",
		fontSize: 26,
		fontWeight: "800",
		lineHeight: 34,
		marginBottom: 12,
	},

	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 4,
	},

	metaText: {
		color: "rgba(255,255,255,0.65)",
		fontSize: 13,
		flex: 1,
	},

	/* Content */
	content: {
		padding: 16,
		marginTop: -24,
	},

	/* Esgotado */
	esgotadoCard: {
		backgroundColor: c.surface,
		borderRadius: 20,
		padding: 36,
		alignItems: "center",
		borderWidth: 1,
		borderColor: c.error + "30",
	},

	esgotadoTitulo: {
		color: c.textPrimary,
		fontSize: 18,
		fontWeight: "700",
		marginTop: 16,
		marginBottom: 8,
	},

	esgotadoSub: {
		color: c.textMuted,
		fontSize: 13,
		textAlign: "center",
		lineHeight: 20,
	},

	/* Erro */
	erroRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: c.error + "18",
		borderRadius: 10,
		padding: 12,
		marginTop: 8,
	},

	erroText: {
		color: c.error,
		fontSize: 13,
		flex: 1,
	},

	/* Política */
	politica: {
		marginTop: 16,
		textAlign: "center",
		fontSize: 11,
		lineHeight: 18,
		color: c.textMuted,
	},

	/* Fallback */
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: c.background,
		padding: 32,
	},

	errorText: {
		color: c.textPrimary,
		fontSize: 16,
		marginTop: 12,
	},

	btnVoltar: {
		marginTop: 20,
		paddingHorizontal: 24,
		paddingVertical: 12,
		backgroundColor: c.primary,
		borderRadius: 12,
	},

	btnVoltarText: {
		color: "#FFF",
		fontWeight: "700",
	},

	/* Carrinho Modal */
	carrinhoModalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "flex-end",
	},

	carrinhoModalContent: {
		backgroundColor: c.background,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		maxHeight: "85%",
		position: "relative",
	},

	carrinhoCloseBtn: {
		position: "absolute",
		top: 16,
		right: 16,
		zIndex: 10,
	},

	blurBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.1)",
	},

	/* Floating Cart Button */
	floatingCartBtn: {
		position: "absolute",
		right: 16,
		zIndex: 100,
	},

	floatingBlur: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		borderRadius: 28,
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 12,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.1)",
		overflow: "hidden",
	},

	cartBadge: {
		backgroundColor: c.primary,
		borderRadius: 12,
		minWidth: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 6,
	},

	cartBadgeText: {
		color: "#FFF",
		fontSize: 12,
		fontWeight: "700",
	},

	floatingCartText: {
		color: "#FFF",
		fontSize: 14,
		fontWeight: "700",
	},
});

/* ──────────────────────────────────────────────
   MODAL CONFIRMAÇÃO — STYLES
   ──────────────────────────────────────────── */
const conf = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.75)",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},

	card: {
		width: "100%",
		backgroundColor: c.surface,
		borderRadius: 28,
		padding: 28,
		alignItems: "center",
		borderWidth: 1,
		borderColor: c.glassBorder,
	},

	iconCircle: {
		width: 72,
		height: 72,
		borderRadius: 36,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 18,
	},

	titulo: {
		color: c.textPrimary,
		fontSize: 20,
		fontWeight: "800",
		marginBottom: 4,
		textAlign: "center",
	},

	subtitulo: {
		color: c.textMuted,
		fontSize: 13,
		marginBottom: 20,
		textAlign: "center",
	},

	codigosContainer: {
		width: "100%",
		gap: 10,
		marginBottom: 16,
	},

	codigoRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: c.primarySoft,
		borderRadius: 12,
		padding: 12,
		gap: 10,
	},

	codigoInfo: {
		flex: 1,
	},

	codigoTipo: {
		color: c.textSecondary,
		fontSize: 11,
		marginBottom: 2,
	},

	codigoCodigo: {
		color: c.textPrimary,
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 1.5,
		fontFamily: "monospace",
	},

	aviso: {
		color: c.textMuted,
		fontSize: 12,
		textAlign: "center",
		lineHeight: 18,
		marginBottom: 20,
	},

	btnCompartilhar: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 8,
		backgroundColor: c.primary,
		borderRadius: 14,
		paddingVertical: 14,
		marginBottom: 10,
	},

	btnCompartilharText: {
		color: "#FFF",
		fontSize: 15,
		fontWeight: "700",
	},

	btnFechar: {
		width: "100%",
		alignItems: "center",
		paddingVertical: 12,
	},

	btnFecharText: {
		color: c.textMuted,
		fontSize: 14,
		fontWeight: "600",
	},
});
}
