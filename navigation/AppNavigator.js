import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

export default function AppNavigator() {
  const isLogged = true; // depois você liga isso ao login real

  return (
    <NavigationContainer>
      {isLogged ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}