import React, { useState } from "react";

import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import styles from "../styles/Styles_Authenticate.js";

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function ResetPassword({ navigation }) {
	const [email, setEmail] = useState("");

	const handleResetPassword = async () => {
		if (!email) {
			alert("Digite um email válido");
			return;
		}

		try {
			await sendPasswordResetEmail(auth, email);
			alert("Email de recuperação enviado! Verifique sua caixa de entrada.");
			navigation.goBack();
		} catch (error) {
			console.log(error);

			if (error.code === "auth/user-not-found") {
				alert("Não existe usuário com esse email.");
			} else if (error.code === "auth/invalid-email") {
				alert("Email inválido.");
			} else {
				alert("Erro ao enviar email. Tente novamente.");
			}
		}
	};

	return (
		<View style={[styles.container, { paddingTop: "15rem" }]}>
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

			<Text style={styles.label}>email de recuperação:</Text>
			<TextInput
				style={styles.input}
				value={email}
				onChangeText={setEmail}
				autoCapitalize="none"
			/>

			<TouchableOpacity onPress={handleResetPassword}>
				<Text style={styles.button}>Enviar código</Text>
			</TouchableOpacity>
		</View>
	);
}
