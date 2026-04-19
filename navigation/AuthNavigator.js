import { createStackNavigator } from "@react-navigation/stack";

import PerfilLogin from "../screens/perfilLogin";
import PerfilCadastro from "../screens/perfilCadastro";
import PerfilConfirmarEmail from "../screens/perfilConfirmarEmail";

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={PerfilLogin} />
      <Stack.Screen name="Cadastro" component={PerfilCadastro} />
      <Stack.Screen name="ConfirmarEmail" component={PerfilConfirmarEmail} />
    </Stack.Navigator>
  );
}