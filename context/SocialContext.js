import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SocialContext = createContext(null);

export function SocialProvider({ children }) {
  const [likes, setLikes] = useState({});
  const [follows, setFollows] = useState({});

  const LIKES_KEY = '@social_likes';
  const FOLLOWS_KEY = '@social_follows';

  useEffect(() => {
    async function load() {
      try {
        const likesRaw = await AsyncStorage.getItem(LIKES_KEY);
        const followsRaw = await AsyncStorage.getItem(FOLLOWS_KEY);
        if (likesRaw) setLikes(JSON.parse(likesRaw));
        if (followsRaw) setFollows(JSON.parse(followsRaw));
      } catch (e) {
        console.warn('load social state', e);
      }
    }
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(LIKES_KEY, JSON.stringify(likes)).catch((e) => console.warn('save likes', e));
  }, [likes]);

  useEffect(() => {
    AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows)).catch((e) => console.warn('save follows', e));
  }, [follows]);

  function toggleLike(postId) {
    setLikes((s) => ({ ...s, [postId]: !s[postId] }));
  }

  function isLiked(postId) {
    return !!likes[postId];
  }

  function toggleFollow(userId) {
    setFollows((s) => ({ ...s, [userId]: !s[userId] }));
  }

  function isFollowing(userId) {
    return !!follows[userId];
  }

  return (
    <SocialContext.Provider value={{ toggleLike, isLiked, toggleFollow, isFollowing }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within SocialProvider');
  return ctx;
}
