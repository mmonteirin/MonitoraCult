import { API_BASE_URL, NOTIFICATIONS_TOKEN_ENDPOINT } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function registerDeviceToken(token, userId = null) {
  try {
    const url = `${API_BASE_URL}${NOTIFICATIONS_TOKEN_ENDPOINT}`;
    // If API_BASE_URL is still the placeholder, fallback to local mock storage
    if (API_BASE_URL.includes('your-api.example.com')) {
      const KEY = '@registered_device_tokens';
      const raw = await AsyncStorage.getItem(KEY);
      const list = raw ? JSON.parse(raw) : [];
      const entry = { token, userId, createdAt: Date.now() };
      await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...list]));
      return { ok: true, mock: true, entry };
    }

    const body = { token, userId };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to register token: ${text}`);
    }
    return await res.json();
  } catch (e) {
    console.warn('registerDeviceToken error', e);
    return null;
  }
}
