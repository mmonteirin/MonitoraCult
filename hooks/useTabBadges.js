import { useState, useCallback, useEffect, useRef } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════
 * useTabBadges Hook
 * 
 * Gerencia badges (notificações) para as abas da navegação.
 * 
 * Exemplo de uso:
 * ```
 * const { badges, setBadge, updateBadges, clearBadge } = useTabBadges();
 * 
 * // Adicionar badge
 * setBadge("Ingressos", 3);
 * 
 * // Atualizar múltiplos
 * updateBadges({ Ingressos: 2, Feed: 1 });
 * 
 * // Limpar
 * clearBadge("Ingressos");
 * ```
 * ═══════════════════════════════════════════════════════════════════
 */
export function useTabBadges(initialBadges = {}) {
  const [badges, setBadgesState] = useState(initialBadges);
  const badgeTimeouts = useRef({});

  /**
   * Define o badge para uma aba
   */
  const setBadge = useCallback((tabName, count) => {
    setBadgesState((prev) => ({
      ...prev,
      [tabName]: count,
    }));
  }, []);

  /**
   * Atualiza múltiplos badges de uma vez
   */
  const updateBadges = useCallback((newBadges) => {
    setBadgesState((prev) => ({
      ...prev,
      ...newBadges,
    }));
  }, []);

  /**
   * Incrementa o badge de uma aba
   */
  const incrementBadge = useCallback((tabName, amount = 1) => {
    setBadgesState((prev) => ({
      ...prev,
      [tabName]: (prev[tabName] || 0) + amount,
    }));
  }, []);

  /**
   * Decrementa o badge de uma aba
   */
  const decrementBadge = useCallback((tabName, amount = 1) => {
    setBadgesState((prev) => {
      const current = prev[tabName] || 0;
      const newCount = Math.max(0, current - amount);
      return {
        ...prev,
        [tabName]: newCount,
      };
    });
  }, []);

  /**
   * Remove o badge de uma aba
   */
  const clearBadge = useCallback((tabName) => {
    setBadgesState((prev) => {
      const newBadges = { ...prev };
      delete newBadges[tabName];
      return newBadges;
    });

    // Limpar timeout se existir
    if (badgeTimeouts.current[tabName]) {
      clearTimeout(badgeTimeouts.current[tabName]);
      delete badgeTimeouts.current[tabName];
    }
  }, []);

  /**
   * Limpa todos os badges
   */
  const clearAllBadges = useCallback(() => {
    setBadgesState({});
    // Limpar todos os timeouts
    Object.values(badgeTimeouts.current).forEach((timeout) => {
      clearTimeout(timeout);
    });
    badgeTimeouts.current = {};
  }, []);

  /**
   * Define um badge temporário que desaparece após um tempo
   */
  const setTemporaryBadge = useCallback((tabName, count, durationMs = 3000) => {
    setBadge(tabName, count);

    // Limpar timeout anterior se existir
    if (badgeTimeouts.current[tabName]) {
      clearTimeout(badgeTimeouts.current[tabName]);
    }

    // Definir novo timeout
    badgeTimeouts.current[tabName] = setTimeout(() => {
      clearBadge(tabName);
    }, durationMs);
  }, [setBadge, clearBadge]);

  /**
   * Obter badge de uma aba
   */
  const getBadge = useCallback(
    (tabName) => badges[tabName] || 0,
    [badges]
  );

  /**
   * Verificar se uma aba tem badge
   */
  const hasBadge = useCallback(
    (tabName) => (badges[tabName] || 0) > 0,
    [badges]
  );

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      Object.values(badgeTimeouts.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    badges,
    setBadge,
    updateBadges,
    incrementBadge,
    decrementBadge,
    clearBadge,
    clearAllBadges,
    setTemporaryBadge,
    getBadge,
    hasBadge,
  };
}

export default useTabBadges;
