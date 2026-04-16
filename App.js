import react from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import TelaInicio from "./screens/TelaInicio";
import TelaBusca from "./screens/TelaBusca";
import perfilLogin from "./screens/perfilLogin";
import perfilCadastro from "./screens/perfilCadastro";
import perfilConfirmarEmail from "./screens/perfilConfirmarEmail";
import perfilRedefinirSenha from "./screens/perfilRedefinirSenha";
import perfilMenu from "./screens/perfilMenu";
import admMenu from "./screens/admMenu";
import TelaFeed from "./screens/TelaFeed";
import admEvento from "./screens/admEvento";
import admCadastroEvento from "./screens/admCadastroEvento";
import admEventoMetrica from "./screens/admEventoMetrica";
import perfilEventos from "./screens/perfilEventos";
import eventoAvaliacao from "./screens/eventoAvaliacao";
import perfilOcorrencia from "./screens/perfilOcorrencia";
import perfilDeclararOcorrencia from "./screens/perfilDeclararOcorrencia";
import eventoProximo from "./screens/eventoProximo";
import perfilGeral from "./screens/perfilGeral";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="perfilLogin">
        <Stack.Screen name="Inicio" component={TelaInicio} options={{ headerShown: false }}/>
        <Stack.Screen name="Busca" component={TelaBusca} options={{ headerShown: false }} />
        <Stack.Screen name="perfilLogin" component={perfilLogin} options={{ headerShown: false }}/>
        <Stack.Screen name="perfilCadastro" component={perfilCadastro} options={{ headerShown: false }} />
        <Stack.Screen name="perfilConfirmarEmail" component={perfilConfirmarEmail} options={{ headerShown: false }} />
        <Stack.Screen name="perfilRedefinirSenha" component={perfilRedefinirSenha} options={{ headerShown: false }} />
        <Stack.Screen name="perfilMenu" component={perfilMenu} options={{ headerShown: false }} />
        <Stack.Screen name="admMenu" component={admMenu} options={{ headerShown: false }} />
        <Stack.Screen name="Feed" component={TelaFeed} options={{ headerShown: false }} />
        <Stack.Screen name="admEvento" component={admEvento} />
        <Stack.Screen name="admCadastroEvento" component={admCadastroEvento} options={{ headerShown: false }} />
        <Stack.Screen name="admEventoMetrica" component={admEventoMetrica} options={{ headerShown: false }} />
        <Stack.Screen name="perfilEventos" component={perfilEventos} options={{ headerShown: false }} />
        <Stack.Screen name="eventoAvaliacao" component={eventoAvaliacao} options={{ headerShown: false }} />
        <Stack.Screen name="perfilOcorrencia" component={perfilOcorrencia} options={{ headerShown: false }} />
        <Stack.Screen name="perfilDeclararOcorrencia" component={perfilDeclararOcorrencia} options={{ headerShown: false }} />
        <Stack.Screen name="eventoProximo" component={eventoProximo} options={{ headerShown: false }} />
        <Stack.Screen name="perfilGeral" component={perfilGeral} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
