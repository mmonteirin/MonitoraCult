import {
	doc,
	setDoc,
	deleteDoc,
	getDocs,
	collection,
	getDoc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

/* 🔔 INSCREVER */
export async function subscribeToEvent(uid, evento) {
	try {
		const ref = doc(db, "users", uid, "subscribedEvents", evento.id);

		await setDoc(ref, {
			eventoId: evento.id,

			tituloEvento: evento.tituloEvento || "",

			imagemEvento: evento.imagemEvento || "",

			dataEvento: evento.dataEvento || "",

			dataEventoTimestamp: evento.dataEventoTimestamp || null,

			localEvento: evento.localEvento || evento.nomeLocal || "",

			createdAt: new Date(),
		});

		return true;
	} catch (error) {
		console.log(error);

		return false;
	}
}

/* 🔕 REMOVER */
export async function unsubscribeFromEvent(uid, eventoId) {
	try {
		const ref = doc(db, "users", uid, "subscribedEvents", eventoId);

		await deleteDoc(ref);

		return true;
	} catch (error) {
		console.log(error);

		return false;
	}
}

/* 📥 PEGAR EVENTOS INSCRITOS */
export async function getSubscribedEvents(uid) {
	try {
		const ref = collection(
			db,
			"users",
			uid,
			"subscribedEvents"
		);

		const snapshot = await getDocs(ref);

		const promises = snapshot.docs.map(async (item) => {
			const data = item.data();

			const eventoRef = doc(
				db,
				"eventos",
				data.eventoId
			);

			const eventoSnap = await getDoc(eventoRef);

			if (!eventoSnap.exists()) {
				return null;
			}

			return {
				id: item.id,
				...data,
			};
		});

		const resultados = await Promise.all(promises);

		return resultados.filter(Boolean);
	} catch (error) {
		console.log(error);

		return [];
	}
}