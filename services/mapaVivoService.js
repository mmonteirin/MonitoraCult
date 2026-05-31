/**
 * mapaVivoService.js
 * Serviço completo do Mapa Vivo da Cultura
 * Integra com Firebase Firestore + fallback com dados mockados para dev
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  GeoPoint,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// ─── HELPERS ────────────────────────────────────────────────────────────────

export const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatarDistancia = (km) => {
  if (!km && km !== 0) return "—";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

export const getDirectionsUrl = (evento, origem = null) => {
  const latitude = evento?.location?.latitude;
  const longitude = evento?.location?.longitude;

  if (latitude == null || longitude == null) return null;

  const destination = `${latitude},${longitude}`;
  const origin =
    origem?.latitude != null && origem?.longitude != null
      ? `&origin=${origem.latitude},${origem.longitude}`
      : "";

  return `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination}&travelmode=driving`;
};

export const clusterMapEvents = (eventos = [], region = null) => {
  if (!region || eventos.length < 12) {
    return eventos.map((evento) => ({
      type: "event",
      id: evento.id,
      evento,
      coordinate: evento.location,
    }));
  }

  const zoomFactor = Math.max(1, Math.round(0.08 / (region.latitudeDelta || 0.04)));
  const cellSize = Math.max(0.0025, 0.018 / zoomFactor);
  const buckets = new Map();

  eventos.forEach((evento) => {
    if (!evento?.location) return;

    const latKey = Math.round(evento.location.latitude / cellSize);
    const lngKey = Math.round(evento.location.longitude / cellSize);
    const key = `${latKey}_${lngKey}`;
    const bucket = buckets.get(key) || [];
    bucket.push(evento);
    buckets.set(key, bucket);
  });

  return Array.from(buckets.entries()).flatMap(([key, items]) => {
    if (items.length < 3) {
      return items.map((evento) => ({
        type: "event",
        id: evento.id,
        evento,
        coordinate: evento.location,
      }));
    }

    const latitude =
      items.reduce((acc, item) => acc + item.location.latitude, 0) / items.length;
    const longitude =
      items.reduce((acc, item) => acc + item.location.longitude, 0) / items.length;

    return [
      {
        type: "cluster",
        id: `cluster_${key}`,
        eventos: items,
        count: items.length,
        coordinate: { latitude, longitude },
      },
    ];
  });
};

// ─── DADOS MOCK (desenvolvimento / fallback) ─────────────────────────────────

const EVENTOS_MOCK = [
  {
    id: "mock_1",
    title: "Forró do Mondubim",
    genre: "Música",
    description: "Forró pé-de-serra toda sexta-feira no coração do Mondubim.",
    location: { latitude: -3.7828, longitude: -38.5518 },
    address: "Praça do Mondubim, Fortaleza",
    date: new Date(Date.now() + 2 * 3600000),
    checkInsCount: 34,
    likesCount: 87,
    isActive: true,
    creatorName: "Casa da Cultura CE",
    coverColor: "#8B5CF6",
  },
  {
    id: "mock_2",
    title: "Exposição Arte Nordestina",
    genre: "Artes Visuais",
    description: "Obras de artistas cearenses contemporâneos em espaço aberto.",
    location: { latitude: -3.7220, longitude: -38.5423 },
    address: "Centro Dragão do Mar, Fortaleza",
    date: new Date(Date.now() + 5 * 3600000),
    checkInsCount: 120,
    likesCount: 210,
    isActive: true,
    creatorName: "Dragão do Mar",
    coverColor: "#06B6D4",
  },
  {
    id: "mock_3",
    title: "Cinema ao Ar Livre",
    genre: "Cinema",
    description: "Projeção gratuita de curtas-metragens cearenses.",
    location: { latitude: -3.7310, longitude: -38.5120 },
    address: "Parque do Cocó, Fortaleza",
    date: new Date(Date.now() + 8 * 3600000),
    checkInsCount: 55,
    likesCount: 130,
    isActive: true,
    creatorName: "Cine Cultura CE",
    coverColor: "#F59E0B",
  },
  {
    id: "mock_4",
    title: "Oficina de Teatro Popular",
    genre: "Teatro",
    description: "Workshop gratuito de teatro de rua para jovens.",
    location: { latitude: -3.7670, longitude: -38.4990 },
    address: "Bairro de Fátima, Fortaleza",
    date: new Date(Date.now() + 24 * 3600000),
    checkInsCount: 18,
    likesCount: 42,
    isActive: true,
    creatorName: "Grupo Cena Livre",
    coverColor: "#22C55E",
  },
  {
    id: "mock_5",
    title: "Sarau de Poesia Urbana",
    genre: "Literatura",
    description: "Noite de poesia, slam e prosa no espaço alternativo.",
    location: { latitude: -3.7450, longitude: -38.5300 },
    address: "Rua Dragão do Mar, Iracema",
    date: new Date(Date.now() + 3 * 3600000),
    checkInsCount: 67,
    likesCount: 150,
    isActive: true,
    creatorName: "Sarau Nordestino",
    coverColor: "#EF4444",
  },
];

export const getEventosMapaVivoMock = () =>
  EVENTOS_MOCK.map((evento) => ({ ...evento }));

const HOTSPOTS_MOCK = [
  { latitude: -3.7220, longitude: -38.5423, intensity: 85, label: "Iracema" },
  { latitude: -3.7828, longitude: -38.5518, intensity: 60, label: "Mondubim" },
  { latitude: -3.7310, longitude: -38.5120, intensity: 45, label: "Cocó" },
  { latitude: -3.7670, longitude: -38.4990, intensity: 30, label: "Fátima" },
  { latitude: -3.7550, longitude: -38.5200, intensity: 70, label: "Centro" },
];

// ─── EVENTOS DO MAPA ─────────────────────────────────────────────────────────

export const getMapEventsMock = (latitude, longitude, genero = null) => {
  let eventos = EVENTOS_MOCK.map((e) => ({
    ...e,
    distance: calcularDistancia(latitude, longitude, e.location.latitude, e.location.longitude),
  }));
  if (genero) eventos = eventos.filter((e) => e.genre === genero);
  return eventos.sort((a, b) => a.distance - b.distance);
};

export const getMapEventsFirestore = async (latitude, longitude, genero = null) => {
  try {
    const constraints = [where("isActive", "==", true), orderBy("createdAt", "desc")];
    if (genero) constraints.push(where("genre", "==", genero));
    const q = query(collection(db, "mapEvents"), ...constraints);
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          distance: calcularDistancia(
            latitude, longitude,
            data.location?.latitude ?? 0,
            data.location?.longitude ?? 0
          ),
        };
      })
      .sort((a, b) => a.distance - b.distance);
  } catch {
    return getMapEventsMock(latitude, longitude, genero);
  }
};

export const getMapEventDetails = async (eventId) => {
  if (eventId.startsWith("mock_")) {
    const mock = EVENTOS_MOCK.find((e) => e.id === eventId);
    return mock
      ? { ...mock, checkIns: [], likes: [] }
      : null;
  }
  try {
    const snap = await getDoc(doc(db, "mapEvents", eventId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch {
    return null;
  }
};

// ─── HEATMAP ─────────────────────────────────────────────────────────────────

export const getHotspotsMock = () => HOTSPOTS_MOCK;

export const getHotspotsFirestore = async (latitude, longitude) => {
  try {
    const snap = await getDocs(
      query(collection(db, "culturalHotspots"), where("isActive", "==", true))
    );
    if (snap.empty) return getHotspotsMock();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return getHotspotsMock();
  }
};

// ─── CHECK-IN ────────────────────────────────────────────────────────────────

export const realizarCheckIn = async (eventId, { latitude, longitude, caption, photoUrl }) => {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");
  if (eventId.startsWith("mock_")) {
    // Simula sucesso em dev
    return { success: true, checkInId: `checkin_${Date.now()}` };
  }
  try {
    const checkInRef = await addDoc(collection(db, "checkIns"), {
      eventId,
      userId: uid,
      location: new GeoPoint(latitude, longitude),
      caption: caption || "",
      photoUrl: photoUrl || null,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "mapEvents", eventId), {
      checkIns: arrayUnion(uid),
      checkInsCount: increment(1),
    });
    return { success: true, checkInId: checkInRef.id };
  } catch (error) {
    throw error;
  }
};

export const getCheckInsByEvent = async (eventId) => {
  if (eventId.startsWith("mock_")) return [];
  try {
    const q = query(
      collection(db, "checkIns"),
      where("eventId", "==", eventId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};

export const getMeusCheckIns = async () => {
  const uid = auth?.currentUser?.uid;
  if (!uid) return [];
  try {
    const q = query(
      collection(db, "checkIns"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};

// ─── RESUMO PARA PAINEL DA CIDADE ─────────────────────────────────────────────

export const getMapaSummary = async (latitude, longitude) => {
  try {
    const eventos = await getMapEventsFirestore(latitude, longitude);
    const proximos = eventos.filter((e) => e.distance <= 5).length;
    const totalCheckins = eventos.reduce((acc, e) => acc + (e.checkInsCount || 0), 0);
    const hotspots = await getHotspotsFirestore(latitude, longitude);
    return { totalEventos: eventos.length, proximos, totalCheckins, hotspots: hotspots.length };
  } catch {
    return {
      totalEventos: EVENTOS_MOCK.length,
      proximos: 3,
      totalCheckins: EVENTOS_MOCK.reduce((acc, e) => acc + e.checkInsCount, 0),
      hotspots: HOTSPOTS_MOCK.length,
    };
  }
};
