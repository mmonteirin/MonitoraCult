// components/ConfirmModal.js

import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppText from "./AppText";
import {
  Radius,
  getGradients,
} from "../styles/Colors";
import { useTheme } from "../context/ThemeContext";

export default function ConfirmModal({
  visible,
  title = "Confirmar ação",
  message = "Deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "info", // "info" | "success" | "error" | "danger" | "warning"
  icon,
  danger = false, // Para retrocompatibilidade, se danger for true, type se torna "danger"
  onConfirm,
  onCancel,
  loading = false,
}) {
  const { colors, isDark } = useTheme();
  const gradients = getGradients(colors, isDark);
  const styles = createStyles(colors);
  // Ajuste de retrocompatibilidade para prop `danger`
  const activeType = danger ? "danger" : type;

  // Configurações visuais por tipo de modal
  const getTypeConfig = () => {
    switch (activeType) {
      case "danger":
      case "error":
        return {
          icon: "alert-circle",
          iconColor: colors.error,
          iconBg: "rgba(239,68,68,0.12)",
          cardGradient: ["rgba(239,68,68,0.15)", "rgba(127,29,29,0.05)"],
          btnGradient: gradients.danger,
        };
      case "success":
        return {
          icon: "check-circle",
          iconColor: colors.success,
          iconBg: "rgba(34,197,94,0.12)",
          cardGradient: ["rgba(34,197,94,0.15)", "rgba(20,83,45,0.05)"],
          btnGradient: gradients.success,
        };
      case "warning":
        return {
          icon: "alert",
          iconColor: colors.warning,
          iconBg: "rgba(245,158,11,0.12)",
          cardGradient: ["rgba(245,158,11,0.15)", "rgba(120,53,4,0.05)"],
          btnGradient: gradients.warning,
        };
      case "info":
      default:
        return {
          icon: "information",
          iconColor: colors.primary,
          iconBg: colors.primarySoft,
          cardGradient: ["rgba(108,92,231,0.15)", "rgba(49,46,129,0.05)"],
          btnGradient: gradients.primaryButton,
        };
    }
  };

  const config = getTypeConfig();
  const modalIconName = icon || config.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={50} tint={isDark ? "dark" : "light"} style={styles.modalCard}>
          <LinearGradient colors={config.cardGradient} style={styles.modalGradient}>
            {/* Ícone */}
            <View style={[styles.modalIcon, { backgroundColor: config.iconBg }]}>
              <MaterialCommunityIcons
                name={modalIconName}
                size={34}
                color={config.iconColor}
              />
            </View>

            {/* Título */}
            <AppText style={styles.modalTitle} weight="bold">
              {title}
            </AppText>

            {/* Mensagem */}
            <AppText style={styles.modalText}>
              {message}
            </AppText>

            {/* Botões */}
            <View style={styles.modalButtons}>
              {/* Botão Cancelar (Renderiza apenas se onCancel for provido) */}
              {onCancel && (
                <Pressable style={styles.cancelBtn} onPress={onCancel}>
                  <AppText style={styles.cancelText} weight="medium">
                    {cancelText}
                  </AppText>
                </Pressable>
              )}

              {/* Botão Confirmar */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.confirmBtn}
                onPress={onConfirm}
                disabled={loading}
              >
                <LinearGradient colors={config.btnGradient} style={styles.confirmGradient}>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name={modalIconName}
                        size={18}
                        color={colors.onPrimary}
                      />
                      <AppText style={styles.confirmText} weight="bold">
                        {confirmText}
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
  );
}

const createStyles = (colors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayStronger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  modalCard: {
    width: "100%",
    borderRadius: Radius.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  modalGradient: {
    padding: 28,
    alignItems: "center",
  },

  modalIcon: {
    width: 78,
    height: 78,
    borderRadius: Radius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  modalTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    textAlign: "center",
  },

  modalText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
  },

  modalButtons: {
    flexDirection: "row",
    marginTop: 26,
    width: "100%",
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: colors.glass,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: colors.textPrimary,
  },

  confirmBtn: {
    flex: 1,
  },

  confirmGradient: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  confirmText: {
    color: colors.onPrimary,
  },
});
