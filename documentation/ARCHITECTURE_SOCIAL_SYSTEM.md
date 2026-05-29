# 📊 Arquitetura do Sistema Social - MonitoraCult

## Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                   INTERFACE DO USUÁRIO                      │
├─────────────────────────────────────────────────────────────┤
│  TelaPerfil | TelaFeed | PerfilPublico | TelaChat | TelaBusca│
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTES REACT                        │
├─────────────────────────────────────────────────────────────┤
│ FollowButton │ VerifiedBadge │ CreatorStats │ ChatBubble    │
│ UserCard │ SocialLinks │ LinktreePreview                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      CUSTOM HOOKS                           │
├─────────────────────────────────────────────────────────────┤
│ useFollow │ useChat │ useProfile │ useNotifications         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVIÇOS (LOGIC)                          │
├─────────────────────────────────────────────────────────────┤
│ followService    → gerenciar followers/following            │
│ profileService   → dados públicos e métricas                │
│ chatService      → mensagens em tempo real                  │
│ spotifyService   → integração com Spotify                   │
│ instagramService → integração com Instagram Graph API       │
│ analyticsService → métricas do creator                      │
│ notificationService → push notifications                    │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              FIREBASE FIRESTORE + AUTH                      │
├─────────────────────────────────────────────────────────────┤
│ users/{uid}                                                 │
│ followers/{userId}/followers/{followerId}                   │
│ followers/{userId}/following/{targetUserId}                 │
│ chats/{chatId}/messages/{msgId}                             │
│ notifications/{notificationId}                              │
│ eventos/{id}                                                │
│ likes/{id}                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Seguidor

```
Usuário A clica "Seguir" em Usuário B
    │
    ▼
[FollowButton] → useFollow hook
    │
    ▼
followService.followUser(userId_B, userData_B)
    │
    ├── Batch Write to Firestore:
    │   ├── followers/{userId_B}/followers/{userId_A} ✓
    │   ├── followers/{userId_A}/following/{userId_B} ✓
    │   ├── users/{userId_B}: followers++ ✓
    │   ├── users/{userId_A}: following++ ✓
    │   └── notifications/{id} → create follow notification ✓
    │
    ▼
UI atualiza: "Seguindo" ✓
Notificação enviada para Usuário B
```

---

## Fluxo de Chat

```
Usuário A clica para enviar mensagem a Usuário B
    │
    ▼
[TelaChat] → chatService.getOrCreateChat(B, userData_B)
    │
    ├── gera chatId = "uid_A_uid_B" (único para ambos)
    ├── cria /chats/{chatId} se não existir
    │
    ▼
Usuário A digita mensagem e clica "Enviar"
    │
    ▼
sendMessage(chatId, "Olá!")
    │
    ├── Firestore:
    │   ├── /chats/{chatId}/messages/{msgId} → nova mensagem
    │   ├── /chats/{chatId} → lastMessage atualizado
    │   └── /notifications/ → nova notificação para Usuário B
    │
    ▼
UI real-time atualiza via onSnapshot() ✓
```

---

## Fluxo de Perfil Público

```
Usuário clica em perfil de outro usuário
    │
    ▼
[PerfilPublico] route.params = { userId }
    │
    ▼
useEffect → carrega dados em paralelo:
    │
    ├── profileService.getPublicProfile(userId)
    │   └── retorna: {name, photo, bio, followers, verified, ...}
    │
    ├── profileService.getCreatorEvents(userId)
    │   └── retorna: [evento1, evento2, ...]
    │
    └── profileService.getCreatorMetrics(userId)
        └── retorna: {totalEventos, totalLikes, engagement, ...}
    │
    ▼
Renderiza:
├── Avatar + Info
├── [FollowButton] → useFollow hook
├── [CreatorStats] → mostra métricas
├── [VerifiedBadge] se verificado
├── [Bio + Bio Links]
└── [FlatList de eventos]
```

---

## Estrutura de Dados - Firestore

