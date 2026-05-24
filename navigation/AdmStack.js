import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../context/AuthContext";

import AdmMenu from "../screens/AdmMenu";
import AdmEvento from "../screens/AdmEvento";
import AdmCadastroEvento from "../screens/AdmCadastroEvento";
import AdmSuporte from "../screens/AdmSuporte";
import AdmEventoMetrica from "../screens/AdmEventoMetrica";
import AdmEventoDashIndividual from "../screens/AdmEventoDashIndividual";

import { View, Text, ActivityIndicator } from "react-native";

const Stack = createStackNavigator();

function Unauthorized() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 16 }}>
        🔒 Acesso restrito a Organizadores
      </Text>
    </View>
  );
}

function Loading() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color="#FFD700" />
      <Text style={{ marginTop: 10 }}>Carregando...</Text>
    </View>
  );
}

export default function AdmStack() {
  const { role, loading } = useAuth();

  if (loading) return <Loading />;
  if (role !== "admin") return <Unauthorized />;

  return (
    <Stack.Navigator
      initialRouteName="AdmMenu"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AdmMenu" component={AdmMenu} />
      <Stack.Screen name="CriarEvento" component={AdmCadastroEvento} />
      <Stack.Screen name="AdmEvento" component={AdmEvento} />
      <Stack.Screen name="Metricas" component={AdmEventoMetrica} />
      <Stack.Screen
        name="AdmEventoDashIndividual"
        component={AdmEventoDashIndividual}
      />
      <Stack.Screen name="AdmSuporte" component={AdmSuporte} />
    </Stack.Navigator>
  );
}
