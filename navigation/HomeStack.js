import TelaInicio from "../screens/TelaInicio";
import EventoDetalhes from "../screens/EventoDetalhes";
import EventoApp from "../screens/EventoApp";
import TelaIngressos from "../screens/TelaIngressos";
import PerfilDeclararOcorrencia from "../screens/PerfilDeclararOcorrencia";
import TelaExploreCidade from "../screens/TelaExploreCidade";

import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InicioHome" component={TelaInicio} />
      <Stack.Screen name="Detalhes" component={EventoDetalhes} />
      <Stack.Screen name="TelaIngressos" component={TelaIngressos} />
      <Stack.Screen name="EventosApp" component={EventoApp} />
      <Stack.Screen name="TelaExploreCidade" component={TelaExploreCidade} />
      <Stack.Screen name="NovaOcorrencia" component={PerfilDeclararOcorrencia} />
    </Stack.Navigator>
  );
}
