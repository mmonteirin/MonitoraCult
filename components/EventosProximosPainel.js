import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { formatarDistancia } from "../services/mapaVivoService";

const formatarHorario = (date) => {
  if (!date) return "Horário a confirmar";
  const value = date?.toDate ? date.toDate() : new Date(date);
  if (Number.isNaN(value.getTime())) return "Horário a confirmar";
  return value.toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EventosProximosPainel({
  eventos = [],
  eventoSelecionado,
  onPress,
  onCheckIn,
  onDetalhes,
  onDirections,
}) {
  const ordenados = [...eventos]
    .filter((evento) => evento?.location)
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    .slice(0, 8);

  if (!ordenados.length) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name="map-search-outline"
          size={34}
          color={Colors.textMuted}
        />
        <Text style={styles.emptyTitle}>Nenhum evento próximo agora</Text>
        <Text style={styles.emptyText}>
          Ajuste o filtro ao vivo ou atualize o mapa para buscar novas atividades.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={ordenados}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const selected = eventoSelecionado?.id === item.id;

        return (
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={() => onPress?.(item)}
            style={[styles.eventCard, selected && styles.eventCardSelected]}
          >
            <View
              style={[
                styles.eventAccent,
                { backgroundColor: item.coverColor || Colors.primary },
              ]}
            />

            <View style={styles.eventBody}>
              <View style={styles.eventTopRow}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.distanceBadge}>
                  <MaterialCommunityIcons
                    name="map-marker-distance"
                    size={12}
                    color={Colors.primary}
                  />
                  <Text style={styles.distanceText}>
                    {formatarDistancia(item.distance)}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="tag-outline"
                  size={13}
                  color={Colors.textMuted}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.genre || "Cultura"}
                </Text>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={13}
                  color={Colors.textMuted}
                  style={styles.metaIcon}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {formatarHorario(item.date)}
                </Text>
              </View>

              <View style={styles.footerRow}>
                <View style={styles.checkInCount}>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={14}
                    color={Colors.success}
                  />
                  <Text style={styles.checkInText}>
                    {item.checkInsCount || 0} check-ins
                  </Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => onDirections?.(item)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="directions"
                      size={18}
                      color={Colors.textPrimary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconButton, styles.checkInButton]}
                    onPress={() => onCheckIn?.(item)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 26,
    gap: 10,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  eventCardSelected: {
    borderColor: Colors.primary,
  },
  eventAccent: {
    width: 4,
  },
  eventBody: {
    flex: 1,
    padding: 12,
  },
  eventTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: "PoppinsSemiBold",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(108,92,231,0.14)",
  },
  distanceText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: "PoppinsSemiBold",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  metaIcon: {
    marginLeft: 10,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
    flexShrink: 1,
    fontFamily: "PoppinsRegular",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  checkInCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  checkInText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: "PoppinsRegular",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkInButton: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 34,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    marginTop: 10,
    fontFamily: "PoppinsSemiBold",
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    fontFamily: "PoppinsRegular",
  },
});
