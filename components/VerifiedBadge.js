import React from "react";
import { View, Text, Tooltip } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../context/ThemeContext";

/**
 * Badge de verificação para usuários verificados
 */
export const VerifiedBadge = ({ badgeType, size = 18 }) => {
  const colors = useColors();
  if (!badgeType) return null;

  const badges = {
    creator: {
      icon: "star",
      color: colors.warning,
      label: "Criador Verificado",
      tooltip: "Este é um criador verificado",
    },
    partner: {
      icon: "shield-check",
      color: colors.primary,
      label: "Parceiro Oficial",
      tooltip: "Este é um parceiro oficial do MonitoraCult",
    },
  };

  const badge = badges[badgeType];
  if (!badge) return null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <MaterialCommunityIcons
        name={badge.icon}
        size={size}
        color={badge.color}
      />
      <Text style={{ fontSize: 10, color: badge.color, fontWeight: "bold" }}>
        {badge.label}
      </Text>
    </View>
  );
};

/**
 * Badge compacto (apenas ícone) para usar ao lado de nomes
 */
export const VerifiedBadgeIcon = ({ badgeType, size = 14 }) => {
  const colors = useColors();
  if (!badgeType) return null;

  const badges = {
    creator: {
      icon: "star",
      color: colors.warning,
    },
    partner: {
      icon: "shield-check",
      color: colors.primary,
    },
  };

  const badge = badges[badgeType];
  if (!badge) return null;

  return <MaterialCommunityIcons name={badge.icon} size={size} color={badge.color} />;
};
