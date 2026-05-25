import { createStackNavigator } from "@react-navigation/stack";
import TelaNotificacoes from "../screens/TelaNotificacoes";
import PerfilPublico from "../screens/PerfilPublico";
import EventoDetalhes from "../screens/EventoDetalhes";
import TelaFeed from "../screens/TelaFeed";

const Stack = createStackNavigator();

export default function NotificationsStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Notificacoes" component={TelaNotificacoes} />
			<Stack.Screen name="PerfilPublico" component={PerfilPublico} />
			<Stack.Screen name="EventoDetalhes" component={EventoDetalhes} />
			<Stack.Screen name="Feed" component={TelaFeed} />
		</Stack.Navigator>
	);
}
