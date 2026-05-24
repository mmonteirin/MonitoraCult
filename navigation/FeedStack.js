import { createStackNavigator } from "@react-navigation/stack";
import TelaFeed from "../screens/TelaFeed";
import EventoDetalhes from "../screens/EventoDetalhes";
import CriarPost from "../screens/CriarPost";
import PerfilDeclararOcorrencia from "../screens/PerfilDeclararOcorrencia";
import EventoApp from "../screens/EventoApp";
import TelaIngressos from "../screens/TelaIngressos";
import PerfilPublico from "../screens/PerfilPublico";
import TelaAgendaEventos from "../screens/TelaAgendaEventos";

const Stack = createStackNavigator();

export default function FeedStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Feed" component={TelaFeed} />
			<Stack.Screen name="Detalhes" component={EventoDetalhes} />
			<Stack.Screen name="TelaIngressos" component={TelaIngressos} />
			<Stack.Screen name="PerfilPublico" component={PerfilPublico} />
			<Stack.Screen name="AgendaEventos" component={TelaAgendaEventos} />
			<Stack.Screen name="CriarPost" component={CriarPost} />
			<Stack.Screen name="NovaOcorrencia" component={PerfilDeclararOcorrencia} />
			<Stack.Screen name="EventosApp" component={EventoApp} />
		</Stack.Navigator>
	);
}
