# 🗺️ MonitoraCult Navigation Structure & Social Feed Analysis

**Date:** May 24, 2026  
**Project:** MonitoraCult React Native  
**Status:** Full exploration complete

---

## 📊 EXECUTIVE SUMMARY

MonitoraCult has a **well-structured navigation system** built on React Navigation with:
- ✅ **6 main content tabs** (Home, Search, Feed, Events, Community, Profile)
- ✅ **Complete social feature backend** (likes, comments, follows, stories, DMs, notifications)
- ❌ **CRITICAL GAP: Messaging not integrated into main navigation**
- ❌ **Missing navigation connections** between social features and screens

---

## 1️⃣ CURRENT NAVIGATION STRUCTURE

### Navigation Hierarchy

```
AppNavigator.js (Root)
├── Auth: AuthNavigator
└── Main: MainNavigator
    └── DrawerNavigator
        └── TabNavigator (6 tabs)
            ├── HomeStack (Inicio)
            ├── BuscaStack (Busca)
            ├── FeedStack (Feed)
            ├── EventoStack (Eventos)
            ├── ComunidadeStack (Comunidade)
            └── PerfilStack (Conta)

        + Drawer Items:
            ├── HomeTabs (TabNavigator)
            ├── Perfil (PerfilStack)
            ├── LocaisVisitados
            ├── PainelCidade (hidden)
            ├── MapaVivo (hidden)
            ├── Suporte
            └── Admin (if isAdmin)
```

### Tab Navigator - 6 Main Tabs

| Tab | Component | Icon | Purpose |
|-----|-----------|------|---------|
| **Inicio** | HomeStack | home-variant | Discover events, recommendations |
| **Busca** | BuscaStack | magnify | Search events & content |
| **Feed** | FeedStack | compass | Social feed (events + posts) |
| **Eventos** | EventoStack | calendar-star | Event hub & calendar |
| **Comunidade** | ComunidadeStack | account-group | Groups, creators, news |
| **Conta** | PerfilStack | account-circle | User profile & settings |

---

## 2️⃣ SCREEN ORGANIZATION & STACKS

### HomeStack
```
TelaInicio (Home screen with recommendations)
├── EventoDetalhes
├── PerfilPublico
├── AgendaEventos
├── TelaIngressos
├── EventosApp
├── TelaExploreCidade
└── NovaOcorrencia
```

### FeedStack
```
TelaFeed (Main social feed)
├── EventoDetalhes
├── TelaIngressos
├── PerfilPublico
├── AgendaEventos
├── CriarPost
├── NovaOcorrencia
└── EventosApp
```

### EventoStack
```
EventoHome (Event hub)
├── EventosApp
├── EventosPublicos
├── EventoDetalhes
├── Avaliacao
├── TelaCulturaViva
├── TelaExploreCidade
├── TelaMapaVivo
├── MapaVivoEventoDetalhes
├── MapaVivoCheckIn
├── EventoIngresso
├── TelaIngressos
└── NovaOcorrencia
```

### ComunidadeStack
```
TelaComunidade (Community hub - groups, creators, news)
├── ComunidadeGrupoDetalhes
├── ComunidadeForumDetalhes
├── ComunidadeCriadorDetalhes
└── ComunidadeNoticiaDetalhes
```

### PerfilStack
```
TelaPerfil (User profile)
├── PerfilEditar
├── PerfilPublico
├── AgendaEventos
├── LocaisVisitados
├── Cadastro
├── ResetPassword
├── Ocorrencias
├── NovaOcorrencia
└── EventoDetalhes
```

### BuscaStack
```
TelaBusca (Search)
├── EventoDetalhes
├── TelaIngressos
├── PerfilPublico
├── AgendaEventos
└── NovaOcorrencia
```

---

## 3️⃣ SOCIAL FEED IMPLEMENTATION

### TelaFeed.js - Primary Social Screen

**Current Features:**
```javascript
✅ Feed of events/posts with:
  - Event card display with images
  - Like button (animated heart)
  - Comment section (SecaoComentarios)
  - Share button (native Share API)
  - Notification toggle
  - Event details modal
  
✅ Real-time updates via Firebase listeners
✅ Infinite scroll with pagination (PAGE_SIZE = 10)
✅ Animated list entries (FadeInUp)
✅ Event subscription/unsubscription
```

