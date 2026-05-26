import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
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
        Alert.alert('Sucesso', 'Conta criada! Faça login para continuar.');
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setDisplayName('');
      } else {
        await signIn(email, password);
      }
    } catch (e) {
      Alert.alert('Erro de Autenticação', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>🎭</Text>
        <Text style={styles.appName}>MonitoraCult</Text>
      </View>

      <GlassContainer intensity={0.15} style={styles.formContainer}>
        <Text style={styles.title}>
          {isSignUp ? 'Criar Conta' : 'Bem-vindo'}
        </Text>

        {isSignUp && (
          <TextInput
            style={[styles.input, glassStyles.glassCard]}
            placeholder="Nome completo"
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor="#999"
            editable={!loading}
          />
        )}

        <TextInput
          style={[styles.input, glassStyles.glassCard]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="#999"
          editable={!loading}
        />

        <TextInput
          style={[styles.input, glassStyles.glassCard]}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
          editable={!loading}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[
            styles.button,
            glassStyles.glassButtonPrimary,
            loading && styles.buttonDisabled,
          ]}
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

        <View style={styles.divider} />

        <TouchableOpacity
          onPress={() => {
            setIsSignUp(!isSignUp);
            setEmail('');
            setPassword('');
            setDisplayName('');
          }}
          disabled={loading}
        >
          <Text style={styles.toggleText}>
            {isSignUp
              ? '← Já tem conta? Faça login'
              : 'Não tem conta? Registre-se →'}
          </Text>
        </TouchableOpacity>
      </GlassContainer>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isSignUp
            ? 'Seus dados serão salvos com segurança'
            : 'Autenticação segura com Firebase'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: '#000',
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(25, 118, 210, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.5)',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#1976d2',
    fontWeight: '700',
    fontSize: 14,
  },
  error: {
    color: '#e53935',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 16,
  },
  toggleText: {
    color: '#1976d2',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
