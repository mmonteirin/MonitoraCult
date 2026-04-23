import { createStackNavigator } from "@react-navigation/stack";

import PerfilLogin from "../screens/PerfilLogin";
import PerfilCadastro from "../screens/PerfilCadastro";
import ResetPassword from "../screens/ResetPassword";

const Stack = createStackNavigator();

export default function AuthNavigator({ setIsLogged }) {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Login">
				{(props) => <PerfilLogin {...props} setIsLogged={setIsLogged} />}
			</Stack.Screen>
			<Stack.Screen name="Cadastro" component={PerfilCadastro} />
			<Stack.Screen name="ResetPassword" component={ResetPassword} />
		</Stack.Navigator>
	);
}
