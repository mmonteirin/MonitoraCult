/**
 * modules/notifications.web.js
 *
 * Stub vazio de expo-notifications para a plataforma web.
 * O Metro resolve automaticamente este arquivo no lugar de
 * expo-notifications quando bundling para web.
 *
 * Todas as funções retornam valores seguros (null / false / [])
 * para que o código que chama estas funções não quebre.
 */

const noop = () => {};
const asyncNoop = async () => null;

export const setNotificationHandler = noop;
export const getPermissionsAsync = async () => ({ status: "undetermined" });
export const requestPermissionsAsync = async () => ({ status: "denied" });
export const getExpoPushTokenAsync = asyncNoop;
export const scheduleNotificationAsync = asyncNoop;
export const cancelScheduledNotificationAsync = asyncNoop;
export const cancelAllScheduledNotificationsAsync = asyncNoop;
export const setBadgeCountAsync = asyncNoop;
export const addNotificationReceivedListener = () => ({ remove: noop });
export const addNotificationResponseReceivedListener = () => ({ remove: noop });
export const removeNotificationSubscription = noop;
export const setNotificationChannelAsync = asyncNoop;
export const AndroidImportance = { HIGH: 4, DEFAULT: 3, LOW: 2, NONE: 0 };

export default {
  setNotificationHandler,
  getPermissionsAsync,
  requestPermissionsAsync,
  getExpoPushTokenAsync,
  scheduleNotificationAsync,
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  setBadgeCountAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
  setNotificationChannelAsync,
  AndroidImportance,
};
