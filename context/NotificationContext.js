/**
 * context/NotificationContext.js
 *
 * Contexto global de notificações.
 * Provê:
 *  - pushToken, permissaoStatus
 *  - notificacoes, naoLidas (badge)
 *  - carregarNotificacoes, marcarLida, marcarTodasLidas, limpar
 *  - listeners de notificação recebida / tocada
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

import { AppState, Platform } from "react-native";

import {
  obterPushToken,
  salvarTokenNoFirestore,
  buscarNotificacoes,
  buscarNotificacoesPaginadas,
  marcarComoLida,
  marcarTodasComoLidas,
  limparHistorico,
  contarNaoLidas,
  clearBadge,
  setBadgeCount,
  NOTIFICATION_TYPES,
} from "../services/notificationService";

import { useAuth } from "./AuthContext";

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;

  // Estado
  const [pushToken, setPushToken] = useState(null);
  const [permissaoStatus, setPermissaoStatus] = useState("undetermined");
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [erro, setErro] = useState(null);
  const [temMais, setTemMais] = useState(true);
  const [ultimoDoc, setUltimoDoc] = useState(null);

  // Refs para listeners
  const notificationsModuleRef = useRef(null);
  const notifRecebidaRef = useRef(null);
  const notifRespostaRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // ── Inicialização quando usuário autentica ──────────────────────────────────
  useEffect(() => {
    if (!uid) {
      // Limpa estado ao fazer logout
      setPushToken(null);
      setNotificacoes([]);
      setNaoLidas(0);
      clearBadge();
      return;
    }

    inicializar();
    carregarNotificacoes();

    return () => {
      // Cleanup listeners
      const Notifications = notificationsModuleRef.current;
      if (Notifications && notifRecebidaRef.current && typeof Notifications.removeNotificationSubscription === 'function') {
        Notifications.removeNotificationSubscription(notifRecebidaRef.current);
      }
      if (Notifications && notifRespostaRef.current && typeof Notifications.removeNotificationSubscription === 'function') {
        Notifications.removeNotificationSubscription(notifRespostaRef.current);
      }
    };
  }, [uid]);

  // ── Recarregar badge quando app volta ao foreground ─────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active" &&
        uid
      ) {
        await carregarNotificacoes();
        clearBadge();
      }
      appStateRef.current = nextState;
    });
    return () => sub?.remove();
  }, [uid]);

  // ── Inicializa token e listeners ────────────────────────────────────────────
  const inicializar = async () => {
    if (Platform.OS === "web") {
      setPermissaoStatus("unsupported");
      return;
    }

    const Notifications = require("../modules/notifications");
    notificationsModuleRef.current = Notifications;

    // 1. Obter token
    const token = await obterPushToken();
    if (token) {
      setPushToken(token);
      setPermissaoStatus("granted");
      await salvarTokenNoFirestore(uid, token);
    } else {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissaoStatus(status);
    }

    // 2. Listener: notificação recebida com app em foreground
    notifRecebidaRef.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        console.log("[Notificações] Recebida em foreground:", notification.request.content.title);
        // Recarrega lista e badge
        await carregarNotificacoes();
      }
    );

    // 3. Listener: usuário tocou na notificação
    notifRespostaRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const dados = response.notification.request.content.data;
        handleNotificationTap(dados);
      }
    );
  };

  // ── Navegar ao tocar na notificação ─────────────────────────────────────────
  const handleNotificationTap = useCallback((dados) => {
    if (!dados?.tipo) return;
    // A navegação real é feita via NavigationService para não depender do hook
    // em contexto que ainda não tem a ref montada.
    try {
      const { navigationRef } = require("../navigation/NavigationService");
      if (!navigationRef?.current?.isReady()) return;

      switch (dados.tipo) {
        case NOTIFICATION_TYPES.EVENTO_NOVO:
        case NOTIFICATION_TYPES.EVENTO_LEMBRETE:
          if (dados.eventoId) {
            navigationRef.current.navigate("Main", {
              screen: "EventoStack",
              params: { screen: "Detalhes", params: { eventoId: dados.eventoId } },
            });
          }
          break;
        case NOTIFICATION_TYPES.MENSAGEM:
          navigationRef.current.navigate("Main", {
            screen: "TelaConversas",
          });
          break;
        case NOTIFICATION_TYPES.COMUNIDADE:
          if (dados.groupId) {
            navigationRef.current.navigate("Main", {
              screen: "ComunidadeStack",
              params: { screen: "ComunidadeGrupoDetalhes", params: { groupId: dados.groupId } },
            });
          }
          break;
        default:
          navigationRef.current.navigate("Main", {
            screen: "TelaNotificacoes",
          });
      }
    } catch (e) {
      console.log("[Notificações] Navegação falhou:", e.message);
    }
  }, []);

  // ── Carregar histórico do Firestore ─────────────────────────────────────────
  const carregarNotificacoes = useCallback(async (reset = true) => {
    if (!uid) return;
    if (reset) {
      setCarregando(true);
      setUltimoDoc(null);
      setTemMais(true);
    } else {
      setCarregandoMais(true);
    }
    setErro(null);
    try {
      const result = await buscarNotificacoesPaginadas(uid, {
        limit: 30,
        ultimoDoc: reset ? null : ultimoDoc,
        tipo: filtroTipo,
      });
      
      if (reset) {
        setNotificacoes(result.notificacoes);
      } else {
        setNotificacoes(prev => [...prev, ...result.notificacoes]);
      }
      
      setUltimoDoc(result.ultimoDoc);
      setTemMais(result.temMais);
      
      const count = result.notificacoes.filter((n) => !n.lida).length;
      if (reset) {
        setNaoLidas(count);
        setBadgeCount(count);
      }
    } catch (e) {
      console.error("[Notificações] Erro ao carregar:", e);
      setErro("Não foi possível carregar notificações");
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  }, [uid, ultimoDoc, filtroTipo]);

  // ── Ações ────────────────────────────────────────────────────────────────────
  const handleMarcarLida = useCallback(async (notifId) => {
    if (!uid || !notifId) return;
    await marcarComoLida(uid, notifId);
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, lida: true } : n))
    );
    setNaoLidas((prev) => Math.max(0, prev - 1));
  }, [uid]);

  const handleMarcarTodasLidas = useCallback(async () => {
    if (!uid) return;
    await marcarTodasComoLidas(uid);
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    setNaoLidas(0);
    clearBadge();
  }, [uid]);

  const handleLimparHistorico = useCallback(async () => {
    if (!uid) return;
    await limparHistorico(uid);
    setNotificacoes([]);
    setNaoLidas(0);
    clearBadge();
  }, [uid]);

  const carregarMais = useCallback(() => {
    if (temMais && !carregandoMais && !carregando) {
      carregarNotificacoes(false);
    }
  }, [temMais, carregandoMais, carregando, carregarNotificacoes]);

  const aplicarFiltro = useCallback((tipo) => {
    setFiltroTipo(tipo);
    setUltimoDoc(null);
    setTemMais(true);
  }, []);

  const limparFiltro = useCallback(() => {
    setFiltroTipo(null);
    setUltimoDoc(null);
    setTemMais(true);
  }, []);

  const value = useMemo(() => ({
    pushToken,
    permissaoStatus,
    notificacoes,
    naoLidas,
    carregando,
    carregandoMais,
    erro,
    filtroTipo,
    temMais,
    carregarNotificacoes,
    carregarMais,
    aplicarFiltro,
    limparFiltro,
    marcarLida: handleMarcarLida,
    marcarTodasLidas: handleMarcarTodasLidas,
    limparHistorico: handleLimparHistorico,
  }), [
    pushToken,
    permissaoStatus,
    notificacoes,
    naoLidas,
    carregando,
    carregandoMais,
    erro,
    filtroTipo,
    temMais,
    carregarNotificacoes,
    carregarMais,
    aplicarFiltro,
    limparFiltro,
    handleMarcarLida,
    handleMarcarTodasLidas,
    handleLimparHistorico,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}