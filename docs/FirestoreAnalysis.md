# Análise: Firestore Rules vs. Projeto MonitoraCult

## ⚠️ Problemas Identificados

### 1. **Autenticação Ausente** 🔐
**Problema:** As regras exigem `request.auth != null`, mas o projeto não tem Firebase Auth implementado.

```javascript
// Regra exige:
function isAuthenticated() {
  return request.auth != null;
}

// Seu projeto: Sem Firebase Auth
// Resultado: ❌ ACESSO NEGADO em todas as operações
```

**Impacto:** Nenhuma leitura/escrita será permitida no Firestore.

---

### 2. **Sincronização de Dados** 💾
**Problema:** O projeto usa AsyncStorage local para notificações e estado social, mas as regras esperam dados no Firestore.

```javascript
// Seu projeto atual:
const [notifications, setNotifications] = useState([...]);
// Persiste em: AsyncStorage (@notifications)

// Regras esperam:
match /posts/{postId}/likes/{likeId} { ... }
// Dados em: Firestore
```

**Impacto:** Os dados locais não sincronizam com Firestore. Cada dispositivo tem sua própria cópia.

---

### 3. **Estrutura de Dados Incompatível** 📊
**Problema:** Seu projeto não cria documentos no Firestore conforme esperado pelas regras.

| Coleção Esperada | Status no Projeto | Ação Necessária |
|---|---|---|
| `/users/{userId}` | ❌ Não existe | Criar ao registrar |
| `/posts/{postId}` | ❌ Não existe | Implementar |
| `/posts/{postId}/likes/{likeId}` | ❌ Não existe | Implementar |
| `/eventos/{eventoId}` | ❌ Não existe | Implementar |

---

### 4. **userId Faltando em Documentos** 👤
**Problema:** As regras checam `request.resource.data.userId == request.auth.uid`, mas seus documentos podem não ter esse campo.

```javascript
// Regra exige:
allow create: if isAuthenticated()
  && request.resource.data.userId == request.auth.uid;

// Seu código (NotificationsContext):
const notif = {
  title: '...',
  body: '...',
  // ❌ Falta: userId: currentUser.uid
};
```

**Impacto:** Criação de documentos será negada.

---

### 5. **Falta de Backend Handler** 🔗
**Problema:** `registerDeviceToken` envia para backend mock, não sincroniza com Firestore.

```javascript
// Seu serviço:
export async function registerDeviceToken(token, userId = null) {
  // Cai em fallback AsyncStorage se URL for placeholder
  // ❌ Não toca Firestore
}
```

---

### 6. **Sem Tratamento de Erros de Segurança** 🚨
**Problema:** Nenhuma UI ou handler para avisar quando Firestore nega acesso.

```javascript
// Sem tratamento:
firestore().collection('posts').add({...})
  // ❌ Erro silencioso: "PERMISSION_DENIED"
```

---

## ✅ Soluções Recomendadas

### Solução 1: Adicionar Firebase Authentication
```javascript
// contexto/AuthContext.js
import auth from '@react-native-firebase/auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(setUser);
    return subscriber;
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Solução 2: Sincronizar Notificações com Firestore
```javascript
// Ao receber notificação:
const notif = {
  title: remoteMessage.notification?.title,
  body: remoteMessage.notification?.body,
  userId: user.uid, // ✅ Adicionar
  createdAt: Date.now(),
  read: false,
};

// Salvar em Firestore:
firestore()
  .collection('users')
  .doc(user.uid)
  .collection('notificacoes')
  .add(notif);

// E também em AsyncStorage (cache local)
AsyncStorage.setItem('@notifications', JSON.stringify([notif, ...]));
```

### Solução 3: Implementar Estrutura de Posts
```javascript
// Ao criar post:
firestore()
  .collection('posts')
  .add({
    userId: user.uid, // ✅ Obrigatório
    content: '...',
    createdAt: serverTimestamp(),
  });
```

### Solução 4: Tratar Erros de Firestore
```javascript
try {
  await firestore().collection('posts').add(postData);
} catch (e) {
  if (e.code === 'permission-denied') {
    Alert.alert('Erro', 'Você não tem permissão para esta ação');
  }
}
```

---

## 🔧 Checklist de Integração

- [ ] Adicionar `@react-native-firebase/auth`
- [ ] Criar `AuthContext` com login/logout
- [ ] Adicionar `AuthProvider` em `App.js`
- [ ] Migrar `NotificationsContext` para ler/escrever no Firestore
- [ ] Migrar `SocialContext` para usar Firestore (posts, likes)
- [ ] Criar Cloud Functions para regras complexas (se necessário)
- [ ] Testar acesso negado e tratamento de erros
- [ ] Adicionar UI de login/registro

---

## 📋 Impacto Imediato

| Feature | Funcionará Agora? | Razão |
|---|---|---|
| Notificações (FCM + local) | ✅ Sim | Usa AsyncStorage |
| Likes/Follows (local) | ✅ Sim | Usa AsyncStorage |
| Sincronizar com Firestore | ❌ Não | Sem Auth + sem estrutura |
| Posts no Firestore | ❌ Não | Sem Auth + sem implementação |
| Compartilhar dados entre usuários | ❌ Não | Sem Auth |

---

## 🎯 Próximas Ações

1. **Curto prazo**: Manter AsyncStorage (funciona)
2. **Médio prazo**: Adicionar Firebase Auth + integração básica
3. **Longo prazo**: Migrar para Firestore com sincronização

