import React, { useState } from "react";
import { View, TextInput, Text, Button, TouchableOpacity } from "react-native";
import styles from "../styles/Styles_declararOcorrencia";

export default function PerfilDeclararOcorrencia({ navigation }) {
	const [text_ocorrencia, setText_ocorrencia] = useState("");
	const [text_local, setText_local] = useState("Teatro josé de alencar");
	// text_local provisório, posteriormente será passado de componente para componente essa informação
	return (
		<View style={styles.container}>
      <TouchableOpacity 
        style={styles.back_button}
        onPress={() => navigation.navigate("Evento")}>
        <Text style={styles.arrow_back}>{"<"}</Text>
      </TouchableOpacity>

			<Text style={styles.title}>Declaração de{"\n"}Ocorrência</Text>

			<View style={styles.input_wrapper}>
				<Text style={styles.label}>Local: </Text>
				<Text style={styles.location}>{text_local}</Text>
				<Text style={styles.label_instruction}>
					Descreva sua ocorrência/feedback:
				</Text>

				<TextInput
					style={styles.input}
					value={text_ocorrencia}
					onChangeText={setText_ocorrencia}
					placeholder="Descreva o que aconteceu..."
					placeholderTextColor="white"
					multiline={true}
				/>
			</View>

			<View style={styles.buttons}>
				<TouchableOpacity
					style={styles.button}
				>
					<Text style={styles.button_text}>Enviar</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
