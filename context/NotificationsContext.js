import React, { createContext, useContext, useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDeviceToken } from '../services/notifications';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Bem-vindo ao MonitoraCult', body: 'Obrigado por instalar o app.', read: false, createdAt: Date.now() - 1000 * 60 * 60 },
    { id: '2', title: 'Nova atividade', body: 'Alguém curtiu sua publicação.', read: false, createdAt: Date.now() - 1000 * 60 * 30 },
  ]);

  useEffect(() => {
    // Carregar notificações persistidas e inicialização FCM:
    const STORAGE_KEY = '@notifications';
    let unsubscribeOnMessage = null;
    let unsubscribeOnOpened = null;

    async function loadPersisted() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setNotifications(parsed);
        }
      } catch (e) {
        console.warn('load notifications error', e);
      }
    }

    loadPersisted();

    async function initFCM() {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          const token = await messaging().getToken();
          console.log('FCM token:', token);
          // Registrar token no backend, se houver endpoint
          registerDeviceToken(token).then((r) => console.log('registered token', r)).catch((e) => console.warn(e));
        }

        // Foreground messages
        unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
          const notif = {
            title: remoteMessage.notification?.title || 'Notificação',
            body: remoteMessage.notification?.body || JSON.stringify(remoteMessage.data || ''),
            data: remoteMessage.data,
            createdAt: Date.now(),
          };
          addNotification(notif);
        });

        // Quando o usuário abre a notificação a partir do background
        unsubscribeOnOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
          if (remoteMessage) {
            addNotification({
              title: remoteMessage.notification?.title || 'Notificação',
              body: remoteMessage.notification?.body || '',
              data: remoteMessage.data,
              createdAt: Date.now(),
              read: true,
            });
          }
        });

        // Se o app foi aberto a partir de uma notificação (quit state)
        const initial = await messaging().getInitialNotification();
        if (initial) {
          addNotification({
            title: initial.notification?.title || 'Notificação',
            body: initial.notification?.body || '',
            data: initial.data,
            createdAt: Date.now(),
            read: true,
          });
        }
      } catch (e) {
        console.warn('FCM init error', e);
      }
    }

    initFCM();

    return () => {
      if (unsubscribeOnMessage) unsubscribeOnMessage();
      if (unsubscribeOnOpened) unsubscribeOnOpened();
    };
  }, []);

  // Firestore sync: listen to user's notifications when authenticated
  useEffect(() => {
    if (!user) return;

    const ref = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('notificacoes')
      .orderBy('createdAt', 'desc');

    const unsub = ref.onSnapshot((snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(data);
      AsyncStorage.setItem('@notifications', JSON.stringify(data)).catch(() => {});
    });

    return () => unsub();
  }, [user]);

  // Persist notifications whenever they change (local cache)
  useEffect(() => {
    const STORAGE_KEY = '@notifications';
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)).catch((e) => console.warn('save notifications error', e));
  }, [notifications]);

  async function addNotification(n) {
    // If user is authenticated, save to Firestore, otherwise local only
    if (user) {
      const notif = {
        ...n,
        userId: user.uid,
        read: !!n.read,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };
      try {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('notificacoes')
          .add(notif);
        return;
      } catch (e) {
        console.warn('addNotification firestore error', e);
      }
    }

    setNotifications((s) => [{ ...n, id: String(Date.now()), read: false }, ...s]);
  }

  async function markAsRead(id) {
    if (user) {
      try {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('notificacoes')
          .doc(id)
          .update({ read: true });
        return;
      } catch (e) {
        console.warn('markAsRead firestore error', e);
      }
    }

    setNotifications((s) => s.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function markAllRead() {
    if (user) {
      try {
        const ref = firestore()
          .collection('users')
          .doc(user.uid)
          .collection('notificacoes');
        const snapshot = await ref.get();
        const batch = firestore().batch();
        snapshot.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
        await batch.commit();
        return;
      } catch (e) {
        console.warn('markAllRead firestore error', e);
      }
    }
    setNotifications((s) => s.map((n) => ({ ...n, read: true })));
  }

  async function removeNotification(id) {
    if (user) {
      try {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('notificacoes')
          .doc(id)
          .delete();
        return;
      } catch (e) {
        console.warn('removeNotification firestore error', e);
      }
    }
    setNotifications((s) => s.filter((n) => n.id !== id));
  }

  async function openNotification(id) {
    if (user) {
      try {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('notificacoes')
          .doc(id)
          .update({ read: true });
      } catch (e) {
        console.warn('openNotification firestore error', e);
      }
    }
    setNotifications((s) => s.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function getFCMToken() {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (e) {
      console.warn('getFCMToken error', e);
      return null;
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markAsRead, markAllRead, removeNotification, openNotification, unreadCount, getFCMToken }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
