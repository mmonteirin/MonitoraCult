import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

/* ➕ ADICIONAR COMENTÁRIO */
export const adicionarComentario = async (postId, user, texto) => {
  if (!texto.trim()) return;

  return await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      userId: user.uid,
      nome: user.displayName || "Usuário",
      foto: user.photoURL || null,
      texto,
      createdAt: serverTimestamp(),
    }
  );
};

/* 👀 ESCUTAR COMENTÁRIOS */
export const escutarComentarios = (postId, callback) => {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(lista);
  });
};
