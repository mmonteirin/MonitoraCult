import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import GlassContainer from '../components/GlassContainer';
import SocialActions from '../components/SocialActions';
import { glassStyles } from '../styles/glassStyles';

/**
 * Exemplo de tela com posts/feed usando efeito Liquid Glass
 */
export default function PostFeedScreen() {
  const mockPosts = [
    {
      id: '1',
      author: 'João Silva',
      avatar: '👨‍🎨',
      content: 'Confira nosso novo projeto de arte urbana!',
      timestamp: 'há 2h',
      likes: 42,
      comments: 8,
    },
    {
      id: '2',
      author: 'Maria Santos',
      avatar: '🎭',
      content: 'Incrível apresentação no teatro municipal',
      timestamp: 'há 4h',
      likes: 128,
      comments: 23,
    },
  ];

  const renderPost = ({ item }) => (
    <GlassContainer
      intensity={0.12}
      variant="light"
      style={styles.postContainer}
    >
      <View style={styles.postHeader}>
        <Text style={styles.avatar}>{item.avatar}</Text>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.author}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
      </View>

      <Text style={styles.postContent}>{item.content}</Text>

      <View style={styles.postStats}>
        <Text style={styles.stat}>❤️ {item.likes} curtidas</Text>
        <Text style={styles.stat}>💬 {item.comments} comentários</Text>
      </View>

      <SocialActions postId={item.id} userId={item.id} />
    </GlassContainer>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>Feed de Artes</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  postContainer: {
    marginBottom: 12,
    padding: 14,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    fontSize: 32,
    marginRight: 10,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 10,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  stat: {
    fontSize: 12,
    color: '#666',
  },
});
