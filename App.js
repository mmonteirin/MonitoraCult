import react from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import TelaInicio from "./screens/TelaInicio";
import TelaBusca from "./screens/TelaBusca";
import PerfilLogin from "./screens/PerfilLogin";
import PerfilCadastro from "./screens/PerfilCadastro";
import PerfilConfirmarEmail from "./screens/PerfilConfirmarEmail";
import PerfilRedefinirSenha from "./screens/PerfilRedefinirSenha";
import PerfilMenu from "./screens/PerfilMenu";
import AdmMenu from "./screens/AdmMenu";
import TelaFeed from "./screens/TelaFeed";
import AdmEvento from "./screens/AdmEvento";
import AdmCadastroEvento from "./screens/AdmCadastroEvento";
import AdmEventoMetrica from "./screens/AdmEventoMetrica";
import EventoDetalhes from "./screens/EventoDetalhes";
import EventoAvaliacao from "./screens/EventoAvaliacao";
import PerfilOcorrencia from "./screens/PerfilOcorrencia";
import PerfilDeclararOcorrencia from "./screens/PerfilDeclararOcorrencia";
import EventoProximo from "./screens/EventoProximo";
import PerfilGeral from "./screens/PerfilGeral";

const Stack = createStackNavigator();

export default function App() {
	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="PerfilDeclararOcorrencia">
				<Stack.Screen
					name="Inicio"
					component={TelaInicio}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="Busca"
					component={TelaBusca}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="PerfilLogin"
					component={PerfilLogin}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="PerfilCadastro"
					component={PerfilCadastro}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="PerfilConfirmarEmail"
					component={PerfilConfirmarEmail}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="PerfilRedefinirSenha"
					component={PerfilRedefinirSenha}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="PerfilMenu"
					component={PerfilMenu}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="AdmMenu"
					component={AdmMenu}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="Feed"
					component={TelaFeed}
					options={{ headerShown: false }}
				/>
				<Stack.Screen name="AdmEvento" component={AdmEvento} />
				<Stack.Screen
					name="AdmCadastroEvento"
					component={AdmCadastroEvento}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="AdmEventoMetrica"
					component={AdmEventoMetrica}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="EventoDetalhes"
					component={EventoDetalhes}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="AventoAvaliacao"
					component={EventoAvaliacao}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="PerfilOcorrencia"
					component={PerfilOcorrencia}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="PerfilDeclararOcorrencia"
					component={PerfilDeclararOcorrencia}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="EventosProximo"
					component={EventoProximo}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="PerfilGeral"
					component={PerfilGeral}
					options={{ headerShown: false }}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
}
