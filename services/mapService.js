import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  geoDistance,
  GeoPoint,
  QueryConstraint,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

/**
 * Serviço de Mapa Vivo da Cultura
 * Gerencia eventos no mapa, heatmap cultural, check-ins e dados de localização
 */

// ==================== EVENTOS NO MAPA ====================

export const createMapEvent = async (eventData) => {
  try {
    const docRef = await addDoc(collection(db, "mapEvents"), {
      ...eventData,
      creatorId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      checkIns: [],
      checkInsCount: 0,
      likes: [],
      likesCount: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar evento no mapa:", error);
    throw error;
  }
};

export const getMapEvents = async (latitude, longitude, radiusKm = 50) => {
  try {
    const q = query(
      collection(db, "mapEvents"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filtrar por raio e calcular distância
    return events
      .map((event) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          event.location.latitude,
          event.location.longitude
        );
        return { ...event, distance };
      })
      .filter((event) => event.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error("Erro ao buscar eventos do mapa:", error);
    throw error;
  }
};

export const getMapEventsByGenre = async (genre, latitude, longitude, radiusKm = 50) => {
  try {
    const q = query(
      collection(db, "mapEvents"),
      where("genre", "==", genre),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar eventos por gênero:", error);
    throw error;
  }
};

export const getMapEventDetails = async (eventId) => {
  try {
    const docSnap = await getDoc(doc(db, "mapEvents", eventId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar detalhes do evento:", error);
    throw error;
  }
};

export const updateMapEvent = async (eventId, updates) => {
  try {
    const eventRef = doc(db, "mapEvents", eventId);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    throw error;
  }
};

// ==================== CHECK-IN ====================

export const checkInEvent = async (eventId, location) => {
  try {
    const docRef = await addDoc(collection(db, "checkIns"), {
      eventId,
      userId: auth.currentUser.uid,
      location,
      createdAt: serverTimestamp(),
      photo: null,
      caption: "",
    });

    // Atualizar contagem de check-ins no evento
    const eventRef = doc(db, "mapEvents", eventId);
    const eventSnap = await getDoc(eventRef);
    const currentCheckIns = (eventSnap.data().checkIns || []).length;

    await updateDoc(eventRef, {
      checkIns: arrayUnion(auth.currentUser.uid),
      checkInsCount: currentCheckIns + 1,
    });

    return docRef.id;
  } catch (error) {
    console.error("Erro ao fazer check-in:", error);
    throw error;
  }
};

export const getCheckIns = async (eventId) => {
  try {
    const q = query(
      collection(db, "checkIns"),
      where("eventId", "==", eventId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar check-ins:", error);
    throw error;
  }
};

export const getUserCheckIns = async () => {
  try {
    const q = query(
      collection(db, "checkIns"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar meus check-ins:", error);
    throw error;
  }
};

export const updateCheckIn = async (checkInId, updates) => {
  try {
    const checkInRef = doc(db, "checkIns", checkInId);
    await updateDoc(checkInRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao atualizar check-in:", error);
    throw error;
  }
};

// ==================== HEATMAP ====================

export const getHeatmapData = async (latitude, longitude, radiusKm = 50) => {
  try {
    const q = query(
      collection(db, "mapEvents"),
      where("isActive", "==", true)
    );

    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map((doc) => doc.data());

    // Filtrar por raio
    return events
      .filter((event) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          event.location.latitude,
          event.location.longitude
        );
        return distance <= radiusKm;
      })
      .map((event) => ({
        latitude: event.location.latitude,
        longitude: event.location.longitude,
        weight: event.checkInsCount || 1,
        genre: event.genre,
      }));
  } catch (error) {
    console.error("Erro ao buscar dados do heatmap:", error);
    throw error;
  }
};

export const getCulturalHotspots = async (latitude, longitude, radiusKm = 50) => {
  try {
    const heatmapData = await getHeatmapData(latitude, longitude, radiusKm);

    // Agrupar por zona (grid)
    const gridSize = 0.1; // Aproximadamente 10km
    const zones = {};

    heatmapData.forEach((point) => {
      const gridX = Math.floor(point.latitude / gridSize);
      const gridY = Math.floor(point.longitude / gridSize);
      const key = `${gridX},${gridY}`;

      if (!zones[key]) {
        zones[key] = {
          latitude: (gridX + 0.5) * gridSize,
          longitude: (gridY + 0.5) * gridSize,
          intensity: 0,
          eventCount: 0,
          genres: {},
        };
      }

      zones[key].intensity += point.weight;
      zones[key].eventCount += 1;
      zones[key].genres[point.genre] = (zones[key].genres[point.genre] || 0) + 1;
    });

    return Object.values(zones);
  } catch (error) {
    console.error("Erro ao buscar hotspots culturais:", error);
    throw error;
  }
};

// ==================== LIKES ====================

export const likeMapEvent = async (eventId) => {
  try {
    const eventRef = doc(db, "mapEvents", eventId);
    const eventSnap = await getDoc(eventRef);
    const currentLikes = (eventSnap.data().likes || []).length;

    await updateDoc(eventRef, {
      likes: arrayUnion(auth.currentUser.uid),
      likesCount: currentLikes + 1,
    });
  } catch (error) {
    console.error("Erro ao dar like:", error);
    throw error;
  }
};

export const unlikeMapEvent = async (eventId) => {
  try {
    const eventRef = doc(db, "mapEvents", eventId);
    const eventSnap = await getDoc(eventRef);
    const currentLikes = (eventSnap.data().likes || []).filter(
      (id) => id !== auth.currentUser.uid
    );

    await updateDoc(eventRef, {
      likes: currentLikes,
      likesCount: currentLikes.length,
    });
  } catch (error) {
    console.error("Erro ao remover like:", error);
    throw error;
  }
};

// ==================== UTILITIES ====================

/**
 * Calcula a distância entre dois pontos em km
 * Usa a fórmula de Haversine
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getHeatmapColor = (intensity, maxIntensity) => {
  const ratio = Math.min(intensity / maxIntensity, 1);

  // Gradiente: Verde -> Amarelo -> Vermelho
  if (ratio < 0.33) {
    // Verde para Amarelo
    const r = Math.round(255 * (ratio / 0.33));
    const g = 255;
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (ratio < 0.66) {
    // Amarelo para Laranja
    const r = 255;
    const g = Math.round(255 * (1 - (ratio - 0.33) / 0.33));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Laranja para Vermelho
    const r = 255;
    const g = Math.round(100 * (1 - (ratio - 0.66) / 0.34));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};
