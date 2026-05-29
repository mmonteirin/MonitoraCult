import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TelaMapaVivo from "../screens/TelaMapaVivo";
import MapaVivoEventoDetalhes from "../screens/MapaVivoEventoDetalhes";
import MapaVivoCheckIn from "../screens/MapaVivoCheckIn";

const Stack = createNativeStackNavigator();

export default function MapaStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#0F0F14" },
      }}
    >
      <Stack.Screen
        name="TelaMapaVivo"
        component={TelaMapaVivo}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="MapaVivoEventoDetalhes"
        component={MapaVivoEventoDetalhes}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="MapaVivoCheckIn"
        component={MapaVivoCheckIn}
        options={{
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
