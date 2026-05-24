/**
 * notificationService.js
 * Serviço completo de notificações push — expo-notifications + Firestore
 *
 * Responsabilidades:
 *  - Solicitar permissão e obter o Expo Push Token
 *  - Salvar/remover o token no Firestore (users/{uid}/pushTokens)
 *  - Enviar notificações locais (agendadas ou imediatas)
 *  - Enviar notificações via Expo Push API (servidor → dispositivo)
 *  - Persistir histórico de notificações em Firestore (users/{uid}/notifications)
 *  - Utilitários: marcar como lida, limpar histórico, contar não lidas
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  writeBatch,
  getDoc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

// ─── Configuração padrão do handler ──────────────────────────────────────────
// Define o comportamento quando a notificação chega com o app em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Tipos de notificação suportados ─────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  EVENTO_NOVO: "evento_novo",
  EVENTO_LEMBRETE: "evento_lembrete",
  EVENTO_AVALIACAO: "evento_avaliacao",
  EVENTO_CANCELADO: "evento_cancelado",
  EVENTO_ALTERADO: "evento_alterado",
  LIKE: "like",
  COMENTARIO: "comentario",
  FOLLOW: "follow",
  MENSAGEM: "mensagem",
  COMUNIDADE: "comunidade",
  SISTEMA: "sistema",
};

// ─── Canal Android ────────────────────────────────────────────────────────────
export async function configurarCanaisAndroid() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("eventos", {
    name: "Eventos Culturais",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#6C5CE7",
    sound: "default",
    enableVibrate: true,
  });

  await Notifications.setNotificationChannelAsync("social", {
    name: "Interações Sociais",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("mensagens", {
    name: "Mensagens",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    enableVibrate: true,
  });

  await Notifications.setNotificationChannelAsync("sistema", {
    name: "Sistema",
    importance: Notifications.AndroidImportance.LOW,
  });
}

// ─── Permissão e token ────────────────────────────────────────────────────────

/**
 * Solicita permissão e retorna o Expo Push Token.
 * Retorna null em simulador/emulador ou se permissão negada.
 */
export async function obterPushToken() {
  // Expo Push Notifications só funciona em dispositivo físico
  if (!Device.isDevice) {
    console.log("[Notificações] Push Token não disponível em simulador.");
    return null;
  }

  const { status: existente } = await Notifications.getPermissionsAsync();
  let status = existente;

  if (existente !== "granted") {
    const { status: novo } = await Notifications.requestPermissionsAsync();
    status = novo;
  }

  if (status !== "granted") {
    console.log("[Notificações] Permissão negada pelo usuário.");
    return null;
  }

  await configurarCanaisAndroid();

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "snack-76330891-d725-4703-84bd-f58504f3c860", // slug do app.json
  });

  return tokenData.data;
}

/**
 * Salva o push token no Firestore para o usuário autenticado.
 * Armazena por deviceId para suportar múltiplos dispositivos.
 */
export async function salvarTokenNoFirestore(uid, token) {
  if (!uid || !token) return;

  try {
    const tokenRef = doc(db, "users", uid, "pushTokens", token.replace(/[^a-zA-Z0-9]/g, "_"));
    await setDoc(tokenRef, {
      token,
      platform: Platform.OS,
      criadoEm: serverTimestamp(),
      ativo: true,
    });
  } catch (error) {
    console.error("[Notificações] Erro ao salvar token:", error);
  }
}

/**
 * Desativa o token ao fazer logout (não remove, apenas marca inativo).
 */
export async function desativarToken(uid, token) {
  if (!uid || !token) return;
  try {
    const tokenRef = doc(db, "users", uid, "pushTokens", token.replace(/[^a-zA-Z0-9]/g, "_"));
    await updateDoc(tokenRef, { ativo: false });
  } catch (_) {}
}

// ─── Notificações locais ──────────────────────────────────────────────────────

/**
 * Exibe uma notificação local imediata.
 */
export async function notificarLocal({ titulo, corpo, dados = {}, canal = "eventos" }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: corpo,
      data: dados,
      sound: "default",
      ...(Platform.OS === "android" && { channelId: canal }),
    },
    trigger: null, // imediata
  });
}

/**
 * Agenda uma notificação local para uma data/hora específica.
 */
export async function agendarNotificacao({ titulo, corpo, dados = {}, dataHora, canal = "eventos" }) {
  if (dataHora <= new Date()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: corpo,
      data: dados,
      sound: "default",
      ...(Platform.OS === "android" && { channelId: canal }),
    },
    trigger: { date: dataHora },
  });

  return id;
}

/**
 * Cancela uma notificação agendada por ID.
 */
export async function cancelarNotificacao(notificationId) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancela todas as notificações agendadas.
 */
export async function cancelarTodasNotificacoes() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Lembrete de evento ───────────────────────────────────────────────────────

