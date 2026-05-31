/**
 * notificationService.js
 *
 * ⚠️  expo-notifications depende de módulos Node.js (util, assert) que não
 *     existem no bundle web. A solução é importar via módulo local que o
 *     Metro resolve por plataforma:
 *       modules/notifications.native.js → re-export de expo-notifications
 *       modules/notifications.web.js    → stub vazio (noop)
 */

import * as Notifications from "../modules/notifications";
import { Platform } from "react-native";

import {
  doc,
  setDoc,
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
  startAfter,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { Brand } from "../styles/Colors";

// ─── Handler de foreground (noop na web via stub) ─────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Tipos ────────────────────────────────────────────────────────────────────
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
    lightColor: Brand.primary,
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

// ─── Token ────────────────────────────────────────────────────────────────────
export async function obterPushToken() {
  if (Platform.OS === "web") return null;
  try {
    const Device = require("expo-device");
    if (!Device.isDevice) return null;

    // A partir do SDK 53 do Expo, notificações push remotas não funcionam no Expo Go.
    // Verificamos se estamos executando no Expo Go ("storeClient") para evitar avisos ou erros.
    const Constants = require("expo-constants").default;
    const isExpoGo = Constants?.executionEnvironment === "storeClient";
    if (isExpoGo) {
      console.log("[Notificações] obterPushToken: Notificações push remotas não são suportadas no Expo Go. Use uma build de desenvolvimento (development build) se precisar testá-las.");
      return null;
    }

    const { status: existente } = await Notifications.getPermissionsAsync();
    let status = existente;
    if (existente !== "granted") {
      const { status: novo } = await Notifications.requestPermissionsAsync();
      status = novo;
    }
    if (status !== "granted") return null;
    await configurarCanaisAndroid();
    
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) {
      console.log("[Notificações] obterPushToken: EXPO_PUBLIC_PROJECT_ID não configurado");
      return null;
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (e) {
    console.log("[Notificações] obterPushToken:", e.message);
    return null;
  }
}

export async function salvarTokenNoFirestore(uid, token) {
  if (!uid || !token) return;
  try {
    await setDoc(
      doc(db, "users", uid, "pushTokens", token.replace(/[^a-zA-Z0-9]/g, "_")),
      { token, platform: Platform.OS, criadoEm: serverTimestamp(), ativo: true }
    );
  } catch (e) {
    console.error("[Notificações] salvarToken:", e);
  }
}

export async function desativarToken(uid, token) {
  if (!uid || !token) return;
  try {
    await updateDoc(
      doc(db, "users", uid, "pushTokens", token.replace(/[^a-zA-Z0-9]/g, "_")),
      { ativo: false }
    );
  } catch (_) {}
}

// ─── Locais ───────────────────────────────────────────────────────────────────
export async function notificarLocal({ titulo, corpo, dados = {}, canal = "eventos" }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo, body: corpo, data: dados, sound: "default",
      ...(Platform.OS === "android" && { channelId: canal }),
    },
    trigger: null,
  });
}

export async function agendarNotificacao({ titulo, corpo, dados = {}, dataHora, canal = "eventos" }) {
  if (dataHora <= new Date()) return null;
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo, body: corpo, data: dados, sound: "default",
      ...(Platform.OS === "android" && { channelId: canal }),
    },
    trigger: { date: dataHora },
  });
}

export async function cancelarNotificacao(id) {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelarTodasNotificacoes() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function agendarLembretesEvento(evento) {
  if (!evento.dataEventoTimestamp) return [];
  const dataEvento = evento.dataEventoTimestamp.toDate
    ? evento.dataEventoTimestamp.toDate()
    : new Date(evento.dataEventoTimestamp);
  const ids = [];
  const umDia = new Date(dataEvento.getTime() - 24 * 60 * 60 * 1000);
  const umaHora = new Date(dataEvento.getTime() - 60 * 60 * 1000);
  
  const lembretes = [];
  
  if (umDia > new Date()) {
    lembretes.push({
      titulo: "🎭 Amanhã tem evento!",
      corpo: `"${evento.tituloEvento}" acontece amanhã em ${evento.localEvento || "local a confirmar"}`,
      dados: { tipo: NOTIFICATION_TYPES.EVENTO_LEMBRETE, eventoId: evento.id },
      dataHora: umDia,
    });
  }
  
  if (umaHora > new Date()) {
    lembretes.push({
      titulo: "⏰ Já está chegando!",
      corpo: `"${evento.tituloEvento}" começa em 1 hora!`,
      dados: { tipo: NOTIFICATION_TYPES.EVENTO_LEMBRETE, eventoId: evento.id },
      dataHora: umaHora,
    });
  }
  
  const results = await Promise.allSettled(
    lembretes.map(lembrete => agendarNotificacao(lembrete))
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      ids.push(result.value);
    }
  });
  
  return ids;
}

