import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { Feather } from '@expo/vector-icons';
import styles from "../styles/Styles_Authenticate";

export default function PerfilCadastro({ navigation }) {
	const [user, setUser] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [hasEmptyField, setHasEmptyField] = useState(false);

	const handleSubmit = () => {
		const fields = [user, email, password, confirmPassword];
		const emptyField = fields.some((field) => field.trim() === "");

		setHasEmptyField(emptyField);

		if (!emptyField) {
			// Provisório. Depois vai puxar uma função envolvendo API e banco de dados
			navigation.navigate("Login");
		}
	};

	return (
		<View style={styles.container}>
			<View>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Feather name="chevron-left" size={24} color="white" style={styles.arrowLeft}/>
				</TouchableOpacity>
			</View>

			<View>
				<Text style={styles.label}>Usuário:</Text>
				<TextInput
					style={styles.input}
					value={user}
					onChangeText={setUser}
				/>
			</View>

			<View>
				<Text style={styles.label}>Email:</Text>
				<TextInput
					style={styles.input}
					value={email}
					onChangeText={setEmail}
				/>
			</View>

			<View>
				<Text style={[styles.label, {marginTop: '1.2rem'}]}>Senha:</Text> 
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
			</View>

			<View>
				<Text style={styles.label}>Confirme sua senha:</Text> 
				<TextInput
					style={styles.input}
					value={confirmPassword}
					onChangeText={setConfirmPassword}
				/>
			</View>

			{hasEmptyField && (
				<Text style={styles.error}>Todos os campos são obrigatórios</Text>
			)}

			<View>
				<TouchableOpacity onPress={() => handleSubmit()}>
					<Text style={styles.button}>Criar Conta</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
