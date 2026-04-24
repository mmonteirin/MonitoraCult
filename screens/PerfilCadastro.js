import React, { useState } from "react";

import { db } from "../firebaseConfig.js";
import { collection, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import styles from "../styles/Styles_Authenticate";

export default function PerfilCadastro({ navigation }) {
	const [user, setUser] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [hasEmptyField, setHasEmptyField] = useState(false);

	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = async () => {
		const fields = [user, email, password, confirmPassword];
		const emptyField = fields.some((field) => field.trim() === "");

		setHasEmptyField(emptyField);

		if (!emptyField) {
			await registerUser();

			navigation.navigate("Login");
		}
	};

	const isValidEmail = (email) => {
		return /\S+@\S+\.\S+/.test(email);
	};

	const registerUser = async () => {
		try {
			if (password !== confirmPassword) {
				alert("'senha' e 'confirmar senha' devem ser iguais");
				return;
			}

			if (!isValidEmail(email)) {
				alert("Digite um email válido");
				return;
			}

			// cria usuário no Auth
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);

			const uid = userCredential.user.uid;

			// salva dados extras no Firestore
			await addDoc(collection(db, "users"), {
				uid,
				user,
				email,
				data: new Date().toISOString(),
			});

			alert("Usuário cadastrado com sucesso!");
		} catch (error) {
			console.log(error);

			if (error.code === "auth/email-already-in-use") {
				alert("Email já está em uso.");
			} else if (error.code === "auth/weak-password") {
				alert("A senha deve ter pelo menos 6 caracteres.");
			} else {
				alert("Erro ao cadastrar usuário.");
			}
		}
	};

	return (
		<View style={styles.container}>
			<View>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Feather
						name="chevron-left"
						size={24}
						color="white"
						style={styles.arrowLeft}
					/>
				</TouchableOpacity>
			</View>

			<View>
				<Text style={styles.label}>Usuário:</Text>
				<TextInput style={styles.input} value={user} onChangeText={setUser} />
			</View>

			<View>
				<Text style={styles.label}>Email:</Text>
				<TextInput style={styles.input} value={email} onChangeText={setEmail} />
			</View>

			<View>
				<Text style={[styles.label, { marginTop: "1.2rem" }]}>Senha:</Text>
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

			<View>
				<Text style={styles.label}>Confirme sua senha:</Text>
				<TextInput
					style={styles.input}
					value={confirmPassword}
					onChangeText={setConfirmPassword}
					secureTextEntry={!showPassword}
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
