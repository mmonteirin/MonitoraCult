import React, { useEffect, useState, useCallback, memo } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    StatusBar,
    Dimensions,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Share, 
} from "react-native";

// Importação do Clipboard nativo para o fallback inteligente de cópia na Web
import * as Clipboard from "expo-clipboard";

import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    withSpring,
    useAnimatedStyle,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    subscribeToEvent,
    unsubscribeFromEvent,
    getSubscribedEvents,
} from "../services/subscribedEventsService";

import {
    adicionarFeedComentario,
    escutarFeedComentarios,
    getUserFeedLikes,
    toggleFeedLike,
} from "../services/feedService";

const { width } = Dimensions.get("window");
const PAGE_SIZE = 10;
const DEFAULT_EVENT_IMAGE = "https://placehold.co/600x600/1B1D26/6C5CE7?text=Evento";

const getFeedItemKey = (itemOrId, type) => {
    if (typeof itemOrId === "object") {
        return `${itemOrId.type}-${itemOrId.id}`;
    }
    return `${type}-${itemOrId}`;
};

// COMPONENTE ANIMADO: Botão de Curtir
const LikeButton = memo(({ isLiked, onPress }) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        scale.value = withSpring(1.3);
        setTimeout(() => { scale.value = withSpring(1); }, 120);
        onPress();
    };

    return (
        <TouchableOpacity style={styles.actionBtn} onPress={handlePress} activeOpacity={0.7}>
            <Animated.View style={animatedStyle}>
                <MaterialCommunityIcons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={27}
                    color={isLiked ? "#A855F7" : Colors.textPrimary}
                />
            </Animated.View>
        </TouchableOpacity>
    );
});

// COMPONENTE ANIMADO: Botão de Compartilhar
const ShareButton = memo(({ onPress }) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        scale.value = withSpring(1.25);
        setTimeout(() => { scale.value = withSpring(1); }, 120);
        onPress();
    };

    return (
        <TouchableOpacity style={styles.actionBtn} onPress={handlePress} activeOpacity={0.7}>
            <Animated.View style={animatedStyle}>
                <MaterialCommunityIcons
                    name="share-variant-outline"
                    size={24}
                    color={Colors.textPrimary}
                />
            </Animated.View>
        </TouchableOpacity>
    );
});

