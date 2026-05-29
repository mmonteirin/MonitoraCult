import { signOut } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebaseConfig";

/**
 * ⚠️ AVISO: Use `logout` do AuthContext em vez desta função
 * 
 * Esta função é um helper auxiliar. Use:
 *   const { logout } = useAuth();
 *   await logout();
 * 
 * Mantida apenas para casos de edge-case ou reset manual.
 */
export const logoutUser = async () => {
  try {
    // Remove apenas dados de usuário, não clear() inteiro
    await AsyncStorage.removeItem("@auth_user");
    
    // Sign out do Firebase
    await signOut(auth);
    
    return true;
  } catch (error) {
    console.error("Erro ao sair (logoutUser):", error);
    throw error;
  }
};
