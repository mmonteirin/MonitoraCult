import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import {
  NOTIFICATION_TYPES,
  agendarNotificacao,
  criarNotificacaoFirestore,
} from "./notificationService";

const parseEventoData = (evento) => {
  const value = evento?.dataEventoTimestamp || evento?.dataEvento;
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;

  const brDate = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function adicionarAvaliacaoEvento({
  eventoId,
  user,
  nota,
  comentario,
  tituloEvento,
}) {
  if (!eventoId || !user?.uid) {
    throw new Error("Dados inválidos para avaliação.");
  }

  const eventoRef = doc(db, "eventos", eventoId);
  const avaliacaoRef = doc(
    db,
    "eventos",
    eventoId,
    "avaliacoes",
    user.uid
  );
  const userAvaliacaoRef = doc(
    collection(db, "users", user.uid, "avaliacoes")
  );

  const avaliacaoData = {
    userId: user.uid,
    nome: user.displayName || "Anônimo",
    nota: Number(nota),
    comentario: comentario.trim(),
    foto: user.photoURL || "https://i.pravatar.cc/100",
    createdAt: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const [eventoSnap, avaliacaoSnap] = await Promise.all([
      transaction.get(eventoRef),
      transaction.get(avaliacaoRef),
    ]);
    if (!eventoSnap.exists()) {
      throw new Error("Evento não encontrado.");
    }
    if (avaliacaoSnap.exists()) {
      throw new Error("Você já avaliou este evento.");
    }

    const evento = eventoSnap.data();
    const resumo = evento.avaliacoesResumo || {};
    const totalAnterior = Number(
      resumo.total ?? evento.totalAvaliacoes ?? 0
    );
    const somaAnterior = Number(resumo.soma ?? evento.somaAvaliacoes ?? 0);
    const total = totalAnterior + 1;
    const soma = somaAnterior + Number(nota);
    const media = total > 0 ? soma / total : 0;

    transaction.set(avaliacaoRef, avaliacaoData);
    transaction.set(userAvaliacaoRef, {
      avaliacaoId: avaliacaoRef.id,
      ...avaliacaoData,
      eventoId,
      tituloEvento: tituloEvento || evento.tituloEvento || "Evento",
    });
    transaction.update(eventoRef, {
      avaliacoesResumo: {
        total,
        soma,
        media,
        updatedAt: serverTimestamp(),
      },
      totalAvaliacoes: total,
      somaAvaliacoes: soma,
      mediaAvaliacoes: media,
    });
  });

  return {
    id: avaliacaoRef.id,
    ...avaliacaoData,
  };
}

export async function removerAvaliacaoEvento({ eventoId, avaliacaoId, userId }) {
  if (!eventoId || !avaliacaoId) return;

  const eventoRef = doc(db, "eventos", eventoId);
  const avaliacaoRef = doc(db, "eventos", eventoId, "avaliacoes", avaliacaoId);

  await runTransaction(db, async (transaction) => {
    const [eventoSnap, avaliacaoSnap] = await Promise.all([
      transaction.get(eventoRef),
      transaction.get(avaliacaoRef),
    ]);

    if (!eventoSnap.exists() || !avaliacaoSnap.exists()) return;

    const evento = eventoSnap.data();
    const avaliacao = avaliacaoSnap.data();
    const resumo = evento.avaliacoesResumo || {};
    const total = Math.max(
      0,
      Number(resumo.total ?? evento.totalAvaliacoes ?? 1) - 1
    );
    const soma = Math.max(
      0,
      Number(resumo.soma ?? evento.somaAvaliacoes ?? avaliacao.nota) -
        Number(avaliacao.nota || 0)
    );
    const media = total > 0 ? soma / total : 0;

    transaction.delete(avaliacaoRef);
    transaction.update(eventoRef, {
      avaliacoesResumo: {
        total,
        soma,
        media,
        updatedAt: serverTimestamp(),
      },
      totalAvaliacoes: total,
      somaAvaliacoes: soma,
      mediaAvaliacoes: media,
    });
  });

  if (userId) {
    const snap = await getDocs(
      query(
        collection(db, "users", userId, "avaliacoes"),
        where("avaliacaoId", "==", avaliacaoId)
      )
    );

    await Promise.all(snap.docs.map((item) => deleteDoc(item.ref)));
  }
}

export async function agendarPedidoAvaliacaoEvento({
  eventoId,
  userId,
  userEmail,
}) {
  if (!eventoId || !userId) return null;

  const eventoSnap = await getDoc(doc(db, "eventos", eventoId));
  if (!eventoSnap.exists()) return null;

  const evento = {
    id: eventoSnap.id,
    ...eventoSnap.data(),
  };

  const dataEvento = parseEventoData(evento);
  if (!dataEvento) return null;

  const dataEnvio = new Date(dataEvento.getTime() + 24 * 60 * 60 * 1000);
  const tituloEvento = evento.tituloEvento || "o evento";
  const payload = {
    titulo: "Como foi sua experiência?",
    corpo: `Avalie ${tituloEvento} e ajude outras pessoas a escolherem melhor.`,
    tipo: NOTIFICATION_TYPES.EVENTO_AVALIACAO,
    dados: {
      eventoId,
      screen: "EventoAvaliacao",
    },
  };

  const reminderRef = doc(
    db,
    "eventos",
    eventoId,
    "avaliacaoReminders",
    userId
  );

  await setDoc(
    reminderRef,
    {
      userId,
      userEmail: userEmail || null,
      eventoId,
      tituloEvento,
      scheduledFor: dataEnvio,
      status: dataEnvio > new Date() ? "agendado" : "pendente",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  if (dataEnvio > new Date()) {
    const notificationId = await agendarNotificacao({
      titulo: payload.titulo,
      corpo: payload.corpo,
      dados: payload.dados,
      dataHora: dataEnvio,
    });

    await updateDoc(reminderRef, {
      notificationId: notificationId || null,
    });
  } else {
    await criarNotificacaoFirestore(userId, payload);
  }

  if (userEmail) {
    await setDoc(doc(collection(db, "mail")), {
      to: userEmail,
      message: {
        subject: `Avalie sua experiência em ${tituloEvento}`,
        text: `Olá! Conte como foi sua experiência em ${tituloEvento}. Sua avaliação ajuda a comunidade cultural.`,
        html: `<p>Olá!</p><p>Conte como foi sua experiência em <strong>${tituloEvento}</strong>. Sua avaliação ajuda a comunidade cultural.</p>`,
      },
      sendAt: dataEnvio,
      tipo: "pedido_avaliacao_evento",
      eventoId,
      userId,
      createdAt: serverTimestamp(),
    });
  }

  await updateDoc(doc(db, "eventos", eventoId), {
    pedidosAvaliacaoAgendados: increment(1),
  }).catch(() => {});

  return {
    scheduledFor: dataEnvio,
  };
}
