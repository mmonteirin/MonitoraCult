import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth, db } from "../firebaseConfig";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ REMOVIDO: setPersistence com browserSessionPersistence
  // Causava o "Maximum update depth exceeded" no ambiente React Native/web
  // A persistência já é configurada corretamente no firebaseConfig.js

  const buildUserData = (userAuth, dbData = {}) => {
    return {
      uid: userAuth.uid,
      email: userAuth.email,
      nome:
        dbData.nome ||
        userAuth.displayName ||
        userAuth.email?.split("@")[0] ||
        "Usuário",
      foto: dbData.foto || userAuth.photoURL || "https://i.pravatar.cc/150",
      role: (dbData.role || "user").toLowerCase(),
      areaAtuacao: dbData.areaAtuacao || null,
      localAtuacao: dbData.localAtuacao || null,
      cnpj: dbData.cnpj || null,
    };
  };

  // ✅ Carrega cache para UX rápida — apenas na montagem (sem deps problemáticas)
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem("@auth_user");
        if (cached) {
          setProfile(JSON.parse(cached));
        }
      } catch (error) {
        console.log("Erro cache:", error);
      }
    };
    loadCache();
  }, []); // ✅ array vazio: executa só uma vez, sem loop

  // ✅ Listener global do Firebase — também só na montagem
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      console.log("Firebase state changed:", userAuth?.email);

      if (!userAuth) {
        setUser(null);
        setProfile(null);
        await AsyncStorage.removeItem("@auth_user");
        setLoading(false);
        return;
      }

      setUser(userAuth);

      try {
        const docRef = doc(db, "users", userAuth.uid);
        const snap = await getDoc(docRef);

        const dbData = snap.exists() ? snap.data() : {};
        const userData = buildUserData(userAuth, dbData);

        setProfile(userData);
        await AsyncStorage.setItem("@auth_user", JSON.stringify(userData));
      } catch (error) {
        console.log(error);
      }

      setLoading(false);
    });

    return unsubscribe; // ✅ cleanup correto: cancela o listener ao desmontar
  }, []); // ✅ array vazio: sem dependências que causem re-execução

  /* 🔓 LOGOUT */
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("@auth_user");
      await signOut(auth);
      setUser(null);
      setProfile(null);
      return true;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        nome: profile?.nome || "",
        foto: profile?.foto || null,
        role: profile?.role || "user",
        isAdmin: profile?.role === "admin",
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
