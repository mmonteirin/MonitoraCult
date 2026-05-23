import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

/**
 * Serviço de Comunidade com Firestore
 * Gerencia Grupos, Fórum, Criadores em Destaque e Notícias
 */

// ==================== GRUPOS ====================

export const createCommunityGroup = async (groupData) => {
  try {
    const docRef = await addDoc(collection(db, "communityGroups"), {
      ...groupData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      members: [auth.currentUser.uid],
      membersCount: 1,
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    throw error;
  }
};

export const getCommunityGroups = async (genre = null) => {
  try {
    let q = collection(db, "communityGroups");
    
    if (genre) {
      q = query(q, where("genre", "==", genre), orderBy("membersCount", "desc"));
    } else {
      q = query(q, orderBy("membersCount", "desc"));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    throw error;
  }
};

export const getGroupDetails = async (groupId) => {
  try {
    const docSnap = await getDoc(doc(db, "communityGroups", groupId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar detalhes do grupo:", error);
    throw error;
  }
};

export const joinGroup = async (groupId) => {
  try {
    const groupRef = doc(db, "communityGroups", groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(auth.currentUser.uid),
      membersCount: await getGroupMembersCount(groupId) + 1,
    });
  } catch (error) {
    console.error("Erro ao entrar no grupo:", error);
    throw error;
  }
};

export const leaveGroup = async (groupId) => {
  try {
    const groupRef = doc(db, "communityGroups", groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(auth.currentUser.uid),
      membersCount: Math.max(0, await getGroupMembersCount(groupId) - 1),
    });
  } catch (error) {
    console.error("Erro ao sair do grupo:", error);
    throw error;
  }
};

export const getGroupMembersCount = async (groupId) => {
  try {
    const docSnap = await getDoc(doc(db, "communityGroups", groupId));
    return docSnap.exists() ? (docSnap.data().members?.length || 0) : 0;
  } catch (error) {
    console.error("Erro ao contar membros:", error);
    return 0;
  }
};

// ==================== FÓRUM ====================

export const createForumThread = async (groupId, threadData) => {
  try {
    const docRef = await addDoc(
      collection(db, "communityGroups", groupId, "forum"),
      {
        ...threadData,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        repliesCount: 0,
        likesCount: 0,
      }
    );
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar tópico do fórum:", error);
    throw error;
  }
};

export const getForumThreads = async (groupId, pageLimit = 10) => {
  try {
    const q = query(
      collection(db, "communityGroups", groupId, "forum"),
      orderBy("createdAt", "desc"),
      limit(pageLimit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar tópicos do fórum:", error);
    throw error;
  }
};

export const addForumReply = async (groupId, threadId, replyData) => {
  try {
    const docRef = await addDoc(
      collection(db, "communityGroups", groupId, "forum", threadId, "replies"),
      {
        ...replyData,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      }
    );
    
    // Atualizar contagem de respostas
    const threadRef = doc(db, "communityGroups", groupId, "forum", threadId);
    await updateDoc(threadRef, {
      repliesCount: await getThreadRepliesCount(groupId, threadId) + 1,
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar resposta:", error);
    throw error;
  }
};

export const getForumReplies = async (groupId, threadId) => {
  try {
    const q = query(
      collection(db, "communityGroups", groupId, "forum", threadId, "replies"),
      orderBy("createdAt", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar respostas:", error);
    throw error;
  }
};

export const getThreadRepliesCount = async (groupId, threadId) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "communityGroups", groupId, "forum", threadId, "replies")
    );
    return querySnapshot.size;
  } catch (error) {
    console.error("Erro ao contar respostas:", error);
    return 0;
  }
};

// ==================== CRIADORES EM DESTAQUE ====================

export const createHighlightedCreator = async (creatorData) => {
  try {
    const docRef = await addDoc(collection(db, "highlightedCreators"), {
      ...creatorData,
      createdAt: serverTimestamp(),
      viewsCount: 0,
      likesCount: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar criador em destaque:", error);
    throw error;
  }
};

export const getHighlightedCreators = async () => {
  try {
    const q = query(
      collection(db, "highlightedCreators"),
      orderBy("viewsCount", "desc"),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar criadores em destaque:", error);
    throw error;
  }
};

export const incrementCreatorViews = async (creatorId) => {
  try {
    const creatorRef = doc(db, "highlightedCreators", creatorId);
    await updateDoc(creatorRef, {
      viewsCount: await getCreatorViewsCount(creatorId) + 1,
    });
  } catch (error) {
    console.error("Erro ao incrementar visualizações:", error);
  }
};

export const getCreatorViewsCount = async (creatorId) => {
  try {
    const docSnap = await getDoc(doc(db, "highlightedCreators", creatorId));
    return docSnap.exists() ? (docSnap.data().viewsCount || 0) : 0;
  } catch (error) {
    console.error("Erro ao buscar contagem de visualizações:", error);
    return 0;
  }
};

// ==================== NOTÍCIAS ====================

export const createCommunityNews = async (groupId, newsData) => {
  try {
    const docRef = await addDoc(
      collection(db, "communityGroups", groupId, "news"),
      {
        ...newsData,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        viewsCount: 0,
        likesCount: 0,
      }
    );
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar notícia:", error);
    throw error;
  }
};

export const getCommunityNews = async (groupId, pageLimit = 10) => {
  try {
    const q = query(
      collection(db, "communityGroups", groupId, "news"),
      orderBy("createdAt", "desc"),
      limit(pageLimit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao buscar notícias:", error);
    throw error;
  }
};

export const incrementNewsViews = async (groupId, newsId) => {
  try {
    const newsRef = doc(db, "communityGroups", groupId, "news", newsId);
    const currentDoc = await getDoc(newsRef);
    await updateDoc(newsRef, {
      viewsCount: (currentDoc.data().viewsCount || 0) + 1,
    });
  } catch (error) {
    console.error("Erro ao incrementar visualizações de notícia:", error);
  }
};

export const likeNews = async (groupId, newsId) => {
  try {
    const newsRef = doc(db, "communityGroups", groupId, "news", newsId);
    const currentDoc = await getDoc(newsRef);
    const currentLikes = (currentDoc.data().likesCount || 0) + 1;
    
    await updateDoc(newsRef, {
      likesCount: currentLikes,
    });
    return currentLikes;
  } catch (error) {
    console.error("Erro ao dar like em notícia:", error);
    throw error;
  }
};
