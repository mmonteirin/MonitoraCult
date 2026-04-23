import { createStackNavigator } from "@react-navigation/stack";
import { useState } from "react";

import AuthNavigator from "./AuthNavigator";
import DrawerNavigator from "./DrawerNavigator";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isLogged, setIsLogged] = useState(false); // depois vem do backend

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLogged ? (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      ) : (
        <Stack.Screen name="Auth">
          {(props) => (
          <AuthNavigator {...props} setIsLogged={setIsLogged} />
          )} 
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}