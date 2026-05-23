import { createStackNavigator } from "@react-navigation/stack";

import TelaBusca from "../screens/TelaBusca";
import EventoDetalhes from "../screens/EventoDetalhes";
import PerfilDeclararOcorrencia from "../screens/PerfilDeclararOcorrencia";
import EventoApp from "../screens/EventoApp";
import TelaIngressos from "../screens/TelaIngressos";

const Stack = createStackNavigator();

export default function BuscaStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name="BuscaHome"
				component={TelaBusca}
			/>

			<Stack.Screen
				name="Detalhes"
				component={EventoDetalhes}
			/>

			<Stack.Screen
				name="TelaIngressos"
				component={TelaIngressos}
			/>

			<Stack.Screen
				name="NovaOcorrencia"
				component={PerfilDeclararOcorrencia}
			/>

			<Stack.Screen
				name="EventosApp"
				component={EventoApp}
			/>
		</Stack.Navigator>
	);
}
