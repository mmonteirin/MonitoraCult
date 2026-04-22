import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: '#333333',
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },

  user: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  legenda: {
    color: '#ddd',
    fontSize: 12,
  },

  rodape: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  rodapeTexto: {
    fontSize: 10,
    color: '#999',
  },
});

export default styles;