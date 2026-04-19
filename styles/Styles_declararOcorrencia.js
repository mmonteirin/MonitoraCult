import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBlock: '7.5rem'
  },

  input_wrapper: {
    width: '17.5rem',
    marginBottom: '1rem'
  },

  label: {
    fontSize: '1.5rem',
    fontWeight: 500,
    color: 'white',
    marginBottom: '.5rem'
  },

  input: {
    backgroundColor: '#888888',
    borderRadius: '.25rem',
    paddingBlock: '.75rem',
    paddingInline: '.5rem',
    color: 'white',
  },

  forget_password: {
    fontFamily: 'sans-serif',
    fontSize: '0.85rem',
    textAlign: 'end',
    color: '#c48d18',
    textDecorationLine: 'underline',
  },

  buttons: {
    flex: 1,
    width: '12.5rem',
    marginTop: '2rem'
  },

  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2665c4',
    borderRadius: '0.25rem',
    fontFamily: 'sans-serif',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'white',
    paddingBlock: '1rem',
    marginBottom: '1rem'
  },
});

export default styles;