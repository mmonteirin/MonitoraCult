/**
 * 📸 HOOK: GERENCIAR STORIES
 * Upload, listagem, visualização de stories com expiração 24h
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  criarStory,
  obterStoriesAmigos,
  marcarStoryComoVisto,
  adicionarReacaoStory,
  deletarStory,
  escutarStories,
} from "../services/storiesService";

export const useStories = (userId, seguindo = []) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [criando, setCriando] = useState(false);
  const isMountedRef = useRef(true);

  // ✅ Listener em tempo real
  useEffect(() => {
    if (!userId || seguindo.length === 0) {
      if (isMountedRef.current) {
        setStories([]);
        setLoading(false);
      }
      return;
    }

    const unsubscribe = escutarStories(userId, seguindo, (novasStories) => {
      if (isMountedRef.current) {
        setStories(novasStories);
        setLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [userId, JSON.stringify(seguindo)]);

  // ✅ Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Criar novo story
  const criarNovoStory = useCallback(
    async (imagemUri, textoStory = "", musica = null, userData) => {
      if (!userId || !imagemUri) {
        return { success: false, error: "Dados inválidos" };
      }

      try {
        setCriando(true);

        const resultado = await criarStory({
          userId,
          userName: userData?.nome || userData?.displayName,
          userPhoto: userData?.foto || userData?.photoURL,
          imagemUri,
          textoStory,
          musica,
        });

        if (isMountedRef.current) {
          setCriando(false);
          if (resultado.success) {
            setErro(null);
          } else {
            setErro(resultado.error);
          }
        }

        return resultado;
      } catch (err) {
        if (isMountedRef.current) {
          setCriando(false);
          setErro(err.message);
          return { success: false, error: err.message };
        }
      }
    },
    [userId]
  );

  // ✅ Marcar como visto
  const verStory = useCallback(async (storyId) => {
    try {
      await marcarStoryComoVisto(storyId, userId);
    } catch (err) {
      console.error("Erro ao marcar story como visto:", err);
    }
  }, [userId]);

  // ✅ Adicionar reação
  const adicionarReacao = useCallback(async (storyId, emoji) => {
    try {
      await adicionarReacaoStory(storyId, emoji, false);
    } catch (err) {
      console.error("Erro ao adicionar reação:", err);
    }
  }, []);

  // ✅ Deletar story
  const deletarStoryLocal = useCallback(
    async (storyId) => {
      try {
        const resultado = await deletarStory(storyId, userId);
        if (resultado.success && isMountedRef.current) {
          // Remover da lista local
          setStories((prev) =>
            prev.map((grupo) => ({
              ...grupo,
              stories: grupo.stories.filter((s) => s.id !== storyId),
            }))
          );
        }
        return resultado;
      } catch (err) {
        console.error("Erro ao deletar story:", err);
        return { success: false, error: err.message };
      }
    },
    [userId]
  );

  return {
    stories,
    loading,
    erro,
    criando,
    criarNovoStory,
    verStory,
    adicionarReacao,
    deletarStoryLocal,
    totalStories: stories.reduce((acc, s) => acc + s.stories.length, 0),
  };
};

export default useStories;
