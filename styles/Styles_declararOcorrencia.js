import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '1.5rem',
  },

  input_wrapper: {
    
    width: '25.5rem',
    marginBottom: '1rem'
  },

  label: {
    fontSize: '1.8rem',
    fontWeight: '500', 
    color: 'white',
    marginBottom: '0.1rem' 
  },
  
  title: {
    fontSize: '2.1rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '4rem', 
    textAlign: 'center',

  },

  location: {
    fontSize: '1.8rem',
    fontWeight: '500',
    color: 'white',
    marginBottom: '.65rem',
    textDecorationLine: 'underline',
  },

  input: {
    backgroundColor: '#888888',
    borderRadius: '.85rem',
    padding: '1rem',         
    color: 'white',
    height: '18rem',          
    textAlignVertical: 'top', 
    fontSize: '1.1rem',
  },

  label_instruction: {
    fontFamily: 'sans-serif',
    fontSize: '1rem',
    color: '#c48d18', 
    marginBottom: 10,
  },

  buttons: {
    width: '18.5rem',
    marginTop: '0.5rem'
  },

  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2665c4',
    borderRadius: '0.25rem',
    paddingBlock: '1rem',
    marginBottom: '1rem'
  },

  button_text: {
    fontFamily: 'sans-serif',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'white',
  },

  back_button: {
    backgroundColor: 'grey',
    borderRadius: '0.5rem',
    width: '2rem',
    height: '1.5rem',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 'auto',
    marginLeft: '1rem'
  },

  arrow_back: {
    color: 'white',
    fontSize: 16,
    fontWeight: 500
  }
});

export default styles;