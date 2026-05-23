import {
	collection,
	addDoc,
	serverTimestamp,
	updateDoc,
	doc,
	getDocs,
	query,
	where,
	orderBy,
	onSnapshot,
	runTransaction,
	increment,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

/**
 * Criar um novo post/evento no feed
 */
export const criarPost = async ({ text, image }) => {
	const user = auth.currentUser;

	if (!user) throw new Error("Usuário não autenticado");

	await addDoc(collection(db, "posts"), {
		userId: user.uid,

		autor: {
			uid: user.uid,

			nome: user.displayName || "Usuário",

			foto: user.photoURL || "",
		},

		descricao: text,

		imagemUrl: image,

		likes: 0,

		createdAt: serverTimestamp(),
	});
};

/**
 * Fazer like/unlike em um evento do feed.
 * Usa transaction para garantir consistência (igual ao eventosAppService).
 * Campo padronizado: usuarioId (mesmo padrão de eventosAppService).
 */
export const toggleFeedLike = async (itemId, itemType, usuarioId) => {
	if (!usuarioId) {
		throw new Error("Usuário não autenticado");
	}

	const collectionName = itemType === "post" ? "posts" : "eventos";

	const itemRef = doc(db, collectionName, itemId);

	const likeRef = doc(db, "likes", `${itemType}_${itemId}_${usuarioId}`);

	try {
		let isNowLiked = false;

		await runTransaction(db, async (transaction) => {
			const itemSnap = await transaction.get(itemRef);

			if (!itemSnap.exists()) {
				throw new Error("Item não encontrado");
			}

			const likeSnap = await transaction.get(likeRef);

			const jaLikado = likeSnap.exists();

			if (jaLikado) {
				transaction.delete(likeRef);

				transaction.update(itemRef, {
					likes: increment(-1),
				});

				isNowLiked = false;
			} else {
				transaction.set(likeRef, {
					itemId,
					itemType,
					usuarioId,
					createdAt: serverTimestamp(),
				});

				transaction.update(itemRef, {
					likes: increment(1),
				});

				isNowLiked = true;
			}
		});

		return isNowLiked;
	} catch (error) {
		console.log("Erro ao fazer like:", error);

		throw error;
	}
};

/**
 * Obter IDs dos eventos que o usuário curtiu.
 * Campo padronizado: usuarioId (mesmo padrão de eventosAppService).
 */
export const getUserFeedLikes = async (usuarioId) => {
	if (!usuarioId) return [];

	try {
		const likesQuery = query(
			collection(db, "likes"),
			where("usuarioId", "==", usuarioId)
		);

		const likesSnapshot = await getDocs(likesQuery);
		return likesSnapshot.docs.map((d) => {
			const data = d.data();
			return `${data.itemType || "evento"}-${data.itemId || data.eventoId}`;
		});
	} catch (error) {
		console.log("Erro ao buscar likes:", error);
		return [];
	}
};

/**
 * Escutar comentários de um item do feed.
 */
export const escutarFeedComentarios = (itemId, itemType, callback) => {
	const collectionName = itemType === "post" ? "posts" : "eventos";

	const comentariosQuery = query(
		collection(db, collectionName, itemId, "comentarios"),
		orderBy("createdAt", "asc")
	);

	return onSnapshot(comentariosQuery, (snapshot) => {
		const comentarios = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		callback(comentarios);
	});
};

/**
 * Adicionar comentário em um item do feed.
 * Usa increment atômico em vez de read-then-write.
 */
export const adicionarFeedComentario = async (
	itemId,
	itemType,
	texto,
	autor = {}
) => {
	const user = auth.currentUser;

	if (!user) throw new Error("Usuário não autenticado");
	if (!texto.trim()) throw new Error("Comentário não pode estar vazio");

	const collectionName = itemType === "post" ? "posts" : "eventos";

	try {
		const comentarioRef = await addDoc(
			collection(db, collectionName, itemId, "comentarios"),
			{
				userId: user.uid,
				userName: autor.nome || user.displayName || "Usuário",
				userPhoto: autor.foto || user.photoURL || "",
				texto: texto.trim(),
				createdAt: serverTimestamp(),
				likes: 0,
			}
		);

		await updateDoc(doc(db, collectionName, itemId), {
			comentarios: increment(1),
		});

		return comentarioRef.id;
	} catch (error) {
		console.log("Erro ao adicionar comentário:", error);
		throw error;
	}
};