/**
 * Agenda lembretes automáticos para um evento:
 *   - 24h antes
 *   - 1h antes
 */
export async function agendarLembretesEvento(evento) {
  if (!evento.dataEventoTimestamp) return [];

  const dataEvento = evento.dataEventoTimestamp.toDate
    ? evento.dataEventoTimestamp.toDate()
    : new Date(evento.dataEventoTimestamp);

  const ids = [];

  const umDiaAntes = new Date(dataEvento.getTime() - 24 * 60 * 60 * 1000);
  if (umDiaAntes > new Date()) {
    const id = await agendarNotificacao({
      titulo: "🎭 Amanhã tem evento!",
      corpo: `"${evento.tituloEvento}" acontece amanhã em ${evento.localEvento || "local a confirmar"}`,
      dados: { tipo: NOTIFICATION_TYPES.EVENTO_LEMBRETE, eventoId: evento.id },
      dataHora: umDiaAntes,
    });
    if (id) ids.push(id);
  }

  const umaHoraAntes = new Date(dataEvento.getTime() - 60 * 60 * 1000);
  if (umaHoraAntes > new Date()) {
    const id = await agendarNotificacao({
      titulo: "⏰ Já está chegando!",
      corpo: `"${evento.tituloEvento}" começa em 1 hora!`,
      dados: { tipo: NOTIFICATION_TYPES.EVENTO_LEMBRETE, eventoId: evento.id },
      dataHora: umaHoraAntes,
    });
    if (id) ids.push(id);
  }

  return ids;
}

// ─── Histórico Firestore ──────────────────────────────────────────────────────

/**
 * Cria uma notificação no histórico do usuário (Firestore).
 * Usado para exibir o sino de notificações dentro do app.
 */
export async function criarNotificacaoFirestore(uid, { titulo, corpo, tipo, dados = {} }) {
  if (!uid) return null;
  try {
    const ref = await addDoc(collection(db, "users", uid, "notifications"), {
      titulo,
      corpo,
      tipo,
      dados,
      lida: false,
      criadoEm: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    console.error("[Notificações] Erro ao criar notificação:", error);
    return null;
  }
}

/**
 * Busca as últimas notificações do usuário.
 */
export async function buscarNotificacoes(uid, quantidade = 30) {
  if (!uid) return [];
  try {
    const q = query(
      collection(db, "users", uid, "notifications"),
      orderBy("criadoEm", "desc"),
      limit(quantidade)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("[Notificações] Erro ao buscar:", error);
    return [];
  }
}

/**
 * Marca uma notificação específica como lida.
 */
export async function marcarComoLida(uid, notifId) {
  if (!uid || !notifId) return;
  try {
    await updateDoc(doc(db, "users", uid, "notifications", notifId), { lida: true });
  } catch (_) {}
}

/**
 * Marca todas as notificações do usuário como lidas.
 */
export async function marcarTodasComoLidas(uid) {
  if (!uid) return;
  try {
    const q = query(
      collection(db, "users", uid, "notifications"),
      where("lida", "==", false)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { lida: true }));
    await batch.commit();
  } catch (error) {
    console.error("[Notificações] Erro ao marcar todas:", error);
  }
}

/**
 * Conta notificações não lidas.
 */
export async function contarNaoLidas(uid) {
  if (!uid) return 0;
  try {
    const q = query(
      collection(db, "users", uid, "notifications"),
      where("lida", "==", false)
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (_) {
    return 0;
  }
}

/**
 * Remove todas as notificações do histórico.
 */
export async function limparHistorico(uid) {
  if (!uid) return;
  try {
    const snap = await getDocs(collection(db, "users", uid, "notifications"));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    console.error("[Notificações] Erro ao limpar:", error);
  }
}

// ─── Envio via Expo Push API (server-side) ────────────────────────────────────

/**
 * Envia uma notificação push para um token específico via Expo Push API.
 * Usar em Cloud Functions ou em fluxos de admin.
 *
 * Nota: Para produção, mova isso para um backend seguro.
 */
export async function enviarPushParaToken(token, { titulo, corpo, dados = {} }) {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: token,
        title: titulo,
        body: corpo,
        data: dados,
        sound: "default",
        priority: "high",
      }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Notificações] Erro ao enviar push:", error);
    return null;
  }
}

/**
 * Busca todos os tokens ativos de um usuário e envia push para todos.
 */
export async function notificarUsuario(uid, payload) {
  if (!uid) return;
  try {
    const snap = await getDocs(
      query(
        collection(db, "users", uid, "pushTokens"),
        where("ativo", "==", true)
      )
    );
    const promises = snap.docs.map((d) =>
      enviarPushParaToken(d.data().token, payload)
    );
    await Promise.allSettled(promises);
    // Persiste no histórico do usuário
    await criarNotificacaoFirestore(uid, payload);
  } catch (error) {
    console.error("[Notificações] Erro ao notificar usuário:", error);
  }
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}
