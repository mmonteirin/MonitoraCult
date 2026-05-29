import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import logger from "../utils/logger";

/**
 * Seguir um usuário
 * Atualiza: followers do target, following do current user
 */
export const followUser = async (targetUserId, targetData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuário não autenticado");
  if (currentUser.uid === targetUserId)
    throw new Error("Você não pode seguir a si mesmo");

  try {
    const batch = writeBatch(db);
    const now = serverTimestamp();

    // 1️⃣ Adicionar em followers do target
    batch.set(
      doc(db, "followers", targetUserId, "followers", currentUser.uid),
      {
        followerId: currentUser.uid,
        followerName: currentUser.displayName || "Usuário",
        followerPhoto: currentUser.photoURL || "",
        createdAt: now,
      }
    );

    // 2️⃣ Adicionar em following do current user
    batch.set(
      doc(db, "followers", currentUser.uid, "following", targetUserId),
      {
        targetUserId,
        targetName: targetData?.displayName || "Usuário",
        targetPhoto: targetData?.photoURL || "",
        createdAt: now,
      }
    );

    // 3️⃣ Incrementar contadores
    batch.update(doc(db, "users", targetUserId), {
      followers: increment(1),
    });

    batch.update(doc(db, "users", currentUser.uid), {
      following: increment(1),
    });

    // 4️⃣ Criar notificação (opcional - implementar depois)
    batch.set(doc(collection(db, "notifications")), {
      fromUserId: currentUser.uid,
      fromUserName: currentUser.displayName || "Usuário",
      fromUserPhoto: currentUser.photoURL || "",
      toUserId: targetUserId,
      type: "follow",
      createdAt: now,
      read: false,
    });

    await batch.commit();
    return true;
  } catch (error) {
    logger.error("followService", "Erro ao seguir usuário", error);
    throw error;
  }
};

/**
 * Deixar de seguir um usuário
 */
export const unfollowUser = async (targetUserId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuário não autenticado");

  try {
    const batch = writeBatch(db);

    // 1️⃣ Remover de followers do target
    batch.delete(
      doc(db, "followers", targetUserId, "followers", currentUser.uid)
    );

    // 2️⃣ Remover de following do current user
    batch.delete(
      doc(db, "followers", currentUser.uid, "following", targetUserId)
    );

    // 3️⃣ Decrementar contadores
    batch.update(doc(db, "users", targetUserId), {
      followers: increment(-1),
    });

    batch.update(doc(db, "users", currentUser.uid), {
      following: increment(-1),
    });

    await batch.commit();
    return true;
  } catch (error) {
    logger.error("followService", "Erro ao deixar de seguir", error);
    throw error;
  }
};

/**
 * Verificar se segue um usuário
 */
export const isFollowing = async (targetUserId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  try {
    const docRef = doc(
      db,
      "followers",
      currentUser.uid,
      "following",
      targetUserId
    );
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    logger.error("followService", "Erro ao verificar follow", error);
    return false;
  }
};

/**
 * Obter lista de seguidores de um usuário
 */
export const getFollowers = async (userId, limitCount = 50) => {
  try {
    const { limit: firestoreLimit } = await import("firebase/firestore");
    const q = query(collection(db, "followers", userId, "followers"), firestoreLimit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    logger.error("followService", "Erro ao buscar seguidores", error);
    return [];
  }
};

/**
 * Obter lista de usuários que alguém está seguindo
 */
export const getFollowing = async (userId, limitCount = 50) => {
  try {
    const { limit: firestoreLimit } = await import("firebase/firestore");
    const q = query(collection(db, "followers", userId, "following"), firestoreLimit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (error) {
    logger.error("followService", "Erro ao buscar following", error);
    return [];
  }
};

/**
 * Obter eventos do criador que você segue
 */
export const getFollowingEvents = async (userId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  try {
    const followingDocs = await getFollowing(currentUser.uid);
    const followingIds = followingDocs.map((d) => d.targetUserId);

    if (followingIds.length === 0) return [];

    // Firestore tem limite de 10 itens em 'in' query
    // Se tiver mais, fazer query em chunks
    const q = query(
      collection(db, "eventos"),
      where("uidEvento", "in", followingIds.slice(0, 10))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    logger.error("followService", "Erro ao buscar eventos dos seguidos", error);
    return [];
  }
};

/**
 * Contar seguidores e following
 */
export const getFollowStats = async (userId) => {
  try {
    const followers = await getFollowers(userId);
    const following = await getFollowing(userId);

    return {
      followers: followers.length,
      following: following.length,
    };
  } catch (error) {
    logger.error("followService", "Erro ao contar seguidores", error);
    return { followers: 0, following: 0 };
  }
};