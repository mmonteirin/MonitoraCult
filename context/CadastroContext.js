import { createContext, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "../firebaseConfig";

const CadastroContext = createContext();

// ─────────────────────────────────────────────────────────────
// Gera código numérico de 6 dígitos
// ─────────────────────────────────────────────────────────────
const gerarCodigo = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export function CadastroProvider({ children }) {

  // ─────────────────────────────────────────────────────────────
  // Gera código de verificação localmente
  // Salva { code, expiry } no Firestore para validação posterior
  // ─────────────────────────────────────────────────────────────
  const sendVerificationCode = async (email) => {
    try {
      const code = gerarCodigo();

      // Expira em 10 minutos
      const expiry = Timestamp.fromDate(
        new Date(Date.now() + 10 * 60 * 1000)
      );

      // Salva o código no Firestore (para validar depois)
      await setDoc(doc(db, "emailCodes", email), {
        code,
        expiry,
        email,
      });

      return { success: true, code };
    } catch (error) {
      console.log("Erro ao gerar código:", error);
      return { success: false, message: "Não foi possível gerar o código." };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Verifica se o código digitado está correto e não expirou
  // ─────────────────────────────────────────────────────────────
  const verifyCode = async (email, inputCode) => {
    try {
      const snap = await getDoc(doc(db, "emailCodes", email));

      if (!snap.exists()) {
        return { success: false, message: "Código não encontrado. Solicite um novo." };
      }

      const { code, expiry } = snap.data();

      if (Timestamp.now().toMillis() > expiry.toMillis()) {
        await deleteDoc(doc(db, "emailCodes", email));
        return { success: false, message: "Código expirado. Solicite um novo." };
      }

      if (inputCode.trim() !== code) {
        return { success: false, message: "Código inválido." };
      }

      // Código correto — remove do Firestore
      await deleteDoc(doc(db, "emailCodes", email));

      return { success: true };
    } catch (error) {
      console.log("Erro ao verificar código:", error);
      return { success: false, message: "Erro ao verificar o código." };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Cria o usuário no Firebase Auth + Firestore
  // ─────────────────────────────────────────────────────────────
  const registerUser = async ({
    email,
    password,
    nome,
    role = "user",
    areaAtuacao = null,
    localAtuacao = null,
    cnpj = null,
  }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await updateProfile(user, { displayName: nome });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        nome,
        role,
        foto: "https://i.pravatar.cc/150",
        areaAtuacao,
        localAtuacao,
        cnpj,
        followers: 0,
        following: 0,
        createdAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      let message = "Erro ao cadastrar";

      if (error.code === "auth/email-already-in-use") {
        message = "Email já está em uso";
      } else if (error.code === "auth/invalid-email") {
        message = "Email inválido";
      } else if (error.code === "auth/weak-password") {
        message = "Senha muito fraca (mínimo 6 caracteres)";
      }

      return { success: false, message };
    }
  };

  return (
    <CadastroContext.Provider value={{ registerUser, sendVerificationCode, verifyCode }}>
      {children}
    </CadastroContext.Provider>
  );
}

export function useCadastro() {
  return useContext(CadastroContext);
}
