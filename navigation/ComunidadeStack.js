import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TelaComunidade from "../screens/TelaComunidade";
import ComunidadeGrupoDetalhes from "../screens/ComunidadeGrupoDetalhes";
import ComunidadeForumDetalhes from "../screens/ComunidadeForumDetalhes";
import ComunidadeCriadorDetalhes from "../screens/ComunidadeCriadorDetalhes";
import ComunidadeNoticiaDetalhes from "../screens/ComunidadeNoticiaDetalhes";

const Stack = createNativeStackNavigator();

const screenOpts = {
  animationEnabled: true,
};

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
        options={screenOpts}
      />
      <Stack.Screen
        name="ComunidadeGrupoDetalhes"
        component={ComunidadeGrupoDetalhes}
        options={screenOpts}
      />
      <Stack.Screen
        name="ComunidadeForumDetalhes"
        component={ComunidadeForumDetalhes}
        options={screenOpts}
      />
      <Stack.Screen
        name="ComunidadeCriadorDetalhes"
        component={ComunidadeCriadorDetalhes}
        options={screenOpts}
      />
      <Stack.Screen
        name="ComunidadeNoticiaDetalhes"
        component={ComunidadeNoticiaDetalhes}
        options={screenOpts}
      />
    </Stack.Navigator>
  );
}
