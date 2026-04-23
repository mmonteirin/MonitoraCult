import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Feather } from '@expo/vector-icons';
import styles from "../styles/Styles_Authenticate.js";

export default function ResetPassword({navigation}) {
  const [email, setEmail] = useState("");

  return (
    <View style={[styles.container, {paddingTop: '15rem'}]}>
      <View>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Feather name="chevron-left" size={24} color="white" style={styles.arrowLeft}/>
				</TouchableOpacity>
			</View>

      <Text style={styles.label}>email de recuperação:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        // onPress => Firebase API para redefinir senha
      >
        <Text style={styles.button}>Enviar código</Text>
      </TouchableOpacity>
    </View>
  );
}