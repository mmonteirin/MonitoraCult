import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSocial } from '../context/SocialContext';
import { glassStyles } from '../styles/glassStyles';
import GlassContainer from './GlassContainer';

export default function SocialActions({ postId, userId }) {
  const { toggleLike, isLiked, toggleFollow, isFollowing } = useSocial();

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => toggleLike(postId)}
        style={[styles.action, glassStyles.glassButton]}
      >
        <Text style={styles.text}>{isLiked(postId) ? '💙' : '🤍'}</Text>
        <Text style={styles.label}>Curtir</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => toggleFollow(userId)}
        style={[
          styles.action,
          isFollowing(userId) ? glassStyles.glassButtonPrimary : glassStyles.glassButton,
        ]}
      >
        <Text style={[styles.label, isFollowing(userId) && styles.followingLabel]}>
          {isFollowing(userId) ? '✓ Seguindo' : 'Seguir'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.action, glassStyles.glassButton]}
        onPress={() => {
          /* abrir modal de comentar */
        }}
      >
        <Text style={styles.text}>💬</Text>
        <Text style={styles.label}>Comentar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  followingLabel: {
    color: '#1976d2',
  },
});
