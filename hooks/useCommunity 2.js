import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCommunityGroups,
  joinGroup,
  leaveGroup,
  getGroupDetails,
  getForumThreads,
  createForumThread,
  addForumReply,
  getForumReplies,
  getHighlightedCreators,
  incrementCreatorViews,
  getCommunityNews,
  createCommunityNews,
  likeNews,
  incrementNewsViews,
} from "../services/communityService";

/**
 * Hook para gerenciar a Comunidade
 * ✅ Com otimizações de memória e cleanup
 */
export const useCommunity = () => {
  const [groups, setGroups] = useState([]);
  const [forumThreads, setForumThreads] = useState([]);
  const [highlightedCreators, setHighlightedCreators] = useState([]);
  const [communityNews, setCommunityNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  // ✅ Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Buscar grupos por gênero
  const loadGroups = useCallback(async (genre = null) => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      const result = await getCommunityGroups(genre);
      if (isMountedRef.current) {
        setGroups(result);
      }
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ✅ Entrar em um grupo
  const handleJoinGroup = useCallback(async (groupId) => {
    try {
      await joinGroup(groupId);
      if (isMountedRef.current) {
        // Recarregar grupos
        await loadGroups();
      }
    } catch (err) {
      console.error("Erro ao entrar no grupo:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [loadGroups]);

  // ✅ Sair de um grupo
  const handleLeaveGroup = useCallback(async (groupId) => {
    try {
      await leaveGroup(groupId);
      if (isMountedRef.current) {
        // Recarregar grupos
        await loadGroups();
      }
    } catch (err) {
      console.error("Erro ao sair do grupo:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [loadGroups]);

  // ✅ Carregar tópicos do fórum
  const loadForumThreads = useCallback(async (groupId) => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      const result = await getForumThreads(groupId);
      if (isMountedRef.current) {
        setForumThreads(result);
      }
    } catch (err) {
      console.error("Erro ao carregar tópicos do fórum:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ✅ Criar tópico no fórum
  const handleCreateForumThread = useCallback(async (groupId, threadData) => {
    try {
      await createForumThread(groupId, threadData);
      if (isMountedRef.current) {
        await loadForumThreads(groupId);
      }
    } catch (err) {
      console.error("Erro ao criar tópico:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [loadForumThreads]);

  // ✅ Carregar criadores em destaque
  const loadHighlightedCreators = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      const result = await getHighlightedCreators();
      if (isMountedRef.current) {
        setHighlightedCreators(result);
      }
    } catch (err) {
      console.error("Erro ao carregar criadores:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ✅ Incrementar visualizações de criador
  const handleViewCreator = useCallback(async (creatorId) => {
    try {
      await incrementCreatorViews(creatorId);
    } catch (err) {
      console.error("Erro ao visualizar criador:", err);
    }
  }, []);

  // ✅ Carregar notícias
  const loadCommunityNews = useCallback(async (groupId) => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);

    try {
      const result = await getCommunityNews(groupId);
      if (isMountedRef.current) {
        setCommunityNews(result);
      }
    } catch (err) {
      console.error("Erro ao carregar notícias:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ✅ Like em notícia
  const handleLikeNews = useCallback(async (groupId, newsId) => {
    try {
      await likeNews(groupId, newsId);
      if (isMountedRef.current) {
        await loadCommunityNews(groupId);
      }
    } catch (err) {
      console.error("Erro ao dar like:", err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  }, [loadCommunityNews]);

  // ✅ Incrementar visualizações de notícia
  const handleViewNews = useCallback(async (groupId, newsId) => {
    try {
      await incrementNewsViews(groupId, newsId);
    } catch (err) {
      console.error("Erro ao visualizar notícia:", err);
    }
  }, []);

  return {
    groups,
    forumThreads,
    highlightedCreators,
    communityNews,
    loading,
    error,
    loadGroups,
    handleJoinGroup,
    handleLeaveGroup,
    loadForumThreads,
    handleCreateForumThread,
    loadHighlightedCreators,
    handleViewCreator,
    loadCommunityNews,
    handleLikeNews,
    handleViewNews,
  };
};
