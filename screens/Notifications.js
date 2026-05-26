import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useNotifications } from '../context/NotificationsContext';
import { glassStyles } from '../styles/glassStyles';
import GlassContainer from '../components/GlassContainer';

export default function NotificationsScreen() {
  const { notifications, markAsRead, markAllRead, removeNotification } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Notificações</Text>
        <TouchableOpacity onPress={markAllRead} style={[styles.markAllBtn, glassStyles.glassButton]}>
          <Text style={styles.markAllText}>Marcar todas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => markAsRead(item.id)}
            onLongPress={() =>
              Alert.alert('Remover', 'Deseja remover esta notificação?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Remover', style: 'destructive', onPress: () => removeNotification(item.id) },
              ])
            }
          >
            <GlassContainer
              intensity={item.read ? 0.08 : 0.15}
              variant="light"
              style={styles.itemContainer}
            >
              <View style={styles.itemContent}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.timestamp}>
                  {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </GlassContainer>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma notificação</Text>}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllText: {
    color: '#1976d2',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  body: {
    marginVertical: 4,
    color: '#555',
    fontSize: 13,
    lineHeight: 18,
  },
  timestamp: {
    marginTop: 6,
    color: '#999',
    fontSize: 11,
    fontStyle: 'italic',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1976d2',
    marginLeft: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 14,
  },
});
