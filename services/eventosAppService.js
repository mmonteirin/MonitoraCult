import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { registrarVisitaLocal } from "./localVisitadoService";

export async function getEventosApp() {
  try {
    const q = query(
      collection(db, "eventos"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((document) => {
        const data = document.data();

        const score =
          (data.likes || 0) * 3 +
          (data.comentarios || 0) * 4 +
          (data.views || 0) * 0.3 +
          (data.tipoEvento === "pago" ? 4 : 0) +
          (data.categoria ? 2 : 0);

        return {
          id: document.id,
          ...data,
          score,
        };
      })
      .filter((item) => item.ativo !== false);
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function getUserLikes(usuarioId) {
  if (!usuarioId) return [];

  try {
    const q = query(
      collection(db, "likes"),
      where("usuarioId", "==", usuarioId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((document) => document.data().eventoId);
  } catch (error) {
    console.log("Erro ao buscar likes do usuário:", error);
    return [];
  }
}

export async function getUserEventInteractions(usuarioId) {
  if (!usuarioId) {
    return [];
  }

  try {
    const q = query(
      collection(db, "eventInteractions"),
      where("usuarioId", "==", usuarioId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));
  } catch (error) {
    console.log("Erro ao buscar interações do usuário:", error);
    return [];
  }
}

export async function trackUserEventInteraction({
  evento,
  usuarioId,
  action = "click",
  durationMs = 0,
}) {
  if (!evento?.id || !usuarioId) {
    return;
  }

  try {
    await addDoc(collection(db, "eventInteractions"), {
      usuarioId,
      eventoId: evento.id,
      action,
      durationMs,
      categoria: evento.categoria || evento.tipoEvento || null,
      local:
        evento.localEvento ||
        evento.nomeLocal ||
        evento.local ||
        evento.location?.name ||
        null,
      titulo:
        evento.tituloEvento ||
        evento.titulo ||
        evento.name ||
        null,
      createdAt: serverTimestamp(),
    });

    if (["checkin", "compra", "attended"].includes(action)) {
      await registrarVisitaLocal(usuarioId, evento);
    }
  } catch (error) {
    console.log("Erro ao registrar interação:", error);
  }
}

export async function toggleEventoLike(eventoId, usuarioId, like) {
  if (!eventoId || !usuarioId) return;

  const eventoRef = doc(db, "eventos", eventoId);
  const likeRef = doc(db, "likes", `${eventoId}_${usuarioId}`);

  try {
    await runTransaction(db, async (transaction) => {
      const eventoSnap = await transaction.get(eventoRef);
      if (!eventoSnap.exists()) {
        throw new Error("Evento não encontrado");
      }

      const likeSnap = await transaction.get(likeRef);

      if (like) {
        if (!likeSnap.exists()) {
          transaction.set(likeRef, {
            eventoId,
            usuarioId,
            createdAt: serverTimestamp(),
          });
          transaction.update(eventoRef, {
            likes: increment(1),
          });
        }
      } else {
        if (likeSnap.exists()) {
          transaction.delete(likeRef);
          transaction.update(eventoRef, {
            likes: increment(-1),
          });
        }
      }
    });
  } catch (error) {
    console.log("Erro ao atualizar like:", error);
    throw error;
  }
}

export async function incrementEventoViews(eventoId) {
  if (!eventoId) return;

  try {
    await updateDoc(doc(db, "eventos", eventoId), {
      views: increment(1),
    });
  } catch (error) {
    console.log("Erro ao incrementar views:", error);
  }
}
