# 🔔 Sistema de Notificações — MonitoraCult
## Guia de Integração Completo

---

## 📁 Arquivos entregues

| Arquivo | O que faz |
|---|---|
| `services/notificationService.js` | Toda lógica: token, permissão, local, push, Firestore |
| `context/NotificationContext.js` | Estado global: badge, histórico, listeners |
| `screens/TelaNotificacoes.js` | Tela inbox de notificações |
| `components/NotificationBell.js` | Sininho com badge animado para headers |
| `App.js` | Atualizado com `<NotificationProvider>` |
| `app.json` | Atualizado com plugin `expo-notifications` |

---

## 🚀 Passos de integração

### 1. Substituir os 2 arquivos raiz

Substitua `App.js` e `app.json` pelos arquivos entregues.

### 2. Adicionar a tela de notificações em algum navigator

No `PerfilStack.js` ou `MainNavigator.js`, adicione:

```js
import TelaNotificacoes from "../screens/TelaNotificacoes";

// Dentro do Stack.Navigator:
<Stack.Screen name="TelaNotificacoes" component={TelaNotificacoes} />
```

### 3. Adicionar o sininho nos headers

Exemplo no `TelaInicio.js` ou `TelaFeed.js`:

```js
import NotificationBell from "../components/NotificationBell";

// No JSX do header:
<NotificationBell onPress={() => navigation.navigate("TelaNotificacoes")} />
```

### 4. Adicionar o sininho no TabNavigator (opcional)

```js
import { useNotifications } from "../context/NotificationContext";

// Dentro de CustomTabIcon ou no TabBar:
const { naoLidas } = useNotifications();

// Exibir badge no ícone da aba de perfil, por exemplo
```

---

## 💡 Usar notificações no código existente

### Lembrete automático ao usuário se inscrever num evento

No `subscribedEventsService.js`, depois de salvar a inscrição:

```js
import { agendarLembretesEvento, criarNotificacaoFirestore, NOTIFICATION_TYPES } from "./notificationService";

// Após o setDoc da inscrição:
await agendarLembretesEvento(evento);
await criarNotificacaoFirestore(uid, {
  titulo: "✅ Inscrição confirmada!",
  corpo: `Você está inscrito em "${evento.tituloEvento}". Lembretes serão enviados.`,
  tipo: NOTIFICATION_TYPES.EVENTO_LEMBRETE,
  dados: { eventoId: evento.id },
});
```

### Notificar quando admin cria um evento

No `AdmCadastroEvento.js`, após criar o evento:

```js
import { notificarLocal, criarNotificacaoFirestore, NOTIFICATION_TYPES } from "../services/notificationService";

// Notificação local para o admin que criou:
await notificarLocal({
  titulo: "🎭 Evento publicado!",
  corpo: `"${titulo}" está ao vivo no MonitoraCult.`,
  dados: { tipo: NOTIFICATION_TYPES.EVENTO_NOVO, eventoId: docRef.id },
});
```

### Notificar like em post

No `feedService.js` ou `useLike.js`, após toggleLike:

```js
import { criarNotificacaoFirestore, NOTIFICATION_TYPES } from "./notificationService";

// Se o post não é do usuário atual:
if (post.userId !== userId) {
  await criarNotificacaoFirestore(post.userId, {
    titulo: "❤️ Alguém curtiu seu post",
    corpo: `Seu post recebeu uma nova curtida!`,
    tipo: NOTIFICATION_TYPES.LIKE,
    dados: { postId: eventoId },
  });
}
```

### Notificar nova mensagem direta

No `dmService.js`, ao enviar mensagem:

```js
import { criarNotificacaoFirestore, NOTIFICATION_TYPES } from "./notificationService";

await criarNotificacaoFirestore(destinatarioUid, {
  titulo: `💬 Nova mensagem de ${remetente.nome}`,
  corpo: texto.length > 60 ? texto.substring(0, 60) + "…" : texto,
  tipo: NOTIFICATION_TYPES.MENSAGEM,
  dados: { remetenteId: remetente.uid },
});
```

---

## 🔥 Estrutura no Firestore

```
users/
  {uid}/
    pushTokens/
      {tokenId}/
        token: "ExponentPushToken[...]"
        platform: "ios" | "android"
        ativo: true | false
        criadoEm: Timestamp

    notifications/
      {notifId}/
        titulo: string
        corpo: string
        tipo: string  (ver NOTIFICATION_TYPES)
        dados: object  (eventoId, groupId, etc.)
        lida: boolean
        criadoEm: Timestamp
```

---

## 📋 Tipos de notificação disponíveis

```js
NOTIFICATION_TYPES = {
  EVENTO_NOVO:       "evento_novo",
  EVENTO_LEMBRETE:   "evento_lembrete",
  EVENTO_CANCELADO:  "evento_cancelado",
  EVENTO_ALTERADO:   "evento_alterado",
  LIKE:              "like",
  COMENTARIO:        "comentario",
  FOLLOW:            "follow",
  MENSAGEM:          "mensagem",
  COMUNIDADE:        "comunidade",
  SISTEMA:           "sistema",
}
```

---

## ⚠️ Notas importantes

### Push Token vs Emulador
O Expo Push Token **só funciona em dispositivo físico**. Em simulador/emulador o token não é gerado, mas notificações locais (`notificarLocal`, `agendarNotificacao`) funcionam normalmente.

### projectId no notificationService
O `projectId` em `obterPushToken()` está configurado com o slug do seu `app.json`. Ao publicar em produção com EAS Build, substitua pelo `projectId` do EAS (disponível em `eas.json` ou no painel expo.dev).

### Push Remoto (servidor → todos os usuários)
A função `enviarPushParaToken` chama a Expo Push API diretamente do cliente. Para enviar notificações em massa (ex: novo evento para todos), mova essa lógica para **Firebase Cloud Functions** para não expor tokens no front-end.

Exemplo de Cloud Function:
```js
// functions/index.js
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const fetch = require("node-fetch");

exports.notificarNovoEvento = onDocumentCreated("eventos/{eventoId}", async (event) => {
  const evento = event.data.data();
  // buscar todos os tokens ativos e enviar via Expo Push API
});
```

---

## 🔐 Regras Firestore sugeridas

```
match /users/{uid}/pushTokens/{tokenId} {
  allow read, write: if request.auth.uid == uid;
}

match /users/{uid}/notifications/{notifId} {
  allow read, update: if request.auth.uid == uid;
  allow create: if request.auth != null; // permite outros usuários notificar
  allow delete: if request.auth.uid == uid;
}
```
