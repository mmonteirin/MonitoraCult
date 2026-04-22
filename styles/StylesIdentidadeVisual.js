import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  // Fundo geral da tela
  principal: {
    flex: 1,
    backgroundColor: "#FDFCFB",
  },

  // ==========================================
  // ESTILOS DA TELA DE PERFIL
  // ==========================================

  header_perfil: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 30,
    marginTop: 60,
    marginBottom: 20,
  },

  avatar_container: {
    alignItems: "center",
    marginRight: 20,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E0E0E0",
  },

  texto_ver_perfil: {
    fontSize: 12,
    color: "#4A6FA5",
    marginTop: 8,
    fontWeight: "bold",
  },

  info_perfil: {
    justifyContent: "center",
    flex: 1,
  },

  nome_perfil: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
  },

  subtitulo_perfil: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },

  menu_container: {
    width: "100%",
    paddingHorizontal: 30,
    marginTop: 10,
    flex: 1,
  },

  menu_item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  menu_texto: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginLeft: 15,
  },

  menu_texto_destaque: {
    fontSize: 22,
    fontWeight: "900",
    color: "#333333",
  },

  bottom_bar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    width: "95%",
    height: 70,
    borderRadius: 20,
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  bottom_item: {
    alignItems: "center",
    justifyContent: "center",
  },

  bottom_texto: {
    fontSize: 10,
    color: "#333333",
    marginTop: 4,
  },
});

export default styles;