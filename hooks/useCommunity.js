import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCommunityGroups,
  getMyGroups,
  createCommunityGroup,
  updateCommunityGroup,
  deleteCommunityGroup,
  joinGroup,
  leaveGroup,
  getGroupDetails,
  isGroupMember,
  isGroupAdmin,
  createGroupPost,
  getGroupPosts,
  likeGroupPost,
  deleteGroupPost,
  addPostComment,
  getPostComments,
  getForumThreads,
  createForumThread,
  addForumReply,
  getForumReplies,
  getForumThreadDetails,
  getHighlightedCreators,
  incrementCreatorViews,
  getCommunityNews,
  createCommunityNews,
  likeNews,
  incrementNewsViews,
} from "../services/communityService";
import { auth } from "../firebaseConfig";

/**
 * Hook de Comunidade — v2
 * Suporte completo a: grupos, posts, fórum, criadores, notícias
 */
export const useCommunity = () => {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [forumThreads, setForumThreads] = useState([]);
  const [currentThread, setCurrentThread] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [postComments, setPostComments] = useState([]);
  const [highlightedCreators, setHighlightedCreators] = useState([]);
  const [communityNews, setCommunityNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const currentUser = auth.currentUser;

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const safe = (fn) => isMountedRef.current && fn();

  // ── GRUPOS ──────────────────────────────────────────────

  const loadGroups = useCallback(async (genre = null, searchText = null) => {
    safe(() => { setLoading(true); setError(null); });
    try {
      const result = await getCommunityGroups(genre, searchText);
      safe(() => setGroups(result));
    } catch (err) {
      safe(() => setError(err.message));
    } finally {
      safe(() => setLoading(false));
    }
  }, []);

  const loadMyGroups = useCallback(async () => {
    try {
      const result = await getMyGroups();
      safe(() => setMyGroups(result));
    } catch (err) {
      console.error("Erro ao carregar meus grupos:", err);
    }
  }, []);

  const loadGroupDetails = useCallback(async (groupId) => {
    safe(() => { setLoading(true); setError(null); });
    try {
      const result = await getGroupDetails(groupId);
      safe(() => setCurrentGroup(result));
      return result;
    } catch (err) {
      safe(() => setError(err.message));
      return null;
    } finally {
      safe(() => setLoading(false));
    }
  }, []);

  const handleCreateGroup = useCallback(async (groupData) => {
    safe(() => setLoading(true));
    try {
      const id = await createCommunityGroup(groupData);
      await Promise.all([loadGroups(), loadMyGroups()]);
      return id;
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    } finally {
      safe(() => setLoading(false));
    }
  }, [loadGroups, loadMyGroups]);

  const handleUpdateGroup = useCallback(async (groupId, data) => {
    try {
      await updateCommunityGroup(groupId, data);
      await loadGroupDetails(groupId);
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    }
  }, [loadGroupDetails]);

  const handleDeleteGroup = useCallback(async (groupId) => {
    try {
      await deleteCommunityGroup(groupId);
      await loadGroups();
      await loadMyGroups();
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    }
  }, [loadGroups, loadMyGroups]);

  const handleJoinGroup = useCallback(async (groupId) => {
    try {
      await joinGroup(groupId);
      await Promise.all([loadGroups(), loadMyGroups(), loadGroupDetails(groupId)]);
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    }
  }, [loadGroups, loadMyGroups, loadGroupDetails]);

  const handleLeaveGroup = useCallback(async (groupId) => {
    try {
      await leaveGroup(groupId);
      await Promise.all([loadGroups(), loadMyGroups(), loadGroupDetails(groupId)]);
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    }
  }, [loadGroups, loadMyGroups, loadGroupDetails]);

  const checkIsMember = useCallback((group) => {
    return isGroupMember(group || currentGroup, currentUser?.uid);
  }, [currentGroup, currentUser]);

  const checkIsAdmin = useCallback((group) => {
    return isGroupAdmin(group || currentGroup, currentUser?.uid);
  }, [currentGroup, currentUser]);

  // ── POSTS ──────────────────────────────────────────────

  const loadGroupPosts = useCallback(async (groupId) => {
    safe(() => { setLoading(true); setError(null); });
    try {
      const result = await getGroupPosts(groupId);
      safe(() => setPosts(result));
    } catch (err) {
      safe(() => setError(err.message));
    } finally {
      safe(() => setLoading(false));
    }
  }, []);

  const handleCreatePost = useCallback(async (groupId, postData) => {
    try {
      await createGroupPost(groupId, postData);
      await loadGroupPosts(groupId);
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    }
  }, [loadGroupPosts]);

  const handleLikePost = useCallback(async (groupId, postId) => {
    try {
      const liked = await likeGroupPost(groupId, postId);
      safe(() =>
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const uid = currentUser?.uid;
            return {
              ...p,
              likesCount: liked ? (p.likesCount || 0) + 1 : Math.max(0, (p.likesCount || 0) - 1),
              likes: liked
                ? [...(p.likes || []), uid]
                : (p.likes || []).filter((id) => id !== uid),
            };
          })
        )
      );
    } catch (err) {
      safe(() => setError(err.message));
    }
  }, [currentUser]);

  const handleDeletePost = useCallback(async (groupId, postId) => {
    try {
      await deleteGroupPost(groupId, postId);
      safe(() => setPosts((prev) => prev.filter((p) => p.id !== postId)));
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    }
  }, []);

  const loadPostComments = useCallback(async (groupId, postId) => {
    try {
      const result = await getPostComments(groupId, postId);
      safe(() => setPostComments(result));
    } catch (err) {
      safe(() => setError(err.message));
    }
  }, []);

  const handleAddComment = useCallback(async (groupId, postId, content) => {
    try {
      await addPostComment(groupId, postId, content);
      await loadPostComments(groupId, postId);
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    }
  }, [loadPostComments]);

  // ── FÓRUM ──────────────────────────────────────────────

  const loadForumThreads = useCallback(async (groupId) => {
    safe(() => { setLoading(true); setError(null); });
    try {
      const result = await getForumThreads(groupId);
      safe(() => setForumThreads(result));
    } catch (err) {
      safe(() => setError(err.message));
    } finally {
      safe(() => setLoading(false));
    }
  }, []);

  const loadThreadDetails = useCallback(async (groupId, threadId) => {
    try {
      const thread = await getForumThreadDetails(groupId, threadId);
      const replies = await getForumReplies(groupId, threadId);
      safe(() => { setCurrentThread(thread); setThreadReplies(replies); });
    } catch (err) {
      safe(() => setError(err.message));
    }
  }, []);

  const handleCreateForumThread = useCallback(async (groupId, threadData) => {
    try {
      await createForumThread(groupId, threadData);
      await loadForumThreads(groupId);
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    }
  }, [loadForumThreads]);

  const handleAddForumReply = useCallback(async (groupId, threadId, content) => {
    try {
      await addForumReply(groupId, threadId, { content });
      await loadThreadDetails(groupId, threadId);
    } catch (err) {
      safe(() => setError(err.message));
      throw err;
    }
  }, [loadThreadDetails]);

  // ── CRIADORES ──────────────────────────────────────────

  const loadHighlightedCreators = useCallback(async () => {
    try {
      const result = await getHighlightedCreators();
      safe(() => setHighlightedCreators(result));
    } catch (err) {
      safe(() => setError(err.message));
    }
  }, []);

  const handleViewCreator = useCallback(async (creatorId) => {
    try { await incrementCreatorViews(creatorId); } catch (_) {}
  }, []);

  // ── NOTÍCIAS ──────────────────────────────────────────

  const loadCommunityNews = useCallback(async (groupId) => {
    try {
      const result = await getCommunityNews(groupId);
      safe(() => setCommunityNews(result));
    } catch (err) {
      safe(() => setError(err.message));
    }
  }, []);

  const handleLikeNews = useCallback(async (groupId, newsId) => {
    try {
      const liked = await likeNews(groupId, newsId);
      safe(() =>
        setCommunityNews((prev) =>
          prev.map((n) =>
            n.id !== newsId
              ? n
              : {
                  ...n,
                  likesCount: liked
                    ? (n.likesCount || 0) + 1
                    : Math.max(0, (n.likesCount || 0) - 1),
                }
          )
        )
      );
    } catch (err) {
      safe(() => setError(err.message));
    }
  }, []);

  const handleViewNews = useCallback(async (groupId, newsId) => {
    try { await incrementNewsViews(groupId, newsId); } catch (_) {}
  }, []);

  return {
    // state
    groups,
    myGroups,
    currentGroup,
    posts,
    forumThreads,
    currentThread,
    threadReplies,
    postComments,
    highlightedCreators,
    communityNews,
    loading,
    error,
    currentUser,
    // grupos
    loadGroups,
    loadMyGroups,
    loadGroupDetails,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleJoinGroup,
    handleLeaveGroup,
    checkIsMember,
    checkIsAdmin,
    // posts
    loadGroupPosts,
    handleCreatePost,
    handleLikePost,
    handleDeletePost,
    loadPostComments,
    handleAddComment,
    // fórum
    loadForumThreads,
    loadThreadDetails,
    handleCreateForumThread,
    handleAddForumReply,
    // criadores
    loadHighlightedCreators,
    handleViewCreator,
    // notícias
    loadCommunityNews,
    handleLikeNews,
    handleViewNews,
  };
};
