# 🚀 Guia de Implementação - Sistema Social MonitoraCult

## 1. Estrutura do Firestore

### Collections a Criar

#### 1.1 `followers/{userId}/followers` (Subcoleção)
```firestore
followers/{userId}/followers/{followerId}
├── followerId: string
├── followerName: string
├── followerPhoto: string
└── createdAt: timestamp
```

#### 1.2 `followers/{userId}/following` (Subcoleção)
```firestore
followers/{userId}/following/{targetUserId}
├── targetUserId: string
├── targetName: string
├── targetPhoto: string
└── createdAt: timestamp
```

#### 1.3 `chats/{chatId}` (Documentos)
```firestore
chats/{chatId}
├── chatId: string
├── participants: [uid1, uid2]
├── participantNames: [name1, name2]
├── participantPhotos: [photo1, photo2]
├── createdAt: timestamp
├── lastMessage: string
├── lastMessageTime: timestamp
└── unreadCount: {uid1: 0, uid2: 0}
```

#### 1.4 `chats/{chatId}/messages/{msgId}` (Subcoleção)
```firestore
chats/{chatId}/messages/{msgId}
├── senderId: string
├── senderName: string
├── senderPhoto: string
├── text: string
├── createdAt: timestamp
└── read: boolean
```

#### 1.5 `notifications/{notificationId}` (Documentos)
```firestore
notifications/{notificationId}
├── fromUserId: string
├── fromUserName: string
├── fromUserPhoto: string
├── toUserId: string
├── type: "follow" | "like" | "comment" | "message"
├── createdAt: timestamp
└── read: boolean
```

### Atualizações no `users/{uid}`
```firestore
users/{uid}
├── uid: string
├── email: string
├── displayName: string
├── photoURL: string
├── bio: string
├── bio_links: Array<{title: string, url: string}>
├── isVerified: boolean
├── verifiedBadge: "creator" | "partner" | null
├── followers: number (contador)
├── following: number (contador)
├── eventosCount: number
├── totalLikes: number
├── createdAt: timestamp
├── spotify: {accessToken, refreshToken, artistId, topTrack, artistName}
├── instagram: {username, followerCount, verified}
└── facebook: {userId, linked}
```

---

## 2. Segurança - Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Públicos
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }

    // Seguidores - Público
    match /followers/{userId}/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid == userId || 
                      request.auth.uid in get(/databases/$(database)/documents/followers/$(userId)/followers/$(request.auth.uid)).data.keys();
    }

    // Chats - Privado
    match /chats/{chatId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      allow create: if request.auth.uid in request.resource.data.participants;
    }

    match /chats/{chatId}/messages/{msgId} {
      allow read, write: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      allow create: if request.auth.uid == request.resource.data.senderId;
    }

    // Notificações - Privado
    match /notifications/{notificationId} {
      allow read: if request.auth.uid == resource.data.toUserId;
      allow write: if request.auth.uid == resource.data.fromUserId;
    }
  }
}
```

---

## 3. Usando os Serviços

### 3.1 Seguir um Usuário
```javascript
import { followUser } from "../services/followService";
import { getPublicProfile } from "../services/profileService";

// Obter dados do usuário
const userData = await getPublicProfile(targetUserId);

// Seguir
await followUser(targetUserId, userData);
```

### 3.2 Usar o Hook useFollow
```javascript
import { useFollow } from "../hooks/useFollow";
import { FollowButton } from "../components/FollowButton";

const MyScreen = ({ targetUserId, targetUserData }) => {
  return (
    <FollowButton 
      targetUserId={targetUserId}
      targetUserData={targetUserData}
      onFollowChange={(isFollowing) => {
        console.log("Follow status:", isFollowing);
      }}
    />
  );
};
```

### 3.3 Obter Perfil Público
```javascript
import { getPublicProfile, getCreatorMetrics } from "../services/profileService";

const profile = await getPublicProfile(userId);
const metrics = await getCreatorMetrics(userId);

