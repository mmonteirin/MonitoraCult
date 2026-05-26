import React, { useMemo, useState } from "react";
import {
    View,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Modal,
    Pressable,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import AppText from "../components/AppText";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { Status } from "../styles/Colors";

export default function TelaPerfil({ navigation }) {
    const { foto, nome, user, logout } = useAuth();
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const styles = useThemedStyles(createPerfilStyles);
    const blurTint = isDark ? "dark" : "light";

    const headerGradient = useMemo(
        () => [colors.surfaceMuted, colors.backgroundDeep, colors.backgroundSecondary],
        [colors]
    );

    const go = (screen) => {
        navigation.navigate("Perfil", { screen });
    };

    const handleLogout = async () => {
        try {
            setLoadingLogout(true);
            await logout();
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingLogout(false);
            setShowLogoutModal(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <LinearGradient
                    colors={headerGradient}
                    style={[styles.header, { paddingTop: insets.top + 10 }]}
                >
                    <View style={styles.profileRow}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{
                                    uri: foto || user?.photoURL || "https://i.pravatar.cc/150",
                                }}
                                style={styles.avatar}
                            />
                            <View style={styles.onlineDot} />
                        </View>

                        <View style={styles.infoContainer}>
                            <AppText style={styles.nome}>
                                {nome || user?.displayName || "Usuário"}
                            </AppText>
                            <AppText style={styles.email}>
                                {user?.email ?? "Email não disponível"}
                            </AppText>
                            <View style={styles.badge}>
                                <MaterialCommunityIcons
                                    name="shield-check"
                                    size={14}
                                    color={colors.primaryLight}
                                />
                                <AppText style={styles.badgeText}>Conta ativa</AppText>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.menu}>
                    <AppText style={styles.section}>Conta</AppText>

                    {[
                        {
                            icon: "account-edit-outline",
                            title: "Editar Perfil",
                            sub: "Atualize suas informações",
                            onPress: () => go("PerfilEditar"),
                        },
                        {
                            icon: "lock-reset",
                            title: "Alterar Senha",
                            sub: "Mantenha sua conta segura",
                            onPress: () => go("ResetPassword"),
                        },
                        {
                            icon: "cog-outline",
                            title: "Configurações",
                            sub: "Privacidade, notificações e suporte",
                            onPress: () => navigation.navigate("Configuracoes"),
                        },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.title}
                            activeOpacity={0.85}
                            style={styles.card}
                            onPress={item.onPress}
                        >
                            <View style={styles.iconBox}>
                                <MaterialCommunityIcons
                                    name={item.icon}
                                    size={22}
                                    color={colors.primary}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.texto}>{item.title}</AppText>
                                <AppText style={styles.subtexto}>{item.sub}</AppText>
                            </View>
                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={24}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>
                    ))}

                    <AppText style={styles.section}>Atividade</AppText>

                    {[
                        {
                            icon: "history",
                            title: "Histórico de Ocorrências",
                            sub: "Visualize atividades recentes",
                            onPress: () => go("Ocorrencias"),
                        },
                        {
                            icon: "map-marker-multiple-outline",
                            title: "Locais Visitados",
                            sub: "Veja seus espaços culturais favoritos",
                            onPress: () => go("LocaisVisitados"),
                        },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.title}
                            activeOpacity={0.85}
                            style={styles.card}
                            onPress={item.onPress}
                        >
                            <View style={styles.iconBox}>
                                <MaterialCommunityIcons
                                    name={item.icon}
                                    size={22}
                                    color={colors.primary}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.texto}>{item.title}</AppText>
                                <AppText style={styles.subtexto}>{item.sub}</AppText>
                            </View>
                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={24}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setShowLogoutModal(true)}
                        style={styles.logout}
                    >
                        <View style={[styles.iconBox, styles.logoutIcon]}>
                            <MaterialCommunityIcons
                                name="logout"
                                size={22}
                                color={colors.error}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.logoutText}>Sair da Conta</AppText>
                            <AppText style={styles.subtexto}>
                                Encerrar sessão do aplicativo
                            </AppText>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={showLogoutModal}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable
                        style={StyleSheet.absoluteFillObject}
                        onPress={() => setShowLogoutModal(false)}
                    />
                    <BlurView intensity={60} tint={blurTint} style={styles.modalCard}>
                        <LinearGradient
                            colors={[`${colors.error}1F`, "transparent"]}
                            style={styles.modalGradient}
                        >
                            <View style={styles.modalIcon}>
                                <MaterialCommunityIcons
                                    name="logout"
                                    size={34}
                                    color={colors.error}
                                />
                            </View>
                            <AppText style={styles.modalTitle}>Sair da conta?</AppText>
                            <AppText style={styles.modalText}>
                                Você realmente deseja encerrar sua sessão ativa no aplicativo?
                            </AppText>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.cancelBtn}
                                    onPress={() => setShowLogoutModal(false)}
                                >
                                    <AppText style={styles.cancelText}>Cancelar</AppText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    style={styles.confirmBtn}
                                    onPress={handleLogout}
                                    disabled={loadingLogout}
                                >
                                    <LinearGradient
                                        colors={[Status.error, Status.errorDark]}
                                        style={styles.confirmGradient}
                                    >
                                        {loadingLogout ? (
                                            <ActivityIndicator
                                                size="small"
                                                color={colors.onPrimary}
                                            />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="logout"
                                                    size={18}
                                                    color={colors.onPrimary}
                                                />
                                                <AppText style={styles.confirmText}>
                                                    Sair
                                                </AppText>
                                            </>
                                        )}
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

