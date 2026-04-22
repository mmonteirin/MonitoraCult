import React, {useState} from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/StylesIdentidadeVisual'

export default function TelaContato({navigation}){
    const [text_nome, setText_nome] = useState('');
    const [text_email, setText_email] = useState('');
    const [text_messagem, setText_messagem] = useState('');

    return (
        <View style={styles.container_contato}>
            <View style={styles.container_icone_voltar_contato}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name ='keyboard-backspace' size = {45} color='#eac073'/>
                </TouchableOpacity>
            </View>
            <View style={styles.view_texto_contato}>
                <Text style={styles.texto_contato}> Entre em Contato Conosco </Text>
            </View>
            <TextInput
            style={styles.input_contato}
            placeholder="Digite seu nome..."
            placeholderTextColor="gray"
            value={text_nome}
            onChangeText={setText_nome}/>            
            <TextInput
            style={styles.input_contato}
            placeholder="Digite seu email..."
            placeholderTextColor="gray"
            value={text_email}
            onChangeText={setText_email}/>
            <ScrollView
            style={styles.input_contato_scrowlView}>
            <TextInput
            placeholder="Escreva a sua mensagem aqui..."
            placeholderTextColor = 'gray'
            value={text_messagem}
            onChangeText={setText_messagem}
            multiline={true}
            numberOfLines={10}
            style={styles.bott}/>
             </ScrollView>
             <View>
            <Button title="Enviar" onPress={() => {alert('Mensagem Enviada!')}} />
            </View>
        </View>
    );
}