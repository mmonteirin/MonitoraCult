# 📱 FEED SOCIAL INSTAGRAM-LIKE - MonitoraCult

## 📋 Visão Geral

Implementação de um feed social semelhante ao Instagram com funcionalidades de:
- ✅ Timeline infinita de posts/eventos
- ✅ Likes e comentários em tempo real
- ✅ Compartilhamento entre usuários
- ✅ Stories (opcional Phase 2)
- ✅ Reels/vídeos (opcional Phase 2)
- ✅ Notificações de interações
- ✅ Seguir criadores
- ✅ Busca de posts/eventos
- ✅ Hashtags e trending topics

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────┐
│           TELAS (Screens)                        │
├──────────────────────────────────────────────────┤
│  TelaFeed.js          → Feed principal           │
│  PerfilPublico.js     → Perfil do criador       │
│  TelaComentarios.js   → Comentários detalhes   │
│  TelaBusca.js         → Buscar posts/users      │
│  CriarPost.js         → Criar novo post         │
└─────────┬──────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────┐
│        COMPONENTES (Components)                  │
├──────────────────────────────────────────────────┤
│  EventoCard.js        → Post individual         │
│  SecaoComentarios.js  → Seção de comentários   │
│  BotaoLike.js         → Like button             │
│  AvatarUsuario.js     → Avatar com info        │
│  SecaoCompartilhar.js → Opções compartilhar    │
└─────────┬──────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────┐
│        HOOKS (State Management)                  │
├──────────────────────────────────────────────────┤
│  useFollow.js         → Follow/unfollow         │
│  useComment.js        → Comentários (novo)      │
│  useLike.js           → Likes em tempo real     │
│  useFeed.js           → Feed timeline           │
└─────────┬──────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────┐
│         SERVIÇOS (Services)                      │
├──────────────────────────────────────────────────┤
│  feedService.js       → Posts/likes             │
│  commentService.js    → Comentários             │
│  followService.js     → Seguidores              │
│  notificationService.js → Notificações         │
└─────────┬──────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────┐
│      FIREBASE FIRESTORE (Dados)                 │
├──────────────────────────────────────────────────┤
│  posts/{postId}                                  │
│  posts/{postId}/comments/{commentId}            │
│  posts/{postId}/likes/{userId}                  │
│  followers/{userId}/following/{targetUserId}    │
│  followers/{userId}/followers/{followerId}      │
│  notifications/{notificationId}                 │
└──────────────────────────────────────────────────┘
```

---

## 📂 Estrutura de Dados - Firestore

### 1. Posts/Eventos
```
posts/{postId}
├── userId: string (criador)
├── userName: string
├── userPhoto: string
├── tituloEvento: string
├── descricao: string
├── imagemEvento: string
├── localEvento: string
├── dataEvento: string
├── horaInicio: string
├── categoria: string
├── hashtags: Array<string> ['#eventos', '#musica', '#cultura']
├── likes: number (contador)
├── comments: number (contador)
├── shares: number (contador)
├── views: number (contador)
├── ativo: boolean
├── createdAt: timestamp
├── updatedAt: timestamp
└── metadata: {
    latitude: number
    longitude: number
    capacidade: number
    ingressoDisponivel: boolean
}
```

### 2. Comentários
```
posts/{postId}/comments/{commentId}
├── userId: string
├── nome: string
├── foto: string
├── texto: string
├── likes: number
├── createdAt: timestamp
└── replies: Array<{comment}> (opcional - respostas)
```

### 3. Likes
```
posts/{postId}/likes/{userId}
├── userId: string
├── createdAt: timestamp
```

### 4. Seguidores
```
followers/{userId}/following/{targetUserId}
├── targetUserId: string
├── targetName: string
├── targetPhoto: string
├── createdAt: timestamp

followers/{userId}/followers/{followerId}
├── followerId: string
├── followerName: string
├── followerPhoto: string
├── createdAt: timestamp
```

### 5. Notificações
```
notifications/{notificationId}
├── fromUserId: string
├── fromUserName: string
├── fromUserPhoto: string
├── toUserId: string
├── type: 'like' | 'comment' | 'follow' | 'share' | 'mention'
├── postId: string (se aplicável)
├── mensagem: string
├── lido: boolean
├── createdAt: timestamp
```

---

## 🚀 Implementação - Phase 1

### 1. Melhorar TelaFeed.js (JÁ OTIMIZADO)

O `TelaFeed.js` já está otimizado com:
- ✅ Paginação
- ✅ Memoização
- ✅ Cleanup de listeners
- ✅ Virtual scrolling preparado

### 2. Criar Novo Hook - useComment

```javascript
// hooks/useComments.js
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  adicionarComentario as addComment,
  escutarComentarios
} from '../services/commentService';