### TelaInicio.js - Home with AI Recommendations

**Sections:**
1. Hero section with greeting
2. Story bar (upcoming)
3. Category pills (filter)
4. Trending carousel
5. Live map card
6. Nearby section (by distance)
7. Recommendation section (AI-powered)
8. Cultural AI insights
9. Explore city section

### TelaComunidade.js - Community Hub

**Features:**
- Community group exploration & search
- Creator highlights with followers count
- News/updates from community
- Join/leave groups
- Create new groups
- Filter by genre (Música, Dança, Teatro, etc.)

---

## 4️⃣ EXISTING SOCIAL FEATURES

### ✅ Feature: Likes
**Files:**
- `services/feedService.js` - `toggleFeedLike()`
- `hooks/useLike.js` - Like state management
- `components/TelaFeed.js` - LikeButton component

**Usage:**
```javascript
const [isLiked, setIsLiked] = useState(false);
const toggleLike = async () => {
  await toggleFeedLike(itemId, itemType, usuarioId);
};
```

**Firestore Structure:**
```
posts/{postId}
├── likes: number
└── (in likes collection: likes/{type}_{id}_{userId})

eventos/{eventoId}
├── likes: number
```

---

### ✅ Feature: Comments
**Files:**
- `services/commentService.js`
- `hooks/useComments.js`
- `components/SecaoComentarios.js`

**Usage:**
```javascript
const { comentarios, adicionarComentario } = useComments(postId);
```

**Firestore Structure:**
```
posts/{postId}/comments
├── userId
├── nome
├── texto
├── createdAt
└── foto
```

---

### ✅ Feature: Follows
**Files:**
- `services/followService.js`
- `hooks/useFollow.js`
- `components/FollowButton.js`

**Usage:**
```javascript
const { isFollowingUser, toggleFollow } = useFollow(targetUserId, targetUserData);
```

**Firestore Structure:**
```
followers/{userId}/followers/{followerId}
├── followerId
├── followerName
├── followerPhoto
└── createdAt

followers/{userId}/following/{targetUserId}
├── targetUserId
├── targetName
├── targetPhoto
└── createdAt

users/{userId}
├── followers: number
└── following: number
```

---

### ✅ Feature: Stories
**Files:**
- `services/storiesService.js`
- `hooks/useStories.js`
- `components/StoryBar.js`
- `components/StoryViewer.js`
- `screens/StoryCriador.js`

**Features:**
- 24-hour expiration
- Real-time listener for following's stories
- Story creation with image + text
- Story reactions
- View tracking

**Firestore Structure:**
```
stories/{storyId}
├── userId
├── userName
├── userPhoto
├── imagemUri
├── textoStory
├── createdAt
├── expiresAt
├── views: [userId, ...]
└── reactions: [...]
```

---

### ✅ Feature: Direct Messages / Chat
**Files:**
- `services/dmService.js`
- `hooks/useDirectMessages.js`
- `screens/TelaConversas.js` ⚠️ **NOT NAVIGABLE**
- `screens/TelaMensagens.js` ⚠️ **NOT NAVIGABLE**
- `components/ChatViewer.js`
- `components/ListaConversas.js`

**Features:**
- Real-time messaging
- Conversation list
- Message editing/deletion
- Unread tracking
- Avatar-based user identification

**Firestore Structure:**
```
conversations/{conversaId}
├── participants: [uid1, uid2]
├── participantNames: [name1, name2]
├── lastMessage: string
├── lastMessageTime: timestamp
└── unreadCount: {uid1: number, uid2: number}

conversations/{conversaId}/messages/{msgId}
├── senderId
├── senderName
├── senderPhoto
├── text
├── createdAt
└── read: boolean
```

---

### ✅ Feature: Notifications
**Files:**
- `context/NotificationContext.js`
- `services/notificationService.js`
- `screens/TelaNotificacoes.js` ⚠️ **PARTIALLY INTEGRATED**
- `components/NotificationBell.js` ✅

**Notification Types:**
```javascript
EVENTO_NOVO
EVENTO_LEMBRETE
EVENTO_CANCELADO
EVENTO_ALTERADO
LIKE
COMENTARIO
FOLLOW
MENSAGEM
COMUNIDADE
```

**Status:**
- ✅ NotificationBell shows in headers
- ✅ TelaNotificacoes.js exists
- ❌ No notification tab in TabNavigator
- ❌ No explicit navigation route for notifications

