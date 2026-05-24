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
  Colors,
  Gradients,
  Radius,
} from "../styles/Colors";

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
  // Ajuste de retrocompatibilidade para prop `danger`
  const activeType = danger ? "danger" : type;

  // Configurações visuais por tipo de modal
  const getTypeConfig = () => {
    switch (activeType) {
      case "danger":
      case "error":
        return {
          icon: "alert-circle",
          iconColor: Colors.error,
          iconBg: "rgba(239,68,68,0.12)",
          cardGradient: ["rgba(239,68,68,0.15)", "rgba(127,29,29,0.05)"],
          btnGradient: Gradients.danger,
        };
      case "success":
        return {
          icon: "check-circle",
          iconColor: Colors.success,
          iconBg: "rgba(34,197,94,0.12)",
          cardGradient: ["rgba(34,197,94,0.15)", "rgba(20,83,45,0.05)"],
          btnGradient: Gradients.success,
        };
      case "warning":
        return {
          icon: "alert",
          iconColor: Colors.warning,
          iconBg: "rgba(245,158,11,0.12)",
          cardGradient: ["rgba(245,158,11,0.15)", "rgba(120,53,4,0.05)"],
          btnGradient: Gradients.warning,
        };
      case "info":
      default:
        return {
          icon: "information",
          iconColor: Colors.primary,
          iconBg: Colors.primarySoft,
          cardGradient: ["rgba(108,92,231,0.15)", "rgba(49,46,129,0.05)"],
          btnGradient: Gradients.primaryButton,
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
        <BlurView intensity={50} tint="dark" style={styles.modalCard}>
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
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name={modalIconName}
                        size={18}
                        color="#FFF"
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayStronger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  modalCard: {
    width: "100%",
    borderRadius: Radius.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
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
    color: Colors.textPrimary,
    fontSize: 22,
    textAlign: "center",
  },

  modalText: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.glass,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
  },
});
