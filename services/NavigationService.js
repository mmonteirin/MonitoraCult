import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

/**
 * Navegação simples
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

/**
 * Navegação para rotas dentro de stacks (🔥 ESSA É A PRINCIPAL)
 */
export function navigateNested(parent, screen, params = {}) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(parent, {
      screen,
      params,
    });
  }
}

/**
 * Push (força nova tela)
 */
export function push(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch({
      ...CommonActions.navigate(name, params),
    });
  }
}

/**
 * Voltar
 */
export function goBack() {
  if (navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * Reset (limpa histórico)
 */
export function reset(name) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name }],
    });
  }
}
