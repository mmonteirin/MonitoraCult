/**
 * screens/TelaFeed.js
 *
 * Hub Social — layout visual idêntico à TelaInicio:
 *  • Header com gradiente + saudação + botões BlurView
 *  • Scroll animado com parallax no hero
 *  • StoryBar reutilizado com os posts recentes
 *  • CategoryPills para filtrar o feed
 *  • SectionHeader + TrendingCarousel para destaques
 *  • Cards de feed (posts + eventos) abaixo
 *  • Abas sociais (Mensagens, Grupos, Pessoas) acessíveis pelo header
 */

import React, {
	useEffect,
	useMemo,
	useState,
	useCallback,
	memo,
} from "react";

import {
	View,
	Text,
	Image,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	StyleSheet,
	StatusBar,
	Modal,
	TextInput,
	KeyboardAvoidingView,
	Platform,
	Share,
	RefreshControl,
} from "react-native";

import Animated, {
	interpolate,
	Extrapolate,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	FadeIn,
	FadeInDown,
	FadeInUp,
	FadeInLeft,
	FadeInRight,
} from "react-native-reanimated";

import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import {
	collection,
	orderBy,
	limit,
	getDocs,
	query,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../styles/Colors";

import {
	adicionarFeedComentario,
	escutarFeedComentarios,
	getUserFeedLikes,
	toggleFeedLike,
} from "../services/feedService";

import {
	subscribeToEvent,
	unsubscribeFromEvent,
	getSubscribedEvents,
} from "../services/subscribedEventsService";

// Componentes reutilizados da TelaInicio
import CategoryPills    from "../components/home/CategoryPills";
import SectionHeader    from "../components/home/SectionHeader";
import StoryBar         from "../components/home/StoryBar";
import TrendingCarousel from "../components/home/TrendingCarousel";
import NotificationBell from "../components/NotificationBell";
import { categoriasHome } from "../components/home/homeUtils";

// Telas sociais embutidas
import TelaComunidade    from "./TelaComunidade";
import TelaConversas     from "./TelaConversas";
import TelaBuscaUsuarios from "./TelaBuscaUsuarios";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 14;
const DEFAULT_IMG = "https://placehold.co/600x600/1B1D26/6C5CE7?text=Post";

const SOCIAL_TABS = [
	{ key: "descubra",   label: "Descubra",  icon: "compass-outline",        iconOn: "compass" },
	{ key: "feed",       label: "Feed",      icon: "view-dashboard-outline", iconOn: "view-dashboard" },
	{ key: "mensagens",  label: "Mensagens", icon: "message-outline",        iconOn: "message" },
	{ key: "comunidade", label: "Grupos",    icon: "account-group-outline",  iconOn: "account-group" },
	{ key: "pessoas",    label: "Pessoas",   icon: "account-search-outline", iconOn: "account-search" },
];

const getFeedKey = (id, type) => `${type}-${id}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(timestamp) {
	if (!timestamp) return "Agora";
	const data = timestamp.toDate?.() || new Date(timestamp);
	const diff = Date.now() - data.getTime();
	const min = Math.floor(diff / 60000);
	const h   = Math.floor(diff / 3600000);
	const d   = Math.floor(diff / 86400000);
	if (min < 1) return "Agora";
	if (min < 60) return `${min}m`;
	if (h < 24)   return `${h}h`;
	if (d < 7)    return `${d}d`;
	return data.toLocaleDateString("pt-BR");
}

function formatarNum(n) {
	if (!n) return "0";
	if (n >= 1000) return (n / 1000).toFixed(1) + "K";
	return String(n);
}

// ─── Botão de like animado ────────────────────────────────────────────────────

const LikeButton = memo(({ isLiked, onPress }) => {
	const scale = useSharedValue(1);
	const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

	const handlePress = () => {
		scale.value = withSpring(1.35, {}, () => { scale.value = withSpring(1); });
		onPress();
	};

	return (
		<TouchableOpacity style={s.actionBtn} onPress={handlePress} activeOpacity={0.7}>
			<Animated.View style={anim}>
				<MaterialCommunityIcons
					name={isLiked ? "heart" : "heart-outline"}
					size={26}
					color={isLiked ? Colors.primary : Colors.textPrimary}
				/>
			</Animated.View>
		</TouchableOpacity>
	);
});

// ─── Card de post/evento ──────────────────────────────────────────────────────

const FeedCard = memo(({ item, index, isLiked, subscribedEvents, onLike, onComment, onShare, onNotify, onNavigate, onPerfil }) => {
	const scale = useSharedValue(1);
	const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

	return (
		<Animated.View entering={FadeInUp.delay(index * 60).springify()} style={anim}>
			<TouchableOpacity
				activeOpacity={1}
				onPressIn={() => { scale.value = withSpring(0.985); }}
				onPressOut={() => { scale.value = withSpring(1); }}
				style={s.card}
			>
				{/* ── HEADER DO CARD ── */}
				<TouchableOpacity style={s.cardHeader} onPress={() => onPerfil(item)} activeOpacity={0.8}>
					<Image
						source={{ uri: item.fotoUsuario || "https://i.pravatar.cc/150" }}
						style={s.avatar}
					/>
					<View style={{ flex: 1 }}>
						<Text numberOfLines={1} style={s.cardAutor}>{item.nomeUsuario || "Usuário"}</Text>
						{item.localEvento ? (
							<View style={s.localRow}>
								<MaterialCommunityIcons name="map-marker" size={11} color={Colors.primary} />
								<Text numberOfLines={1} style={s.localText}>{item.localEvento}</Text>
							</View>
						) : null}
					</View>
					<BlurView intensity={40} tint="dark" style={s.datePill}>
						<Text style={s.dateText}>{formatarData(item.createdAt)}</Text>
					</BlurView>
				</TouchableOpacity>

				{/* ── IMAGEM ── */}
				<TouchableOpacity activeOpacity={0.93} onPress={() => onNavigate(item)} style={s.imgWrapper}>
					<Image
						source={{ uri: item.imagemFeed || DEFAULT_IMG }}
						style={s.cardImg}
						resizeMode="cover"
					/>
					<LinearGradient colors={["transparent", "rgba(0,0,0,0.92)"]} style={s.imgOverlay}>
						{item.dataEvento ? (
							<BlurView intensity={40} tint="dark" style={s.eventDatePill}>
								<MaterialCommunityIcons name="calendar" size={11} color="#fff" />
								<Text style={s.eventDateText}>{item.dataEvento}</Text>
							</BlurView>
						) : null}

						{item.type === "evento" ? (
							<View style={s.ticketPill}>
								<MaterialCommunityIcons
									name={item.gratuito || Number(item.precoInteira || 0) === 0 ? "ticket-confirmation" : "cash"}
									size={11} color="#fff"
								/>
								<Text style={s.ticketText}>
									{item.gratuito || Number(item.precoInteira || 0) === 0 ? "Gratuito" : "Pago"}
								</Text>
							</View>
						) : null}

						<Text numberOfLines={2} style={s.cardTitle}>
							{item.tituloEvento || item.descricao || ""}
						</Text>
						{item.type === "evento" && item.descricao ? (
							<Text numberOfLines={2} style={s.cardDesc}>{item.descricao}</Text>
						) : null}
					</LinearGradient>
				</TouchableOpacity>

				{/* ── AÇÕES ── */}
				<View style={s.actions}>
					<View style={s.actionsLeft}>
						<LikeButton isLiked={isLiked} onPress={() => onLike(item.id, item.type)} />
						<TouchableOpacity style={s.actionBtn} onPress={() => onComment(item)}>
							<MaterialCommunityIcons name="comment-outline" size={24} color={Colors.textPrimary} />
						</TouchableOpacity>
						<TouchableOpacity style={s.actionBtn} onPress={() => onShare(item)}>
							<MaterialCommunityIcons name="share-variant-outline" size={23} color={Colors.textPrimary} />
						</TouchableOpacity>
					</View>
					{item.type === "evento" ? (
						<TouchableOpacity style={s.actionBtn} onPress={() => onNotify(item)}>
							<MaterialCommunityIcons
								name={subscribedEvents[item.id] ? "bell-ring" : "bell-outline"}
								size={22}
								color={subscribedEvents[item.id] ? Colors.primary : Colors.textMuted}
							/>
						</TouchableOpacity>
					) : null}
				</View>

				{/* ── MÉTRICAS ── */}
				<View style={s.metrics}>
					<Text style={s.metricsLikes}>{formatarNum(item.likes || 0)} curtidas</Text>
					<TouchableOpacity onPress={() => onComment(item)}>
						<Text style={s.metricsComments}>
							{formatarNum(item.comentarios || item.commentsCount || 0)} comentários
						</Text>
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		</Animated.View>
	);
});

// ─── Modal de comentários ─────────────────────────────────────────────────────

function ModalComentarios({ item, comentarios, loading, text, setText, sending, onSend, onClose, foto, nome, insets }) {
	const formatarData_ = formatarData;
	return (
		<Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
			<KeyboardAvoidingView style={s.modalWrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
				<TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose} />
				<View style={[s.sheet, { paddingBottom: insets.bottom + 14 }]}>
					<View style={s.handle} />

					<View style={s.sheetHeader}>
						<View style={{ flex: 1, paddingRight: 10 }}>
							<Text style={s.sheetTitle}>Comentários</Text>
							<Text style={s.sheetSub} numberOfLines={1}>
								{item?.tituloEvento || item?.descricao || "Publicação"}
							</Text>
						</View>
						<TouchableOpacity style={s.sheetClose} onPress={onClose}>
							<MaterialCommunityIcons name="close" size={20} color={Colors.textPrimary} />
						</TouchableOpacity>
					</View>

					{loading ? (
						<View style={s.sheetLoading}>
							<ActivityIndicator color={Colors.primary} />
						</View>
					) : (
						<FlatList
							data={comentarios}
							keyExtractor={(c) => c.id}
							contentContainerStyle={s.commentList}
							showsVerticalScrollIndicator={false}
							ListEmptyComponent={
								<View style={s.emptyComment}>
									<MaterialCommunityIcons name="comment-text-outline" size={36} color={Colors.textMuted} />
									<Text style={s.emptyCommentText}>Seja o primeiro a comentar</Text>
								</View>
							}
							renderItem={({ item: c }) => (
								<View style={s.commentRow}>
									<Image
										source={{ uri: c.userPhoto || c.foto || "https://i.pravatar.cc/100" }}
										style={s.commentAvatar}
									/>
									<View style={s.commentBubble}>
										<View style={s.commentTop}>
											<Text style={s.commentAuthor} numberOfLines={1}>{c.userName || c.nome || "Usuário"}</Text>
											<Text style={s.commentDate}>{formatarData_(c.createdAt)}</Text>
										</View>
										<Text style={s.commentBody}>{c.texto}</Text>
									</View>
								</View>
							)}
						/>
					)}

					<View style={s.composer}>
						<Image source={{ uri: foto || "https://i.pravatar.cc/100" }} style={s.composerAvatar} />
						<View style={s.composerInput}>
							<TextInput
								value={text}
								onChangeText={setText}
								placeholder={`Comentar como ${nome || "você"}…`}
								placeholderTextColor={Colors.textMuted}
								style={s.composerText}
								multiline
								maxLength={500}
							/>
							<TouchableOpacity
								style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnOff]}
								disabled={!text.trim() || sending}
								onPress={onSend}
							>
								{sending
									? <ActivityIndicator size="small" color="#fff" />
									: <MaterialCommunityIcons name="send" size={16} color="#fff" />}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

// ─── Aba Feed (conteúdo principal) ───────────────────────────────────────────

function AbaFeed({ navigation, user, nome, foto, scrollY, scrollX, mode = "feed" }) {
	const [items,            setItems]            = useState([]);
	const [loading,          setLoading]          = useState(true);
	const [refreshing,       setRefreshing]       = useState(false);
	const [likedIds,         setLikedIds]         = useState([]);
	const [subscribedEvents, setSubscribedEvents] = useState({});
	const [categoriaAtiva,   setCategoriaAtiva]   = useState("Todos");

	// Comentários
	const [selectedItem,    setSelectedItem]    = useState(null);
	const [comentarios,     setComentarios]     = useState([]);
	const [commentsLoading, setCommentsLoading] = useState(false);
	const [commentText,     setCommentText]     = useState("");
	const [sending,         setSending]         = useState(false);

	const insets = useSafeAreaInsets();

	// ── Carregar ──────────────────────────────────────────────────────────────
	useEffect(() => {
		carregarTudo();
	}, []);

	useEffect(() => {
		if (!selectedItem?.id) return;
		setCommentsLoading(true);
		const unsub = escutarFeedComentarios(selectedItem.id, selectedItem.type, (lista) => {
			setComentarios(lista);
			setCommentsLoading(false);
		});
		return unsub;
	}, [selectedItem?.id, selectedItem?.type]);

	const carregarTudo = async () => {
		await Promise.all([carregarFeed(), carregarLikes(), carregarSubscribed()]);
	};

	const carregarFeed = async () => {
		try {
			const [evSnap, postSnap] = await Promise.all([
				getDocs(query(collection(db, "eventos"), orderBy("createdAt", "desc"), limit(PAGE_SIZE))),
				getDocs(query(collection(db, "posts"),   orderBy("createdAt", "desc"), limit(PAGE_SIZE))),
			]);

			const evs = evSnap.docs.map((d) => {
				const data = d.data();
				return {
					id: d.id, type: "evento", ...data,
					nomeUsuario: data.organizador?.nome || "Organizador",
					fotoUsuario: data.organizador?.foto || "https://i.pravatar.cc/150",
					imagemFeed:  data.imagemEvento || DEFAULT_IMG,
				};
			});

			const posts = postSnap.docs.map((d) => {
				const data = d.data();
				return {
					id: d.id, type: "post", ...data,
					nomeUsuario: data.autor?.nome || "Usuário",
					fotoUsuario: data.autor?.foto || "https://i.pravatar.cc/150",
					imagemFeed:  data.imagemUrl || DEFAULT_IMG,
				};
			});

			const merged = [...evs, ...posts].sort((a, b) => {
				const ta = a.createdAt?.toDate?.() || new Date(0);
				const tb = b.createdAt?.toDate?.() || new Date(0);
				return tb - ta;
			});

			setItems(merged);
		} catch (e) {
			console.log(e);
		} finally {
			setLoading(false);
		}
	};

	const carregarLikes = async () => {
		if (!user?.uid) return;
		try {
			const ids = await getUserFeedLikes(user.uid);
			setLikedIds(ids);
		} catch (e) { console.log(e); }
	};

	const carregarSubscribed = async () => {
		if (!user?.uid) return;
		try {
			const lista = await getSubscribedEvents(user.uid);
			const mapa = {};
			lista.forEach((ev) => { mapa[ev.id] = true; });
			setSubscribedEvents(mapa);
		} catch (e) { console.log(e); }
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await carregarTudo();
		setRefreshing(false);
	};

	// ── Filtro por categoria ──────────────────────────────────────────────────
	const itemsFiltrados = useMemo(() => {
		if (categoriaAtiva === "Todos") return items;
		return items.filter((item) =>
			(item.categoria || item.tipoEvento || "")
				.toLowerCase()
				.includes(categoriaAtiva.toLowerCase())
		);
	}, [items, categoriaAtiva]);

	// StoryBar e TrendingCarousel usam os mais recentes (máx 8)
	const destaques = useMemo(() =>
		itemsFiltrados.slice(0, 8).map((item) => ({
			...item,
			// normaliza campos esperados por HeroSection / StoryBar / TrendingCarousel
			titulo:    item.tituloEvento || item.descricao || "Post",
			imagem:    item.imagemFeed || DEFAULT_IMG,
			local:     item.localEvento || item.nomeLocal || "",
			categoria: item.categoria || item.tipoEvento || "Post",
			score:     item.likes || 0,
			gratuito:  item.gratuito ?? (Number(item.precoInteira || 0) === 0),
			dataInicio: item.createdAt?.toDate?.() ?? null,
		})),
	[itemsFiltrados]);

	// ── Ações ─────────────────────────────────────────────────────────────────
	const handleLike = useCallback(async (itemId, itemType) => {
		if (!user?.uid) return;
		try {
			const liked = await toggleFeedLike(itemId, itemType, user.uid);
			const key = getFeedKey(itemId, itemType);
			setLikedIds((prev) =>
				liked ? [...prev.filter((k) => k !== key), key] : prev.filter((k) => k !== key)
			);
			setItems((prev) => prev.map((item) => {
				if (item.id !== itemId || item.type !== itemType) return item;
				return { ...item, likes: liked ? (item.likes || 0) + 1 : Math.max(0, (item.likes || 0) - 1) };
			}));
		} catch (e) { console.log(e); }
	}, [user]);

	const handleShare = useCallback(async (item) => {
		const titulo = item.tituloEvento || "Post de " + item.nomeUsuario;
		const texto  = `${titulo}\n\n${item.descricao || ""}`;
		const url    = item.imagemFeed || "https://monitoracult.com";

		if (Platform.OS === "web") {
			if (navigator.share) {
				try { await navigator.share({ title: titulo, text: item.descricao, url }); return; } catch (_) {}
			}
			try { await Clipboard.setStringAsync(`${texto}\n\n${url}`); } catch (_) {}
			return;
		}
		try {
			await Share.share({
				title: titulo,
				message: Platform.OS === "android" ? `${texto}\n\n${url}` : texto,
				url,
			});
		} catch (e) { console.log(e); }
	}, []);

	const handleNotify = useCallback(async (evento) => {
		if (!user?.uid) return;
		try {
			if (subscribedEvents[evento.id]) {
				await unsubscribeFromEvent(user.uid, evento.id);
				setSubscribedEvents((prev) => ({ ...prev, [evento.id]: false }));
			} else {
				await subscribeToEvent(user.uid, evento);
				setSubscribedEvents((prev) => ({ ...prev, [evento.id]: true }));
			}
		} catch (e) { console.log(e); }
	}, [user, subscribedEvents]);

	const abrirComentarios = useCallback((item) => {
		setSelectedItem(item);
		setComentarios([]);
		setCommentText("");
	}, []);

	const fecharComentarios = useCallback(() => {
		setSelectedItem(null);
		setComentarios([]);
		setCommentText("");
		setCommentsLoading(false);
	}, []);

	const enviarComentario = useCallback(async () => {
		if (!selectedItem || !commentText.trim()) return;
		setSending(true);
		try {
			await adicionarFeedComentario(selectedItem.id, selectedItem.type, commentText.trim(), { nome, foto });
			setCommentText("");
			setItems((prev) => prev.map((item) => {
				if (item.id !== selectedItem.id || item.type !== selectedItem.type) return item;
				const c = item.comentarios || item.commentsCount || 0;
				return { ...item, comentarios: c + 1, commentsCount: c + 1 };
			}));
		} catch (e) { console.log(e); } finally { setSending(false); }
	}, [commentText, nome, foto, selectedItem]);

	const abrirEvento = useCallback(async (item) => {
		try { await Haptics.selectionAsync(); } catch (_) {}
		const target = item.original || item;
		if (item.type === "evento") {
			navigation.navigate("Detalhes", { evento: target });
		} else {
			abrirComentarios(item);
		}
	}, [navigation, abrirComentarios]);

	const verticalScroll = useAnimatedScrollHandler({
		onScroll: (e) => { scrollY.value = e.contentOffset.y; },
	});
	const horizontalScroll = useAnimatedScrollHandler({
		onScroll: (e) => { scrollX.value = e.contentOffset.x; },
	});

	// ── Parallax do "hero" (StoryBar) na scroll ───────────────────────────────
	const heroStyle = useAnimatedStyle(() => ({
		transform: [
			{ scale: interpolate(scrollY.value, [-160, 0, 250], [1.08, 1, 0.94], Extrapolate.CLAMP) },
			{ translateY: interpolate(scrollY.value, [0, 300], [0, 18], Extrapolate.CLAMP) },
		],
		opacity: interpolate(scrollY.value, [0, 320], [1, 0.85], Extrapolate.CLAMP),
	}));

	if (loading) {
		return (
			<View style={s.loading}>
				<MaterialCommunityIcons name="compass-rose" size={54} color={Colors.primary} />
				<Text style={s.loadingText}>Carregando social...</Text>
			</View>
		);
	}

	return (
		<>
			<Animated.ScrollView
				entering={FadeIn.duration(600)}
				showsVerticalScrollIndicator={false}
				onScroll={verticalScroll}
				scrollEventThrottle={16}
				bounces
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
				}
				contentContainerStyle={{ paddingBottom: 140 }}
			>
				{mode === "descubra" && (
					<>
						{/* AGORA NA CIDADE */}
						{destaques.length > 0 && (
							<Animated.View entering={FadeInLeft.delay(120).springify()} style={heroStyle}>
								<StoryBar eventos={destaques} onPress={abrirEvento} />
							</Animated.View>
						)}

						{/* FILTROS DE CATEGORIA */}
						<Animated.View entering={FadeInRight.delay(160).springify()}>
							<CategoryPills
								categorias={categoriasHome}
								ativa={categoriaAtiva}
								onChange={setCategoriaAtiva}
							/>
						</Animated.View>

						{/* EM ALTA AGORA */}
						{destaques.length > 0 ? (
							<Animated.View entering={FadeInUp.delay(200).springify()}>
								<SectionHeader
									title="Em alta agora"
									subtitle="Posts e eventos que movimentam a cidade"
								/>
								<TrendingCarousel
									eventos={destaques}
									scrollX={scrollX}
									onScroll={horizontalScroll}
									onPress={abrirEvento}
								/>
							</Animated.View>
						) : (
							<View style={s.empty}>
								<MaterialCommunityIcons name="compass-outline" size={52} color={Colors.textMuted} />
								<Text style={s.emptyTitle}>Nada em destaque ainda</Text>
								<Text style={s.emptySub}>Quando a cidade se movimentar, aparece aqui.</Text>
							</View>
						)}
					</>
				)}

				{mode === "feed" && (
					<>
						{/* FILTROS DE CATEGORIA */}
						<Animated.View entering={FadeInRight.delay(160).springify()}>
							<CategoryPills
								categorias={categoriasHome}
								ativa={categoriaAtiva}
								onChange={setCategoriaAtiva}
							/>
						</Animated.View>

						{/* SEÇÃO: FEED COMPLETO */}
						<Animated.View entering={FadeInUp.delay(260).springify()}>
							<SectionHeader
								title="Feed Social"
								subtitle={`${itemsFiltrados.length} publicações`}
								actionLabel="Criar"
								onAction={() => navigation.navigate("CriarPost")}
							/>
						</Animated.View>

						{itemsFiltrados.length === 0 ? (
							<View style={s.empty}>
								<MaterialCommunityIcons name="post-outline" size={52} color={Colors.textMuted} />
								<Text style={s.emptyTitle}>Nenhuma publicação</Text>
								<Text style={s.emptySub}>Seja o primeiro a publicar algo!</Text>
							</View>
						) : (
							itemsFiltrados.map((item, index) => (
								<FeedCard
									key={getFeedKey(item.id, item.type)}
									item={item}
									index={index}
									isLiked={likedIds.includes(getFeedKey(item.id, item.type))}
									subscribedEvents={subscribedEvents}
									onLike={handleLike}
									onComment={abrirComentarios}
									onShare={handleShare}
									onNotify={handleNotify}
									onNavigate={abrirEvento}
									onPerfil={(it) => {
										const uid = it.userId || it.organizador?.uid;
										if (uid) navigation.navigate("PerfilPublico", { userId: uid });
									}}
								/>
							))
						)}
					</>
				)}
			</Animated.ScrollView>

			<ModalComentarios
				item={selectedItem}
				comentarios={comentarios}
				loading={commentsLoading}
				text={commentText}
				setText={setCommentText}
				sending={sending}
				onSend={enviarComentario}
				onClose={fecharComentarios}
				foto={foto}
				nome={nome}
				insets={insets}
			/>
		</>
	);
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────

export default function TelaFeed({ navigation, route }) {
	const insets = useSafeAreaInsets();
	const { user, nome, foto } = useAuth();

	const [activeTab, setActiveTab] = useState(route?.params?.initialTab || "descubra");

	// Shared values passados à AbaFeed (scroll animado do header)
	const scrollY = useSharedValue(0);
	const scrollX = useSharedValue(0);

	const saudacao = useMemo(() => {
		const h = new Date().getHours();
		if (h < 12) return "Bom dia";
		if (h < 18) return "Boa tarde";
		return "Boa noite";
	}, []);

	const nomeUsuario = nome || user?.displayName || user?.email?.split("@")[0] || "Explorador";

	useEffect(() => {
		if (route?.params?.initialTab) {
			setActiveTab(route.params.initialTab);
		}
	}, [route?.params?.initialTab]);

	// Header encolhe conforme scroll (apenas na aba feed)
	const headerAnim = useAnimatedStyle(() => {
		if (activeTab !== "feed" && activeTab !== "descubra") return {};
		return {
			transform: [{
				translateY: interpolate(scrollY.value, [0, 100], [0, -8], Extrapolate.CLAMP),
			}],
			opacity: interpolate(scrollY.value, [0, 120], [1, 0.97], Extrapolate.CLAMP),
		};
	});

	return (
		<View style={s.container}>
			<StatusBar barStyle="light-content" />

			{/* ── HEADER (mesmo gradiente + estrutura da TelaInicio) ── */}
			<Animated.View entering={FadeInDown.duration(600)} style={headerAnim}>
				<LinearGradient
					colors={[Colors.backgroundSecondary, Colors.surface, Colors.background]}
					style={[s.headerGrad, { paddingTop: insets.top + 12 }]}
				>
					{/* LINHA SUPERIOR: saudação + botões */}
					<View style={s.headerRow}>
						<View style={s.headerCopy}>
							<Text style={s.greeting}>{saudacao}</Text>
							<Text style={s.name} numberOfLines={1}>{nomeUsuario}</Text>
							<Text style={s.city}>Social · MonitoraCult</Text>
						</View>

						<Animated.View entering={FadeInRight.delay(200)} style={s.headerBtns}>
							{activeTab === "feed" && (
								<TouchableOpacity
									activeOpacity={0.8}
									style={s.headerBtn}
									onPress={() => navigation.navigate("CriarPost")}
								>
									<BlurView intensity={35} tint="dark" style={s.headerBlur}>
										<MaterialCommunityIcons name="pencil-plus-outline" size={22} color="#fff" />
									</BlurView>
								</TouchableOpacity>
							)}

							<NotificationBell
								onPress={() => navigation.navigate("Notificacoes")}
								color="#fff"
								size={22}
								style={s.headerBtn}
							/>
						</Animated.View>
					</View>

					{/* TAB BAR SOCIAL — mesmo estilo das CategoryPills */}
					<View style={s.tabRow}>
						{SOCIAL_TABS.map((tab) => {
							const active = activeTab === tab.key;
							return (
								<TouchableOpacity
									key={tab.key}
									style={[s.tab, active && s.tabActive]}
									onPress={() => setActiveTab(tab.key)}
									activeOpacity={0.8}
								>
									<MaterialCommunityIcons
										name={active ? tab.iconOn : tab.icon}
										size={15}
										color={active ? "#fff" : Colors.textMuted}
									/>
									<Text style={[s.tabLabel, active && s.tabLabelActive]}>
										{tab.label}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</LinearGradient>
			</Animated.View>

			{/* ── CONTEÚDO ── */}
			<View style={{ flex: 1 }}>
				{activeTab === "descubra" && (
					<AbaFeed
						navigation={navigation}
						user={user}
						nome={nomeUsuario}
						foto={foto}
						scrollY={scrollY}
						scrollX={scrollX}
						mode="descubra"
					/>
				)}
				{activeTab === "feed" && (
					<AbaFeed
						navigation={navigation}
						user={user}
						nome={nomeUsuario}
						foto={foto}
						scrollY={scrollY}
						scrollX={scrollX}
						mode="feed"
					/>
				)}
				{activeTab === "mensagens" && (
					<TelaConversas navigation={navigation} route={{ params: {} }} />
				)}
				{activeTab === "comunidade" && (
					<TelaComunidade navigation={navigation} route={{ params: { embedded: true } }} />
				)}
				{activeTab === "pessoas" && (
					<TelaBuscaUsuarios navigation={navigation} route={{ params: { embedded: true } }} />
				)}
			</View>
		</View>
	);
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.background },

	// HEADER — idêntico ao da TelaInicio
	headerGrad: { paddingBottom: 0 },
	headerRow: {
		paddingHorizontal: 20,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingBottom: 18,
	},
	headerCopy: { flex: 1, paddingRight: 14 },
	greeting: { color: Colors.textSecondary, fontSize: 15 },
	name: { color: Colors.textPrimary, fontSize: 30, fontWeight: "800", marginTop: 4 },
	city: { color: Colors.textMuted, fontSize: 13, marginTop: 5 },
	headerBtns: { flexDirection: "row", alignItems: "center", gap: 10 },
	headerBtn: {},
	headerBlur: {
		width: 52, height: 52, borderRadius: 18,
		justifyContent: "center", alignItems: "center",
		overflow: "hidden", borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
		backgroundColor: "rgba(255,255,255,0.04)",
	},

	// TAB BAR — mesmo visual das CategoryPills mas compacto
	tabRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: 18,
		paddingBottom: 14,
		gap: 8,
	},
	tab: {
		flexDirection: "row", alignItems: "center", gap: 6,
		flexGrow: 1,
		justifyContent: "center",
		paddingHorizontal: 14, paddingVertical: 9,
		borderRadius: 22,
		backgroundColor: Colors.glass,
		borderWidth: 1, borderColor: Colors.glassBorder,
	},
	tabActive: {
		backgroundColor: Colors.primaryDark,
		borderColor: Colors.primary,
		shadowColor: Colors.primary,
		shadowOpacity: 0.35,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 0 },
		elevation: 6,
	},
	tabLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
	tabLabelActive: { color: "#fff" },

	// LOADING
	loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
	loadingText: { color: Colors.textPrimary, fontSize: 15, fontWeight: "600", marginTop: 14 },

	// CARD
	card: {
		backgroundColor: Colors.surface,
		marginHorizontal: 16, marginBottom: 20,
		borderRadius: 28, overflow: "hidden",
	},
	cardHeader: {
		padding: 14, flexDirection: "row",
		alignItems: "center", gap: 12,
	},
	avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.card },
	cardAutor: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14 },
	localRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
	localText: { color: Colors.textMuted, fontSize: 11 },
	datePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, overflow: "hidden" },
	dateText: { color: "#fff", fontSize: 11, fontWeight: "700" },
	imgWrapper: { width: "100%", height: 400, backgroundColor: "#000" },
	cardImg: { width: "100%", height: "100%" },
	imgOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16 },
	eventDatePill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, overflow: "hidden", marginBottom: 8 },
	eventDateText: { color: "#fff", marginLeft: 4, fontSize: 11, fontWeight: "700" },
	ticketPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, backgroundColor: "rgba(108,92,231,0.85)", marginBottom: 8, gap: 4 },
	ticketText: { color: "#fff", fontSize: 11, fontWeight: "800" },
	cardTitle: { color: "#fff", fontSize: 24, fontWeight: "800", lineHeight: 30 },
	cardDesc: { color: "rgba(255,255,255,0.7)", marginTop: 6, fontSize: 13, lineHeight: 19 },
	actions: { paddingHorizontal: 6, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	actionsLeft: { flexDirection: "row", alignItems: "center" },
	actionBtn: { padding: 8 },
	metrics: { paddingHorizontal: 16, paddingBottom: 14 },
	metricsLikes: { color: Colors.textPrimary, fontWeight: "700", fontSize: 13 },
	metricsComments: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },

	// EMPTY
	empty: { alignItems: "center", paddingVertical: 64 },
	emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 14 },
	emptySub: { color: Colors.textMuted, fontSize: 13, marginTop: 6 },

	// MODAL
	modalWrap: { flex: 1, justifyContent: "flex-end" },
	modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)" },
	sheet: { maxHeight: "82%", minHeight: "55%", backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: Colors.glassBorder, overflow: "hidden" },
	handle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)", marginTop: 10, marginBottom: 10 },
	sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
	sheetTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: "800" },
	sheetSub: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
	sheetClose: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)" },
	sheetLoading: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
	commentList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
	emptyComment: { alignItems: "center", paddingVertical: 44 },
	emptyCommentText: { color: Colors.textMuted, fontSize: 13, marginTop: 10 },
	commentRow: { flexDirection: "row", marginBottom: 12 },
	commentAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10, backgroundColor: Colors.background },
	commentBubble: { flex: 1, padding: 11, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)" },
	commentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
	commentAuthor: { flex: 1, color: Colors.textPrimary, fontSize: 12, fontWeight: "800", paddingRight: 8 },
	commentDate: { color: Colors.textMuted, fontSize: 11 },
	commentBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
	composer: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
	composerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, marginBottom: 3, backgroundColor: Colors.background },
	composerInput: { flex: 1, flexDirection: "row", alignItems: "flex-end", borderRadius: 22, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", paddingLeft: 14, paddingRight: 5, paddingVertical: 5 },
	composerText: { flex: 1, color: Colors.textPrimary, fontSize: 14, maxHeight: 96, paddingTop: 8, paddingBottom: 8 },
	sendBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, marginLeft: 6 },
	sendBtnOff: { opacity: 0.4 },
});
