import React from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Typography } from "../../styles/Colors";
import { useTheme } from "../../context/ThemeContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  icon = "arrow-right",
  onAction,
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>

        {!!subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {!!onAction && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.action}
          onPress={onAction}
        >
          {!!actionLabel && (
            <Text style={styles.actionText}>
              {actionLabel}
            </Text>
          )}

          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={colors.primaryLight}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    marginTop: 24,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  copy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: c.textPrimary,
    fontSize: 22,
    fontFamily: Typography.bold,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 13,
    marginTop: 4,
    fontFamily: Typography.regular,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: c.glass,
  },
  actionText: {
    color: c.primaryLight,
    fontSize: 12,
    fontFamily: Typography.semiBold,
  },
});
}
