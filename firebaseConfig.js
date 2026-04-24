import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCNld0ThxUsLpo84wcz9T8m3JeC3e8PlZE",
  authDomain: "monitoracult.firebaseapp.com",
  projectId: "monitoracult",
  storageBucket: "monitoracult.firebasestorage.app",
  messagingSenderId: "133936734015",
  appId: "1:133936734015:web:ff16ed3bc5c10552337d8a",
  measurementId: "G-81ZPDYYXGX"
};

// Inicializa app
const app = initializeApp(firebaseConfig);

// Inicializa Firestore
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };