# Guia de Integração - Área de Comunidade

## 📋 Visão Geral

A Área de Comunidade foi implementada como um novo módulo completo no MonitoraCult, com suporte a:
- **Grupos por Gênero**: Agrupamentos de usuários por categorias culturais
- **Fórum de Debate**: Discussões dentro de grupos com tópicos e respostas
- **Criadores em Destaque**: Showcase de criadores culturais com estatísticas
- **Notícias do Grupo**: Publicação e leitura de notícias comunitárias

## 🏗️ Arquitetura Implementada

### Serviços (Firebase)
**`services/communityService.js`** - Operações com Firestore:
```javascript
// Grupos
- createCommunityGroup()
- getCommunityGroups()
- getGroupDetails()
- joinGroup() / leaveGroup()

// Fórum
- createForumThread()
- getForumThreads()
- addForumReply()
- getForumReplies()

// Criadores em Destaque
- createHighlightedCreator()
- getHighlightedCreators()
- incrementCreatorViews()

// Notícias
- createCommunityNews()
- getCommunityNews()
- likeNews()
- incrementNewsViews()
```

### Hook Customizado
**`hooks/useCommunity.js`** - Gerenciamento de estado com otimizações:
```javascript
const {
  groups,
  forumThreads,
  highlightedCreators,
  communityNews,
  loading,
  error,
  loadGroups,
  handleJoinGroup,
  handleLeaveGroup,
  loadForumThreads,
  handleCreateForumThread,
  loadHighlightedCreators,
  handleViewCreator,
  loadCommunityNews,
  handleLikeNews,
  handleViewNews,
} = useCommunity();
```

### Componentes Criados

1. **CommunityGroupCard.js**
   - Card de grupo com gênero, membros e opções de entrada/saída
   - Gradient visual com suporte a imagens

2. **ForumThread.js**
   - Exibição de tópicos do fórum
   - Contador de respostas e curtidas
   - Botão de resposta rápida

3. **CreatorHighlight.js**
   - Card destacado do criador com estatísticas
   - Visualizações e seguidores
   - Botão de seguir

4. **CommunityNews.js**
   - Card de notícia com imagem, título e excerpt
   - Sistema de curtidas
   - Contador de visualizações

### Telas Implementadas

1. **TelaComunidade.js** - Tela principal
   - 3 abas: Grupos, Criadores, Notícias
   - Filtro por gênero para grupos
   - Pull-to-refresh

2. **ComunidadeGrupoDetalhes.js**
   - Detalhes do grupo com informações
   - Listagem de tópicos do fórum
   - FAB (Floating Action Button) para criar novo tópico
   - Modal para criar novo tópico

3. **ComunidadeForumDetalhes.js**
   - Exibição de respostas do fórum
   - Input para adicionar novas respostas
   - Formatação de datas relativas

4. **ComunidadeCriadorDetalhes.js**
   - Perfil completo do criador
   - Portfolio em grid
   - Obras recentes com navegação

5. **ComunidadeNoticiaDetalhes.js**
   - Artigo completo da notícia
   - Sistema de likes e compartilhamento
   - Notícias relacionadas
   - Metadata do autor e data

### Stack de Navegação
**`navigation/ComunidadeStack.js`** - Gerencia navegação interna da comunidade

## 🔧 Configuração do Firebase

A estrutura no Firestore deve ser:

```
communityGroups/
├── {groupId}/
│   ├── name: string
│   ├── genre: string
│   ├── description: string
│   ├── image: string (URL)
│   ├── members: array (userIds)
│   ├── membersCount: number
│   ├── createdAt: timestamp
│   └── forum/
│       └── {threadId}/
│           ├── title: string
│           ├── description: string
│           ├── authorId: string
│           ├── repliesCount: number
│           ├── likesCount: number
│           ├── createdAt: timestamp
│           └── replies/
│               └── {replyId}/
│                   ├── content: string
│                   ├── authorId: string
│                   └── createdAt: timestamp
│   └── news/
│       └── {newsId}/
│           ├── title: string
│           ├── excerpt: string
│           ├── content: string
│           ├── image: string (URL)
│           ├── authorId: string
│           ├── viewsCount: number
│           ├── likesCount: number
│           └── createdAt: timestamp

highlightedCreators/
└── {creatorId}/
    ├── name: string
    ├── genre: string
    ├── description: string
    ├── profileImage: string (URL)
    ├── viewsCount: number
    ├── followersCount: number
    └── createdAt: timestamp
```

