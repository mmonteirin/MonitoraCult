import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { BlurView } from "expo-blur";

import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import {
  getEventosApp,
} from "../services/eventosAppService";

import {
  normalizeEvento,
  formatarDistancia,
  getCountdownInfo,
} from "../components/home/homeUtils";

import { getUserLocation } from "../services/locationService";

import { calcularDistancia } from "../utils/distance";

import { Colors } from "../styles/Colors";

export default function TelaCulturaViva({
  navigation,
}) {
  const [eventos, setEventos] = useState([]);

  const [location, setLocation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setLoading(true);

      const [dados, localizacao] =
        await Promise.all([
          getEventosApp(),
          getUserLocation(),
        ]);

      setEventos(
        dados.map(normalizeEvento)
      );

      setLocation(localizacao);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  const eventosComDistancia =
    useMemo(() => {
      return eventos.map((evento) => ({
        ...evento,

        distancia:
          location &&
          evento.latitude &&
          evento.longitude
            ? calcularDistancia(
                location.latitude,
                location.longitude,
                evento.latitude,
                evento.longitude
              )
            : null,
      }));
    }, [eventos, location]);

  const emAlta = useMemo(() => {
    return eventosComDistancia
      .slice()
      .sort(
        (a, b) =>
          (b.score || 0) -
          (a.score || 0)
      )
      .slice(0, 6);
  }, [eventosComDistancia]);

  const proximos = useMemo(() => {
    return eventosComDistancia
      .filter(
        (item) =>
          item.distancia != null
      )
      .sort(
        (a, b) =>
          a.distancia -
          b.distancia
      )
      .slice(0, 5);
  }, [eventosComDistancia]);

  const acontecendoAgora =
    useMemo(() => {
      return eventosComDistancia.filter(
        (evento) =>
          getCountdownInfo(evento)
            .tone === "live"
      );
    }, [eventosComDistancia]);

  const statusCidade =
    eventos.length > 60
      ? "🔥 Alta atividade cultural"
      : eventos.length > 25
      ? "✨ Movimento cultural intenso"
      : "🌙 Movimento tranquilo";

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={carregar}
            tintColor={
              Colors.primary
            }
          />
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom: 60,
        }}
      >
        <LinearGradient
          colors={[
            Colors.primary,
            "#5B4CF0",
            "#241B4B",
          ]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              navigation.goBack()
            }
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

          <View
            style={
              styles.headerContent
            }
          >
            <BlurView
              intensity={40}
              tint="dark"
              style={
                styles.iconCircle
              }
            >
              <MaterialCommunityIcons
                name="fire"
                size={34}
                color="#fff"
              />
            </BlurView>

            <Text style={styles.title}>
              Cultura Viva
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              {eventos.length} eventos
              ativos •{" "}
              {
                acontecendoAgora.length
              }{" "}
              acontecendo agora
            </Text>
          </View>
        </LinearGradient>

        {/* RADAR */}
        <View
          style={styles.radarCard}
        >
          <Text
            style={
              styles.radarTitle
            }
          >
            📍 Radar Cultural
          </Text>

          <Text
            style={
              styles.radarItem
            }
          >
            • {eventos.length}{" "}
            eventos ativos
          </Text>

          <Text
            style={
              styles.radarItem
            }
          >
            •{" "}
            {
              acontecendoAgora.length
            }{" "}
            ao vivo agora
          </Text>

          <Text
            style={
              styles.radarItem
            }
          >
            • {proximos.length}{" "}
            próximos de você
          </Text>
        </View>

        {/* STATUS */}
        <View
          style={styles.statusCard}
        >
          <View>
            <Text
              style={
                styles.statusLabel
              }
            >
              Cidade agora
            </Text>

            <Text
              style={
                styles.statusTitle
              }
            >
              {statusCidade}
            </Text>
          </View>

          <View
            style={
              styles.liveBadge
            }
          >
            <Text
              style={
                styles.liveText
              }
            >
              AO VIVO
            </Text>
          </View>
        </View>

        {/* STATS */}
        <View
          style={styles.statsRow}
        >
          <View
            style={styles.statCard}
          >
            <MaterialCommunityIcons
              name="calendar-star"
              size={24}
              color="#8B5CF6"
            />

            <Text
              style={
                styles.statNumber
              }
            >
              {eventos.length}
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Eventos
            </Text>
          </View>

          <View
            style={styles.statCard}
          >
            <MaterialCommunityIcons
              name="broadcast"
              size={24}
              color="#EF4444"
            />

            <Text
              style={
                styles.statNumber
              }
            >
              {
                acontecendoAgora.length
              }
            </Text>

            <Text
              style={
                styles.statLabel
              }
            >
              Ao vivo
            </Text>
          </View>
        </View>

        {/* AO VIVO */}
        {acontecendoAgora.length >
          0 && (
          <>
            <Text
              style={
                styles.sectionTitle
              }
            >
              🔴 Acontecendo Agora
            </Text>

            {acontecendoAgora
              .slice(0, 3)
              .map(renderEvento)}
          </>
        )}

        {/* EM ALTA */}
        <Text
          style={
            styles.sectionTitle
          }
        >
          🔥 Em Alta Hoje
        </Text>

        {emAlta.map(renderEvento)}

        {/* PRÓXIMOS */}
        <Text
          style={
            styles.sectionTitle
          }
        >
          📍 Próximos de Você
        </Text>

        {proximos.map(renderEvento)}
      </ScrollView>
    </View>
  );

  function renderEvento(item) {
    const countdown =
      getCountdownInfo(item);

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.9}
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate(
            "Detalhes",
            {
              evento:
                item.original ||
                item,
            }
          )
        }
      >
        <LinearGradient
          colors={[
            Colors.primary,
            "#8B5CF6",
          ]}
          style={
            styles.eventIcon
          }
        >
          <MaterialCommunityIcons
            name="calendar-star"
            size={22}
            color="#fff"
          />
        </LinearGradient>

        <View
          style={{ flex: 1 }}
        >
          <Text
            style={
              styles.eventTitle
            }
            numberOfLines={1}
          >
            {item.titulo}
          </Text>

          <Text
            style={
              styles.eventLocal
            }
          >
            {item.local}
          </Text>

          {item.distancia !=
            null && (
            <Text
              style={
                styles.distance
              }
            >
              {formatarDistancia(
                item.distancia
              )}
            </Text>
          )}
        </View>

        <Text
          style={
            styles.eventTime
          }
        >
          {countdown.label}
        </Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingTop: 60,
    paddingBottom: 34,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  headerContent: {
    alignItems: "center",
  },

  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 18,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },

  statusCard: {
    margin: 18,
    padding: 18,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusLabel: {
    color: Colors.textMuted,
    marginBottom: 6,
  },

  statusTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },

  liveBadge: {
    backgroundColor: "rgba(239,68,68,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
  },

  liveText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 12,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },

  statCard: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: 22,
    paddingVertical: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  statNumber: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10,
  },

  statLabel: {
    color: Colors.textMuted,
    marginTop: 4,
  },

  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 26,
    marginBottom: 14,
    paddingHorizontal: 18,
  },

  eventCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  eventIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  eventTitle: {
    color: Colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },

  eventLocal: {
    color: Colors.textMuted,
    marginTop: 4,
  },

  eventTime: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },

radarCard: {
  marginHorizontal: 18,
  marginTop: 18,
  padding: 18,
  borderRadius: 22,
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.border,
},

radarTitle: {
  color: Colors.textPrimary,
  fontSize: 17,
  fontWeight: "800",
  marginBottom: 12,
},

radarItem: {
  color: Colors.textSecondary,
  marginBottom: 8,
},

distance: {
  color: Colors.accentCyan,
  fontSize: 12,
  marginTop: 4,
},
});
