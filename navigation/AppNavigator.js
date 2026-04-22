import { createStackNavigator } from "@react-navigation/stack";

import AuthNavigator from "./AuthNavigator";
import DrawerNavigator from "./DrawerNavigator";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const isLogged = true; // depois vem do backend

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLogged ? (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}