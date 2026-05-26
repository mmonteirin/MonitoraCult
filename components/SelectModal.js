import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Colors,
  Radius,
  Typography,
} from "../styles/Colors";

export default function SelectModal({
  label,
  value,
  options = [],
  onSelect,
}) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  /* 🔥 ANIMAÇÃO iOS STYLE */
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(40);
      scale.setValue(0.95);
      setSearch("");
    }
  }, [visible]);

  /* 🔍 FILTRO */
  const filtered = useMemo(() => {
    return options.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, options]);

  return (
    <>
      {/* LABEL */}
      <Text style={styles.label}>
        {label}
      </Text>

      {/* INPUT */}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.trigger}
      >
        <Text
          style={[
            styles.triggerText,
            !value && styles.placeholder,
          ]}
        >
          {value || "Selecione..."}
        </Text>

        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={Colors.primaryLight}
        />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={visible} transparent animationType="none">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <Animated.View
            style={[
              styles.modal,
              {
              opacity,
              transform: [{ translateY }, { scale }],
              },
            ]}
          >
            {/* 🔍 BUSCA */}
            <View
              style={styles.searchBox}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={Colors.textMuted}
              />

              <TextInput
                placeholder="Buscar..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>

            {/* LISTA */}
            {filtered.map((item) => {
              const ativo = value === item;

              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                  style={[
                    styles.option,
                    ativo && styles.optionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      ativo && styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* ❌ FECHAR */}
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: Colors.textSecondary,
    marginBottom: 8,
    fontFamily: Typography.medium,
    fontSize: 13,
  },
  trigger: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  triggerText: {
    color: Colors.textPrimary,
    fontFamily: Typography.medium,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlayStronger,
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.xl,
    padding: 15,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    padding: 10,
    marginLeft: 6,
    fontFamily: Typography.regular,
  },
  option: {
    padding: 14,
    borderRadius: Radius.md,
    marginBottom: 6,
  },
  optionActive: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    color: Colors.textPrimary,
    fontFamily: Typography.regular,
  },
  optionTextActive: {
    fontFamily: Typography.bold,
  },
  cancelButton: {
    marginTop: 10,
    padding: 12,
    alignItems: "center",
  },
  cancelText: {
    color: Colors.textSecondary,
    fontFamily: Typography.medium,
  },
});
