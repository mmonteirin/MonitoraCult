import { createStackNavigator } from "@react-navigation/stack";

import PerfilGeral from "../screens/TelaPerfil";
import PerfilCadastro from "../screens/PerfilCadastro";
import PerfilHistorico from "../screens/PerfilHistorico";
import PerfilDeclararOcorrencia from "../screens/PerfilDeclararOcorrencia";
import EventoDetalhes from "../screens/EventoDetalhes";
import PerfilEditar from "../screens/PerfilEditar";
import ResetPassword from "../screens/ResetPassword";
import EventoHome from "../screens/EventoHome"; // 👈 volta simples
import PerfilPublico from "../screens/PerfilPublico";
import TelaAgendaEventos from "../screens/TelaAgendaEventos";
import TelaLocaisVisitados from "../screens/TelaLocaisVisitados";

const Stack = createStackNavigator();

export default function PerfilStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="PerfilHome"
    >
      <Stack.Screen name="PerfilHome" component={PerfilGeral} />
      <Stack.Screen name="PerfilEditar" component={PerfilEditar} />
      <Stack.Screen name="PerfilPublico" component={PerfilPublico} />
      <Stack.Screen name="AgendaEventos" component={TelaAgendaEventos} />
      <Stack.Screen name="LocaisVisitados" component={TelaLocaisVisitados} />
      <Stack.Screen name="Cadastro" component={PerfilCadastro} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="Ocorrencias" component={PerfilHistorico} />
      <Stack.Screen name="NovaOcorrencia" component={PerfilDeclararOcorrencia} />
      <Stack.Screen name="Detalhes" component={EventoDetalhes} />
    </Stack.Navigator>
  );
}
