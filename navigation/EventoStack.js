import { createStackNavigator } from "@react-navigation/stack";

import EventoHome from "../screens/EventoHome";
import EventoApp from "../screens/EventoApp";
import EventoDetalhes from "../screens/EventoDetalhes";
import EventoAvaliacao from "../screens/EventoAvaliacao";
import EventosPublicos from "../screens/EventoPublico";
import EventoDetalhesPublico from "../screens/EventoDetalhesPublico";
import TelaCulturaViva from "../screens/TelaCulturaViva";
import TelaExploreCidade from "../screens/TelaExploreCidade";
import EventoIngresso from "../screens/EventoIngresso";
import TelaIngressos from "../screens/TelaIngressos";
import TelaCarrinhoIngressos from "../screens/TelaCarrinhoIngressos";
import MeusIngressos from "../screens/MeusIngressos";
import PerfilDeclararOcorrencia from "../screens/PerfilDeclararOcorrencia";
import TelaMapaVivo from "../screens/TelaMapaVivo";
import MapaVivoEventoDetalhes from "../screens/MapaVivoEventoDetalhes";
import MapaVivoCheckIn from "../screens/MapaVivoCheckIn";
import PerfilPublico from "../screens/PerfilPublico";
import TelaAgendaEventos from "../screens/TelaAgendaEventos";

const Stack = createStackNavigator();

export default function EventoStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* HUB */}
      <Stack.Screen name="EventoHome" component={EventoHome} />

      {/* LISTAGENS */}
      <Stack.Screen name="EventosApp" component={EventoApp} />
      <Stack.Screen name="EventosPublicos" component={EventosPublicos} />

      {/* DETALHES E AÇÕES */}
      <Stack.Screen 
        name="Detalhes" 
        component={EventoDetalhes}
        options={{ tabBarStyle: { display: 'none' } }}
      />
      <Stack.Screen name="EventoDetalhesPublico" component={EventoDetalhesPublico} />
      <Stack.Screen name="PerfilPublico" component={PerfilPublico} />
      <Stack.Screen name="Avaliacao" component={EventoAvaliacao} />
      <Stack.Screen name="AgendaEventos" component={TelaAgendaEventos} />
      <Stack.Screen name="TelaCulturaViva" component={TelaCulturaViva} />
      <Stack.Screen name="TelaExploreCidade" component={TelaExploreCidade} />
      <Stack.Screen name="TelaMapaVivo" component={TelaMapaVivo} />
      <Stack.Screen name="MapaVivoEventoDetalhes" component={MapaVivoEventoDetalhes} />
      <Stack.Screen name="MapaVivoCheckIn" component={MapaVivoCheckIn} />

      {/* INGRESSOS — dois modos acessíveis */}
      <Stack.Screen name="EventoIngresso" component={EventoIngresso} />
      <Stack.Screen name="TelaIngressos" component={TelaIngressos} />
      <Stack.Screen name="TelaCarrinhoIngressos" component={TelaCarrinhoIngressos} />
      <Stack.Screen name="MeusIngressos" component={MeusIngressos} />

      {/* OCORRÊNCIAS */}
      <Stack.Screen name="NovaOcorrencia" component={PerfilDeclararOcorrencia} />
    </Stack.Navigator>
  );
}
