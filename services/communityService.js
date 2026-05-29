import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// ==================== GRUPOS ====================

export const createCommunityGroup = async (groupData) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");

  const docRef = await addDoc(collection(db, "communityGroups"), {
    ...groupData,
    createdBy: uid,
    admins: [uid],
    members: [uid],
    membersCount: 1,
    postsCount: 0,
    isPrivate: groupData.isPrivate || false,
    coverImage: groupData.coverImage || null,
    tags: groupData.tags || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getCommunityGroups = async (genre = null, searchText = null) => {
  let q;
  if (genre && genre !== "Todos") {
    q = query(
      collection(db, "communityGroups"),
      where("genre", "==", genre),
      orderBy("membersCount", "desc")
    );
  } else {
    q = query(
      collection(db, "communityGroups"),
      orderBy("membersCount", "desc")
    );
  }
  const snap = await getDocs(q);
  const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (searchText) {
    const lower = searchText.toLowerCase();
    return groups.filter(
      (g) =>
        g.name?.toLowerCase().includes(lower) ||
        g.description?.toLowerCase().includes(lower)
    );
  }
  return groups;
};

export const getMyGroups = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const q = query(
    collection(db, "communityGroups"),
    where("members", "array-contains", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getGroupDetails = async (groupId) => {
  const snap = await getDoc(doc(db, "communityGroups", groupId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const joinGroup = async (groupId) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");
  await updateDoc(doc(db, "communityGroups", groupId), {
    members: arrayUnion(uid),
    membersCount: increment(1),
    updatedAt: serverTimestamp(),
  });
};

export const leaveGroup = async (groupId) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");
  const group = await getGroupDetails(groupId);
  if (group?.createdBy === uid) throw new Error("O criador não pode sair do grupo");
  await updateDoc(doc(db, "communityGroups", groupId), {
    members: arrayRemove(uid),
    membersCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
};

export const updateCommunityGroup = async (groupId, data) => {
  const uid = auth.currentUser?.uid;
  const group = await getGroupDetails(groupId);
  if (!group?.admins?.includes(uid)) throw new Error("Sem permissão");
  await updateDoc(doc(db, "communityGroups", groupId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCommunityGroup = async (groupId) => {
  const uid = auth.currentUser?.uid;
  const group = await getGroupDetails(groupId);
  if (group?.createdBy !== uid) throw new Error("Sem permissão");
  await deleteDoc(doc(db, "communityGroups", groupId));
};

export const isGroupMember = (group, uid) =>
  Array.isArray(group?.members) && group.members.includes(uid);

export const isGroupAdmin = (group, uid) =>
  Array.isArray(group?.admins) && group.admins.includes(uid);

// ==================== POSTS DO GRUPO ====================

export const createGroupPost = async (groupId, postData) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");

  const group = await getGroupDetails(groupId);
  if (!isGroupMember(group, uid)) throw new Error("Você precisa ser membro para postar");

  const docRef = await addDoc(
    collection(db, "communityGroups", groupId, "posts"),
    {
      ...postData,
      authorId: uid,
      authorName: auth.currentUser.displayName || "Usuário",
      authorPhoto: auth.currentUser.photoURL || null,
      likesCount: 0,
      commentsCount: 0,
      likes: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  await updateDoc(doc(db, "communityGroups", groupId), {
    postsCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getGroupPosts = async (groupId, pageLimit = 20) => {
  const q = query(
    collection(db, "communityGroups", groupId, "posts"),
    orderBy("createdAt", "desc"),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const likeGroupPost = async (groupId, postId) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");
  const postRef = doc(db, "communityGroups", groupId, "posts", postId);
  const postSnap = await getDoc(postRef);
  const likes = postSnap.data()?.likes || [];
  if (likes.includes(uid)) {
    await updateDoc(postRef, { likes: arrayRemove(uid), likesCount: increment(-1) });
    return false;
  } else {
    await updateDoc(postRef, { likes: arrayUnion(uid), likesCount: increment(1) });
    return true;
  }
};

export const deleteGroupPost = async (groupId, postId) => {
  const uid = auth.currentUser?.uid;
  const postSnap = await getDoc(doc(db, "communityGroups", groupId, "posts", postId));
  if (postSnap.data()?.authorId !== uid) throw new Error("Sem permissão");
  await deleteDoc(doc(db, "communityGroups", groupId, "posts", postId));
  await updateDoc(doc(db, "communityGroups", groupId), {
    postsCount: increment(-1),
  });
};

export const addPostComment = async (groupId, postId, content) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");
  const docRef = await addDoc(
    collection(db, "communityGroups", groupId, "posts", postId, "comments"),
    {
      content,
      authorId: uid,
      authorName: auth.currentUser.displayName || "Usuário",
      authorPhoto: auth.currentUser.photoURL || null,
      createdAt: serverTimestamp(),
    }
  );
  await updateDoc(doc(db, "communityGroups", groupId, "posts", postId), {
    commentsCount: increment(1),
  });
  return docRef.id;
};

export const getPostComments = async (groupId, postId) => {
  const q = query(
    collection(db, "communityGroups", groupId, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ==================== FÓRUM ====================

export const createForumThread = async (groupId, threadData) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");
  const group = await getGroupDetails(groupId);
  if (!isGroupMember(group, uid)) throw new Error("Você precisa ser membro");

  const docRef = await addDoc(
    collection(db, "communityGroups", groupId, "forum"),
    {
      ...threadData,
      authorId: uid,
      authorName: auth.currentUser.displayName || "Usuário",
      authorPhoto: auth.currentUser.photoURL || null,
      repliesCount: 0,
      likesCount: 0,
      likes: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );
  return docRef.id;
};

export const getForumThreads = async (groupId, pageLimit = 20) => {
  const q = query(
    collection(db, "communityGroups", groupId, "forum"),
    orderBy("createdAt", "desc"),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addForumReply = async (groupId, threadId, replyData) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");
  const docRef = await addDoc(
    collection(db, "communityGroups", groupId, "forum", threadId, "replies"),
    {
      ...replyData,
      authorId: uid,
      authorName: auth.currentUser.displayName || "Usuário",
      authorPhoto: auth.currentUser.photoURL || null,
      createdAt: serverTimestamp(),
    }
  );
  await updateDoc(doc(db, "communityGroups", groupId, "forum", threadId), {
    repliesCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getForumReplies = async (groupId, threadId) => {
  const q = query(
    collection(db, "communityGroups", groupId, "forum", threadId, "replies"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getForumThreadDetails = async (groupId, threadId) => {
  const snap = await getDoc(doc(db, "communityGroups", groupId, "forum", threadId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ==================== CRIADORES ====================

export const getHighlightedCreators = async () => {
  const q = query(
    collection(db, "highlightedCreators"),
    orderBy("viewsCount", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getCreatorDetails = async (creatorId) => {
  const snap = await getDoc(doc(db, "highlightedCreators", creatorId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const incrementCreatorViews = async (creatorId) => {
  await updateDoc(doc(db, "highlightedCreators", creatorId), {
    viewsCount: increment(1),
  });
};

// ==================== NOTÍCIAS ====================

export const createCommunityNews = async (groupId, newsData) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");
  const group = await getGroupDetails(groupId);
  if (!isGroupAdmin(group, uid)) throw new Error("Apenas admins podem postar notícias");

  const docRef = await addDoc(
    collection(db, "communityGroups", groupId, "news"),
    {
      ...newsData,
      authorId: uid,
      authorName: auth.currentUser.displayName || "Redação",
      viewsCount: 0,
      likesCount: 0,
      likes: [],
      createdAt: serverTimestamp(),
    }
  );
  return docRef.id;
};

export const getCommunityNews = async (groupId, pageLimit = 10) => {
  const q = query(
    collection(db, "communityGroups", groupId, "news"),
    orderBy("createdAt", "desc"),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const likeNews = async (groupId, newsId) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");
  const newsRef = doc(db, "communityGroups", groupId, "news", newsId);
  const newsSnap = await getDoc(newsRef);
  const likes = newsSnap.data()?.likes || [];
  if (likes.includes(uid)) {
    await updateDoc(newsRef, { likes: arrayRemove(uid), likesCount: increment(-1) });
    return false;
  } else {
    await updateDoc(newsRef, { likes: arrayUnion(uid), likesCount: increment(1) });
    return true;
  }
};

export const incrementNewsViews = async (groupId, newsId) => {
  await updateDoc(doc(db, "communityGroups", groupId, "news", newsId), {
    viewsCount: increment(1),
  });
};
