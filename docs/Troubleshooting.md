# 🔴 O Que Pode Quebrar com Firestore Rules - Troubleshooting Rápido

## Cenário 1: Usuário não consegue fazer login

### 🔍 Possíveis causas

1. **Firebase não está inicializado**
   - Verifique `google-services.json` (Android) e `GoogleService-Info.plist` (iOS)

2. **Email/senha incorretos**
   - Verifique se o usuário foi registrado
   - Teste com credenciais conhecidas

3. **Regra de Auth bloqueando**
   - Erro: `PERMISSION_DENIED: Missing or insufficient permissions`
   - Solução: Verifique permissões em Firebase Console

### ✅ Solução rápida
```bash
# 1. Limpar app
npm run android -- --reset-cache

# 2. Verificar Firebase Console:
# - Authentication ativa?
# - Email/Password provider habilitado?

# 3. Testar com credenciais de teste
```

---

## Cenário 2: Notificações não sincronizam com Firestore

### 🔍 Possíveis causas

1. **NotificationsContext ainda usa AsyncStorage**
   - Status: Esperado (versão atual usa cache local)
   - Solução: Migrar conforme `FirestoreIntegration.md`

2. **Firestore rules negando acesso**
   - Erro: `Permission denied (missing or insufficient permissions)`
   - Solução: Adicionar `userId` ao documento

3. **Usuário não autenticado**
   - `request.auth == null`
   - Solução: Fazer login primeiro

### ✅ Solução rápida
```javascript
// Adicionar em todas as operações Firestore:
const { user } = useAuth();
if (!user) return; // Exigir autenticação

// Adicionar userId:
const notif = {
  ...notif,
  userId: user.uid, // ✅ OBRIGATÓRIO
};
```

---

## Cenário 3: Erro "userId is required"

### 🔍 Causa

Regra checa `request.resource.data.userId == request.auth.uid` mas documento não tem `userId`.

### ✅ Solução
```javascript
// Sempre adicionar userId ao criar documento:
firestore().collection('posts').add({
  userId: auth().currentUser.uid, // ✅
  content: '...',
  createdAt: serverTimestamp(),
});
```

---

## Cenário 4: App quebrando ao iniciar

### 🔍 Possíveis causas

1. **AuthProvider não foi adicionado ao App.js**
   - Erro: `useAuth must be used within AuthProvider`
   - Solução: Verifique se `AuthProvider` envolve a app

2. **Firebase não inicializado**
   - Erro: `Failed to get document because the client is offline`
   - Solução: Testar conexão internet

### ✅ Solução rápida
```javascript
// ✅ App.js CORRETO:
export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <SocialProvider>
          <RootNavigator />
        </SocialProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
```

---

## Cenário 5: Login funciona mas dados não sincronizam

### 🔍 Possíveis causas

1. **Contextos ainda usam AsyncStorage puro**
   - Esperado: Versão atual é cache local
   - Solução: Implementar listeners de Firestore

2. **Firestore rules não permitem leitura**
   - Erro: `Permission denied`
   - Solução: Verificar regras de leitura

### ✅ Solução rápida

Migrar NotificationsContext gradualmente (veja `FirestoreIntegration.md`):

```javascript
// Adicionar listener de Firestore:
useEffect(() => {
  if (!user) return;
  
  const subscriber = firestore()
    .collection('users')
    .doc(user.uid)
    .collection('notificacoes')
    .onSnapshot((snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
    });

  return subscriber;
}, [user]);
```

---

## 📋 Checklist Rápido

- [ ] Firebase Auth habilitado em Firebase Console?
- [ ] Email/Password provider ativo?
- [ ] `google-services.json` em `android/app/`?
- [ ] `GoogleService-Info.plist` em `ios/`?
- [ ] `AuthProvider` envolve o app em `App.js`?
- [ ] Todos os documentos têm `userId`?
- [ ] Usuário faz login antes de criar dados?
- [ ] Internet conectada?

---

## 🆘 Erros Comuns e Soluções

| Erro | Causa | Solução |
|---|---|---|
| `PERMISSION_DENIED` | Sem autenticação | Fazer login |
| `userId is required` | Documento sem userId | Adicionar `userId: user.uid` |
| `useAuth must be used within AuthProvider` | AuthProvider falta | Adicionar em App.js |
| `[firestore/network-error]` | Sem internet | Verificar conexão |
| `[auth/invalid-email]` | Email inválido | Validar email |
| `[auth/user-not-found]` | Usuário não existe | Registrar primeiro |
| `[auth/wrong-password]` | Senha errada | Verificar senha ou reset |

---

## 🔗 Links Úteis

- [Documentação Firestore Rules](https://firebase.google.com/docs/firestore/security)
- [Firebase Auth Console](https://console.firebase.google.com/authentication)
- [React Native Firebase Docs](https://rnfirebase.io/)

---

## 💡 Dicas Finais

1. **Teste passo a passo**: Registre → Login → Crie dados → Sincronize
2. **Monitore Firestore Console**: Veja os dados sendo criados
3. **Ative Logs**: `firebase.firestore().enableLogging(true);`
4. **Teste offline**: Desconecte internet e veja falhas
5. **Use emulador**: Teste sem custos com Firebase Emulator Suite