// COMPONENTE: Card de Evento Mapeado e Otimizado
const EventoCard = memo(
    ({
        item,
        index,
        isLiked,
        formatarNumero,
        formatarData,
        onToggleLike,
        onOpenComments,
        onShare, 
        toggleNotification,
        subscribedEvents,
        onNavigate,
    }) => {
        const scale = useSharedValue(1);
        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
        }));

        return (
            <Animated.View entering={FadeInUp.delay(index * 80).springify()}>
                <Animated.View style={animatedStyle}>
                    <TouchableOpacity
                        activeOpacity={0.95}
                        onPressIn={() => { scale.value = withSpring(0.98); }}
                        onPressOut={() => { scale.value = withSpring(1); }}
                        style={styles.card}
                    >
                        {/* HEADER */}
                        <View style={styles.cardHeader}>
                            <View style={styles.userInfo}>
                                <Image
                                    source={{ uri: item.fotoUsuario || "https://i.pravatar.cc/150" }}
                                    style={styles.avatar}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text numberOfLines={1} style={styles.userName}>
                                        {item.nomeUsuario || "Organizador"}
                                    </Text>
                                    {item.type === "evento" && (
                                        <View style={styles.locationRow}>
                                            <MaterialCommunityIcons name="map-marker" size={12} color={Colors.primary} />
                                            <Text numberOfLines={1} style={styles.locationText}>
                                                {item.localEvento || item.nomeLocal || "Local não informado"}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={styles.headerActions}>
                                <BlurView intensity={40} tint="dark" style={styles.dateBadge}>
                                    <Text style={styles.dateText}>{formatarData(item.createdAt)}</Text>
                                </BlurView>
                            </View>
                        </View>

                        {/* IMAGEM E CONTEÚDO */}
                        <TouchableOpacity
                            activeOpacity={0.92}
                            onPress={() => onNavigate(item)}
                            style={styles.imageWrapper}
                        >
                            <Image
                                source={{ uri: item.imagemFeed || DEFAULT_EVENT_IMAGE }}
                                style={styles.mainImage}
                                resizeMode="cover"
                            />

                            <LinearGradient colors={["transparent", "rgba(0,0,0,0.95)"]} style={styles.imageOverlay}>
                                {item.dataEvento && (
                                    <BlurView intensity={40} tint="dark" style={styles.eventDateBadge}>
                                        <MaterialCommunityIcons name="calendar" size={12} color="#fff" />
                                        <Text style={styles.eventDateText}>{item.dataEvento}</Text>
                                    </BlurView>
                                )}

                                {item.type === "evento" && (
                                    <View style={styles.ticketTypeBadge}>
                                        <MaterialCommunityIcons
                                            name={
                                                item.gratuito ||
                                                item.tipoEvento === "gratuito" ||
                                                Number(item.precoInteira || 0) === 0
                                                    ? "ticket-confirmation"
                                                    : "cash"
                                            }
                                            size={12}
                                            color="#fff"
                                        />
                                        <Text style={styles.ticketTypeText}>
                                            {item.gratuito || item.tipoEvento === "gratuito" || Number(item.precoInteira || 0) === 0
                                                ? "Gratuito"
                                                : "Pago"}
                                        </Text>
                                    </View>
                                )}

                                {item.type === "evento" && (
                                    <Text numberOfLines={2} style={styles.eventTitle}>
                                        {item.tituloEvento || "Evento"}
                                    </Text>
                                )}

                                <Text numberOfLines={2} style={item.type === "evento" ? styles.description : styles.eventTitle}>
                                    {item.descricao}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* AÇÕES */}
                        <View style={styles.actions}>
                            <View style={styles.leftActions}>
                                <LikeButton
                                    isLiked={isLiked}
                                    onPress={() => onToggleLike(item.id, item.type)}
                                />

                                <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenComments(item)}>
                                    <MaterialCommunityIcons name="comment-outline" size={25} color={Colors.textPrimary} />
                                </TouchableOpacity>

                                <ShareButton onPress={() => onShare(item)} />
                            </View>

                            {item.type === "evento" && (
                                <View style={styles.rightActions}>
                                    <TouchableOpacity onPress={() => toggleNotification(item)}>
                                        <MaterialCommunityIcons
                                            name={subscribedEvents[item.id] ? "bell-ring" : "bell-outline"}
                                            size={24}
                                            color={subscribedEvents[item.id] ? Colors.primary : Colors.textMuted}
                                        />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* MÉTRICAS */}
                        <View style={styles.metricsContainer}>
                            <Text style={styles.likesText}>{formatarNumero(item.likes || 0)} curtidas</Text>
                            <TouchableOpacity activeOpacity={0.75} onPress={() => onOpenComments(item)}>
                                <Text style={styles.commentsText}>
                                    {formatarNumero(item.comentarios || item.commentsCount || 0)} comentários
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        );
    }
);

