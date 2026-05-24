import {
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const parseDate = (value) => {
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

/**
 * Obter perfil público de um usuário
 */
export const getPublicProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("Usuário não encontrado");
    }

    const userData = userSnap.data();

    // Remover dados sensíveis
    const publicProfile = {
      uid: userSnap.id,
      displayName: userData.displayName || userData.nome || "Usuário",
      nome: userData.nome || userData.displayName || "Usuário",
      photoURL: userData.photoURL || userData.foto || "https://i.pravatar.cc/100",
      foto: userData.foto || userData.photoURL || "https://i.pravatar.cc/100",
      bio: userData.bio || "",
      bio_links: userData.bio_links || [],
      isVerified: userData.isVerified || false,
      verifiedBadge: userData.verifiedBadge || null,
      followers: userData.followers || 0,
      following: userData.following || 0,
      eventosCount: userData.eventosCount || 0,
      totalLikes: userData.totalLikes || 0,
      createdAt: userData.createdAt,

      // Integrações (apenas públicas)
      spotify: userData.spotify?.topTrack
        ? {
            topTrack: userData.spotify.topTrack,
            artistName: userData.spotify.artistName,
          }
        : null,
      instagram: userData.instagram?.username
        ? {
            username: userData.instagram.username,
            verified: userData.instagram.verified,
          }
        : null,
    };

    return publicProfile;
  } catch (error) {
    console.log("Erro ao buscar perfil público:", error);
    throw error;
  }
};

export const getAttendedEvents = async (userId, maxItems = 30) => {
  try {
    const comprasRef = collection(db, "usuarios", userId, "compras");
    const comprasQuery = query(
      comprasRef,
      orderBy("dataCompra", "desc")
    );

    const snapshot = await getDocs(comprasQuery);
    const now = new Date();

    return snapshot.docs
      .map((document) => ({
        id: document.id,
        ...document.data(),
      }))
      .filter((compra) => {
        const dataEvento =
          parseDate(compra.dataValidade) || parseDate(compra.eventoData);
        return (
          compra.status === "confirmado" &&
          dataEvento &&
          dataEvento <= now
        );
      })
      .slice(0, maxItems);
  } catch (error) {
    console.log("Erro ao buscar eventos frequentados:", error);
    return [];
  }
};

/**
 * Obter eventos criados por um usuário
 */
export const getCreatorEvents = async (userId, limit = 20) => {
  try {
    const q = query(
      collection(db, "eventos"),
      where("uidEvento", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    console.log("Erro ao buscar eventos do criador:", error);
    return [];
  }
};

/**
 * Obter métricas do criador
 */
export const getCreatorMetrics = async (userId) => {
  try {
    const events = await getCreatorEvents(userId, 100);

    const metrics = {
      totalEventos: events.length,
      totalLikes: events.reduce((acc, e) => acc + (e.likes || 0), 0),
      totalViews: events.reduce((acc, e) => acc + (e.views || 0), 0),
      totalComentarios: events.reduce((acc, e) => acc + (e.comentarios || 0), 0),
      engagementRate:
        events.length > 0
          ? (
              events.reduce((acc, e) => acc + (e.likes || 0), 0) /
              (events.reduce((acc, e) => acc + (e.views || 0), 0) || 1)
            ).toFixed(3)
          : 0,
    };

    return metrics;
  } catch (error) {
    console.log("Erro ao buscar métricas:", error);
    return {
      totalEventos: 0,
      totalLikes: 0,
      totalViews: 0,
      totalComentarios: 0,
      engagementRate: 0,
    };
  }
};

/**
 * Buscar usuários por nome (search)
 */
export const searchUsers = async (searchTerm, limit = 20) => {
  try {
    if (!searchTerm.trim()) return [];

    // Firestore não tem busca full-text nativa
    // Usar Algolia ou implementar com Meilisearch no backend
    // Por enquanto, retornar vazio
    console.log(
      "Search precisa de integração com Algolia ou similar:",
      searchTerm
    );
    return [];
  } catch (error) {
    console.log("Erro ao buscar usuários:", error);
    return [];
  }
};

/**
 * Obter criadores verificados (trending creators)
 */
export const getTrendingCreators = async (limit = 10) => {
  try {
    // Implementação: Firestore não tem sorting complexo
    // Solução: Usar índice composto (verified + followers)
    // Por enquanto, simular com dados estáticos

    const verifiedCreators = [];
    // TODO: Implementar com Firestore índices

    return verifiedCreators;
  } catch (error) {
    console.log("Erro ao buscar creators trending:", error);
    return [];
  }
};
