/**
 * 💬 HOOK: GERENCIAR COMENTÁRIOS
 * Carrega, escuta e adiciona comentários em tempo real
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  adicionarComentario as addComment,
  escutarComentarios,
} from "../services/commentService";

export const useComments = (postId) => {
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const isMountedRef = useRef(true);

  // ✅ Listener em tempo real
  useEffect(() => {
    if (!postId || !isMountedRef.current) return;

    try {
      setLoading(true);

      const unsubscribe = escutarComentarios(postId, (comentarios) => {
        if (isMountedRef.current) {
          setComentarios(comentarios);
          setLoading(false);
          setError(null);
        }
      });

      return () => {
        isMountedRef.current = false;
        unsubscribe();
      };
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [postId]);

  // ✅ Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Adicionar comentário
  const adicionarComentario = useCallback(
    async (user, texto) => {
      if (!user || !texto.trim()) {
        return { success: false, error: "Dados inválidos" };
      }

      try {
        setAdicionando(true);

        await addComment(postId, user, texto.trim());

        if (isMountedRef.current) {
          setAdicionando(false);
          return { success: true };
        }
      } catch (err) {
        if (isMountedRef.current) {
          setAdicionando(false);
          setError(err.message);
          return { success: false, error: err.message };
        }
      }
    },
    [postId]
  );

  return {
    comentarios,
    loading,
    error,
    adicionando,
    adicionarComentario,
    totalComentarios: comentarios.length,
  };
};

export default useComments;
