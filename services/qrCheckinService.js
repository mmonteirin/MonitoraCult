/**
 * 🎫 SERVIÇO DE CHECK-IN POR QR CODE
 *
 * Valida o ingresso escaneado, marca como utilizado
 * e registra o comparecimento nas métricas de alcance.
 *
 * Estrutura Firestore usada:
 *  • comprasIngressos/{compraId}          — compra raiz (usada pelo ingressoServiceV2)
 *  • usuarios/{userId}/compras/{compraId} — cópia do usuário
 *  • eventos/{eventoId}/metricas/alcance  — contadores de alcance (comparecimentos)
 *  • eventos/{eventoId}/checkIns/{checkInId} — log individual por entrada
 */

import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  increment,
  addDoc,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

// ─── Status reutilizados do ingressoServiceV2 ────────────────────────────────
export const STATUS_INGRESSO = {
  PENDENTE: "pendente",
  CONFIRMADO: "confirmado",
  CANCELADO: "cancelado",
  UTILIZADO: "utilizado",
};

// ─── Resultado padronizado ────────────────────────────────────────────────────
const resultado = (ok, mensagem, dados = {}) => ({
  valido: ok,
  mensagem,
  ...dados,
});

/**
 * 🔍 Busca a compra que contém o código do ingresso para um evento.
 * Retorna { compraDocId, compraData, ingresso } ou null.
 */
const buscarIngressoPorCodigo = async (codigoIngresso, eventoId) => {
  const q = query(
    collection(db, "comprasIngressos"),
    where("eventoId", "==", eventoId)
  );

  const snap = await getDocs(q);
  let encontrado = null;

  snap.forEach((docSnap) => {
    if (encontrado) return;
    const data = docSnap.data();
    const ing = data.ingressos?.find(
      (i) => i.codigoIngresso === codigoIngresso
    );
    if (ing) {
      encontrado = {
        compraDocId: docSnap.id,
        compraData: data,
        ingresso: ing,
      };
    }
  });

  return encontrado;
};

/**
 * ✅ REALIZAR CHECK-IN
 *
 * Fluxo:
 *  1. Localiza o ingresso em comprasIngressos
 *  2. Valida status (não cancelado, não já utilizado)
 *  3. Em transação atômica:
 *     a. Marca ingresso como UTILIZADO em comprasIngressos
 *     b. Incrementa eventos/{eventoId}/metricas/alcance.comparecimentos
 *     c. Decrementa se necessário (não aplica aqui)
 *  4. Grava log em eventos/{eventoId}/checkIns
 *
 * @param {string} codigoIngresso  — código escaneado do QR
 * @param {string} eventoId        — ID do evento
 * @param {string} operadorId      — UID do organizador que escaneou
 * @returns {{ valido, mensagem, usuario?, tipo?, compraId? }}
 */
export const realizarCheckIn = async (
  codigoIngresso,
  eventoId,
  operadorId
) => {
  if (!codigoIngresso || !eventoId) {
    return resultado(false, "Dados inválidos para check-in.");
  }

  try {
    // 1. Localizar ingresso
    const encontrado = await buscarIngressoPorCodigo(
      codigoIngresso,
      eventoId
    );

    if (!encontrado) {
      return resultado(false, "Ingresso não encontrado para este evento.");
    }

    const { compraDocId, compraData, ingresso } = encontrado;

    // 2. Validar status
    if (ingresso.status === STATUS_INGRESSO.CANCELADO) {
      return resultado(false, "Este ingresso foi cancelado.", {
        usuario: compraData.userName,
      });
    }

    if (ingresso.status === STATUS_INGRESSO.UTILIZADO) {
      const usadoEm = ingresso.usadoEm
        ? new Date(ingresso.usadoEm?.seconds * 1000 || ingresso.usadoEm)
            .toLocaleString("pt-BR")
        : "anteriormente";

      return resultado(
        false,
        `Ingresso já utilizado em ${usadoEm}.`,
        { usuario: compraData.userName }
      );
    }

    // 3. Transação atômica
    const compraRaizRef = doc(db, "comprasIngressos", compraDocId);
    const alcanceRef = doc(
      db,
      "eventos",
      eventoId,
      "metricas",
      "alcance"
    );

    await runTransaction(db, async (tx) => {
      const compraSnap = await tx.get(compraRaizRef);

      if (!compraSnap.exists()) {
        throw new Error("Compra não encontrada durante transação.");
      }

      const dadosAtuais = compraSnap.data();

      // Marcar ingresso como utilizado
      const ingressosAtualizados = dadosAtuais.ingressos.map((ing) =>
        ing.codigoIngresso === codigoIngresso
          ? {
              ...ing,
              status: STATUS_INGRESSO.UTILIZADO,
              usadoEm: new Date().toISOString(),
              operadorId: operadorId || null,
            }
          : ing
      );

      tx.update(compraRaizRef, { ingressos: ingressosAtualizados });

      // Incrementar comparecimentos no dashboard de alcance
      tx.set(
        alcanceRef,
        { comparecimentos: increment(1) },
        { merge: true }
      );
    });

    // 4. Log de check-in (fora da transação — falha silenciosa aceitável)
    try {
      await addDoc(
        collection(db, "eventos", eventoId, "checkIns"),
        {
          codigoIngresso,
          compraId: compraDocId,
          userId: compraData.userId || compraData.usuarioId || null,
          userName: compraData.userName || "Participante",
          userPhoto: compraData.userPhoto || null,
          tipoIngresso: ingresso.tipo || "inteira",
          operadorId: operadorId || null,
          realizadoEm: serverTimestamp(),
        }
      );
    } catch (_) {
      // log não crítico — não impede o check-in
    }

    return resultado(true, "Entrada confirmada! ✓", {
      usuario: compraData.userName || "Participante",
      foto: compraData.userPhoto || null,
      tipo: ingresso.tipo || "inteira",
      compraId: compraDocId,
    });
  } catch (error) {
    console.error("[qrCheckInService] Erro:", error);
    return resultado(false, "Erro ao registrar entrada. Tente novamente.");
  }
};

/**
 * 📋 LISTAR CHECK-INS DO EVENTO
 * Retorna os últimos check-ins para exibição no histórico.
 */
export const listarCheckIns = async (eventoId, limite = 50) => {
  try {
    const snap = await getDocs(
      query(
        collection(db, "eventos", eventoId, "checkIns"),
        orderBy("realizadoEm", "desc"),
        limit(limite)
      )
    );

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("[qrCheckInService] listarCheckIns:", error);
    return [];
  }
};