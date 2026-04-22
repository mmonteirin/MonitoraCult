import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import Login from "../screens/login";
import Cadastro from "../screens/cadastro";

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Cadastro" component={Cadastro} />
    </Stack.Navigator>
  );
}