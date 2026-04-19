import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#202020",
    padding: 16,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },

  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    width: "48%",
  },

  cardTitle: {
    color: "#ccc",
    fontSize: 12,
  },

  cardNumber: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
  },

  eventCard: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },

  eventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },

  eventTitle: {
    color: "#fff",
    fontSize: 14,
  },

  eventDate: {
    color: "#aaa",
    fontSize: 12,
  },
});
export default styles;