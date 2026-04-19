import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: "#202020",
    padding: 16,
},
botaoVoltar: {
  position: "absolute",
  top: 50,
  left: 20,
  backgroundColor: "#555",
  padding: 10,
  borderRadius: 5,
},

titulo: {
  color: "#fff",
  fontSize: 20,
  textAlign: "center",
  marginTop: 100,
  marginBottom: 20,
},

inputEmail: {
  backgroundColor: "#777",
  borderRadius: 8,
  padding: 10,
  color: "#fff",
  marginBottom: 20,
},

containerCodigo: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 20,
},

inputCodigo: {
  width: 50,
  height: 50,
  backgroundColor: "#777",
  textAlign: "center",
  fontSize: 18,
  borderRadius: 8,
  color: "#fff",
},

botaoEnviar: {
  backgroundColor: "#4a6fa5",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
},

textoBotao: {
  color: "#fff",
  fontWeight: "bold",
},
});
export default styles;