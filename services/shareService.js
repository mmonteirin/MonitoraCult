/**
 * Serviço de rastreamento de compartilhamentos de eventos
 * Permite rastrear quais eventos o usuário compartilhou com outros
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const COLLECTION_NAME = "compartilhamentos";

/**
 * Registra um compartilhamento de evento
 * @param {string} userId - ID do usuário
 * @param {string} eventoId - ID do evento
 * @param {string} plataforma - Plataforma de compartilhamento (whatsapp, facebook, etc.)
 * @param {Object} eventoData - Dados do evento para cache
 */
export async function registrarCompartilhamento(
  userId,
  eventoId,
  plataforma,
  eventoData = {}
) {
  try {
    const compartilhamentoRef = await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      eventoId,
      plataforma,
      timestamp: serverTimestamp(),
      eventoData: {
        titulo: eventoData.tituloEvento || eventoData.titulo,
        categoria: eventoData.categoria,
        local: eventoData.localEvento || eventoData.local,
        imagem: eventoData.imagemEvento || eventoData.imagem,
      },
    });

    return { success: true, id: compartilhamentoRef.id };
  } catch (error) {
    console.error("Erro ao registrar compartilhamento:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca todos os eventos compartilhados por um usuário
 * @param {string} userId - ID do usuário
 * @param {number} limit - Limite de resultados (opcional)
 */
export async function getEventosCompartilhados(userId, limit = 50) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    const compartilhamentos = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      compartilhamentos.push({
        id: doc.id,
        eventoId: data.eventoId,
        plataforma: data.plataforma,
        timestamp: data.timestamp,
        eventoData: data.eventoData,
      });
    });

    return compartilhamentos.slice(0, limit);
  } catch (error) {
    console.error("Erro ao buscar eventos compartilhados:", error);
    return [];
  }
}

/**
 * Busca eventos compartilhados com dados completos do evento
 * @param {string} userId - ID do usuário
 * @param {Array} eventosDisponiveis - Lista de eventos disponíveis para fazer join
 */
export async function getSharedEventsWithDetails(userId, eventosDisponiveis = []) {
  try {
    const compartilhamentos = await getEventosCompartilhados(userId);
    
    // Cria mapa de eventos por ID para lookup rápido
    const eventosMap = {};
    eventosDisponiveis.forEach((evento) => {
      eventosMap[evento.id] = evento;
    });

    // Faz join com dados completos do evento
    const sharedEvents = compartilhamentos
      .map((comp) => {
        const eventoCompleto = eventosMap[comp.eventoId];
        if (!eventoCompleto) return null;

        return {
          ...eventoCompleto,
          timestamp: comp.timestamp,
          plataforma: comp.platajeta,
        };
      })
      .filter(Boolean);

    return sharedEvents;
  } catch (error) {
    console.error("Erro ao buscar eventos compartilhados com detalhes:", error);
    return [];
  }
}

/**
 * Remove um registro de compartilhamento
 * @param {string} compartilhamentoId - ID do compartilhamento
 */
export async function removerCompartilhamento(compartilhamentoId) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, compartilhamentoId));
    return { success: true };
  } catch (error) {
    console.error("Erro ao remover compartilhamento:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Conta quantas vezes um evento foi compartilhado
 * @param {string} eventoId - ID do evento
 */
export async function contarCompartilhamentosEvento(eventoId) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("eventoId", "==", eventoId)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Erro ao contar compartilhamentos:", error);
    return 0;
  }
}
