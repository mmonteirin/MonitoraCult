/**
 * services/userService.js
 * Serviço para buscar e gerenciar usuários
 */

import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  startAt,
  endAt,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * 🔍 Buscar usuários por nome ou username
 * @param {string} searchQuery - Texto para buscar
 * @param {string} currentUserId - ID do usuário atual (para excluir dos resultados)
 * @param {number} resultLimit - Limite de resultados
 * @returns {Promise<Array>} Array de usuários encontrados
 */
export const searchUsers = async (
  searchQuery,
  currentUserId,
  resultLimit = 20
) => {
  try {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return [];
    }

    const usersCollection = collection(db, "users");

    // Buscar por nome (case-insensitive com Firestore)
    const nameQuery = query(
      usersCollection,
      where("nome", ">=", searchQuery),
      where("nome", "<=", searchQuery + "\uf8ff"),
      limit(resultLimit)
    );

    const nameSnapshot = await getDocs(nameQuery);
    const resultsByName = new Map();

    nameSnapshot.forEach((doc) => {
      if (doc.id !== currentUserId) {
        const userData = {
          id: doc.id,
          nome: doc.data().nome || doc.data().displayName || "Usuário",
          username: doc.data().username || doc.id.slice(0, 8),
          avatar: doc.data().foto || doc.data().photoURL,
          bio: doc.data().bio || "",
        };
        resultsByName.set(doc.id, userData);
      }
    });

    // Buscar por username também
    const usernameQuery = query(
      usersCollection,
      where("username", ">=", searchQuery),
      where("username", "<=", searchQuery + "\uf8ff"),
      limit(resultLimit)
    );

    const usernameSnapshot = await getDocs(usernameQuery);

    usernameSnapshot.forEach((doc) => {
      if (doc.id !== currentUserId && !resultsByName.has(doc.id)) {
        const userData = {
          id: doc.id,
          nome: doc.data().nome || doc.data().displayName || "Usuário",
          username: doc.data().username || doc.id.slice(0, 8),
          avatar: doc.data().foto || doc.data().photoURL,
          bio: doc.data().bio || "",
        };
        resultsByName.set(doc.id, userData);
      }
    });

    return Array.from(resultsByName.values()).slice(0, resultLimit);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
};

/**
 * 👥 Obter informações básicas do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object|null>} Dados do usuário
 */
export const getBasicUserInfo = async (userId) => {
  try {
    const usersCollection = collection(db, "users");
    const userSnapshot = await getDocs(
      query(usersCollection, where("uid", "==", userId), limit(1))
    );

    if (userSnapshot.empty) {
      return null;
    }

    const userData = userSnapshot.docs[0].data();
    return {
      id: userSnapshot.docs[0].id,
      nome: userData.nome || userData.displayName || "Usuário",
      username: userData.username || userId.slice(0, 8),
      avatar: userData.foto || userData.photoURL,
      bio: userData.bio || "",
    };
  } catch (error) {
    console.error("Erro ao obter informações do usuário:", error);
    return null;
  }
};

/**
 * 📋 Listar usuários que o usuário atual segue
 * @param {string} userId - ID do usuário atual
 * @returns {Promise<Array>} Array de usuários seguidos
 */
export const getFollowingUsers = async (userId) => {
  try {
    const followingQuery = query(
      collection(db, "users", userId, "following"),
      limit(100)
    );

    const snapshot = await getDocs(followingQuery);
    const followingUsers = [];

    for (const doc of snapshot.docs) {
      const userData = await getBasicUserInfo(doc.id);
      if (userData) {
        followingUsers.push(userData);
      }
    }

    return followingUsers;
  } catch (error) {
    console.error("Erro ao obter usuários seguidos:", error);
    return [];
  }
};

/**
 * 👥 Listar seguidores do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Array de seguidores
 */
export const getFollowers = async (userId) => {
  try {
    const followersQuery = query(
      collection(db, "users", userId, "followers"),
      limit(100)
    );

    const snapshot = await getDocs(followersQuery);
    const followers = [];

    for (const doc of snapshot.docs) {
      const userData = await getBasicUserInfo(doc.id);
      if (userData) {
        followers.push(userData);
      }
    }

    return followers;
  } catch (error) {
    console.error("Erro ao obter seguidores:", error);
    return [];
  }
};
