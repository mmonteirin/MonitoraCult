import { createStackNavigator } from "@react-navigation/stack";
import { useState, useEffect } from "react";

import AuthNavigator from "./AuthNavigator";
import DrawerNavigator from "./DrawerNavigator";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true); // 👈 importante

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLogged(!!user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 👇 evita "flash" de tela errada
  if (loading) return null;

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