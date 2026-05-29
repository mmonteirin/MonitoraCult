import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import {
  getMapEvents,
  getMapEventsByGenre,
  getHeatmapData,
  getCulturalHotspots,
  checkInEvent,
  getCheckIns,
  getUserCheckIns,
  likeMapEvent,
  unlikeMapEvent,
  createMapEvent,
} from "../services/mapService";

/**
 * Hook para gerenciar o Mapa Vivo da Cultura
 * ✅ Com otimizações de memória e cleanup
 */
export const useMap = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapEvents, setMapEvents] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [culturalHotspots, setCulturalHotspots] = useState([]);
  const [checkInsList, setCheckInsList] = useState([]);
  const [userCheckIns, setUserCheckIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const isMountedRef = useRef(true);
  const locationSubscriptionRef = useRef(null);

  // ✅ Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, []);

  // ✅ Obter localização atual
  const startLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permissão de localização negada");
        return;
      }

      // Obter localização inicial
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (isMountedRef.current) {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }

      // Acompanhar localização em tempo real
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 segundos
          distanceInterval: 50, // 50 metros
        },
        (location) => {
          if (isMountedRef.current) {
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }
      );

      locationSubscriptionRef.current = subscription;
    } catch (err) {
      console.error("Erro ao obter localização:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, []);

  // ✅ Carregar eventos do mapa
  const loadMapEvents = useCallback(async () => {
    if (!currentLocation) return;

    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      let events;
      if (selectedGenre) {
        events = await getMapEventsByGenre(
          selectedGenre,
          currentLocation.latitude,
          currentLocation.longitude
        );
      } else {
        events = await getMapEvents(
          currentLocation.latitude,
          currentLocation.longitude
        );
      }

      if (isMountedRef.current) {
        setMapEvents(events);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentLocation, selectedGenre]);

  // ✅ Carregar dados do heatmap
  const loadHeatmapData = useCallback(async () => {
    if (!currentLocation) return;

    try {
      const [heatmap, hotspots] = await Promise.all([
        getHeatmapData(currentLocation.latitude, currentLocation.longitude),
        getCulturalHotspots(currentLocation.latitude, currentLocation.longitude),
      ]);

      if (isMountedRef.current) {
        setHeatmapData(heatmap);
        setCulturalHotspots(hotspots);
      }
    } catch (err) {
      console.error("Erro ao carregar heatmap:", err);
    }
  }, [currentLocation]);

  // ✅ Fazer check-in
  const handleCheckIn = useCallback(async (eventId) => {
    if (!currentLocation) return;

    try {
      await checkInEvent(eventId, {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });

      if (isMountedRef.current) {
        // Recarregar eventos e check-ins
        await Promise.all([loadMapEvents(), loadUserCheckIns()]);
      }
    } catch (err) {
      console.error("Erro ao fazer check-in:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [currentLocation, loadMapEvents]);

  // ✅ Carregar check-ins do evento
  const loadEventCheckIns = useCallback(async (eventId) => {
    try {
      const checkIns = await getCheckIns(eventId);
      if (isMountedRef.current) {
        setCheckInsList(checkIns);
      }
    } catch (err) {
      console.error("Erro ao carregar check-ins:", err);
    }
  }, []);

  // ✅ Carregar meus check-ins
  const loadUserCheckIns = useCallback(async () => {
    try {
      const checkIns = await getUserCheckIns();
      if (isMountedRef.current) {
        setUserCheckIns(checkIns);
      }
    } catch (err) {
      console.error("Erro ao carregar meus check-ins:", err);
    }
  }, []);

  // ✅ Like no evento
  const handleLikeEvent = useCallback(async (eventId, isLiked) => {
    try {
      if (isLiked) {
        await unlikeMapEvent(eventId);
      } else {
        await likeMapEvent(eventId);
      }
      if (isMountedRef.current) {
        await loadMapEvents();
      }
    } catch (err) {
      console.error("Erro ao dar like:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [loadMapEvents]);

  // ✅ Criar evento no mapa
  const handleCreateMapEvent = useCallback(async (eventData) => {
    try {
      await createMapEvent(eventData);
      if (isMountedRef.current) {
        await loadMapEvents();
      }
    } catch (err) {
      console.error("Erro ao criar evento:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [loadMapEvents]);

  return {
    currentLocation,
    mapEvents,
    heatmapData,
    culturalHotspots,
    checkInsList,
    userCheckIns,
    loading,
    error,
    selectedGenre,
    setSelectedGenre,
    startLocationTracking,
    loadMapEvents,
    loadHeatmapData,
    handleCheckIn,
    loadEventCheckIns,
    loadUserCheckIns,
    handleLikeEvent,
    handleCreateMapEvent,
  };
};