---

## 5️⃣ NAVIGATION PATTERNS FOR SOCIAL FEATURES

### ✅ Pattern 1: View Public Profile
**Current Flow:**
```
Any Feed/Post → PerfilPublico Screen → Shows:
  - Profile info (name, photo, bio)
  - Follower/Following counts
  - Attended events list
  - Follow button
  - Creator stats
```

**Navigation Call:**
```javascript
navigation.navigate('PerfilPublico', {
  userId: targetUserId,
  usuario: { uid, nome, displayName, foto, photoURL }
})
```

### ✅ Pattern 2: Like & Comment on Feed
**Current Flow:**
```
TelaFeed.js
├── Like button → toggleLike() → Real-time update
├── Comment section → SecaoComentarios → Add comment
└── Share button → Native Share API
```

### ✅ Pattern 3: View Followers/Following
**Current Implementation:**
```
PerfilPublico.js
├── Carrega list of followers
├── Carrega list of following
├── Shows SeguindoList component
└── Can navigate to nested PerfilPublico (recursive)
```

### ✅ Pattern 4: View Community Details
**Current Flow:**
```
TelaComunidade
└── Click group → ComunidadeGrupoDetalhes → Shows:
    - Group info
    - Member list
    - Forum threads
    - Creator info
    - News
```

---

## 6️⃣ MISSING NAVIGATION CONNECTIONS ⚠️

### 🔴 CRITICAL: No Messaging Navigation

**Problem:**
- `TelaConversas.js` (chat list) exists but NOT accessible
- `TelaMensagens.js` (individual chat) exists but NOT accessible
- No `MessagingStack` defined
- No route in `TabNavigator` or `DrawerNavigator`

**Current Status:**
```
TelaConversas.js (💬 List of conversations)
  ❌ Not in any navigation stack
  ❌ Can't be navigated to
  ❌ Services work but UI unreachable

TelaMensagens.js (💬 Individual conversation)
  ❌ Depends on TelaConversas
  ❌ Can't be reached
```

**Impact:**
- Users cannot access DM/chat features at all
- Full messaging service is dead code
- No way to start conversations with creators/users

---

### 🟡 INCOMPLETE: Notifications Integration

**Problem:**
- `TelaNotificacoes.js` exists with full UI
- No dedicated tab or easy navigation route
- NotificationBell exists in headers but no default onPress handler
- Missing integration in drawer or bottom tabs

**Current Status:**
```
TelaNotificacoes.js (🔔 Notification inbox)
  ⚠️ UI built but not easily accessible
  ⚠️ Notification types all defined
  ⚠️ Missing proper navigation route
  ⚠️ NotificationBell needs wired navigation
```

---

### 🟡 MISSING: Creator/Influencer Dashboard

**Problem:**
- No dedicated creator analytics dashboard
- PerfilPublico shows stats but limited
- No creator-specific navigation

**Missing Screens:**
```
DashboardCreador.js (not implemented)
  - Creator analytics
  - Event performance metrics
  - Follower growth charts
  - Engagement analytics
```

---

### 🟡 MISSING: User Search / Discovery

**Problem:**
- No dedicated "search users" screen
- Can search events/content but not profiles
- No way to browse creators/influencers

**Missing Screens:**
```
TelaBuscaUsuarios.js (not implemented)
  - Search users by name
  - Browse featured creators
  - Trending creators list
  - Explore section for new users
```

---

### 🟡 INCOMPLETE: Stories Integration

**Problem:**
- `useStories.js` hook exists
- `StoryBar.js` component exists
- But not fully integrated in main screens
- Story bar in TelaInicio but not in feed

**Status:**
```
StoryBar.js
  ✅ Component built
  ⚠️ Only in TelaInicio
  ❌ Should be in Feed, Community, etc.

StoryCriador.js
  ✅ Screen exists
  ❌ No clear navigation to it
```

---

## 7️⃣ COMPONENT INVENTORY FOR SOCIAL INTERACTIONS

