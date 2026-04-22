import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  principal: {
    flex: 1,
    backgroundColor: "#FDFCFB",
    paddingTop: 60,
  },

  // 👤 HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    marginBottom: 30,
  },

  avatar_container: {
    alignItems: "center",
    marginRight: 20,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E0E0",
  },

  texto_editar: {
    fontSize: 12,
    color: "#4A6FA5",
    marginTop: 5,
    fontWeight: "bold",
  },

  info: {
    flex: 1,
  },

  nome: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },

  email: {
    color: "#666",
    marginTop: 3,
  },

  // ⚙️ MENU
  menu: {
    paddingHorizontal: 25,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#DDD",
  },

  texto: {
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});

export default styles;