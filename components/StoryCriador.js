/**
 * 📸 COMPONENTE: CRIADOR DE STORIES
 * Modal para capturar foto e criar nova story
 */

import React, { memo, useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../styles/Colors";

const StoryCriador = memo(
  ({ visible, onClose, onCriar, userData, criando = false }) => {
    const [imagemUri, setImagemUri] = useState(null);
    const [textoStory, setTextoStory] = useState("");
    const [musica, setMusica] = useState(null);
    const [emProcesso, setEmProcesso] = useState(false);

    // ✅ Selecionar foto da galeria
    const handleSelecionarFoto = async () => {
      try {
        const resultado = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [9, 16],
          quality: 0.8,
        });

        if (!resultado.canceled) {
          setImagemUri(resultado.assets[0].uri);
        }
      } catch (erro) {
        Alert.alert("Erro", "Falha ao selecionar foto");
      }
    };

    // ✅ Tirar foto com câmera
    const handleTirarFoto = async () => {
      try {
        const resultado = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [9, 16],
          quality: 0.8,
        });

        if (!resultado.canceled) {
          setImagemUri(resultado.assets[0].uri);
        }
      } catch (erro) {
        Alert.alert("Erro", "Falha ao acessar câmera");
      }
    };

    // ✅ Enviar story
    const handleEnviar = async () => {
      if (!imagemUri) {
        Alert.alert("Erro", "Selecione uma foto para a story");
        return;
      }

      setEmProcesso(true);

      try {
        await onCriar({
          imagemUri,
          textoStory,
          musica,
        });

        // Limpar formulário
        setImagemUri(null);
        setTextoStory("");
        setMusica(null);
        onClose();
      } catch (erro) {
        Alert.alert("Erro", "Falha ao criar story");
      } finally {
        setEmProcesso(false);
      }
    };

    const handleFechar = () => {
      if (imagemUri || textoStory || musica) {
        Alert.alert(
          "Descartar",
          "Você tem certeza que quer descartar a story?",
          [
            { text: "Cancelar" },
            {
              text: "Descartar",
              onPress: () => {
                setImagemUri(null);
                setTextoStory("");
                setMusica(null);
                onClose();
              },
              style: "destructive",
            },
          ]
        );
      } else {
        onClose();
      }
    };

    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleFechar}>
              <Text style={styles.btnTexto}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.titulo}>Nova Story</Text>
            <TouchableOpacity
              onPress={handleEnviar}
              disabled={emProcesso || !imagemUri}
            >
              {emProcesso ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text
                  style={[
                    styles.btnTexto,
                    (!imagemUri || criando) && styles.btnTextoDesabilitado,
                  ]}
                >
                  Enviar
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* CONTEÚDO */}
          <ScrollView
            style={styles.conteudo}
            contentContainerStyle={styles.conteudoContainer}
          >
            {/* SELETOR DE FOTO */}
            {imagemUri ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: imagemUri }}
                  style={styles.preview}
                />
                <TouchableOpacity
                  style={styles.btnTrocar}
                  onPress={handleSelecionarFoto}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.seletorFoto}>
                <Text style={styles.labelFoto}>Selecione uma foto</Text>

                <View style={styles.botoesSelecao}>
                  <TouchableOpacity
                    style={styles.btnSelecao}
                    onPress={handleTirarFoto}
                  >
                    <MaterialCommunityIcons
                      name="camera"
                      size={32}
                      color={Colors.primary}
                    />
                    <Text style={styles.btnSelecaoText}>Câmera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnSelecao}
                    onPress={handleSelecionarFoto}
                  >
                    <MaterialCommunityIcons
                      name="image"
                      size={32}
                      color={Colors.primary}
                    />
                    <Text style={styles.btnSelecaoText}>Galeria</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {imagemUri && (
              <>
                {/* INPUT DE TEXTO */}
                <View style={styles.secao}>
                  <Text style={styles.label}>Adicione um texto</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="O que você está fazendo?"
                    placeholderTextColor={Colors.textMuted}
                    value={textoStory}
                    onChangeText={setTextoStory}
                    maxLength={150}
                    multiline
                  />
                  <Text style={styles.contador}>
                    {textoStory.length}/150
                  </Text>
                </View>

                {/* MÚSICA */}
                <View style={styles.secao}>
                  <View style={styles.headerSecao}>
                    <Text style={styles.label}>Adicione música</Text>
                    <MaterialCommunityIcons
                      name="lock"
                      size={14}
                      color={Colors.textMuted}
                    />
                  </View>

                  <TouchableOpacity style={styles.btnMusica}>
                    <MaterialCommunityIcons
                      name="music"
                      size={24}
                      color={Colors.primary}
                    />
                    <View style={styles.musicaInfo}>
                      <Text style={styles.musicaNome}>
                        Nenhuma música selecionada
                      </Text>
                      <Text style={styles.musicaSubtitle}>
                        Recurso em desenvolvimento
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* OPÇÕES */}
                <View style={styles.secao}>
                  <Text style={styles.label}>Privacidade</Text>
                  <TouchableOpacity style={styles.opcao}>
                    <MaterialCommunityIcons
                      name="account-multiple"
                      size={20}
                      color={Colors.primary}
                    />
                    <View style={styles.opcaoInfo}>
                      <Text style={styles.opcaoTitulo}>Todos</Text>
                      <Text style={styles.opcaoSubtitle}>
                        Visível para seus seguidores
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  btnTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },

  btnTextoDesabilitado: {
    opacity: 0.5,
  },

  conteudo: {
    flex: 1,
  },

  conteudoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  seletorFoto: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
  },

  labelFoto: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 20,
  },

  botoesSelecao: {
    flexDirection: "row",
    gap: 16,
  },

  btnSelecao: {
    flex: 1,
    backgroundColor: Colors.primary + "15",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },

  btnSelecaoText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },

  previewContainer: {
    position: "relative",
    marginBottom: 20,
  },

  preview: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 16,
  },

  btnTrocar: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  secao: {
    marginBottom: 24,
  },

  headerSecao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
  },

  contador: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: "right",
  },

  btnMusica: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  musicaInfo: {
    flex: 1,
  },

  musicaNome: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  musicaSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  opcao: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  opcaoInfo: {
    flex: 1,
  },

  opcaoTitulo: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  opcaoSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

export default StoryCriador;
