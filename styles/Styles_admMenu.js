import { StyleSheet } from "react-native";
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c2c2c",
    padding: 20,
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

  // 📋 OPÇÕES
  menuOptions: {
    marginTop: 20,
  },

  itemMenu: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  icone: {
    fontSize: 20,
    marginRight: 10,
    color: "#fff",
  },

  textoMenu: {
    color: "#fff",
    fontSize: 16,
  },

  tituloSecao: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
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
    padding: 12,
  },

  bottomItem: {
    fontSize: 20,
  },
});
export default styles;