### UI Components Built

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| FollowButton | components/FollowButton.js | Follow/Unfollow action | ✅ Complete |
| VerifiedBadge | components/VerifiedBadge.js | Verified creator badge | ✅ Complete |
| CreatorStats | components/CreatorStats.js | Creator metrics display | ✅ Complete |
| CreatorHighlight | components/CreatorHighlight.js | Featured creator card | ✅ Complete |
| CommunityNews | components/CommunityNews.js | News item with likes | ✅ Complete |
| ChatViewer | components/ChatViewer.js | Chat message display | ✅ Complete |
| ListaConversas | components/ListaConversas.js | Conversation list | ✅ Complete |
| SecaoComentarios | components/SecaoComentarios.js | Comments section | ✅ Complete |
| NotificationBell | components/NotificationBell.js | Notification bell icon | ✅ Complete |
| DrawerAvatar | components/DrawerAvatar.js | User avatar in drawer | ✅ Complete |
| SeguidoresCard | components/SeguidoresCard.js | Follower/Following list | ✅ Complete |

---

## 8️⃣ SERVICES & HOOKS SUMMARY

### Services Layer (Firestore Integration)

| Service | File | Functions | Status |
|---------|------|-----------|--------|
| feedService | services/feedService.js | criarPost, toggleFeedLike, adicionarFeedComentario | ✅ Complete |
| commentService | services/commentService.js | adicionarComentario, escutarComentarios | ✅ Complete |
| followService | services/followService.js | followUser, unfollowUser, isFollowing | ✅ Complete |
| storiesService | services/storiesService.js | criarStory, obterStories, marcarComoVisto | ✅ Complete |
| dmService | services/dmService.js | enviarMensagem, obterConversas | ✅ Complete |
| chatService | services/chatService.js | createChat, sendMessage, getMessages | ✅ Complete |
| notificationService | services/notificationService.js | getNotifications, markAsRead | ✅ Complete |
| profileService | services/profileService.js | getPublicProfile, getFollowers | ✅ Complete |

### Custom Hooks

| Hook | File | Purpose | Status |
|------|------|---------|--------|
| useComments | hooks/useComments.js | Comment CRUD | ✅ Complete |
| useLike | hooks/useLike.js | Like toggle | ✅ Complete |
| useFollow | hooks/useFollow.js | Follow state | ✅ Complete |
| useStories | hooks/useStories.js | Story management | ✅ Complete |
| useDirectMessages | hooks/useDirectMessages.js | DM/Chat state | ✅ Complete |
| useCommunity | hooks/useCommunity.js | Community data | ✅ Complete |
| useBuscaGlobal | hooks/useBuscaGlobal.js | Global search | ✅ Complete |

---

## 9️⃣ COMPARISON: CURRENT vs INSTAGRAM-LIKE

### What's Implemented ✅

```
INSTAGRAM FEATURE          STATUS     NOTES
─────────────────────────────────────────────
Feed/Timeline             ✅ DONE    TelaFeed.js complete
Like posts                ✅ DONE    feedService + useLike
Comment on posts          ✅ DONE    commentService
Share posts               ✅ DONE    Native Share API
Stories                   ✅ DONE    useStories + components
Follow users              ✅ DONE    useFollow + service
View public profiles      ✅ DONE    PerfilPublico
DM/Messaging              ✅ DONE    Services but NO NAV ⚠️
Notifications             ✅ DONE    Full UI but incomplete ⚠️
Creator highlights        ✅ DONE    TelaComunidade
Creator stats             ✅ DONE    CreatorStats component
```

### What's Missing ❌

```
INSTAGRAM FEATURE          STATUS     IMPACT
──────────────────────────────────────────────
Message navigation        ❌ MISSING CRITICAL
User search               ❌ MISSING Medium
Creator dashboard         ❌ MISSING Low
Direct messaging tab      ❌ MISSING CRITICAL
Notification tab          ❌ MISSING Medium
Story highlights          ❌ MISSING Low
Reels/Video             ❌ MISSING Low
```

---

## 🔟 ROUTES DEFINED IN CODEBASE

From `navigation/routes.js`:
```javascript
export const ROUTES = {
  HOME: "Inicio",
  FEED: "Feed",
  PERFIL: "Perfil",
};
```

**Status:** Minimal route definitions - most navigation done via direct stack references.

---

## 1️⃣1️⃣ ARCHITECTURE NOTES

### Navigation Strengths
1. ✅ Drawer + Tab combination for main sections
2. ✅ Stack navigators for deep linking
3. ✅ Proper auth flow separation
4. ✅ Admin routes conditional
5. ✅ Smooth transitions between sections

