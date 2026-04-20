import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import styles from "../styles/Styles_confirmEmail.js";

export default function PerfilConfirmarEmail() {
	const [email, setEmail] = useState("");
	const [codigo, setCodigo] = useState(["", "", "", ""]);

	const atualizarCodigo = (valor, index) => {
		const novoCodigo = [...codigo];
		novoCodigo[index] = valor;
		setCodigo(novoCodigo);
	};

	const [click, setClick] = useState(false);

	return (
		<View style={styles.container}>
			{/* Botão voltar */}
			<TouchableOpacity style={styles.botaoVoltar}>
				<Text style={{ color: "#fff" }}>←</Text>
			</TouchableOpacity>

			{/* Título */}
			<Text style={styles.titulo}>Insira o E-mail registrado:</Text>

			{/* Input email */}
			<TextInput
				placeholder="Seu email..."
				placeholderTextColor="#ccc"
				value={email}
				onChangeText={setEmail}
				style={styles.inputEmail}
			/>

			{/* Código */}
			{click && (
				<View style={styles.containerCodigo}>
					{codigo.map((item, index) => (
						<TextInput
							key={index}
							value={item}
							onChangeText={(text) => atualizarCodigo(text, index)}
							style={styles.inputCodigo}
							maxLength={1}
							keyboardType="default"
							secureTextEntry={true}
							autoCorrect={false}
							autoCapitalize="none"
							textContentType="none"
							importantForAutofill="no"
							autoComplete="off"
						/>
					))}
				</View>
			)}

			{/* Botão */}
			<TouchableOpacity
				style={styles.botaoEnviar}
				onPress={() => setClick(true)}
			>
				<Text style={styles.textoBotao}>Enviar Código</Text>
			</TouchableOpacity>
		</View>
	);
}
