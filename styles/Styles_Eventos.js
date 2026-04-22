import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  principal: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 60,
  },

  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: "hidden",
  },

  imagem: {
    width: "100%",
    height: 150,
  },

  conteudo: {
    padding: 15,
  },

  titulo: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  info_row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  info_text: {
    color: "#AAA",
    marginLeft: 5,
  },

  // 🎟️ Status
  status: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  confirmado: {
    backgroundColor: "#2ECC71",
  },

  pendente: {
    backgroundColor: "#F39C12",
  },

  status_text: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },

  // ❌ Botão cancelar
  actions: {
    marginTop: 15,
  },

  botao_cancelar: {
    backgroundColor: "#FF4C4C",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  texto_cancelar: {
    color: "#FFF",
    fontWeight: "bold",
  },

  empty: {
    color: "#AAA",
    textAlign: "center",
    marginTop: 50,
  },
});

export default styles;