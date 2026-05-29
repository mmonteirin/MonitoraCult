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
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

const StoryCriador = memo(
  ({ visible, onClose, onCriar, userData, criando = false }) => {
    const { colors } = useTheme();
    const styles = useThemedStyles(createThemedScreenStyles);
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
                <ActivityIndicator size="small" color={colors.primary} />
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
                      color={colors.primary}
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
                      color={colors.primary}
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
                    placeholderTextColor={colors.textMuted}
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
                      color={colors.textMuted}
                    />
                  </View>

                  <TouchableOpacity style={styles.btnMusica}>
                    <MaterialCommunityIcons
                      name="music"
                      size={24}
                      color={colors.primary}
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
                      color={colors.primary}
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
                      color={colors.primary}
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

function createThemedScreenStyles(c) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },

  header: {
    backgroundColor: c.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: c.textPrimary,
  },

  btnTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: c.primary,
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
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: c.border,
  },

  labelFoto: {
    fontSize: 16,
    fontWeight: "600",
    color: c.textPrimary,
    marginBottom: 20,
  },

  botoesSelecao: {
    flexDirection: "row",
    gap: 16,
  },

  btnSelecao: {
    flex: 1,
    backgroundColor: c.primary + "15",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },

  btnSelecaoText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.primary,
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
    backgroundColor: c.primary,
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
    color: c.textPrimary,
    marginBottom: 12,
  },

  input: {
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: c.textPrimary,
    borderWidth: 1,
    borderColor: c.border,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
  },

  contador: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 6,
    textAlign: "right",
  },

  btnMusica: {
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: c.border,
  },

  musicaInfo: {
    flex: 1,
  },

  musicaNome: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary,
  },

  musicaSubtitle: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2,
  },

  opcao: {
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: c.border,
  },

  opcaoInfo: {
    flex: 1,
  },

  opcaoTitulo: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textPrimary,
  },

  opcaoSubtitle: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 2,
  },
  });
}

export default StoryCriador;
