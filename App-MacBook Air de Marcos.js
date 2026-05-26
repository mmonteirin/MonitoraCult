import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./context/AuthContext";
import { CadastroProvider } from "./context/CadastroContext";
import AppNavigator from "./navigation/AppNavigator";
import { navigationRef } from "./navigation/NavigationService"; // ✅ corrigido

import { useFonts } from "expo-font";
import { ActivityIndicator, View } from "react-native";

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
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthProvider>
      <CadastroProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </CadastroProvider>
    </AuthProvider>
  );
}
