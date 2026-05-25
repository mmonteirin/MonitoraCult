import {
	doc,
	setDoc,
	deleteDoc,
	getDocs,
	collection,
	getDoc,
	updateDoc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import {
	agendarNotificacao,
	cancelarNotificacao,
} from "./notificationService";

const parseDate = (value) => {
	if (!value) return null;
	if (value?.toDate) return value.toDate();
	if (value instanceof Date) return value;

	const brDate = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (brDate) {
		const [, day, month, year] = brDate;
		return new Date(Number(year), Number(month) - 1, Number(day));
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

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

			categoria: evento.categoria || evento.tipoEvento || "",

			preco: evento.precoInteira ?? evento.preco ?? 0,

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
				...eventoSnap.data(),
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

export async function configurarLembreteEvento(uid, evento, minutosAntes) {
	try {
		if (!uid || !evento?.id) return false;

		if (evento.reminderNotificationId) {
			await cancelarNotificacao(evento.reminderNotificationId);
		}

		const eventDate =
			parseDate(evento.dataEventoTimestamp) ||
			parseDate(evento.dataEvento);

		const dataHora =
			eventDate && !Number.isNaN(eventDate.getTime())
				? new Date(eventDate.getTime() - minutosAntes * 60000)
				: null;

		const notificationId =
			dataHora && dataHora > new Date()
				? await agendarNotificacao({
						titulo: "Lembrete de evento",
						corpo: `${evento.tituloEvento} começa em breve.`,
						dados: {
							eventoId: evento.eventoId || evento.id,
							screen: "Detalhes",
						},
						dataHora,
					})
				: null;

		await updateDoc(doc(db, "users", uid, "subscribedEvents", evento.id), {
			reminderMinutesBefore: minutosAntes,
			reminderAt: dataHora,
			reminderNotificationId: notificationId,
		});

		return true;
	} catch (error) {
		console.log("Erro ao configurar lembrete:", error);
		return false;
	}
}
