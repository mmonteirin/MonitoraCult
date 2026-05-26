import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useColors } from "../context/ThemeContext";
import { getCreatorMetrics } from "../services/profileService";

/**
 * Componente para exibir estatísticas do criador
 */
export const CreatorStats = ({ userId, followers, following }) => {
  const colors = useColors();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await getCreatorMetrics(userId);
        setMetrics(data);
      } catch (error) {
        console.log("Erro ao carregar métricas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [userId]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Seguidores */}
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatNumber(followers || 0)}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Seguidores</Text>
      </View>

      {/* Eventos */}
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatNumber(metrics?.totalEventos || 0)}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Eventos</Text>
      </View>

      {/* Likes */}
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatNumber(metrics?.totalLikes || 0)}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Likes</Text>
      </View>

      {/* Engagement Rate */}
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{(metrics?.engagementRate * 100 || 0).toFixed(1)}%</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Engagement</Text>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  loading: {
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
};
