import React, { useState } from "react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import styles from "../styles/Styles_Authenticate";

export default function PerfilLogin({ navigation, setIsLogged }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [hasEmptyField, setHasEmptyField] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = (email) => {
		return /\S+@\S+\.\S+/.test(email);
	};

	const handleSubmit = async () => {
		const fields = [email, password];
		const emptyField = fields.some((field) => field.trim() === "");

		setHasEmptyField(emptyField);

		// valida email
		if (!isValidEmail(email)) {
			alert("Email inválido");
			return;
		}

		try {
			await signInWithEmailAndPassword(auth, email, password);

			setIsLogged(true);
		} catch (error) {
			console.log(error);

			if (error.code === "auth/user-not-found") {
				alert("Usuário não encontrado");
			} else if (error.code === "auth/wrong-password") {
				alert("Senha incorreta");
			} else if (error.code === "auth/invalid-email") {
				alert("Email inválido");
			} else {
				alert("Erro ao fazer login");
			}
		}
	};

	return (
		<View style={styles.container}>
			<View>
				<Text style={styles.label}>email:</Text>
				<TextInput
					style={styles.input}
					value={email}
					onChangeText={setEmail}
				/>
			</View>

			<View>
				<Text style={styles.label}>senha:</Text>

        <View style={{ position: "relative" }}>
					<TextInput
						style={[styles.input, { paddingRight: "2.5rem" }]}
						value={password}
						onChangeText={setPassword}
						secureTextEntry={!showPassword}
					/>

					<TouchableOpacity
						style={styles.eyeIcon}
						onPress={() => setShowPassword(!showPassword)}
					>
						<Feather
							name={showPassword ? "eye" : "eye-off"}
							size={18}
							color="white"
						/>
					</TouchableOpacity>
				</View>
			</View>

			{hasEmptyField && (
				<Text style={styles.error}>Todos os campos são obrigatórios</Text>
			)}

			<View>
				<TouchableOpacity
					style={styles.flex}
					onPress={() => navigation.navigate("ResetPassword")}
				>
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
