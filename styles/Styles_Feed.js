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

    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  imagem: {
    width: "100%",
    height: 180,
  },

  conteudo: {
    padding: 15,
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  descricao: {
    color: "#AAAAAA",
    marginTop: 5,
  },

  actions: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
    width: 80,
  },
});

export default styles;