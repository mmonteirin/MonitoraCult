/**
 * App.js — MonitoraCult
 * Adicionado: NotificationProvider em volta do NavigationContainer
 */

import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./context/AuthContext";
import { CadastroProvider } from "./context/CadastroContext";
import { NotificationProvider } from "./context/NotificationContext";
import AppNavigator from "./navigation/AppNavigator";
import { navigationRef } from "./navigation/NavigationService";

import { useFonts } from "expo-font";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  SectionList,
  View,
} from "react-native";
import { Colors, Typography } from "./styles/Colors";

// Tema global do React Navigation.
// A chave `fonts` é obrigatória: componentes internos como HeaderTitle e
// DrawerItem acessam theme.fonts.bold / theme.fonts.medium diretamente.
// Sem ela ocorre: "Cannot read properties of undefined (reading 'bold')"
const navigationTheme = {
  dark: true,
  colors: {
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.primary,
  },
  fonts: {
    regular: { fontFamily: Typography.regular, fontWeight: "400" },
    medium:  { fontFamily: Typography.medium,  fontWeight: "500" },
    bold:    { fontFamily: Typography.bold,    fontWeight: "700" },
    heavy:   { fontFamily: Typography.bold,    fontWeight: "900" },
  },
};

const boundedScrollProps = {
  alwaysBounceVertical: false,
  bounces: false,
  overScrollMode: "never",
};

[ScrollView, FlatList, SectionList].forEach((Component) => {
  Component.defaultProps = {
    ...Component.defaultProps,
    ...boundedScrollProps,
  };
});

if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.style.overscrollBehavior = "none";
  document.body.style.overscrollBehavior = "none";
  document.body.style.overflow = "hidden";
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PoppinsRegular: require("./assets/fonts/Poppins-Regular.ttf"),
    PoppinsMedium: require("./assets/fonts/Poppins-Medium.ttf"),
    PoppinsSemiBold: require("./assets/fonts/Poppins-SemiBold.ttf"),
    PoppinsBold: require("./assets/fonts/Poppins-Bold.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <CadastroProvider>
        {/*
          ✅ NotificationProvider precisa ficar dentro de AuthProvider
          (pois usa useAuth internamente) e FORA do NavigationContainer
          para que o contexto fique disponível em toda a árvore.
        */}
        <NotificationProvider>
          <NavigationContainer ref={navigationRef} theme={navigationTheme}>
            <AppNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </CadastroProvider>
    </AuthProvider>
  );
}