### Users (Público)
```
/users/{uid}
├── displayName: "João Silva"
├── photoURL: "https://..."
├── bio: "Organizador de eventos"
├── bio_links: [
│   {title: "Instagram", url: "https://instagram.com/..."},
│   {title: "Website", url: "https://..."}
│ ]
├── isVerified: true
├── verifiedBadge: "creator"
├── followers: 1250
├── following: 89
├── eventosCount: 15
├── totalLikes: 5432
└── createdAt: timestamp
```

### Followers (Público)
```
/followers/{userId}/followers/{followerId}
├── followerId: "uid_xyz"
├── followerName: "Maria"
├── followerPhoto: "https://..."
└── createdAt: timestamp

/followers/{userId}/following/{targetId}
├── targetUserId: "uid_abc"
├── targetName: "João"
├── targetPhoto: "https://..."
└── createdAt: timestamp
```

### Chats (Privado)
```
/chats/{chatId}
├── chatId: "uid1_uid2"
├── participants: ["uid1", "uid2"]
├── participantNames: ["Ana", "Bruno"]
├── participantPhotos: ["https://...", "https://..."]
├── createdAt: timestamp
├── lastMessage: "Tudo bem?"
├── lastMessageTime: timestamp
└── unreadCount: {uid1: 0, uid2: 2}

/chats/{chatId}/messages/{msgId}
├── senderId: "uid1"
├── senderName: "Ana"
├── senderPhoto: "https://..."
├── text: "Olá! Como vai?"
├── createdAt: timestamp
└── read: true
```

### Notifications (Privado)
```
/notifications/{notificationId}
├── fromUserId: "uid_a"
├── fromUserName: "João"
├── fromUserPhoto: "https://..."
├── toUserId: "uid_b"
├── type: "follow" | "like" | "comment" | "message"
├── createdAt: timestamp
└── read: false
```

---

## Índices Firestore Recomendados

```
Collection: followers
├── {userId}/followers
│   └── createdAt (desc) - para listar recentes
└── {userId}/following
    └── createdAt (desc)

Collection: chats
├── participants (array) + lastMessageTime (desc)
└── Compound index: participants, createdAt

Collection: notifications
├── toUserId + read + createdAt (desc)
└── Compound index: toUserId, read, createdAt
```

---

## Permissões Firestore (Security Rules)

```javascript
// Públicos
match /users/{userId} {
  allow read: if true;
  allow write: if request.auth.uid == userId;
}

// Seguidores públicos
match /followers/{userId}/{document=**} {
  allow read: if true;
  allow write: if request.auth.uid == userId;
}

// Chats privados
match /chats/{chatId} {
  allow read: if request.auth.uid in resource.data.participants;
  allow write: if request.auth.uid in resource.data.participants;
}

match /chats/{chatId}/messages/{msgId} {
  allow read: if request.auth.uid in 
    get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
  allow create: if request.auth.uid == request.resource.data.senderId;
  allow update, delete: if request.auth.uid == resource.data.senderId;
}

// Notificações privadas
match /notifications/{notificationId} {
  allow read: if request.auth.uid == resource.data.toUserId;
  allow create: if request.auth.uid == request.resource.data.fromUserId;
}
```

---

## Performance & Otimização

### Lazy Loading
```javascript
// Carregar eventos em chunks
const [pageIndex, setPageIndex] = useState(0);
const events = await getCreatorEvents(userId, 20 * (pageIndex + 1));
```

### Real-time Updates
```javascript
// Listener ativo apenas na tela visível
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    setData(snapshot.docs);
  });

  return () => unsubscribe(); // Cleanup
}, []);
```

### Cache Local
```javascript
// AsyncStorage para cache de usuários recentes
import AsyncStorage from '@react-native-async-storage/async-storage';

const cachedUsers = await AsyncStorage.getItem('recentUsers');
```

---

## Próximas Fases

### Fase 1: Base Social ✅
- ✓ Sistema de seguidores
- ✓ Chat básico
- ✓ Perfil público

### Fase 2: Creator Tools
- [ ] Dashboard de métricas
- [ ] Linktree-like profile
- [ ] Sistema de verificação

### Fase 3: Integrações
- [ ] Spotify
- [ ] Instagram
- [ ] Facebook/Meta

### Fase 4: Avançado
- [ ] Recomendações ML
- [ ] Analytics avançado
- [ ] Monetização
- [ ] Stories/TikTok-like
