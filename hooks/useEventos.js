import { useEffect, useState, useRef, useCallback } from "react";
import { getEventos } from "../services/mapaCulturalService";

export function useEventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true); // ✅ Track se hook está montado

  // ✅ Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Carregar com useCallback para memoizar
  const carregar = useCallback(async (offset = 0) => {
    try {
      if (!isMountedRef.current) return;

      setLoading(true);
      setError(null);

      const data = await getEventos(offset);

      if (!isMountedRef.current) return; // ✅ Verifica antes de atualizar estado

      const normalizados = data.map((item) => ({
        id: item.id,
        titulo: item.name || "Sem título",
        descricao: item.shortDescription || "",
        local: item?.location?.name || "",
        data: item.startDate || "",
        tipo: "evento_publico",
        // ✅ Não armazena 'original' para economizar RAM
      }));

      setEventos(normalizados);
    } catch (e) {
      console.log("Erro em useEventos:", e);
      
      if (isMountedRef.current) {
        setError(e.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ✅ Carregar na montagem
  useEffect(() => {
    carregar();
  }, [carregar]);

  return { 
    eventos, 
    loading,
    error,
    carregar, // ✅ Expõe para paginação se necessário
  };
}
