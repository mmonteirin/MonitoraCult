/**
 * Arquivo de helper para registrar o background handler do FCM.
 * Importe este arquivo no seu `index.js` (entrypoint) para ativar o handler.
 */
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  try {
    const key = '@notifications';
    const raw = await AsyncStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const notif = {
      id: String(Date.now()),
      title: remoteMessage.notification?.title || 'Notificação',
      body: remoteMessage.notification?.body || JSON.stringify(remoteMessage.data || ''),
      data: remoteMessage.data,
      read: false,
      createdAt: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify([notif, ...list]));
  } catch (e) {
    console.warn('background handler error', e);
  }
});

export default null;