## 📱 Uso no App

### Para o Usuário Final

1. **Explorar Grupos**:
   - Acesse a aba "Comunidade" no menu inferior
   - Filtre grupos por gênero cultural
   - Clique em um grupo para ver mais detalhes
   - Use "Entrar" para se juntar ao grupo

2. **Participar do Fórum**:
   - Entre em um grupo
   - Veja os tópicos de discussão
   - Clique em um tópico para responder
   - Use o botão "+" para criar novo tópico

3. **Descobrir Criadores**:
   - Acesse a aba "Criadores"
   - Veja criadores em destaque com estatísticas
   - Clique para ver seu portfólio completo
   - Use "Seguir" para acompanhar

4. **Ler Notícias**:
   - Acesse a aba "Notícias"
   - Leia notícias da comunidade
   - Curta e compartilhe conteúdo interessante
   - Salve para leitura posterior

### Para Administradores

Você pode criar e gerenciar conteúdo através do Firebase Console:

1. **Criar um novo grupo**:
```javascript
await createCommunityGroup({
  name: "Música Brasileira",
  genre: "Música",
  description: "Grupo dedicado à música brasileira",
  image: "https://example.com/image.jpg"
});
```

2. **Adicionar criador em destaque**:
```javascript
await createHighlightedCreator({
  name: "João Silva",
  genre: "Música",
  description: "Compositor e produtor musical",
  profileImage: "https://example.com/profile.jpg",
  followersCount: 1500
});
```

3. **Publicar notícia**:
```javascript
await createCommunityNews(groupId, {
  title: "Nova Exposição",
  excerpt: "Conheça a nova exposição de arte...",
  content: "Conteúdo completo da notícia...",
  image: "https://example.com/news.jpg"
});
```

## 🎨 Paleta de Cores Utilizada

Todos os componentes seguem a paleta do app:
- **Primary**: #6C5CE7 (Roxo)
- **Background**: #0F0F14 (Preto)
- **Surface**: #1B1D26
- **Text Primary**: #FFFFFF
- **Text Secondary**: #B2B5C3
- **Success**: #22C55E (Verde)
- **Error**: #EF4444 (Vermelho)

## 🚀 Próximas Melhorias Sugeridas

1. **Paginação**: Implementar carregamento "infinito" para listas
2. **Filtros avançados**: Busca por tags, ordenação por relevância
3. **Notificações**: Push notifications para novos tópicos/notícias
4. **Moderação**: Sistema de reporte e moderação de conteúdo
5. **Recomendações**: Algoritmo de sugestão de grupos baseado em interesses
6. **Eventos**: Integração com sistema de eventos
7. **Analytics**: Dashboard de estatísticas de comunidade
8. **Integração Social**: Compartilhamento em redes sociais

## 📝 Notas Técnicas

- ✅ Otimização de memória com `useRef` e `isMountedRef`
- ✅ Cleanup automático ao desmontar componentes
- ✅ Tratamento de erros com try/catch
- ✅ Loading states em todas as operações
- ✅ Formatação de datas relativas
- ✅ Suporte a refresh manual (pull-to-refresh)
- ✅ Design responsivo para todos os dispositivos

## 🐛 Troubleshooting

### Dados não aparecem
- Verifique as permissões do Firebase
- Certifique-se de que os dados foram criados corretamente
- Verifique a estrutura no Firestore

### Erros de performance
- Implemente paginação para listas grandes
- Reduza o número de listeners do Firestore
- Use cache quando possível

### Problemas de navegação
- Verifique se todas as telas estão registradas no `ComunidadeStack.js`
- Confirme os nomes das rotas
- Teste a navegação com o React Navigation DevTools

---

**Data**: 18 de maio de 2026
**Versão**: 1.0.0
