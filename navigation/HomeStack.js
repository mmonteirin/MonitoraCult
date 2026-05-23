import TelaInicio from "../screens/TelaInicio";
import EventoDetalhes from "../screens/EventoDetalhes";
import EventoApp from "../screens/EventoApp";

import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InicioHome" component={TelaInicio} />
      <Stack.Screen name="Detalhes" component={EventoDetalhes} />
      <Stack.Screen name="EventosApp" component={EventoApp} />
    </Stack.Navigator>
  );
}