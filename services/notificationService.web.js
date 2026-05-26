import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  writeBatch,
  doc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

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

export async function obterPushToken() {
  return null;
}

export async function salvarTokenNoFirestore() {}
export async function desativarToken() {}
export async function configurarCanaisAndroid() {}
export async function notificarLocal() {}
export async function agendarNotificacao() {
  return null;
}
export async function cancelarNotificacao() {}
export async function cancelarTodasNotificacoes() {}
export async function agendarLembretesEvento() {
  return [];
}
export async function enviarPushParaToken() {
  return null;
}
export async function setBadgeCount() {}
export async function clearBadge() {}

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

export async function marcarComoLida(uid, notifId) {
  if (!uid || !notifId) return;
  await updateDoc(doc(db, "users", uid, "notifications", notifId), {
    lida: true,
  }).catch(() => {});
}

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

export async function notificarUsuario(uid, payload) {
  await criarNotificacaoFirestore(uid, payload);
}