export default function TelaFeed({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user, isAdmin, nome, foto } = useAuth();

    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [likedIds, setLikedIds] = useState([]);
    const [subscribedEvents, setSubscribedEvents] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [sendingComment, setSendingComment] = useState(false);

    useEffect(() => {
        carregarFeed();
        carregarLikes();
        carregarSubscribedEvents();
    }, []);

    useEffect(() => {
        if (!selectedItem?.id) return;
        setCommentsLoading(true);

        const unsubscribe = escutarFeedComentarios(
            selectedItem.id,
            selectedItem.type,
            (lista) => {
                setComentarios(lista);
                setCommentsLoading(false);
            }
        );
        return unsubscribe;
    }, [selectedItem?.id, selectedItem?.type]);

    // 🖥️ NOVO MOTOR DE COMPARTILHAMENTO UNIFICADO (MOBILE + WEB LOG LOCALHOST)
    const handleShare = useCallback(async (item) => {
        const éEvento = item.type === "evento";
        const titulo = éEvento ? item.tituloEvento : "Post de " + item.nomeUsuario;
        const textoCompartilhar = `${titulo}\n\n${item.descricao}`;
        const linkFalsoOuReal = item.imagemFeed || "https://monitoracult.com";

        // Fluxo de verificação para execução em ambiente Web de Desktop ou Mobile Browser
        if (Platform.OS === "web") {
            if (navigator.share) {
                // Se o navegador Web der suporte total (ex: Safari Mac ou Chrome Mobile Web)
                try {
                    await navigator.share({
                        title: titulo,
                        text: item.descricao,
                        url: linkFalsoOuReal,
                    });
                    return;
                } catch (err) {
                    if (err.name !== "AbortError") console.log("Erro no navigator.share:", err);
                }
            }

            // Fallback Premium para Web Desktops (Copia o link automaticamente + Avisa o usuário inline)
            try {
                await Clipboard.setStringAsync(`${textoCompartilhar}\n\nLink: ${linkFalsoOuReal}`);
                
                // Mapeia o alert tradicional de forma segura para navegadores
                if (Platform.OS === 'web') {
                    window.alert("Link copiado para a área de transferência! 📋 Mande para seus amigos.");
                } else {
                    Alert.alert("Sucesso 📋", "Link copiado para a área de transferência!");
                }
            } catch (clipErr) {
                console.log("Falha ao acessar área de transferência da web:", clipErr);
            }
            return;
        }

        // Fluxo Nativo Executado nos Emuladores/Dispositivos Físicos Mobile (iOS e Android)
        try {
            await Share.share({
                title: titulo,
                message: Platform.OS === "android" ? `${textoCompartilhar}\n\n${linkFalsoOuReal}` : textoCompartilhar,
                url: linkFalsoOuReal,
            }, {
                dialogTitle: `Compartilhar ${éEvento ? 'Evento' : 'Publicação'}`,
            });
        } catch (error) {
            console.log("Erro ao compartilhar nativo:", error.message);
        }
    }, []);

    const carregarLikes = async () => {
        try {
            if (!user?.uid) return;
            const likes = await getUserFeedLikes(user.uid);
            setLikedIds(likes);
        } catch (e) { console.log(e); }
    };

    const carregarFeed = async () => {
        try {
            const eventosQuery = query(collection(db, "eventos"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
            const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));

            const [eventosSnap, postsSnap] = await Promise.all([
                getDocs(eventosQuery),
                getDocs(postsQuery),
            ]);

            const eventosLista = eventosSnap.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: "evento",
                    ...data,
                    nomeUsuario: data.organizador?.nome || "Organizador",
                    fotoUsuario: data.organizador?.foto || "https://i.pravatar.cc/150",
                    imagemFeed: data.imagemEvento || DEFAULT_EVENT_IMAGE,
                };
            });

            const postsLista = postsSnap.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: "post",
                    ...data,
                    nomeUsuario: data.autor?.nome || "Usuário",
                    fotoUsuario: data.autor?.foto || "https://i.pravatar.cc/150",
                    imagemFeed: data.imagemUrl || DEFAULT_EVENT_IMAGE,
                };
            });

            const feedCompleto = [...eventosLista, ...postsLista];
            feedCompleto.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });

            setEventos(feedCompleto);
        } catch (e) { console.log(e); } finally { setLoading(false); }
    };

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await Promise.all([carregarFeed(), carregarLikes(), carregarSubscribedEvents()]);
        } catch (error) { console.log(error); } finally { setRefreshing(false); }
    };

    const carregarSubscribedEvents = async () => {
        try {
            if (!user?.uid) return;
            const eventos = await getSubscribedEvents(user.uid);
            const mapa = {};
            eventos.forEach((evento) => { mapa[evento.id] = true; });
            setSubscribedEvents(mapa);
        } catch (error) { console.log(error); }
    };

    const toggleLike = useCallback(async (itemId, itemType) => {
        try {
            const liked = await toggleFeedLike(itemId, itemType, user.uid);
            const itemKey = getFeedItemKey(itemId, itemType);

            if (liked) {
                setLikedIds((prev) => prev.includes(itemKey) ? prev : [...prev, itemKey]);
            } else {
                setLikedIds((prev) => prev.filter((id) => id !== itemKey));
            }

            setEventos((prev) =>
                prev.map((item) => {
                    if (item.id !== itemId || item.type !== itemType) return item;
                    const likes = item.likes || 0;
                    return {
                        ...item,
                        likes: liked ? likes + 1 : Math.max(0, likes - 1),
                    };
                })
            );
        } catch (e) {
            console.log(e);
        }
    }, [user]);

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

        try {
            setSendingComment(true);
            await adicionarFeedComentario(selectedItem.id, selectedItem.type, commentText.trim(), { nome, foto });
            setCommentText("");

            setEventos((prev) =>
                prev.map((item) => {
                    if (item.id !== selectedItem.id || item.type !== selectedItem.type) return item;
                    const comentariosCount = item.comentarios || item.commentsCount || 0;
                    return {
                        ...item,
                        comentarios: comentariosCount + 1,
                        commentsCount: comentariosCount + 1,
                    };
                })
            );
        } catch (error) {
            console.log(error);
        } finally { setSendingComment(false); }
    }, [commentText, foto, nome, selectedItem]);

    async function toggleNotification(evento) {
        try {
            const isSubscribed = subscribedEvents[evento.id];
            if (isSubscribed) {
                await unsubscribeFromEvent(user.uid, evento.id);
                setSubscribedEvents((prev) => ({ ...prev, [evento.id]: false }));
            } else {
                await subscribeToEvent(user.uid, evento);
                setSubscribedEvents((prev) => ({ ...prev, [evento.id]: true }));
            }
        } catch (error) { console.log(error); }
    }

    const formatarNumero = (num) => {
        if (!num) return "0";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    const formatarData = (timestamp) => {
        if (!timestamp) return "Agora";
        const data = timestamp.toDate?.() || new Date(timestamp);
        const diff = Date.now() - data.getTime();
        const min = Math.floor(diff / 60000);
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);

        if (min < 1) return "Agora";
        if (min < 60) return `${min}m`;
        if (h < 24) return `${h}h`;
        if (d < 7) return `${d}d`;
        return data.toLocaleDateString("pt-BR");
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <LinearGradient
                colors={["#18122B", "#10131F", Colors.background]}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <Animated.View entering={FadeInDown.springify()} style={styles.headerContent}>
                    <View>
                        <Text style={styles.logo}>MonitoraCult</Text>
                        <Text style={styles.subtitle}>Descubra eventos incríveis ✨</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate("CriarPost")}>
                            <MaterialCommunityIcons name="plus-box-outline" size={26} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate("EventosApp")}>
                            <MaterialCommunityIcons name="bell-outline" size={25} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>

            {/* LISTA DO FEED MULTIPLATAFORMA */}
            <FlatList
                data={eventos}
                refreshing={refreshing}
                onRefresh={onRefresh}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingTop: 16 }}
                renderItem={({ item, index }) => (
                    <EventoCard
                        item={item}
                        index={index}
                        isLiked={likedIds.includes(getFeedItemKey(item.id, item.type))}
                        isAdmin={isAdmin}
                        currentUserId={user?.uid}
                        formatarNumero={formatarNumero}
                        formatarData={formatarData}
                        onToggleLike={toggleLike}
                        onOpenComments={abrirComentarios}
                        onShare={handleShare} 
                        toggleNotification={toggleNotification}
                        subscribedEvents={subscribedEvents}
                        onNavigate={(targetItem) => {
                            if (targetItem.type === "evento") {
                                navigation.navigate("Detalhes", { evento: targetItem });
                            } else {
                                abrirComentarios(targetItem);
                            }
                        }}
                    />
                )}
            />

            {/* MODAL COMENTÁRIOS */}
            <Modal visible={!!selectedItem} transparent animationType="slide" onRequestClose={fecharComentarios}>
                <KeyboardAvoidingView style={styles.commentsModalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <TouchableOpacity style={styles.commentsBackdrop} activeOpacity={1} onPress={fecharComentarios} />
                    <View style={[styles.commentsSheet, { paddingBottom: insets.bottom + 14 }]}>
                        <View style={styles.commentsHandle} />
                        <View style={styles.commentsHeader}>
                            <View style={styles.commentsTitleBox}>
                                <Text style={styles.commentsTitle}>Comentários</Text>
                                <Text style={styles.commentsSubtitle} numberOfLines={1}>
                                    {selectedItem?.tituloEvento || selectedItem?.descricao || "Publicação"}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.closeCommentsBtn} onPress={fecharComentarios}>
                                <MaterialCommunityIcons name="close" size={22} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {commentsLoading ? (
                            <View style={styles.commentsLoading}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={comentarios}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.commentsList}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <View style={styles.emptyComments}>
                                        <MaterialCommunityIcons name="comment-text-outline" size={38} color={Colors.textMuted} />
                                        <Text style={styles.emptyCommentsTitle}>Nenhum comentário ainda</Text>
                                        <Text style={styles.emptyCommentsText}>Seja a primeira pessoa a comentar.</Text>
                                    </View>
                                }
                                renderItem={({ item }) => (
                                    <View style={styles.commentItem}>
                                        <Image
                                            source={{ uri: item.userPhoto || item.foto || "https://i.pravatar.cc/100" }}
                                            style={styles.commentAvatar}
                                        />
                                        <View style={styles.commentBubble}>
                                            <View style={styles.commentTopRow}>
                                                <Text style={styles.commentAuthor} numberOfLines={1}>
                                                    {item.userName || item.nome || "Usuário"}
                                                </Text>
                                                <Text style={styles.commentDate}>{formatarData(item.createdAt)}</Text>
                                            </View>
                                            <Text style={styles.commentBody}>{item.texto}</Text>
                                        </View>
                                    </View>
                                )}
                            />
                        )}

                        <View style={styles.commentComposer}>
                            <Image source={{ uri: foto || "https://i.pravatar.cc/100" }} style={styles.composerAvatar} />
                            <View style={styles.commentInputWrapper}>
                                <TextInput
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    placeholder={`Comentar como ${nome || "Usuário"}`}
                                    placeholderTextColor={Colors.textMuted}
                                    style={styles.commentInput}
                                    multiline
                                    maxLength={500}
                                />
                                <TouchableOpacity
                                    style={[styles.sendCommentBtn, (!commentText.trim() || sendingComment) && styles.sendCommentBtnDisabled]}
                                    disabled={!commentText.trim() || sendingComment}
                                    onPress={enviarComentario}
                                >
                                    {sendingComment ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <MaterialCommunityIcons name="send" size={18} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
    header: { paddingBottom: 22 },
    headerContent: { paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    logo: { color: "#FFF", fontSize: 32, fontWeight: "bold" },
    subtitle: { color: Colors.textSecondary, marginTop: 6 },
    headerRight: { flexDirection: "row", gap: 6 },
    headerIconBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)" },
    card: { backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 22, borderRadius: 28, overflow: "hidden" },
    cardHeader: { padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
    avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
    userName: { color: Colors.textPrimary, fontWeight: "700", fontSize: 15 },
    locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    locationText: { color: Colors.textMuted, fontSize: 12, marginLeft: 4 },
    headerActions: { alignItems: "flex-end" },
    dateBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, overflow: "hidden" },
    dateText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
    imageWrapper: { width: "100%", height: 420, backgroundColor: "#000" },
    mainImage: { width: "100%", height: "100%" },
    imageOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 18 },
    eventDateBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, overflow: "hidden", marginBottom: 10 },
    eventDateText: { color: "#FFF", marginLeft: 5, fontSize: 11, fontWeight: "700" },
    ticketTypeBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(124,58,237,0.86)", marginBottom: 10, gap: 5 },
    ticketTypeText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
    eventTitle: { color: "#FFF", fontSize: 26, fontWeight: "bold" },
    description: { color: "rgba(255,255,255,0.75)", marginTop: 10, lineHeight: 20, fontSize: 13 },
    actions: { paddingHorizontal: 8, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    leftActions: { flexDirection: "row", alignItems: "center" },
    rightActions: { flexDirection: "row", alignItems: "center", marginRight: 8 },
    actionBtn: { padding: 8 },
    metricsContainer: { paddingHorizontal: 16, paddingBottom: 16 },
    likesText: { color: Colors.textPrimary, fontWeight: "700", fontSize: 13 },
    commentsText: { color: Colors.textSecondary, fontSize: 13, marginTop: 6 },
    commentsModalOverlay: { flex: 1, justifyContent: "flex-end" },
    commentsBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.68)" },
    commentsSheet: { maxHeight: "82%", minHeight: "58%", backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: Colors.glassBorder, overflow: "hidden" },
    commentsHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.22)", marginTop: 10, marginBottom: 12 },
    commentsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
    commentsTitleBox: { flex: 1, paddingRight: 12 },
    commentsTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "800" },
    commentsSubtitle: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
    closeCommentsBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)" },
    commentsLoading: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
    commentsList: { paddingHorizontal: 18, paddingVertical: 14, flexGrow: 1 },
    emptyComments: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 44 },
    emptyCommentsTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 12 },
    emptyCommentsText: { color: Colors.textMuted, fontSize: 13, marginTop: 6 },
    commentItem: { flexDirection: "row", marginBottom: 14 },
    commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: Colors.background },
    commentBubble: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)" },
    commentTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 5 },
    commentAuthor: { flex: 1, color: Colors.textPrimary, fontSize: 13, fontWeight: "800", paddingRight: 8 },
    commentDate: { color: Colors.textMuted, fontSize: 11 },
    commentBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
    commentComposer: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
    composerAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10, marginBottom: 3, backgroundColor: Colors.background },
    commentInputWrapper: { flex: 1, minHeight: 46, maxHeight: 112, flexDirection: "row", alignItems: "flex-end", borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingLeft: 14, paddingRight: 5, paddingVertical: 5 },
    commentInput: { flex: 1, color: Colors.textPrimary, fontSize: 14, maxHeight: 96, paddingTop: 8, paddingBottom: 8 },
    sendCommentBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, marginLeft: 6 },
    sendCommentBtnDisabled: { opacity: 0.45 },
});