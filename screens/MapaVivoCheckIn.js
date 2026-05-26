import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { useMapaVivo } from "../hooks/useMapaVivo";
import CheckInCard from "../components/CheckInCard";

export default function MapaVivoCheckIn({ route, navigation }) {
  const { eventId, eventTitle } = route.params;
  const {
    localizacao,
    iniciarLocalizacao,
    fazerCheckIn,
    carregarCheckInsEvento,
  } = useMapaVivo();

  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    iniciarLocalizacao();
    carregarCheckInsEvento(eventId);
  }, [eventId, iniciarLocalizacao, carregarCheckInsEvento]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível selecionar a imagem");
    }
  };

  const handleSubmitCheckIn = async () => {
    if (!caption.trim()) {
      Alert.alert("Erro", "Digite uma legenda para o check-in");
      return;
    }

    if (!localizacao) {
      Alert.alert("Localização", "Aguarde sua localização ser carregada para confirmar o check-in.");
      return;
    }

    setLoading(true);
    try {
      await fazerCheckIn(eventId, {
        caption: caption.trim(),
        photoUrl: selectedImage,
      });
      setCaption("");
      setSelectedImage(null);
      Alert.alert("Sucesso", "Check-in realizado com sucesso!");
      await carregarCheckInsEvento(eventId);
    } catch (error) {
      Alert.alert("Erro", "Erro ao fazer check-in: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-in</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* EVENT TITLE */}
        <View style={styles.eventSection}>
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.eventName} numberOfLines={2}>
            {eventTitle}
          </Text>
        </View>

        {/* IMAGE PICKER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adicionar Foto</Text>
          {selectedImage ? (
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={32}
                  color={Colors.error}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="camera-plus"
                size={40}
                color={Colors.primary}
              />
              <Text style={styles.imagePickerText}>
                Selecionar Foto
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CAPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legenda</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Compartilhe sua experiência..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            value={caption}
            onChangeText={setCaption}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {caption.length}/500
          </Text>
        </View>

        {/* CHECKIN PREVIEW */}
        {(selectedImage || caption.trim()) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prévia</Text>
            <CheckInCard
              eventTitle={eventTitle}
              userName="Você"
              caption={caption}
              photo={selectedImage}
              createdAt={{ seconds: Math.floor(Date.now() / 1000) }}
              onPress={() => {}}
            />
          </View>
        )}

        {/* TIPS */}
        <View style={styles.tipsSection}>
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={20}
            color={Colors.warning}
          />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Dicas</Text>
            <Text style={styles.tipsText}>
              • Tire uma foto do local ou evento{"\n"}
              • Escreva uma legenda interessante{"\n"}
              • Compartilhe sua experiência{"\n"}
              • Inspire outros a visitarem!
            </Text>
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!caption.trim() || loading || !localizacao) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitCheckIn}
          disabled={!caption.trim() || loading || !localizacao}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={Colors.textPrimary}
            />
          ) : (
            <>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={Colors.textPrimary}
              />
              <Text style={styles.submitButtonText}>
                Confirmar Check-in
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* PRIVACY NOTE */}
        <View style={styles.privacyNote}>
          <MaterialCommunityIcons
            name="shield-account"
            size={16}
            color={Colors.textMuted}
          />
          <Text style={styles.privacyText}>
            Seu check-in será compartilhado com a comunidade
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 20,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  imagePicker: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(108, 92, 231, 0.05)",
  },
  imagePickerText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 8,
  },
  imagePreview: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.surface,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  captionInput: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: "right",
  },
  tipsSection: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.warning,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.success,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
  },
});
