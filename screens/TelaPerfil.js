import React, { useState } from "react";
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
import { Colors } from "../styles/Colors";

export default function TelaPerfil({ navigation }) {
    const { foto, nome, user, logout } = useAuth();
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const insets = useSafeAreaInsets();

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
                contentContainerStyle={{
                    paddingBottom: 120,
                }}
            >
                {/* HEADER */}
                <LinearGradient
                    colors={["#111827", "#1E1B4B", "#0F172A"]}
                    style={[
                        styles.header,
                        {
                            paddingTop: insets.top + 10,
                        },
                    ]}
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
                                    color="#A78BFA"
                                />
                                <AppText style={styles.badgeText}>
                                    Conta ativa
                                </AppText>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                {/* MENU CONTAS E ATIVIDADES */}
                <View style={styles.menu}>
                    <AppText style={styles.section}>Conta</AppText>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.card}
                        onPress={() => go("PerfilEditar")}
                    >
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons
                                name="account-edit-outline"
                                size={22}
                                color={Colors.primary}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.texto}>Editar Perfil</AppText>
                            <AppText style={styles.subtexto}>Atualize suas informações</AppText>
                        </View>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={24}
                            color="rgba(255,255,255,0.35)"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.card}
                        onPress={() => go("ResetPassword")}
                    >
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons
                                name="lock-reset"
                                size={22}
                                color={Colors.primary}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.texto}>Alterar Senha</AppText>
                            <AppText style={styles.subtexto}>Mantenha sua conta segura</AppText>
                        </View>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={24}
                            color="rgba(255,255,255,0.35)"
                        />
                    </TouchableOpacity>

                    <AppText style={styles.section}>Atividade</AppText>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.card}
                        onPress={() => go("Ocorrencias")}
                    >
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons
                                name="history"
                                size={22}
                                color={Colors.primary}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.texto}>Histórico de Ocorrências</AppText>
                            <AppText style={styles.subtexto}>Visualize atividades recentes</AppText>
                        </View>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={24}
                            color="rgba(255,255,255,0.35)"
                        />
                    </TouchableOpacity>

                    {/* BOTAO LOGOUT */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setShowLogoutModal(true)}
                        style={styles.logout}
                    >
                        <View style={[styles.iconBox, styles.logoutIcon]}>
                            <MaterialCommunityIcons
                                name="logout"
                                size={22}
                                color="#EF4444"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.logoutText}>Sair da Conta</AppText>
                            <AppText style={styles.subtexto}>Encerrar sessão do aplicativo</AppText>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* 🔥 MODAL PADRONIZADO IGUAL AO DA TELA FEED */}
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
                    
                    <BlurView intensity={60} tint="dark" style={styles.modalCard}>
                        <LinearGradient
                            colors={["rgba(239,68,68,0.12)", "rgba(15,15,20,0)"]}
                            style={styles.modalGradient}
                        >
                            <View style={styles.modalIcon}>
                                <MaterialCommunityIcons
                                    name="logout"
                                    size={34}
                                    color="#EF4444"
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
                                        colors={["#EF4444", "#DC2626"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.confirmGradient}
                                    >
                                        {loadingLogout ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons
                                                    name="logout"
                                                    size={18}
                                                    color="#FFF"
                                                />
                                                <AppText style={styles.confirmText}>Sair</AppText>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#070B14" },
    header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    profileRow: { flexDirection: "row", alignItems: "center" },
    avatarWrapper: { position: "relative" },
    avatar: { width: 78, height: 78, borderRadius: 39, borderWidth: 3, borderColor: "#7C3AED" },
    onlineDot: { position: "absolute", right: 2, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#22C55E", borderWidth: 2, borderColor: "#111827" },
    infoContainer: { marginLeft: 14, flex: 1 },
    nome: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
    email: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 },
    badge: { marginTop: 10, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", paddingHorizontal: 10, height: 26, borderRadius: 14, backgroundColor: "rgba(124,58,237,0.16)" },
    badgeText: { color: "#C4B5FD", fontSize: 12, marginLeft: 6, fontWeight: "600" },
    
    menu: { padding: 18 },
    section: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 12, marginTop: 8, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
    card: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", padding: 16, borderRadius: 22, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
    iconBox: { width: 46, height: 46, borderRadius: 16, backgroundColor: "rgba(124,58,237,0.12)", justifyContent: "center", alignItems: "center", marginRight: 14 },
    texto: { color: "#FFF", fontSize: 15, fontWeight: "600" },
    subtexto: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 3 },
    
    logout: { marginTop: 12, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239,68,68,0.06)", padding: 16, borderRadius: 22, borderWidth: 1, borderColor: "rgba(239,68,68,0.15)" },
    logoutIcon: { backgroundColor: "rgba(239,68,68,0.1)" },
    logoutText: { color: "#EF4444", fontSize: 15, fontWeight: "bold" },

    /* ESTILIZAÇÃO DO MODAL INTEGRADO E COMPATÍVEL */
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
    modalCard: { width: "100%", borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
    modalGradient: { padding: 24, alignItems: "center" },
    modalIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(239,68,68,0.1)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    modalTitle: { color: "#FFF", fontSize: 22, fontWeight: "bold" },
    modalText: { color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 10, fontSize: 14, lineHeight: 22, paddingHorizontal: 12 },
    modalButtons: { flexDirection: "row", marginTop: 24, width: "100%", gap: 12 },
    cancelBtn: { flex: 1, height: 50, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
    cancelText: { color: "#FFF", fontWeight: "600", fontSize: 14 },
    confirmBtn: { flex: 1, height: 50, borderRadius: 16, overflow: "hidden" },
    confirmGradient: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
    confirmText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
});