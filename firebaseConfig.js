// firebaseConfig.js
// ⚠️  SEGURANÇA: mova as credenciais para variáveis de ambiente.
//     Veja o arquivo .env.example para instruções.
//
// ✅ Firebase Storage removido intencionalmente (plano Spark não suporta).
//    Use ImgBB via uploadService.js para upload de imagens.
 
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
 
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY             || "AIzaSyCNld0ThxUsLpo84wcz9T8m3JeC3e8PlZE",
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN         || "monitoracult.firebaseapp.com",
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID          || "monitoracult",
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET      || "monitoracult.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "133936734015",
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID              || "1:133936734015:web:ff16ed3bc5c10552337d8a",
};
 
/* 🚀 APP — evita reinicialização em hot-reload */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
 
/* 🔐 AUTH
 * CORREÇÃO: firebase/auth/react-native foi removido no Firebase v10+.
 * getReactNativePersistence agora é exportado direto de "firebase/auth".
 */
let auth;
 
try {
  if (Platform.OS === "web") {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch (e) {
  // initializeAuth lança se já foi inicializado (hot-reload)
  auth = getAuth(app);
}
 
/* 🔥 FIRESTORE */
const db = getFirestore(app);
 
export { app, db, auth };
 