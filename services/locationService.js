import * as Location from "expo-location";

export const getUserLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
  } catch (error) {
    console.log("locationService error:", error);
    return null;
  }
};

/**
 * Reverse geocoding usando Nominatim (OpenStreetMap)
 * Converte coordenadas em informações de endereço/cidade
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      city: data.address?.city || data.address?.town || data.address?.municipality || data.address?.village || null,
      state: data.address?.state || null,
      country: data.address?.country || null,
      fullAddress: data.display_name || null,
      suburb: data.address?.suburb || data.address?.district || null,
    };
  } catch (error) {
    console.log("reverseGeocode error:", error);
    return null;
  }
};

/**
 * Obtém localização completa do usuário (coordenadas + cidade)
 */
export const getUserLocationWithCity = async () => {
  try {
    const location = await getUserLocation();
    if (!location) return null;

    const address = await reverseGeocode(location.latitude, location.longitude);
    
    return {
      ...location,
      city: address?.city,
      state: address?.state,
      country: address?.country,
      suburb: address?.suburb,
    };
  } catch (error) {
    console.log("getUserLocationWithCity error:", error);
    return null;
  }
};
