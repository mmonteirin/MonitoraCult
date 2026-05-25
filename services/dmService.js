/**
 * 💬 SERVIÇO: DIRECT MESSAGES
 * Enviar, receber e gerenciar mensagens diretas entre usuários
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  limit,
  increment,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const fallbackAvatar = (id) => `https://i.pravatar.cc/100?u=${id || "user"}`;

const getOutroParticipanteFromConversaId = (conversaId, usuarioId) =>
  conversaId
    ?.split("_")
    .find((participanteId) => participanteId && participanteId !== usuarioId);

const getTimestampMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
};

const ordenarConversasPorAtividade = (conversas) =>
  conversas.sort(
    (a, b) =>
      getTimestampMillis(b.ultimaAtividade) -
      getTimestampMillis(a.ultimaAtividade)
  );

// ✅ ENVIAR MENSAGEM
export const enviarMensagem = async ({
  remetenteId,
  remetenteName,
  remetentePhoto,
  destinatarioId,
  destinatarioName,
  destinatarioPhoto,
  texto,
  conversaId: conversaIdParam,
  midia = null, // {tipo: 'imagem/video', uri}
}) => {
  try {
    if (!remetenteId) throw new Error("Usuário remetente inválido");
    if (!texto?.trim() && !midia) throw new Error("Mensagem não pode estar vazia");

    let conversaId = conversaIdParam;
    if (!conversaId && destinatarioId) {
      conversaId = [remetenteId, destinatarioId].sort().join("_");
    }

    if (!conversaId) throw new Error("Conversa inválida");

    const conversaRef = doc(db, "conversas", conversaId);
    destinatarioId =
      destinatarioId ||
      getOutroParticipanteFromConversaId(conversaId, remetenteId);

    if (!destinatarioId) throw new Error("Destinatário inválido");

    const mensagemData = {
      conversaId,
      remetenteId,
      remetenteName: remetenteName || "Usuário",
      remetentePhoto: remetentePhoto || fallbackAvatar(remetenteId),
      destinatarioId,
      destinatarioName: destinatarioName || "Usuário",
      destinatarioPhoto: destinatarioPhoto || fallbackAvatar(destinatarioId),
      texto: texto.trim(),
      midia,
      lido: false,
      deletado: false,
      editado: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const conversaPayload = {
      conversaId,
      participantes: [remetenteId, destinatarioId].sort(),
      ultimaMensagem: texto.trim(),
      ultimaAtividade: serverTimestamp(),
      remetente: remetenteId,
    };

    await setDoc(conversaRef, {
      ...conversaPayload,
      [`naoLido.${destinatarioId}`]: increment(1),
      [`naoLido.${remetenteId}`]: 0,
      [`usuariosComDeleção.${remetenteId}`]: false,
      [`usuariosComDeleção.${destinatarioId}`]: false,
    }, { merge: true });

    // Adicionar mensagem após garantir que a conversa existe para as rules.
    const docRef = await addDoc(
      collection(db, "conversas", conversaId, "mensagens"),
      mensagemData
    );

    return {
      success: true,
      mensagemId: docRef.id,
      mensagem: mensagemData,
    };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ✅ OBTER CONVERSAS DO USUÁRIO
export const obterConversas = async (userId) => {
  try {
    // Buscar conversas onde o usuário participa
    const q = query(
      collection(db, "conversas"),
      where("participantes", "array-contains", userId)
    );

    const snapshot = await getDocs(q);
    const conversas = [];

    snapshot.forEach((doc) => {
      const conversa = { id: doc.id, ...doc.data() };
      conversas.push(conversa);
    });

    return ordenarConversasPorAtividade(conversas);
  } catch (error) {
    console.error("Erro ao obter conversas:", error);
    return [];
  }
};

// ✅ OBTER MENSAGENS DE UMA CONVERSA
export const obterMensagens = async (conversaId, limiteMsg = 50) => {
  try {
    const q = query(
      collection(db, "conversas", conversaId, "mensagens"),
      orderBy("createdAt", "desc"),
      limit(limiteMsg)
    );

    const snapshot = await getDocs(q);
    const mensagens = [];

    snapshot.forEach((doc) => {
      mensagens.push({ id: doc.id, ...doc.data() });
    });

    return mensagens.reverse(); // Reverter para ordem cronológica
  } catch (error) {
    console.error("Erro ao obter mensagens:", error);
    return [];
  }
};

// ✅ MARCAR MENSAGENS COMO LIDAS
export const marcarComolidas = async (conversaId, usuarioId) => {
  try {
    const q = query(
      collection(db, "conversas", conversaId, "mensagens"),
      where("destinatarioId", "==", usuarioId),
      where("lido", "==", false)
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(async (docSnap) => {
      await updateDoc(docSnap.ref, { lido: true });
    });

    // Atualizar contador na conversa
    const conversaRef = doc(db, "conversas", conversaId);
    await updateDoc(conversaRef, {
      [`naoLido.${usuarioId}`]: 0,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar como lidas:", error);
    return { success: false, error: error.message };
  }
};

// ✅ DELETAR MENSAGEM
export const deletarMensagem = async (conversaId, mensagemId, usuarioId) => {
  try {
    const mensagemRef = doc(
      db,
      "conversas",
      conversaId,
      "mensagens",
      mensagemId
    );
    const mensagemSnap = await getDoc(mensagemRef);

    if (!mensagemSnap.exists()) {
      return { success: false, error: "Mensagem não encontrada" };
    }

    const mensagem = mensagemSnap.data();

    if (mensagem.remetenteId !== usuarioId) {
      return { success: false, error: "Permissão negada" };
    }

    await updateDoc(mensagemRef, {
      deletado: true,
      texto: "[Mensagem deletada]",
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar mensagem:", error);
    return { success: false, error: error.message };
  }
};

// ✅ EDITAR MENSAGEM
export const editarMensagem = async (
  conversaId,
  mensagemId,
  novoTexto,
  usuarioId
) => {
  try {
    const mensagemRef = doc(
      db,
      "conversas",
      conversaId,
      "mensagens",
      mensagemId
    );
    const mensagemSnap = await getDoc(mensagemRef);

    if (!mensagemSnap.exists()) {
      return { success: false, error: "Mensagem não encontrada" };
    }

    const mensagem = mensagemSnap.data();

    if (mensagem.remetenteId !== usuarioId) {
      return { success: false, error: "Permissão negada" };
    }

    await updateDoc(mensagemRef, {
      texto: novoTexto.trim(),
      editado: true,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao editar mensagem:", error);
    return { success: false, error: error.message };
  }
};

// ✅ ESCUTAR MENSAGENS EM TEMPO REAL
export const escutarMensagens = (conversaId, callback) => {
  try {
    const q = query(
      collection(db, "conversas", conversaId, "mensagens"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const mensagens = [];

      snapshot.forEach((doc) => {
        mensagens.push({ id: doc.id, ...doc.data() });
      });

      callback(mensagens.reverse()); // Ordem cronológica
    });
  } catch (error) {
    console.error("Erro ao escutar mensagens:", error);
    return () => {};
  }
};

// ✅ ESCUTAR CONVERSAS EM TEMPO REAL
export const escutarConversas = (userId, callback) => {
  try {
    const q = query(
      collection(db, "conversas"),
      where("participantes", "array-contains", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const conversas = [];

      snapshot.forEach((doc) => {
        const conversa = { id: doc.id, ...doc.data() };
        const usuariosDeletou = conversa.usuariosComDeleção || {};
        if (!usuariosDeletou[userId]) {
          conversas.push(conversa);
        }
      });

      callback(ordenarConversasPorAtividade(conversas));
    });
  } catch (error) {
    console.error("Erro ao escutar conversas:", error);
    return () => {};
  }
};

// ✅ CONTAR MENSAGENS NÃO LIDAS
export const contarNaoLidas = async (userId) => {
  try {
    const conversas = await obterConversas(userId);
    let total = 0;

    for (const conversa of conversas) {
      const q = query(
        collection(db, "conversas", conversa.id, "mensagens"),
        where("destinatarioId", "==", userId),
        where("lido", "==", false)
      );

      const snapshot = await getDocs(q);
      total += snapshot.size;
    }

    return total;
  } catch (error) {
    console.error("Erro ao contar não lidas:", error);
    return 0;
  }
};

// ✅ BUSCAR OU CRIAR CONVERSA COM USUÁRIO
export const obterOuCriarConversa = async (
  usuarioId,
  outroUsuarioId
) => {
  try {
    const conversaId = [usuarioId, outroUsuarioId].sort().join("_");
    const conversaRef = doc(db, "conversas", conversaId);

    // Garante a conversa sem leitura prévia, evitando bloqueio das rules em docs inexistentes.
    const novaConversa = {
      conversaId,
      participantes: [usuarioId, outroUsuarioId].sort(),
    };

    await setDoc(conversaRef, novaConversa, { merge: true });

    return { success: true, conversaId, conversa: novaConversa };
  } catch (error) {
    console.error("Erro ao obter/criar conversa:", error);
    return { success: false, error: error.message };
  }
};

// ✅ DELETAR CONVERSA PARA O USUÁRIO (soft delete)
export const deletarConversaParaUsuario = async (conversaId, usuarioId) => {
  try {
    const conversaRef = doc(db, "conversas", conversaId);
    
    // Adiciona usuário na lista de users que deletaram para si
    await updateDoc(conversaRef, {
      [`usuariosComDeleção.${usuarioId}`]: true,
      [`naoLido.${usuarioId}`]: 0,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar conversa:", error);
    return { success: false, error: error.message };
  }
};

// ✅ OBTER CONVERSAS ATIVAS (filtrando as deletadas pelo usuário)
export const obterConversasAtivas = async (userId) => {
  try {
    const q = query(
      collection(db, "conversas"),
      where("participantes", "array-contains", userId)
    );

    const snapshot = await getDocs(q);
    const conversas = [];

    snapshot.forEach((doc) => {
      const conversa = { id: doc.id, ...doc.data() };
      
      // Filtra conversas deletadas pelo usuário
      const usuariosDeletou = conversa.usuariosComDeleção || {};
      if (!usuariosDeletou[userId]) {
        conversas.push(conversa);
      }
    });

    return ordenarConversasPorAtividade(conversas);
  } catch (error) {
    console.error("Erro ao obter conversas ativas:", error);
    return [];
  }
};

// ✅ RESTAURAR CONVERSA (caso tenha sido deletada)
export const restaurarConversa = async (conversaId, usuarioId) => {
  try {
    const conversaRef = doc(db, "conversas", conversaId);
    
    await updateDoc(conversaRef, {
      [`usuariosComDeleção.${usuarioId}`]: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao restaurar conversa:", error);
    return { success: false, error: error.message };
  }
};
