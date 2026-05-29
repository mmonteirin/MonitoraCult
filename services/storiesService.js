/**
 * 📸 SERVIÇO: STORIES (Desaparecem em 24h)
 * Upload, listagem, deleção automática de stories
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// ✅ CRIAR STORY
export const criarStory = async ({
  userId,
  userName,
  userPhoto,
  imagemUri,
  textoStory,
  musica,
}) => {
  try {
    const agora = new Date();
    const expiracao = new Date(agora.getTime() + 24 * 60 * 60 * 1000); // 24h depois

    const storyData = {
      userId,
      userName,
      userPhoto,
      imagemUri,
      textoStory: textoStory || "",
      musica: musica || null,
      createdAt: serverTimestamp(),
      expiresAt: expiracao,
      visualizacoes: 0,
      vistos: [], // Array de {userId, timestamp}
      reacoes: {}, // {emoji: count}
    };

    const docRef = await addDoc(collection(db, "stories"), storyData);

    return {
      success: true,
      storyId: docRef.id,
      story: storyData,
    };
  } catch (error) {
    console.error("Erro ao criar story:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ✅ OBTER STORIES DE QUEM SEGUEM
export const obterStoriesAmigos = async (userId, seguindo = []) => {
  try {
    if (seguindo.length === 0) return [];

    // Buscar stories de quem o usuário segue
    const q = query(
      collection(db, "stories"),
      where("userId", "in", seguindo)
    );

    const snapshot = await getDocs(q);
    const agora = new Date();
    const stories = [];

    snapshot.forEach((doc) => {
      const story = { id: doc.id, ...doc.data() };

      // ✅ Remover stories expirados automaticamente
      if (
        story.expiresAt &&
        new Date(story.expiresAt.toDate?.() || story.expiresAt) < agora
      ) {
        deleteDoc(doc.ref).catch((e) => console.error(e));
        return;
      }

      stories.push(story);
    });

    // Agrupar por usuário
    const agrupadosPorUsuario = {};
    stories.forEach((story) => {
      if (!agrupadosPorUsuario[story.userId]) {
        agrupadosPorUsuario[story.userId] = [];
      }
      agrupadosPorUsuario[story.userId].push(story);
    });

    return Object.entries(agrupadosPorUsuario).map(([usuarioId, stories]) => ({
      usuarioId,
      userName: stories[0].userName,
      userPhoto: stories[0].userPhoto,
      stories: stories.sort(
        (a, b) =>
          new Date(a.createdAt?.toDate?.() || a.createdAt) -
          new Date(b.createdAt?.toDate?.() || b.createdAt)
      ),
      jaSeen: stories.every((s) =>
        s.vistos?.some((v) => v.userId === userId)
      ),
    }));
  } catch (error) {
    console.error("Erro ao obter stories:", error);
    return [];
  }
};

// ✅ OBTER STORIES DE UM USUÁRIO
export const obterStoriesUsuario = async (userId) => {
  try {
    const q = query(
      collection(db, "stories"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const agora = new Date();
    const stories = [];

    snapshot.forEach((doc) => {
      const story = { id: doc.id, ...doc.data() };

      // Remover expirados
      if (
        story.expiresAt &&
        new Date(story.expiresAt.toDate?.() || story.expiresAt) < agora
      ) {
        deleteDoc(doc.ref).catch((e) => console.error(e));
        return;
      }

      stories.push(story);
    });

    return stories;
  } catch (error) {
    console.error("Erro ao obter stories do usuário:", error);
    return [];
  }
};

// ✅ MARCAR STORY COMO VISTO
export const marcarStoryComoVisto = async (storyId, userId) => {
  try {
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await (await import("firebase/firestore")).getDoc(
      storyRef
    );

    if (!storySnap.exists()) {
      return { success: false, error: "Story não encontrado" };
    }

    const story = storySnap.data();
    const jaVisto = story.vistos?.some((v) => v.userId === userId);

    if (jaVisto) {
      return { success: true };
    }

    const novoVistos = [
      ...(story.vistos || []),
      {
        userId,
        timestamp: serverTimestamp(),
      },
    ];

    await (await import("firebase/firestore")).updateDoc(storyRef, {
      vistos: novoVistos,
      visualizacoes: (story.visualizacoes || 0) + 1,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar story como visto:", error);
    return { success: false, error: error.message };
  }
};

// ✅ ADICIONAR REAÇÃO A STORY
export const adicionarReacaoStory = async (storyId, emoji, remover = false) => {
  try {
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await (await import("firebase/firestore")).getDoc(
      storyRef
    );

    if (!storySnap.exists()) {
      return { success: false, error: "Story não encontrado" };
    }

    const story = storySnap.data();
    const reacoes = story.reacoes || {};
    const count = reacoes[emoji] || 0;

    if (remover) {
      reacoes[emoji] = Math.max(0, count - 1);
    } else {
      reacoes[emoji] = count + 1;
    }

    await (await import("firebase/firestore")).updateDoc(storyRef, {
      reacoes,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao adicionar reação:", error);
    return { success: false, error: error.message };
  }
};

// ✅ DELETAR STORY
export const deletarStory = async (storyId, userId) => {
  try {
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await (await import("firebase/firestore")).getDoc(
      storyRef
    );

    if (!storySnap.exists()) {
      return { success: false, error: "Story não encontrado" };
    }

    if (storySnap.data().userId !== userId) {
      return { success: false, error: "Permissão negada" };
    }

    await deleteDoc(storyRef);
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar story:", error);
    return { success: false, error: error.message };
  }
};

// ✅ ESCUTAR STORIES EM TEMPO REAL
export const escutarStories = (userId, seguindo = [], callback) => {
  try {
    if (seguindo.length === 0) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, "stories"),
      where("userId", "in", seguindo)
    );

    return onSnapshot(q, (snapshot) => {
      const agora = new Date();
      const stories = [];

      snapshot.forEach((doc) => {
        const story = { id: doc.id, ...doc.data() };

        // Remover expirados
        if (
          story.expiresAt &&
          new Date(story.expiresAt.toDate?.() || story.expiresAt) < agora
        ) {
          deleteDoc(doc.ref).catch((e) => console.error(e));
          return;
        }

        stories.push(story);
      });

      // Agrupar por usuário
      const agrupadosPorUsuario = {};
      stories.forEach((story) => {
        if (!agrupadosPorUsuario[story.userId]) {
          agrupadosPorUsuario[story.userId] = [];
        }
        agrupadosPorUsuario[story.userId].push(story);
      });

      const resultado = Object.entries(agrupadosPorUsuario).map(
        ([usuarioId, stories]) => ({
          usuarioId,
          userName: stories[0].userName,
          userPhoto: stories[0].userPhoto,
          stories: stories.sort(
            (a, b) =>
              new Date(a.createdAt?.toDate?.() || a.createdAt) -
              new Date(b.createdAt?.toDate?.() || b.createdAt)
          ),
          jaSeen: stories.every((s) =>
            s.vistos?.some((v) => v.userId === userId)
          ),
        })
      );

      callback(resultado);
    });
  } catch (error) {
    console.error("Erro ao escutar stories:", error);
    return () => {};
  }
};
