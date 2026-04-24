import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    alignItems: 'center',
    paddingTop: '10rem'
  },

  flex: {
    flex: 1,
  },

  row: {
    flex: 1,
    flexDirection: 'row'
  },

  label: {
    fontSize: '1rem',
    fontWeight: 500,
    letterSpacing: '0.04rem',
    textTransform: 'uppercase',
    color: 'white',
    marginBottom: '.5rem'
  },

  input: {
    width: '17.5rem',
    marginBottom: '1rem',
    outlineStyle: 'none',
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: '.5rem',
    paddingBlock: '.75rem',
    paddingInline: '.5rem',
    color: 'white',
  },

  forget_password: {
    flex: 1,
    width: '17.5rem',
    fontFamily: 'sans-serif',
    fontSize: '0.85rem',
    textAlign: 'end',
    color: '#c48d18',
    textDecorationLine: 'underline',
  },

  button: {
    width: '12.5rem',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2665c4',
    borderRadius: '0.25rem',
    fontFamily: 'sans-serif',
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '0.04rem',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: 'white',
    paddingBlock: '1rem',
    marginBottom: '1rem',
    marginTop: '2rem',
  },

  p: {
    fontFamily: 'sans-serif',
    fontSize: '.75rem',
    color: 'white',
    letterSpacing: '0.04rem',
  },

  link: {
    textDecorationLine: 'underline',
    color: '#2665c4',
    fontFamily: 'sans-serif',
    fontSize: '.75rem',
    letterSpacing: '0.04rem',
  },

  error: {
		fontFamily: "sans-serif",
		fontWeight: 400,
		fontSize: 14,
		color: "red",
    marginBottom: "0.5rem"
	},

  arrowLeft: {
    backgroundColor: 'grey',
    borderRadius: '1rem',
    width: '2.5rem',
    textAlign: 'center',
    position: 'fixed',
    left: '5%',
    top: '10%'
  },

  eyeIcon: {
    position: 'absolute',
    right: -25,
    top: 12,
    zIndex: 1
  },
});

export default styles;