// ─── Firestore ────────────────────────────────────────────────────────────────
export async function criarNotificacaoFirestore(uid, { titulo, corpo, tipo, dados = {} }) {
  if (!uid) return null;
  try {
    const ref = await addDoc(collection(db, "users", uid, "notifications"), {
      titulo, corpo, tipo, dados, lida: false, criadoEm: serverTimestamp(),
    });
    return ref.id;
  } catch (e) {
    console.error("[Notificações] criarNotificacao:", e);
    return null;
  }
}

export async function buscarNotificacoes(uid, quantidade = 30) {
  if (!uid) return [];
  try {
    const snap = await getDocs(
      query(collection(db, "users", uid, "notifications"), orderBy("criadoEm", "desc"), limit(quantidade))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("[Notificações] buscarNotificacoes:", e);
    return [];
  }
}

export async function buscarNotificacoesPaginadas(uid, { limit: limite = 30, ultimoDoc = null, tipo = null } = {}) {
  if (!uid) return { notificacoes: [], ultimoDoc: null, temMais: false };
  try {
    let q = query(collection(db, "users", uid, "notifications"), orderBy("criadoEm", "desc"), limit(limite + 1));
    
    if (tipo) {
      q = query(collection(db, "users", uid, "notifications"), where("tipo", "==", tipo), orderBy("criadoEm", "desc"), limit(limite + 1));
    }
    
    if (ultimoDoc) {
      if (tipo) {
        q = query(collection(db, "users", uid, "notifications"), where("tipo", "==", tipo), orderBy("criadoEm", "desc"), startAfter(ultimoDoc), limit(limite + 1));
      } else {
        q = query(collection(db, "users", uid, "notifications"), orderBy("criadoEm", "desc"), startAfter(ultimoDoc), limit(limite + 1));
      }
    }
    
    const snap = await getDocs(q);
    const docs = snap.docs;
    const temMais = docs.length > limite;
    const notificacoes = temMais ? docs.slice(0, limite).map((d) => ({ id: d.id, ...d.data() })) : docs.map((d) => ({ id: d.id, ...d.data() }));
    
    return {
      notificacoes,
      ultimoDoc: temMais ? docs[limite - 1] : (docs.length > 0 ? docs[docs.length - 1] : null),
      temMais,
    };
  } catch (e) {
    console.error("[Notificações] buscarNotificacoesPaginadas:", e);
    return { notificacoes: [], ultimoDoc: null, temMais: false };
  }
}

export async function marcarComoLida(uid, notifId) {
  if (!uid || !notifId) return;
  try {
    await updateDoc(doc(db, "users", uid, "notifications", notifId), { lida: true });
  } catch (_) {}
}

export async function marcarTodasComoLidas(uid) {
  if (!uid) return;
  try {
    const snap = await getDocs(
      query(collection(db, "users", uid, "notifications"), where("lida", "==", false))
    );
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { lida: true }));
    await batch.commit();
  } catch (e) {
    console.error("[Notificações] marcarTodas:", e);
  }
}

export async function contarNaoLidas(uid) {
  if (!uid) return 0;
  try {
    const snap = await getDocs(
      query(collection(db, "users", uid, "notifications"), where("lida", "==", false))
    );
    return snap.size;
  } catch (_) {
    return 0;
  }
}

export async function limparHistorico(uid) {
  if (!uid) return;
  try {
    const snap = await getDocs(collection(db, "users", uid, "notifications"));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (e) {
    console.error("[Notificações] limpar:", e);
  }
}

// ─── Push remoto ──────────────────────────────────────────────────────────────
export async function enviarPushParaToken(token, { titulo, corpo, dados = {} }) {
  try {
    const r = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: token, title: titulo, body: corpo, data: dados, sound: "default", priority: "high" }),
    });
    return await r.json();
  } catch (e) {
    console.error("[Notificações] enviarPush:", e);
    return null;
  }
}

export async function notificarUsuario(uid, payload) {
  if (!uid) return;
  try {
    const snap = await getDocs(
      query(collection(db, "users", uid, "pushTokens"), where("ativo", "==", true))
    );
    await Promise.allSettled(snap.docs.map((d) => enviarPushParaToken(d.data().token, payload)));
    await criarNotificacaoFirestore(uid, payload);
  } catch (e) {
    console.error("[Notificações] notificarUsuario:", e);
  }
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}