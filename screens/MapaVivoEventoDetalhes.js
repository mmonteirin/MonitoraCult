import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import {
  getMapEventDetails,
  formatarDistancia,
} from "../services/mapaVivoService";
import CheckInCard from "../components/CheckInCard";

const formatarDataEvento = (date) => {
  if (!date) return "Data não definida";
  const value = date?.toDate ? date.toDate() : new Date(date);
  if (Number.isNaN(value.getTime())) return "Data não definida";
  return value.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function MapaVivoEventoDetalhes({ route, navigation }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventDetails();
  }, []);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const details = await getMapEventDetails(eventId);
      setEvent(details);
    } catch (error) {
      console.error("Erro ao carregar evento:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira este evento cultural: ${event?.title} - ${event?.genre}`,
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  const handleCheckIn = () => {
    navigation.navigate("MapaVivoCheckIn", {
      eventId,
      eventTitle: event?.title,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Evento não encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <MaterialCommunityIcons
            name="share-variant"
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNER */}
        {event.image ? (
          <Image source={{ uri: event.image }} style={styles.banner} />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <MaterialCommunityIcons
              name="map-marker-multiple"
              size={60}
              color={colors.primary}
            />
          </View>
        )}

        {/* EVENT INFO */}
        <View style={styles.infoSection}>
          {/* GENRE TAG */}
          <View style={styles.genreTag}>
            <MaterialCommunityIcons
              name="tag"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.genreText}>{event.genre}</Text>
          </View>

          {/* TITLE */}
          <Text style={styles.title}>{event.title}</Text>

          {/* LOCATION */}
          <View style={styles.locationSection}>
            <MaterialCommunityIcons
              name="map-marker"
              size={18}
              color={colors.primary}
            />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Localização</Text>
              <Text style={styles.locationValue} numberOfLines={2}>
                {event.address || "Sem endereço"}
              </Text>
              <Text style={styles.distance}>
                {formatarDistancia(event.distance || 0)} de você
              </Text>
            </View>
          </View>

          {/* TIME */}
          <View style={styles.timeSection}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={colors.primary}
            />
            <View>
              <Text style={styles.timeLabel}>Horário</Text>
              <Text style={styles.timeValue}>
                {formatarDataEvento(event.date)}
              </Text>
            </View>
          </View>

          {/* DESCRIPTION */}
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Sobre</Text>
            <Text style={styles.descriptionText}>
              {event.description || "Sem descrição disponível"}
            </Text>
          </View>

          {/* STATS */}
          <View style={styles.statsSection}>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="heart"
                size={20}
                color={colors.error}
              />
              <View>
                <Text style={styles.statValue}>
                  {event.likesCount || 0}
                </Text>
                <Text style={styles.statLabel}>Curtidas</Text>
              </View>
            </View>

            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.success}
              />
              <View>
                <Text style={styles.statValue}>
                  {event.checkInsCount || 0}
                </Text>
                <Text style={styles.statLabel}>Check-ins</Text>
              </View>
            </View>

            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="people"
                size={20}
                color={colors.primary}
              />
              <View>
                <Text style={styles.statValue}>
                  {event.attendeesCount || 0}
                </Text>
                <Text style={styles.statLabel}>Pessoas</Text>
              </View>
            </View>
          </View>

          {/* CONTACT */}
          {event.contact && (
            <View style={styles.contactSection}>
              <Text style={styles.sectionTitle}>Contato</Text>
              <TouchableOpacity
                style={styles.contactButton}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="phone"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.contactText}>{event.contact}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ACTION BUTTONS */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="heart-outline"
                size={20}
                color={colors.error}
              />
              <Text style={styles.actionButtonText}>Curtir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.checkInActionButton,
              ]}
              onPress={handleCheckIn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.textPrimary}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  styles.checkInActionButtonText,
                ]}
              >
                Check-in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: c.surface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: c.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: c.textMuted,
  },
  content: {
    flex: 1,
  },
  banner: {
    width: "100%",
    height: 220,
    backgroundColor: c.surface,
  },
  bannerPlaceholder: {
    width: "100%",
    height: 220,
    backgroundColor: c.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  genreTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(108, 92, 231, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  genreText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 16,
    lineHeight: 30,
  },
  locationSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: c.surface,
    borderRadius: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: c.textMuted,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary,
    marginBottom: 4,
  },
  distance: {
    fontSize: 11,
    color: c.textSecondary,
  },
  timeSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: c.surface,
    borderRadius: 12,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: c.textMuted,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: c.textSecondary,
    lineHeight: 18,
  },
  statsSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: c.surface,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: c.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: c.textMuted,
    marginTop: 2,
  },
  contactSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: c.textPrimary,
    marginBottom: 8,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: c.surface,
    borderRadius: 10,
  },
  contactText: {
    fontSize: 13,
    fontWeight: "600",
    color: c.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  checkInActionButton: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: c.textSecondary,
  },
  checkInActionButtonText: {
    color: c.textPrimary,
  },
});
}
