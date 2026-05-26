/**
 * useLocaisVisitados
 *
 * Hook que expõe o histórico de locais visitados do usuário
 * com estatísticas derivadas prontas para a UI.
 *
 * Uso:
 *   const { locais, favoritos, stats, loading, refresh } = useLocaisVisitados(uid);
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getLocaisFavoritos, getLocaisVisitados } from "../services/localVisitadoService";

export default function useLocaisVisitados(uid) {
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getLocaisVisitados(uid);
      setLocais(data);
    } catch (e) {
      console.warn("[useLocaisVisitados]", e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Top 3 mais frequentados (para o card de destaque no perfil)
  const favoritos = useMemo(
    () => [...locais].sort((a, b) => b.visitas - a.visitas).slice(0, 3),
    [locais]
  );

  // Estatísticas agregadas para o painel
  const stats = useMemo(() => {
    const totalVisitas = locais.reduce((s, l) => s + (l.visitas || 1), 0);

    const categorias = {};
    locais.forEach((l) => {
      if (l.categoria) {
        categorias[l.categoria] = (categorias[l.categoria] || 0) + l.visitas;
      }
    });
    const categoriaMaisVisitada = Object.entries(categorias).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    const bairros = {};
    locais.forEach((l) => {
      if (l.bairro) {
        bairros[l.bairro] = (bairros[l.bairro] || 0) + l.visitas;
      }
    });
    const bairroFavorito = Object.entries(bairros).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    return {
      totalLocais: locais.length,
      totalVisitas,
      categoriaMaisVisitada,
      bairroFavorito,
    };
  }, [locais]);

  return {
    locais,
    favoritos,
    stats,
    loading,
    refresh: carregar,
  };
}
