import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/Styles_login';

export default function TelaLogin({navigation}) {
  const [text_email, setText_email] = useState('');
  const [text_password, setText_password] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.input_wrapper}>
        <Text style={styles.label}>E-mail:</Text>
        <TextInput
          style={styles.input}
          value={text_email}
          onChangeText={setText_email}
          placeholder="Digite seu email ..."
          placeholderTextColor = 'white'
        />
      </View>

      <View style={styles.input_wrapper}>
        <Text style={styles.label}>Senha:</Text>
        <TextInput
          style={styles.input}
          value={text_password}
          onChangeText={setText_password}
          placeholder="Digite sua senha ..."
          placeholderTextColor = 'white'
        />
      </View>

      <View>
        <TouchableOpacity style={styles.forget_password} onPress={() => navigation.navigate("perfilConfirmarEmail")}>Esqueci minha senha</TouchableOpacity>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("TelaInicio")}>Entrar</TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("perfilCadastro")}>Cadastrar</TouchableOpacity>
      </View>
    </View>
  );
}