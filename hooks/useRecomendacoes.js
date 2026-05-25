/**
 * useRecomendacoes
 *
 * Hook central do sistema de recomendação personalizada.
 *
 * Responsabilidades:
 *  1. Buscar todos os sinais do usuário (likes, interações, inscritos, frequentados)
 *  2. Construir o perfil de preferências com buildUserSignals()
 *  3. Pontuar + ordenar eventos com scoreRecommendation()
 *  4. Cachear resultado em AsyncStorage para evitar latência no próximo boot
 *  5. Expor estado reativo (loading, recomendados, sinais, refresh)
 *
 * Uso:
 *   const { recomendados, sinaisUsuario, loading, refresh } = useRecomendacoes(eventos, usuarioId);
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getUserEventInteractions,
  getUserLikes,
} from "../services/eventosAppService";
import { getSubscribedEvents } from "../services/subscribedEventsService";
import { getAttendedEvents } from "../services/profileService";
import { getLocaisFavoritos } from "../services/localVisitadoService";

import {
  buildUserSignals,
  scoreRecommendation,
} from "../components/home/homeUtils";

// ─── Constantes ─────────────────────────────────────────────────────────────

const CACHE_KEY_PREFIX = "recomendacoes_v1_";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min: stale enquanto atualiza em bg
const MAX_RECOMENDADOS = 10;

// ─── Helpers de cache ────────────────────────────────────────────────────────

async function lerCache(usuarioId) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + usuarioId);
    if (!raw) return null;

    const { sinais, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null; // expirado

    // Reidrata os Sets que o JSON serializa como objetos
    return {
      ...sinais,
      likedSet: new Set(sinais.likedArray || []),
    };
  } catch {
    return null;
  }
}

async function gravarCache(usuarioId, sinais) {
  try {
    const payload = {
      sinais: {
        ...sinais,
        likedArray: [...sinais.likedSet], // Set → array para JSON
      },
      ts: Date.now(),
    };
    await AsyncStorage.setItem(
      CACHE_KEY_PREFIX + usuarioId,
      JSON.stringify(payload)
    );
  } catch {
    // silencioso — cache é best-effort
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export default function useRecomendacoes(eventos = [], usuarioId = null) {
  const [sinaisUsuario, setSinaisUsuario] = useState(() => ({
    likedSet: new Set(),
    categories: {},
    places: {},
    eventIds: {},
  }));
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Evita fetch duplicado se o hook remontar antes do primeiro terminar
  const fetchingRef = useRef(false);

  // ── Carrega sinais do usuário ──────────────────────────────────────────────
  const carregarSinais = useCallback(
    async ({ silent = false } = {}) => {
      if (!usuarioId) {
        setLoading(false);
        return;
      }
      if (fetchingRef.current) return;

      fetchingRef.current = true;
      if (!silent) setLoading(true);
      setErro(null);

      try {
        // 1) Serve cache imediatamente enquanto busca dados frescos
        const cached = await lerCache(usuarioId);
        if (cached && !silent) {
          setSinaisUsuario(cached);
          setLoading(false);
        }

        // 2) Busca paralela de todos os sinais
        const [likes, interactions, subscribed, attended, locaisFavoritos] = await Promise.all([
          getUserLikes(usuarioId),
          getUserEventInteractions(usuarioId),
          getSubscribedEvents(usuarioId),
          getAttendedEvents(usuarioId),
          getLocaisFavoritos(usuarioId, 5),
        ]);

        // 3) Eventos curtidos (join local — sem roundtrip extra)
        const eventosById = Object.fromEntries(
          eventos.map((e) => [e.id, e])
        );
        const likedEvents = likes
          .map((id) => eventosById[id])
          .filter(Boolean);

        // 4) Constrói sinais frescos
        const sinaisFrescos = buildUserSignals({
          likes,
          interactions,
          likedEvents,
          subscribedEvents: subscribed,
          attendedEvents: attended,
        });

        locaisFavoritos.forEach((local) => {
          if (!local?.nome) return;
          sinaisFrescos.places[local.nome] =
            (sinaisFrescos.places[local.nome] || 0) +
            (local.visitas || 1) * 2;
        });

        setSinaisUsuario(sinaisFrescos);
        await gravarCache(usuarioId, sinaisFrescos);
      } catch (e) {
        console.warn("[useRecomendacoes] Erro ao carregar sinais:", e);
        setErro(e);
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuarioId, eventos.length] // re-run quando o catálogo cresce
  );

  useEffect(() => {
    carregarSinais();
  }, [carregarSinais]);

  // ── Pontua e ordena eventos ────────────────────────────────────────────────
  const recomendados = useMemo(() => {
    if (!eventos.length) return [];

    return eventos
      .slice()
      .sort(
        (a, b) =>
          scoreRecommendation(b, sinaisUsuario) -
          scoreRecommendation(a, sinaisUsuario)
      )
      .slice(0, MAX_RECOMENDADOS);
  }, [eventos, sinaisUsuario]);

  // ── Expõe métricas de diagnóstico (útil para testes A/B futuros) ──────────
  const diagnostico = useMemo(() => {
    const topCategorias = Object.entries(sinaisUsuario.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const topLocais = Object.entries(sinaisUsuario.places)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([local]) => local);

    return {
      topCategorias,
      topLocais,
      totalLikes: sinaisUsuario.likedSet.size,
      totalInteracoes: Object.keys(sinaisUsuario.eventIds).length,
    };
  }, [sinaisUsuario]);

  return {
    recomendados,
    sinaisUsuario,
    diagnostico,
    loading,
    erro,
    refresh: () => carregarSinais({ silent: true }),
  };
}
