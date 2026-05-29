import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function comprarIngresso({
  eventoId,
  user,
  valor,
  tipo = "inteira",
}) {
  try {
    await addDoc(
      collection(db, "eventos", eventoId, "ingressos"),
      {
        userId: user.uid,
        nome: user.displayName || "Usuário",
        valorPago: valor,
        tipo,
        status: "confirmado",
        createdAt: new Date(),
      }
    );

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}