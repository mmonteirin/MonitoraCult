import React, { useState } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import styles from "../styles/Styles_cadastro";

export default function perfilCadastro({ navigation }) {
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
			navigation.navigate("perfilLogin");
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.input_wrapper}>
				<Text style={styles.label}>Usuário:</Text>
				<TextInput
					style={styles.input}
					value={user}
					onChangeText={setUser}
					placeholder="Seu nome de usúario ..."
				/>
			</View>

			<View style={styles.input_wrapper}>
				<Text style={styles.label}>E-mail:</Text>
				<TextInput
					style={styles.input}
					value={email}
					onChangeText={setEmail}
					placeholder="Seu email ..."
				/>
			</View>

			<View style={styles.input_wrapper}>
				<Text style={styles.label}>Senha:</Text>
				<TextInput
					style={[styles.input, { marginBottom: "0.5rem" }]}
					value={password}
					onChangeText={setPassword}
					placeholder="Seu senha ..."
				/>
				<TextInput
					style={styles.input}
					value={confirmPassword}
					onChangeText={setConfirmPassword}
					placeholder="Confirme sua senha ..."
				/>
			</View>

			{hasEmptyField && (
				<Text style={styles.error}>Todos os campos são obrigatórios</Text>
			)}

			<View>
				<TouchableOpacity style={styles.button} onPress={() => handleSubmit()}>
					<Text style={styles.buttonText}>Criar Conta</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
