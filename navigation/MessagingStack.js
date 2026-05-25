import { createStackNavigator } from "@react-navigation/stack";
import TelaConversas from "../screens/TelaConversas";
import TelaMensagens from "../screens/TelaMensagens";
import TelaBuscaUsuarios from "../screens/TelaBuscaUsuarios";
import PerfilPublico from "../screens/PerfilPublico";

const Stack = createStackNavigator();

export default function MessagingStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Conversas" component={TelaConversas} />
			<Stack.Screen name="BuscaUsuarios" component={TelaBuscaUsuarios} />
			<Stack.Screen name="TelaMensagens" component={TelaMensagens} />
			<Stack.Screen name="PerfilPublico" component={PerfilPublico} />
		</Stack.Navigator>
	);
}
