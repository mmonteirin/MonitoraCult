import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TelaComunidade from "../screens/TelaComunidade";
import ComunidadeGrupoDetalhes from "../screens/ComunidadeGrupoDetalhes";
import ComunidadeForumDetalhes from "../screens/ComunidadeForumDetalhes";
import ComunidadeCriadorDetalhes from "../screens/ComunidadeCriadorDetalhes";
import ComunidadeNoticiaDetalhes from "../screens/ComunidadeNoticiaDetalhes";

const Stack = createNativeStackNavigator();

export default function ComunidadeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#0F0F14" },
      }}
    >
      <Stack.Screen
        name="TelaComunidade"
        component={TelaComunidade}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="ComunidadeGrupoDetalhes"
        component={ComunidadeGrupoDetalhes}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="ComunidadeForumDetalhes"
        component={ComunidadeForumDetalhes}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="ComunidadeCriadorDetalhes"
        component={ComunidadeCriadorDetalhes}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="ComunidadeNoticiaDetalhes"
        component={ComunidadeNoticiaDetalhes}
        options={{
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
