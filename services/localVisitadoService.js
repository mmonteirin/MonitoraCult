/**
 * localVisitadoService.js
 *
 * Camada de dados para o histórico de locais visitados.
 *
 * Estrutura Firestore:
 *   users/{uid}/locaisVisitados/{localId}
 *     ├── localId        string   — id único do local (slug do nome)
 *     ├── nome           string   — nome do local/venue
 *     ├── bairro         string
 *     ├── categoria      string   — categoria do evento que gerou a visita
 *     ├── visitas        number   — contador de vezes que frequentou
 *     ├── ultimaVisita   Timestamp
 *     ├── primeiraVisita Timestamp
 *     ├── eventos        array    — últimos eventoIds visitados neste local (max 10)
 *     └── imagemLocal    string   — imagem do último evento neste local
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const MAX_EVENTOS_POR_LOCAL = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Gera um ID estável para o local a partir do nome.
 * Ex: "Teatro São José" → "teatro-sao-jose"
 */
function slugify(nome = "") {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ─── Registrar visita ─────────────────────────────────────────────────────────

/**
 * Registra ou atualiza uma visita ao local extraído de um evento.
 * Chamada no momento em que o usuário faz check-in, compra ingresso
 * ou o evento é marcado como frequentado.
 *
 * @param {string} uid
 * @param {object} evento  — objeto normalizado do evento
 */
export async function registrarVisitaLocal(uid, evento) {
  if (!uid || !evento) return;

  const nomeLocal =
    evento.localEvento ||
    evento.nomeLocal ||
    evento.local ||
    evento.location?.name;

  if (!nomeLocal) return;

  const localId = slugify(nomeLocal);
  if (!localId) return;

  const ref = doc(db, "users", uid, "locaisVisitados", localId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const agora = serverTimestamp();

      if (!snap.exists()) {
        // Primeira visita a este local
        tx.set(ref, {
          localId,
          nome: nomeLocal,
          bairro: evento.bairro || evento.endereco?.bairro || "",
          categoria: evento.categoria || evento.tipoEvento || "",
          visitas: 1,
          ultimaVisita: agora,
          primeiraVisita: agora,
          eventos: evento.id ? [evento.id] : [],
          imagemLocal:
            evento.imagemEvento ||
            evento.imagem ||
            evento.files?.header?.url ||
            "",
        });
      } else {
        const data = snap.data();
        const eventosAtuais = data.eventos || [];
        const novosEventos = evento.id
          ? [...new Set([evento.id, ...eventosAtuais])].slice(
              0,
              MAX_EVENTOS_POR_LOCAL
            )
          : eventosAtuais;

        tx.update(ref, {
          visitas: (data.visitas || 0) + 1,
          ultimaVisita: agora,
          eventos: novosEventos,
          // Atualiza imagem apenas se não tiver uma
          ...(data.imagemLocal
            ? {}
            : {
                imagemLocal:
                  evento.imagemEvento ||
                  evento.imagem ||
                  evento.files?.header?.url ||
                  "",
              }),
        });
      }
    });
  } catch (error) {
    console.warn("[localVisitadoService] Erro ao registrar visita:", error);
  }
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

/**
 * Retorna o histórico de locais visitados do usuário,
 * ordenado por última visita (mais recente primeiro).
 */
export async function getLocaisVisitados(uid, maxItems = 30) {
  if (!uid) return [];

  try {
    const q = query(
      collection(db, "users", uid, "locaisVisitados"),
      orderBy("ultimaVisita", "desc"),
      limit(maxItems)
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn("[localVisitadoService] Erro ao buscar locais:", error);
    return [];
  }
}

/**
 * Retorna os N locais mais frequentados (por contagem de visitas).
 * Usado no perfil cultural e nos sinais de recomendação.
 */
export async function getLocaisFavoritos(uid, n = 5) {
  if (!uid) return [];

  try {
    const q = query(
      collection(db, "users", uid, "locaisVisitados"),
      orderBy("visitas", "desc"),
      limit(n)
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn("[localVisitadoService] Erro ao buscar favoritos:", error);
    return [];
  }
}

/**
 * Busca um local específico pelo seu id (slug do nome).
 */
export async function getLocalVisitado(uid, localId) {
  if (!uid || !localId) return null;

  try {
    const snap = await getDoc(
      doc(db, "users", uid, "locaisVisitados", localId)
    );
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.warn("[localVisitadoService] Erro ao buscar local:", error);
    return null;
  }
}

// ─── Exclusão ────────────────────────────────────────────────────────────────

/**
 * Remove um local do histórico do usuário.
 */
export async function removerLocalVisitado(uid, localId) {
  if (!uid || !localId) return false;

  try {
    await deleteDoc(doc(db, "users", uid, "locaisVisitados", localId));
    return true;
  } catch (error) {
    console.warn("[localVisitadoService] Erro ao remover local:", error);
    return false;
  }
}
