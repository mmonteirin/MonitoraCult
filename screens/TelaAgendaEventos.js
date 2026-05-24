import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import { configurarLembreteEvento } from "../services/subscribedEventsService";
import { Colors } from "../styles/Colors";

const DEFAULT_IMAGE =
  "https://placehold.co/600x400?text=Evento";

const lembretes = [
  { label: "1h", value: 60 },
  { label: "3h", value: 180 },
  { label: "1 dia", value: 1440 },
];

const parseDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;

  const brDate = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dayKey = (date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const monthLabel = (date) =>
  date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

const buildMonthDays = (monthDate) => {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const days = [];

  for (let i = 0; i < first.getDay(); i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  return days;
};

export default function TelaAgendaEventos({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return undefined;
    }

    const q = query(
      collection(db, "users", user.uid, "subscribedEvents"),
      orderBy("dataEventoTimestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
            data: parseDate(
              document.data().dataEventoTimestamp || document.data().dataEvento
            ),
          }))
          .filter((item) => item.data);

        setEventos(lista);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, [user?.uid]);

  const eventosPorDia = useMemo(() => {
    return eventos.reduce((acc, evento) => {
      const key = dayKey(evento.data);
      acc[key] = acc[key] || [];
      acc[key].push(evento);
      return acc;
    }, {});
  }, [eventos]);

  const dias = useMemo(() => buildMonthDays(mesAtual), [mesAtual]);

  const eventosDoDia = eventosPorDia[dayKey(diaSelecionado)] || [];

  const eventosDoMes = useMemo(
    () =>
      eventos.filter(
        (evento) =>
          evento.data.getFullYear() === mesAtual.getFullYear() &&
          evento.data.getMonth() === mesAtual.getMonth()
      ),
    [eventos, mesAtual]
  );

  const mudarMes = (direction) => {
    setMesAtual(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1)
    );
  };

  const configurarLembrete = async (evento, minutos) => {
    await configurarLembreteEvento(user.uid, evento, minutos);
  };

  const renderEvento = ({ item }) => (
    <BlurView intensity={24} tint="dark" style={styles.eventCard}>
      <Image
        source={{ uri: item.imagemEvento || DEFAULT_IMAGE }}
        style={styles.eventImage}
      />

      <View style={styles.eventContent}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.tituloEvento || "Evento"}
        </Text>

        <Text style={styles.eventMeta} numberOfLines={1}>
          {item.localEvento || "Local não informado"}
        </Text>

        <Text style={styles.eventTime}>
          {item.data.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        <View style={styles.reminderRow}>
          {lembretes.map((lembrete) => {
            const active = item.reminderMinutesBefore === lembrete.value;

            return (
              <TouchableOpacity
                key={lembrete.value}
                style={[
                  styles.reminderChip,
                  active && styles.reminderChipActive,
                ]}
                onPress={() => configurarLembrete(item, lembrete.value)}
              >
                <MaterialCommunityIcons
                  name={active ? "bell-ring" : "bell-outline"}
                  size={13}
                  color={active ? "#FFF" : Colors.textSecondary}
                />

                <Text
                  style={[
                    styles.reminderText,
                    active && styles.reminderTextActive,
                  ]}
                >
                  {lembrete.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </BlurView>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F172A", "#111827", "#1E1B4B"]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Agenda</Text>
          <Text style={styles.headerSubtitle}>
            Seus eventos salvos por mês
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.monthHeader}>
          <TouchableOpacity style={styles.monthButton} onPress={() => mudarMes(-1)}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.monthTitle}>{monthLabel(mesAtual)}</Text>

          <TouchableOpacity style={styles.monthButton} onPress={() => mudarMes(1)}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekText}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {dias.map((date, index) => {
            const selected = date && dayKey(date) === dayKey(diaSelecionado);
            const count = date ? eventosPorDia[dayKey(date)]?.length || 0 : 0;

            return (
              <TouchableOpacity
                key={date ? dayKey(date) : `empty-${index}`}
                disabled={!date}
                style={[styles.dayCell, selected && styles.dayCellActive]}
                onPress={() => setDiaSelecionado(date)}
              >
                {date && (
                  <>
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.dayTextActive,
                      ]}
                    >
                      {date.getDate()}
                    </Text>

                    {count > 0 && (
                      <View style={styles.dayDot}>
                        <Text style={styles.dayDotText}>{count}</Text>
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{eventosDoMes.length}</Text>
            <Text style={styles.summaryLabel}>no mês</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{eventosDoDia.length}</Text>
            <Text style={styles.summaryLabel}>no dia</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Eventos do dia</Text>

        <FlatList
          data={eventosDoDia.length ? eventosDoDia : eventosDoMes}
          keyExtractor={(item) => item.id}
          renderItem={renderEvento}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="calendar-search"
                size={48}
                color={Colors.textMuted}
              />

              <Text style={styles.emptyText}>
                Nenhum evento salvo neste mês
              </Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B14",
  },
  loading: {
    flex: 1,
    backgroundColor: "#070B14",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  content: {
    padding: 18,
    paddingBottom: 130,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  monthButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekText: {
    flex: 1,
    textAlign: "center",
    color: Colors.textMuted,
    fontWeight: "800",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 8,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  dayCellActive: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  dayTextActive: {
    color: "#FFF",
  },
  dayDot: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.warning,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  dayDotText: {
    color: "#111827",
    fontSize: 10,
    fontWeight: "900",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
  },
  summaryValue: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
  },
  summaryLabel: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 12,
  },
  eventCard: {
    flexDirection: "row",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 12,
    padding: 10,
  },
  eventImage: {
    width: 88,
    height: 112,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  eventContent: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
  },
  eventMeta: {
    color: Colors.textSecondary,
    marginTop: 6,
    fontSize: 12,
  },
  eventTime: {
    color: Colors.primaryLight,
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
  },
  reminderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  reminderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  reminderChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reminderText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  reminderTextActive: {
    color: "#FFF",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 42,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: 10,
  },
});
