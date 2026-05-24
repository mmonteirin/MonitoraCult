import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

export const SUPPORT_CATEGORIES = [
  { id: "login", label: "Problema com Login", icon: "account-alert-outline" },
  { id: "evento", label: "Problema com Evento", icon: "calendar-alert" },
  { id: "pagamento", label: "Pagamento", icon: "credit-card-outline" },
  { id: "bug", label: "Bug no App", icon: "bug-outline" },
  { id: "outro", label: "Outro", icon: "help-circle-outline" },
];

export const SUPPORT_STATUS = {
  aberto: "Aberto",
  em_atendimento: "Em atendimento",
  aguardando_usuario: "Aguardando usuário",
  resolvido: "Resolvido",
};

export function getSupportPriority(categoryId) {
  if (categoryId === "pagamento") return "alta";
  if (categoryId === "bug") return "media";
  return "normal";
}

export function normalizeSupportTicket(document) {
  return {
    id: document.id,
    ...document.data(),
  };
}

export async function createSupportTicket({
  uid,
  email,
  userName,
  userPhoto,
  categoria,
  categoriaLabel,
  mensagem,
}) {
  if (!uid) throw new Error("Usuário não autenticado");
  if (!categoria || !mensagem?.trim()) {
    throw new Error("Informe a categoria e a mensagem.");
  }

  const texto = mensagem.trim();
  const prioridade = getSupportPriority(categoria);

  const ticketRef = await addDoc(collection(db, "supportTickets"), {
    uid,
    email: email || "",
    userName: userName || "Usuário",
    userPhoto: userPhoto || "",
    categoria,
    categoriaLabel,
    mensagem: texto,
    status: "aberto",
    prioridade,
    respostaAdmin: "",
    assignedAdminId: null,
    assignedAdminName: null,
    lastMessage: texto,
    lastMessageAt: serverTimestamp(),
    lastMessageBy: uid,
    unreadAdmin: true,
    unreadUser: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "supportTickets", ticketRef.id, "messages"), {
    texto,
    authorId: uid,
    authorName: userName || "Usuário",
    authorPhoto: userPhoto || "",
    authorRole: "user",
    createdAt: serverTimestamp(),
  });

  return ticketRef.id;
}

export function listenUserSupportTickets(uid, callback, onError) {
  if (!uid) return () => {};

  const q = query(
    collection(db, "supportTickets"),
    where("uid", "==", uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tickets = snapshot.docs
        .map(normalizeSupportTicket)
        .sort((a, b) => {
          const aTime = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const bTime = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      callback(tickets);
    },
    onError
  );
}

export function listenAdminSupportTickets(callback, onError) {
  const q = query(
    collection(db, "supportTickets"),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map(normalizeSupportTicket));
    },
    onError
  );
}

export function listenSupportMessages(ticketId, callback, onError) {
  if (!ticketId) return () => {};

  const q = query(
    collection(db, "supportTickets", ticketId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })));
    },
    onError
  );
}

export async function sendSupportMessage(ticketId, {
  texto,
  authorId,
  authorName,
  authorPhoto,
  authorRole,
}) {
  if (!ticketId) throw new Error("Chamado inválido");
  if (!authorId) throw new Error("Usuário não autenticado");
  if (!texto?.trim()) throw new Error("Digite uma mensagem.");

  const cleanText = texto.trim();
  const isAdmin = authorRole === "admin";
  const ticketRef = doc(db, "supportTickets", ticketId);

  await addDoc(collection(db, "supportTickets", ticketId, "messages"), {
    texto: cleanText,
    authorId,
    authorName: authorName || (isAdmin ? "Suporte MonitoraCult" : "Usuário"),
    authorPhoto: authorPhoto || "",
    authorRole: isAdmin ? "admin" : "user",
    createdAt: serverTimestamp(),
  });

  await updateDoc(ticketRef, {
    lastMessage: cleanText,
    lastMessageAt: serverTimestamp(),
    lastMessageBy: authorId,
    unreadAdmin: !isAdmin,
    unreadUser: isAdmin,
    ...(isAdmin ? { respostaAdmin: cleanText } : {}),
    status: isAdmin ? "aguardando_usuario" : "em_atendimento",
    updatedAt: serverTimestamp(),
  });
}

export async function markSupportTicketRead(ticketId, role) {
  if (!ticketId) return;

  await updateDoc(doc(db, "supportTickets", ticketId), {
    ...(role === "admin" ? { unreadAdmin: false } : { unreadUser: false }),
  });
}

export async function updateSupportTicketStatus(ticketId, {
  status,
  adminId,
  adminName,
}) {
  if (!ticketId || !status) return;

  await updateDoc(doc(db, "supportTickets", ticketId), {
    status,
    assignedAdminId: adminId || null,
    assignedAdminName: adminName || null,
    updatedAt: serverTimestamp(),
  });
}

export async function getSupportTicket(ticketId) {
  if (!ticketId) return null;
  const snapshot = await getDoc(doc(db, "supportTickets", ticketId));
  return snapshot.exists() ? normalizeSupportTicket(snapshot) : null;
}