### Navigation Weaknesses
1. ❌ No named routes file (hard to maintain)
2. ❌ Missing messaging navigation entirely
3. ❌ No notification tab despite full implementation
4. ❌ No deep linking strategy defined
5. ❌ Hard-coded navigation strings scattered across files

### Social Backend Strengths
1. ✅ Real-time Firestore listeners
2. ✅ Proper transaction handling for consistency
3. ✅ Batch operations for efficiency
4. ✅ Complete social service layer
5. ✅ Custom hooks for state management

### Social Backend Weaknesses
1. ❌ No pagination for large datasets (likes, comments)
2. ❌ Limited search capabilities
3. ❌ No blocking/muting system
4. ❌ No spam/abuse reporting
5. ❌ Limited privacy controls

---

## 1️⃣2️⃣ IMMEDIATE ACTION ITEMS

### Priority 1 - CRITICAL (Enable Messaging)

```javascript
// 1. Create MessagingStack.js
// 2. Add to DrawerNavigator or TabNavigator
// 3. Wire NotificationBell.onPress to navigate
// 4. Create messaging icon in tab navigator
```

### Priority 2 - HIGH (Complete Notifications)

```javascript
// 1. Add TelaNotificacoes to drawer or bottom tab
// 2. Wire NotificationBell to notifications screen
// 3. Implement notification deep linking
```

### Priority 3 - MEDIUM (Enhance Discovery)

```javascript
// 1. Create TelaBuscaUsuarios.js
// 2. Integrate user search into BuscaStack
// 3. Add creator discovery section
```

### Priority 4 - LOW (Polish)

```javascript
// 1. Create DashboardCreador.js
// 2. Implement creator analytics
// 3. Add story highlights support
```

---

## 1️⃣3️⃣ FILE PATHS REFERENCE

### Key Navigation Files
- `navigation/AppNavigator.js` - Root navigator
- `navigation/MainNavigator.js` - Main layout
- `navigation/DrawerNavigator.js` - Drawer menu (78% width)
- `navigation/TabNavigator.js` - Bottom tabs (6 tabs, glass morphism)
- `navigation/FeedStack.js` - Feed navigation
- `navigation/HomeStack.js` - Home navigation
- `navigation/ComunidadeStack.js` - Community navigation

### Key Screen Files
- `screens/TelaFeed.js` - Social feed (PRIMARY)
- `screens/TelaInicio.js` - Home recommendations
- `screens/TelaComunidade.js` - Community hub
- `screens/PerfilPublico.js` - User profiles
- `screens/TelaNotificacoes.js` - Notifications (MISSING NAV)
- `screens/TelaConversas.js` - Chat list (MISSING NAV)
- `screens/TelaMensagens.js` - Chat detail (MISSING NAV)

### Key Component Files
- `components/FollowButton.js`
- `components/CreatorHighlight.js`
- `components/ChatViewer.js`
- `components/SecaoComentarios.js`
- `components/NotificationBell.js`

### Key Service Files
- `services/feedService.js`
- `services/followService.js`
- `services/dmService.js`
- `services/storiesService.js`
- `services/notificationService.js`

### Key Hook Files
- `hooks/useLike.js`
- `hooks/useFollow.js`
- `hooks/useDirectMessages.js`
- `hooks/useStories.js`
- `hooks/useComments.js`

---

## 1️⃣4️⃣ CONCLUSION

**MonitoraCult has excellent social feature backends but incomplete navigation integration.**

### Summary Stats
- **Total Screens:** 50+ screens defined
- **Navigation Stacks:** 6 main stacks + drawer
- **Social Services:** 8 complete services
- **Social Hooks:** 6+ custom hooks
- **UI Components:** 11 social interaction components
- **Missing:** Messaging navigation, user search, notification access

### The Gap
The project has built **90% of the social features** but only **70% of the navigation** to access them. The most critical gap is **messaging/DM which is completely unreachable** despite having full backend implementation.

### Next Steps
1. **URGENT:** Add MessagingStack to enable DM access
2. **URGENT:** Add notifications navigation
3. **HIGH:** Implement user search
4. **MEDIUM:** Add creator dashboard
5. **LOW:** Polish story features

---

**End of Analysis**

Generated: May 24, 2026  
Analyzed by: GitHub Copilot
