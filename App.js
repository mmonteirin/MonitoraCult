/**
 * App.js — MonitoraCult
 * Adicionado: NotificationProvider em volta do NavigationContainer
 */

import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./context/AuthContext";
import { CadastroProvider } from "./context/CadastroContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
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
import { Brand } from "./styles/Colors";

const NavigationThemeWrapper = ({ children }) => {
  const { navigationTheme } = useTheme();

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      {children}
    </NavigationContainer>
  );
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
        <ActivityIndicator color={Brand.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <CadastroProvider>
          {/*
            ✅ NotificationProvider precisa ficar dentro de AuthProvider
            (pois usa useAuth internamente) e FORA do NavigationContainer
            para que o contexto fique disponível em toda a árvore.
          */}
          <NotificationProvider>
            <NavigationThemeWrapper>
              <AppNavigator />
            </NavigationThemeWrapper>
          </NotificationProvider>
        </CadastroProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}