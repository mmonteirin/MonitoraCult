import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

/**
 * Gerar ID de chat a partir de dois UIDs
 * Sempre colocar o menor UID primeiro para evitar duplicatas
 */
const generateChatId = (uid1, uid2) => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

/**
 * Iniciar ou obter conversa existente
 */
export const getOrCreateChat = async (otherUserId, otherUserData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuário não autenticado");

  try {
    const chatId = generateChatId(currentUser.uid, otherUserId);
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      // Criar nova conversa
      await setDoc(chatRef, {
        chatId,
        participants: [currentUser.uid, otherUserId],
        participantNames: [
          currentUser.displayName || "Usuário",
          otherUserData?.displayName || "Usuário",
        ],
        participantPhotos: [
          currentUser.photoURL || "https://i.pravatar.cc/100",
          otherUserData?.photoURL || "https://i.pravatar.cc/100",
        ],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastMessageTime: null,
        unreadCount: {
          [currentUser.uid]: 0,
          [otherUserId]: 0,
        },
      });
    }

    return chatId;
  } catch (error) {
    console.log("Erro ao obter/criar chat:", error);
    throw error;
  }
};

/**
 * Enviar mensagem
 */
export const sendMessage = async (chatId, text) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuário não autenticado");
  if (!text.trim()) throw new Error("Mensagem não pode estar vazia");

  try {
    const batch = writeBatch(db);

    // 1️⃣ Adicionar mensagem
    const messageRef = await addDoc(
      collection(db, "chats", chatId, "messages"),
      {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Usuário",
        senderPhoto: currentUser.photoURL || "https://i.pravatar.cc/100",
        text: text.trim(),
        createdAt: serverTimestamp(),
        read: false,
      }
    );

    // 2️⃣ Atualizar último chat
    batch.update(doc(db, "chats", chatId), {
      lastMessage: text.trim(),
      lastMessageTime: serverTimestamp(),
    });

    await batch.commit();

    return messageRef.id;
  } catch (error) {
    console.log("Erro ao enviar mensagem:", error);
    throw error;
  }
};

/**
 * Obter lista de conversas (chats) de um usuário
 */
export const getUserChats = async (userId) => {
  try {
    // Buscar chats onde o usuário é participante
    // Firestore: fazer query por array containment
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId)
    );

    const snapshot = await getDocs(q);
    const chats = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Ordenar por lastMessageTime (mais recente primeiro)
    chats.sort(
      (a, b) =>
        (b.lastMessageTime?.toMillis?.() || 0) -
        (a.lastMessageTime?.toMillis?.() || 0)
    );

    return chats;
  } catch (error) {
    console.log("Erro ao buscar conversas:", error);
    return [];
  }
};

/**
 * Obter mensagens de um chat
 */
export const getChatMessages = async (chatId, limit = 50) => {
  try {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .slice(-limit)
      .map((d) => ({
        id: d.id,
        ...d.data(),
      }));
  } catch (error) {
    console.log("Erro ao buscar mensagens:", error);
    return [];
  }
};

/**
 * Listen em tempo real para novas mensagens
 */
export const onChatMessages = (chatId, callback) => {
  try {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(messages);
    });

    return unsubscribe;
  } catch (error) {
    console.log("Erro ao listener chat:", error);
    return () => {};
  }
};

/**
 * Marcar mensagens como lidas
 */
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "chats", chatId, "messages"),
        where("read", "==", false),
        where("senderId", "!=", userId)
      )
    );

    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      });
    });

    // Resetar unread count
    batch.update(doc(db, "chats", chatId), {
      [`unreadCount.${userId}`]: 0,
    });

    await batch.commit();
  } catch (error) {
    console.log("Erro ao marcar como lido:", error);
  }
};

/**
 * Excluir chat (soft delete - mover para archived)
 */
export const archiveChat = async (chatId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuário não autenticado");

  try {
    await updateDoc(doc(db, "chats", chatId), {
      [`archived.${currentUser.uid}`]: true,
    });
  } catch (error) {
    console.log("Erro ao arquivar chat:", error);
    throw error;
  }
};

/**
 * Obter dados de outro usuário na conversa
 */
export const getChatOtherUser = (chat, currentUserId) => {
  const otherUserId = chat.participants.find((id) => id !== currentUserId);
  const otherUserIndex = chat.participants.indexOf(otherUserId);

  return {
    uid: otherUserId,
    displayName: chat.participantNames[otherUserIndex],
    photoURL: chat.participantPhotos[otherUserIndex],
  };
};
