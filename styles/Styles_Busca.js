import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  principal: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  // 🔍 Busca
  search_container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDEDED",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },

  search_input: {
    marginLeft: 10,
    flex: 1,
    color: "#000",
  },

  // 📌 Seções
  section_title: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 10,
    marginTop: 10,
  },

  // 🧩 Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    backgroundColor: "#EDEDED",
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
  },

  card_text: {
    marginLeft: 10,
    fontWeight: "bold",
    color: "#000",
  },

  // 📍 Locais
  local_card: {
    flexDirection: "row",
    backgroundColor: "#EDEDED",
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },

  local_image: {
    width: 50,
    height: 50,
    backgroundColor: "#ccc",
    borderRadius: 10,
    marginRight: 10,
  },

  local_title: {
    fontWeight: "bold",
    color: "#000",
  },

  local_rating: {
    color: "#666",
  },
});

export default styles;