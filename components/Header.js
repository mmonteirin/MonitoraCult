import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { glassStyles } from '../styles/glassStyles';

export default function Header({ title, onPressNotifications, unreadCount }) {
  return (
    <View style={[styles.container, glassStyles.glassHeader, glassStyles.shadowGlass]}>
      <View style={styles.left} />
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        accessibilityLabel="notifications-button"
        onPress={onPressNotifications}
        style={styles.right}
      >
        <View style={styles.bellContainer}>
          <Text style={styles.bell}>🔔</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, glassStyles.glassBadge]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backdropFilter: 'blur(10px)',
  },
  left: { width: 40 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
  right: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: { fontSize: 24 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