export const useComments = (postId) => {
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!postId || !isMountedRef.current) return;

    setLoading(true);

    // Listener em tempo real
    const unsubscribe = escutarComentarios(postId, (comentarios) => {
      if (isMountedRef.current) {
        setComentarios(comentarios);
        setLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [postId]);

  const adicionarComentario = useCallback(
    async (user, texto) => {
      try {
        await addComment(postId, user, texto);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [postId]
  );

  return {
    comentarios,
    loading,
    adicionarComentario,
  };
};
```

### 3. Criar Hook - useLike

```javascript
// hooks/useLike.js
import { useState, useCallback } from 'react';
import { toggleEventoLike } from '../services/feedService';

export const useLike = (postId, usuarioId) => {
  const [gostei, setGostei] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    setLoading(true);

    try {
      const result = await toggleEventoLike(postId, usuarioId);
      setGostei(result);
    } catch (error) {
      console.error('Erro ao dar like:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, usuarioId]);

  return {
    gostei,
    toggle,
    loading,
  };
};
```

### 4. Componente - SecaoComentarios

```javascript
// components/SecaoComentarios.js
import React, { memo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useComments } from '../hooks/useComments';
import { Colors } from '../styles/Colors';

const CommentItem = memo(({ comment }) => (
  <View style={styles.comment}>
    <View style={styles.commentAvatar}>
      <Image
        source={{ uri: comment.foto || 'https://i.pravatar.cc/150' }}
        style={styles.avatar}
      />
    </View>

    <View style={styles.commentContent}>
      <Text style={styles.commentUser}>{comment.nome}</Text>
      <Text style={styles.commentText}>{comment.texto}</Text>

      <View style={styles.commentFooter}>
        <Text style={styles.commentTime}>agora</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons
            name="heart-outline"
            size={14}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  </View>
));

const SecaoComentarios = ({ postId }) => {
  const { user, profile } = useAuth();
  const { comentarios, adicionarComentario, loading } = useComments(postId);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async () => {
    if (!novoComentario.trim() || !user) return;

    setEnviando(true);

    const result = await adicionarComentario(
      { uid: user.uid, displayName: profile?.nome },
      novoComentario
    );

    if (result.success) {
      setNovoComentario('');
    }

    setEnviando(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comentários ({comentarios.length})</Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <FlatList
          data={comentarios}
          renderItem={({ item }) => <CommentItem comment={item} />}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.empty}>Sem comentários ainda. Seja o primeiro!</Text>
          }
        />
      )}

      {/* INPUT */}
      {user && (
        <View style={styles.input}>
          <Image
            source={{ uri: profile?.foto || 'https://i.pravatar.cc/150' }}
            style={styles.inputAvatar}
          />

          <TextInput
            style={styles.inputText}
            placeholder="Adicionar comentário..."
            placeholderTextColor={Colors.textMuted}
            value={novoComentario}
            onChangeText={setNovoComentario}
            multiline
            maxLength={300}
          />

          <TouchableOpacity
            onPress={handleEnviar}
            disabled={enviando || !novoComentario.trim()}
          >
            {enviando ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={
                  novoComentario.trim() ? Colors.primary : Colors.textMuted
                }
              />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: 16,
    marginVertical: 16,
    borderRadius: 12,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  comment: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  commentAvatar: {
    marginRight: 10,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  commentContent: {
    flex: 1,
  },

  commentUser: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  commentText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 2,
  },

  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },

  commentTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  empty: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  inputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  inputText: {
    flex: 1,
    backgroundColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textPrimary,
    maxHeight: 60,
  },
});

export default SecaoComentarios;
```

---

## 🎯 Recursos Adicionais

### Hashtags
```javascript
// Parse hashtags do post
const extrairHashtags = (texto) => {
  const regex = /#(\w+)/g;
  return [...texto.matchAll(regex)].map(m => m[1]);
};

// Usado em:
const hashtags = extrairHashtags(descricao);
await adicionarPost({ ...post, hashtags });
```

### Trending Topics (Phase 2)
```javascript
// services/trendingService.js
export const getTrendingTopics = async () => {
  const ref = collection(db, 'posts');
  const posts = await getDocs(ref);
  
  const hashtagCount = {};
  posts.forEach(doc => {
    doc.data().hashtags?.forEach(tag => {
      hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
    });
  });
  
  return Object.entries(hashtagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
};
```

### Mentions
```javascript
// Mencionar @usuario
const texto = "Confira o evento com @joao #musica";

// Parse mentions
const extrairMencoes = (texto) => {
  const regex = /@(\w+)/g;
  return [...texto.matchAll(regex)].map(m => m[1]);
};

// Notificar mencionados
const mencoes = extrairMencoes(texto);
mencoes.forEach(async (user) => {
  await criarNotificacao({
    type: 'mention',
    toUser: user,
    fromUser: currentUserId,
    postId: postId
  });
});
```

---

## 📊 Funções Principais do Feed

```javascript
// Criar post
await criarPost({
  userId,
  titulo,
  descricao,
  imagem,
  categoria,
  local,
  data,
  hashtags: ['#musica', '#cultura']
});

// Dar like
await toggleEventoLike(postId, usuarioId);

// Comentar
await adicionarComentario(postId, { userId, texto });

// Seguir usuário
await followUser(targetUserId, userData);

// Buscar posts
const resultados = await buscarPosts(
  query,
  filtros: { categoria, hashtag, local, usuario }
);
```

---

## 🧪 Fluxo do Usuário

1. **Abrir Feed** → Vê timeline de eventos/posts
2. **Scroll Infinito** → Carrega mais posts automaticamente
3. **Ver Post** → Clica para expandir e comentar
4. **Dar Like** → Ícone ❤️ se destaca
5. **Comentar** → Digita comentário e envia
6. **Ver Perfil** → Clica no avatar do criador
7. **Seguir** → Botão "Seguir" aparece
8. **Compartilhar** → Share para redes sociais
9. **Buscar** → Procura posts/usuários/hashtags
10. **Criar Post** → Faz novo evento/post

---

## 🔔 Notificações

Usuário recebe notificação quando:
- ❤️ Alguém curte seu post
- 💬 Alguém comenta seu post
- 👤 Alguém te segue
- 🔔 @menciona você
- ↩️ Alguém responde seu comentário

```javascript
// Em cada ação, criar notificação:
await criarNotificacao({
  fromUserId,
  toUserId,
  type: 'like' | 'comment' | 'follow' | 'mention',
  postId,
  mensagem: `${userName} curtiu seu post`,
  lido: false,
  createdAt: serverTimestamp()
});
```

---

## 🔐 Firestore Rules

```javascript
// Posts - Público para ler, criar quando autenticado
match /posts/{postId} {
  allow read: if true;
  allow create: if request.auth.uid != null;
  allow update, delete: if request.auth.uid == resource.data.userId;
  
  match /comments/{commentId} {
    allow read: if true;
    allow create: if request.auth.uid != null;
    allow delete: if request.auth.uid == resource.data.userId;
  }
  
  match /likes/{userId} {
    allow read: if true;
    allow create, delete: if request.auth.uid == userId;
  }
}
```

---

## 🚀 Phase 2 (Futuro)

- [ ] Stories (desaparecem em 24h)
- [ ] Reels/Vídeos
- [ ] Live streaming
- [ ] Direct Messages (DM)
- [ ] Polls em posts
- [ ] Filtros de câmera
- [ ] Efeitos de foto
- [ ] Stickers
- [ ] Stories com múltiplos segmentos
- [ ] Analytics para criadores

---

## 📞 Suporte

Arquivos principais:
- Serviço: `services/feedService.js`, `services/commentService.js`
- Componentes: `components/EventoCard.js`, `components/SecaoComentarios.js`
- Hooks: `hooks/useFollow.js`, `hooks/useComments.js`, `hooks/useLike.js`
- Telas: `screens/TelaFeed.js`, `screens/CriarPost.js`

---

**Status:** ✅ Phase 1 Pronta  
**Próximas Etapas:** Stories, Reels, Live  
**Última Atualização:** 18 de Maio, 2026
