import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

/* 🔥 CRIAR POST */
export const criarPost = async (data) => {
  return await addDoc(collection(db, "posts"), {
    ...data,
    likesCount: 0,
    createdAt: serverTimestamp(),
  });
};

/* 🔥 FEED */
export const escutarFeed = (callback) => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(lista);
  });
};

/* ❤️ LIKE */
export const toggleLike = async (postId, user) => {
  const ref = doc(db, "posts", postId, "likes", user.uid);

  try {
    await setDoc(ref, {
      userId: user.uid,
    });
  } catch {
    await deleteDoc(ref);
  }
};

/* 💬 COMENTÁRIOS */
export const escutarComentarios = (postId, callback) => {
  const q = query(
    collection(db, "posts", postId, "comentarios"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(lista);
  });
};

export const adicionarComentario = async (postId, { user, texto }) => {
  return await addDoc(
    collection(db, "posts", postId, "comentarios"),
    {
      userId: user.uid,
      nome: user.displayName,
      foto: user.photoURL,
      texto,
      createdAt: serverTimestamp(),
    }
  );
};
