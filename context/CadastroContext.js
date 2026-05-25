import { createContext, useContext } from "react";
import emailjs from "@emailjs/react-native";
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

// ─────────────────────────────────────────────────────────────
// Envia email de verificação via EmailJS
// ─────────────────────────────────────────────────────────────
const enviarEmailVerificacao = async (toEmail, codigo) => {
  try {
    const response = await emailjs.send(
      "MonitoraCult",
      "verificacaoMonitoraCult",
      {
        CODIGO_VERIFICACAO: codigo,
        TEMPO_VALIDADE: 10,
        to_email: toEmail,
      },
      {
        publicKey: "re6QctN7UZLA_gLCL",
      }
    );

    console.log("Email enviado com sucesso:", response);

    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);

    throw error;
  }
};

export function CadastroProvider({ children }) {

  // ─────────────────────────────────────────────────────────────
  // Envia código de verificação para o email
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

      // Dispara o envio do email
      await enviarEmailVerificacao(email, code);

      return { success: true };
    } catch (error) {
      console.log("Erro ao enviar código:", error);
      return { success: false, message: "Não foi possível enviar o código." };
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