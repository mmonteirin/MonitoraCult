/**
 * ❤️ HOOK: GERENCIAR LIKES
 * Toggle likes em posts com sincronização em tempo real
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export const useLike = (postId, userId) => {
  const [gostei, setGostei] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);
  const isMountedRef = useRef(true);

  // ✅ Verificar se usuário já curtiu
  useEffect(() => {
    if (!postId || !userId) {
      setLoading(false);
      return;
    }

    const verificar = async () => {
      try {
        const q = query(
          collection(db, "posts", postId, "likes"),
          where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);

        if (isMountedRef.current) {
          setGostei(!snapshot.empty);
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao verificar like:", error);
        if (isMountedRef.current) setLoading(false);
      }
    };

    verificar();
  }, [postId, userId]);

  // ✅ Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Toggle like
  const toggleLike = useCallback(async () => {
    if (!postId || !userId) return;

    try {
      setLoading(true);

      if (gostei) {
        // Remover like
        const q = query(
          collection(db, "posts", postId, "likes"),
          where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
          await deleteDoc(docSnap.ref);
        }

        if (isMountedRef.current) {
          setGostei(false);
          setLikesCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        // Adicionar like
        await addDoc(collection(db, "posts", postId, "likes"), {
          userId,
          createdAt: new Date(),
        });

        if (isMountedRef.current) {
          setGostei(true);
          setLikesCount((prev) => prev + 1);
        }
      }

      if (isMountedRef.current) {
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro ao atualizar like:", error);
      if (isMountedRef.current) setLoading(false);
    }
  }, [postId, userId, gostei]);

  return {
    gostei,
    loading,
    likesCount,
    toggleLike,
  };
};

export default useLike;