console.log(profile); // {displayName, photoURL, followers, isVerified, ...}
console.log(metrics); // {totalEventos, totalLikes, engagementRate, ...}
```

### 3.4 Iniciar Chat
```javascript
import { getOrCreateChat, sendMessage } from "../services/chatService";

// Obter ou criar chat
const chatId = await getOrCreateChat(otherUserId, otherUserData);

// Enviar mensagem
await sendMessage(chatId, "Olá!");
```

### 3.5 Listar Conversas
```javascript
import { getUserChats } from "../services/chatService";

const chats = await getUserChats(currentUser.uid);
// Retorna array de chats ordenados por recente
```

---

## 4. Tela Pública do Perfil (Próxima Etapa)

### Criar `screens/PerfilPublico.js`

```javascript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";

import { getPublicProfile, getCreatorEvents, getCreatorMetrics } from "../services/profileService";
import { FollowButton } from "../components/FollowButton";
import { VerifiedBadgeIcon } from "../components/VerifiedBadge";
import { CreatorStats } from "../components/CreatorStats";

export default function PerfilPublico({ route }) {
  const { userId } = route.params;
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileData, eventsData] = await Promise.all([
          getPublicProfile(userId),
          getCreatorEvents(userId, 10),
        ]);

        setProfile(profileData);
        setEvents(eventsData);
      } catch (error) {
        console.log("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading) {
    return <View><ActivityIndicator /></View>;
  }

  if (!profile) {
    return <View><Text>Perfil não encontrado</Text></View>;
  }

  return (
    <ScrollView>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        <Text style={styles.name}>
          {profile.displayName}
          {profile.isVerified && <VerifiedBadgeIcon badgeType={profile.verifiedBadge} />}
        </Text>
        <Text style={styles.bio}>{profile.bio}</Text>

        {/* Stats */}
        <CreatorStats
          userId={userId}
          followers={profile.followers}
          following={profile.following}
        />

        {/* Follow Button */}
        <FollowButton targetUserId={userId} targetUserData={profile} />
      </View>

      {/* Eventos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Eventos</Text>
        <FlatList
          data={events}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <Image source={{ uri: item.imagemEvento }} style={styles.eventImage} />
              <Text style={styles.eventTitle}>{item.tituloEvento}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
}
```

---

## 5. Próximos Passos

1. ✅ **Criar serviços base** (followService, profileService, chatService)
2. ✅ **Criar componentes** (FollowButton, VerifiedBadge, CreatorStats)
3. 🔲 **Tela Pública do Perfil** (PerfilPublico.js)
4. 🔲 **Tela de Chat** (TelaChat.js)
5. 🔲 **Lista de Seguidores** (SeguidoresList.js)
6. 🔲 **Integração Spotify**
7. 🔲 **Integração Instagram/Meta**
8. 🔲 **Sistema de Notificações**

---

## 6. Dependências Necessárias

```json
{
  "expo-notifications": "^0.x.x",
  "react-native-spotify-remote": "^0.x.x",
  "react-native-instagram-share": "^0.x.x",
  "@react-native-async-storage/async-storage": "^1.x.x"
}
```

---

## 7. Variáveis de Ambiente

Adicione ao `.env`:
```
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
SPOTIFY_REDIRECT_URI=xxx

INSTAGRAM_BUSINESS_ACCOUNT_ID=xxx
INSTAGRAM_ACCESS_TOKEN=xxx

FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
```

---

## Dúvidas Comuns

**P: Como ativar o sistema de verificação?**
A: Criar um admin dashboard para marcar `isVerified: true` e `verifiedBadge: "creator"` no documento do usuário.

**P: Como fazer search de usuários?**
A: Usar Algolia, Meilisearch ou Firebase Search Extension.

**P: Como implementar notificações push?**
A: Usar `expo-notifications` + Firebase Cloud Messaging.

**P: Como sincronizar seguidores do Instagram?**
A: Usar Instagram Graph API para sincronizar automaticamente.
