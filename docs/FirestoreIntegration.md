# Integrando Firestore com AuthContext

## Exemplo 1: Sincronizar Notificações com Firestore

```javascript
// context/NotificationsContext.js (ATUALIZADO)
import { useAuth } from './AuthContext';
import firestore from '@react-native-firebase/firestore';

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  // Sincronizar com Firestore quando usuário loga
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Ouvir notificações do Firestore
    const subscriber = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('notificacoes')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifs);
        // Também salvar em cache local
        AsyncStorage.setItem('@notifications', JSON.stringify(notifs));
      });

    return subscriber;
  }, [user]);

  async function addNotification(n) {
    if (!user) return;

    const notif = {
      ...n,
      userId: user.uid,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    // Salvar no Firestore
    await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('notificacoes')
      .add(notif);
  }

  async function markAsRead(id) {
    if (!user) return;

    await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('notificacoes')
      .doc(id)
      .update({ read: true });
  }

  // ... resto do código
}
```

---

## Exemplo 2: Posts com Likes no Firestore

```javascript
// services/postsService.js (NOVO)
import firestore from '@react-native-firebase/firestore';

export async function createPost(userId, content) {
  const post = {
    userId, // ✅ OBRIGATÓRIO (regra checa isso)
    content,
    createdAt: firestore.FieldValue.serverTimestamp(),
    likes: 0,
    comments: 0,
  };

  const docRef = await firestore()
    .collection('posts')
    .add(post);

  return { id: docRef.id, ...post };
}

export async function likePost(postId, userId) {
  // Criar documento de like
  const likeId = `${userId}_${postId}`;

  await firestore()
    .collection('posts')
    .doc(postId)
    .collection('likes')
    .doc(likeId)
    .set({
      userId, // ✅ OBRIGATÓRIO
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

  // Incrementar contador de likes
  await firestore()
    .collection('posts')
    .doc(postId)
    .update({
      likes: firestore.FieldValue.increment(1),
    });
}

export async function unlikePost(postId, userId) {
  const likeId = `${userId}_${postId}`;

  await firestore()
    .collection('posts')
    .doc(postId)
    .collection('likes')
    .doc(likeId)
    .delete();

  await firestore()
    .collection('posts')
    .doc(postId)
    .update({
      likes: firestore.FieldValue.increment(-1),
    });
}
```

---

## Exemplo 3: Atualizar App.js com AuthProvider

```javascript
// App.js (ATUALIZADO)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { SocialProvider } from './context/SocialContext';

import LoginScreen from './screens/Login';
import HomeWrapper from './screens/Home';
import NotificationsScreen from './screens/Notifications';

const Stack = createStackNavigator();

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeWrapper} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

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

## Exemplo 4: Tela de Login Simples

```javascript
// screens/Login.js (NOVO)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import GlassContainer from '../components/GlassContainer';
import { glassStyles } from '../styles/glassStyles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, error } = useAuth();

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    if (isSignUp && !displayName) {
      Alert.alert('Erro', 'Digite seu nome');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <GlassContainer intensity={0.15} style={styles.formContainer}>
        <Text style={styles.title}>
          {isSignUp ? 'Criar Conta' : 'Login'}
        </Text>

        {isSignUp && (
          <TextInput
            style={[styles.input, glassStyles.glassCard]}
            placeholder="Nome completo"
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor="#999"
          />
        )}

        <TextInput
          style={[styles.input, glassStyles.glassCard]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="#999"
        />

        <TextInput
          style={[styles.input, glassStyles.glassCard]}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, glassStyles.glassButtonPrimary]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Registrar' : 'Entrar'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.toggleText}>
            {isSignUp
              ? 'Já tem conta? Faça login'
              : 'Não tem conta? Registre-se'}
          </Text>
        </TouchableOpacity>
      </GlassContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#000',
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 14,
    color: '#333',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    color: '#e53935',
    marginBottom: 12,
    textAlign: 'center',
  },
  toggleText: {
    color: '#1976d2',
    textAlign: 'center',
    fontSize: 13,
  },
});
```

---

## Checklist de Implementação

- [ ] Adicionar `@react-native-firebase/auth` e `@react-native-firebase/firestore` ao `package.json`
- [ ] Criar `AuthContext.js`
- [ ] Criar `Login.js` screen
- [ ] Atualizar `NotificationsContext.js` com Firestore sync
- [ ] Atualizar `SocialContext.js` com Firestore posts/likes
- [ ] Atualizar `App.js` com `AuthProvider` e `RootNavigator`
- [ ] Testar login/logout
- [ ] Testar sincronização com Firestore
- [ ] Configurar regras de segurança no Firestore

