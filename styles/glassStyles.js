import { StyleSheet } from 'react-native';

/**
 * Estilos reutilizáveis para efeito Liquid Glass (Glassmorphism)
 */

export const glassStyles = StyleSheet.create({
  // Base: vidro com blur e transparência
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  glassContainerDark: {
    backgroundColor: 'rgba(50, 50, 50, 0.25)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Header com vidro
  glassHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },

  // Card com vidro (para notificações)
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },

  glassCardDark: {
    backgroundColor: 'rgba(30, 30, 30, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },

  // Button com vidro
  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  glassButtonPrimary: {
    backgroundColor: 'rgba(25, 118, 210, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  // Badge com vidro
  glassBadge: {
    backgroundColor: 'rgba(229, 57, 53, 0.85)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.4)',
  },

  // Shadow suave (glassmorphism)
  shadowGlass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },

  // Gradiente de fundo (opcional)
  gradientBg: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },

  // Efeito de blur backdrop (simulado com opacity)
  blurBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default glassStyles;