function createPerfilStyles(c) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        header: {
            paddingHorizontal: 20,
            paddingBottom: 24,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
        },
        profileRow: { flexDirection: "row", alignItems: "center" },
        avatarWrapper: { position: "relative" },
        avatar: {
            width: 78,
            height: 78,
            borderRadius: 39,
            borderWidth: 3,
            borderColor: c.primary,
        },
        onlineDot: {
            position: "absolute",
            right: 2,
            bottom: 2,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: c.success,
            borderWidth: 2,
            borderColor: c.surfaceMuted,
        },
        infoContainer: { marginLeft: 14, flex: 1 },
        nome: { color: c.textPrimary, fontSize: 20, fontWeight: "bold" },
        email: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
        badge: {
            marginTop: 10,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            height: 26,
            borderRadius: 14,
            backgroundColor: c.primarySoft,
        },
        badgeText: {
            color: c.primaryLight,
            fontSize: 12,
            marginLeft: 6,
            fontWeight: "600",
        },
        menu: { padding: 18 },
        section: {
            color: c.textMuted,
            fontSize: 13,
            marginBottom: 12,
            marginTop: 8,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.5,
        },
        card: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.glass,
            padding: 16,
            borderRadius: 22,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: c.glassBorder,
        },
        iconBox: {
            width: 46,
            height: 46,
            borderRadius: 16,
            backgroundColor: c.primarySoft,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 14,
        },
        texto: { color: c.textPrimary, fontSize: 15, fontWeight: "600" },
        subtexto: { color: c.textMuted, fontSize: 12, marginTop: 3 },
        logout: {
            marginTop: 12,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(239,68,68,0.06)",
            padding: 16,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.15)",
        },
        logoutIcon: { backgroundColor: "rgba(239,68,68,0.1)" },
        logoutText: { color: c.error, fontSize: 15, fontWeight: "bold" },
        modalOverlay: {
            flex: 1,
            backgroundColor: c.overlayStronger,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
        },
        modalCard: {
            width: "100%",
            borderRadius: 28,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: c.glassBorder,
        },
        modalGradient: { padding: 24, alignItems: "center" },
        modalIcon: {
            width: 72,
            height: 72,
            borderRadius: 24,
            backgroundColor: "rgba(239,68,68,0.1)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
        },
        modalTitle: { color: c.textPrimary, fontSize: 22, fontWeight: "bold" },
        modalText: {
            color: c.textSecondary,
            textAlign: "center",
            marginTop: 10,
            fontSize: 14,
            lineHeight: 22,
            paddingHorizontal: 12,
        },
        modalButtons: { flexDirection: "row", marginTop: 24, width: "100%", gap: 12 },
        cancelBtn: {
            flex: 1,
            height: 50,
            borderRadius: 16,
            backgroundColor: c.glass,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: c.glassBorder,
        },
        cancelText: { color: c.textPrimary, fontWeight: "600", fontSize: 14 },
        confirmBtn: { flex: 1, height: 50, borderRadius: 16, overflow: "hidden" },
        confirmGradient: {
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
        },
        confirmText: { color: c.onPrimary, fontWeight: "bold", fontSize: 14 },
    });
}
