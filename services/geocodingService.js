export const geocodeAddress = async (endereco) => {
  if (!endereco) return null;

  try {
    const params = new URLSearchParams({
      q: endereco,
      format: "json",
      addressdetails: "1",
      limit: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "MonitoraCult/1.0 (contato@seudominio.com)",
        },
      }
    );

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    return {
      latitude: Number(results[0].lat),
      longitude: Number(results[0].lon),
    };
  } catch (error) {
    console.log("geocodingService error:", error);
    return null;
  }
};
