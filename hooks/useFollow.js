import { useState, useEffect, useCallback, useRef } from "react";
import { followUser, unfollowUser, isFollowing } from "../services/followService";

/**
 * Hook para gerenciar o estado de seguir/deixar de seguir um usuário
 * ✅ Com limpeza de memória e otimizações
 */
export const useFollow = (targetUserId, targetUserData) => {
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  // ✅ Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ Verificar status inicial de follow
  useEffect(() => {
    const checkFollowing = async () => {
      if (!targetUserId) {
        setIsFollowingUser(false);
        return;
      }

      try {
        const following = await isFollowing(targetUserId);
        
        if (isMountedRef.current) {
          setIsFollowingUser(following);
        }
      } catch (err) {
        console.log("Erro ao verificar follow:", err);
        
        if (isMountedRef.current) {
          setError(err.message);
        }
      }
    };

    checkFollowing();
  }, [targetUserId]);

  // ✅ Toggle follow/unfollow com useCallback
  const toggleFollow = useCallback(async () => {
    if (!isMountedRef.current || !targetUserId) return isFollowingUser;

    setLoading(true);
    setError(null);

    try {
      if (isFollowingUser) {
        await unfollowUser(targetUserId);

        if (isMountedRef.current) {
          setIsFollowingUser(false);
        }
        return false;
      } else {
        await followUser(targetUserId, targetUserData);

        if (isMountedRef.current) {
          setIsFollowingUser(true);
        }
        return true;
      }
    } catch (err) {
      console.log("Erro ao togglear follow:", err);

      if (isMountedRef.current) {
        setError(err.message);
      }
      return isFollowingUser;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isFollowingUser, targetUserId, targetUserData]);

  return {
    isFollowing: isFollowingUser,
    loading,
    error,
    toggleFollow,
  };
};
