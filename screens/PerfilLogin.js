import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/Styles_Authenticate';

export default function PerfilLogin({navigation, setIsLogged}) {
  const [text_email, setText_email] = useState('');
  const [text_password, setText_password] = useState('');

  const [hasEmptyField, setHasEmptyField] = useState(false);

  const handleSubmit = () => {
		const fields = [text_email, text_password];
		const emptyField = fields.some((field) => field.trim() === "");

		setHasEmptyField(emptyField);

		if (!emptyField) {
			// verificar se existe usuário no banco de dados...
			setIsLogged(true);
		}
	};

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>email:</Text>
        <TextInput
          style={styles.input}
          value={text_email}
          onChangeText={setText_email}
        />
      </View>

      <View>
        <Text style={styles.label}>senha:</Text>
        <TextInput
          style={styles.input}
          value={text_password}
          onChangeText={setText_password}
        />
      </View>

      {hasEmptyField && (
				<Text style={styles.error}>Todos os campos são obrigatórios</Text>
			)}

      <View>
        <TouchableOpacity style={styles.flex} onPress={() => navigation.navigate("ResetPassword")}>
          <Text style={styles.forget_password}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </View>

      <View>
        <TouchableOpacity onPress={() => handleSubmit()}>
          <Text style={styles.button}>Entrar</Text>
        </TouchableOpacity>
      </View>
        
      <View style={styles.row}>
          <Text style={styles.p}> Não possui uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
              <Text style={styles.link}>Crie uma conta</Text>
            </TouchableOpacity>
          <Text style={styles.p}> agora!</Text>
      </View>
    </View>
  );
}