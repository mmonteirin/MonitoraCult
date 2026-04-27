import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
    paddingBottom: 90,
  },

  headerMenu: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },

  avatarMenu: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },

  nomeMenu: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  subtituloMenu: {
    color: "#aaa",
    fontSize: 12,
  },

  topoEventos: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  tituloSecao: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  botaoCadastrar: {
    backgroundColor: "#4a6fa5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  textoBotao: {
    color: "#fff",
    fontWeight: "bold",
  },

  cardEvento: {
    flexDirection: "row",
    backgroundColor: "#444",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
  },

  imagemEvento: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },

  tituloEvento: {
    color: "#fff",
    fontWeight: "bold",
  },

  localEvento: {
    color: "#ccc",
  },

  dataEvento: {
    color: "#aaa",
    fontSize: 12,
  },

  acoesEvento: {
    alignItems: "center",
    justifyContent: "space-between",
    height: 80,
  },

  icone: {
    fontSize: 20,
  },

  botaoDashboard: {
    backgroundColor: "#4a6fa5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 10,
  },

  textoBotaoDashboard: {
    color: "#fff",
    fontSize: 12,
  },

  bottomMenu: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#eee",
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },

  bottomItem: {
    fontSize: 20,
  },
});

export default styles;