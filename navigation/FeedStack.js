import { createStackNavigator } from "@react-navigation/stack";

// Hub principal
import TelaFeed from "../screens/TelaFeed";

// Post & Evento
import CriarPost from "../screens/CriarPost";
import EventoDetalhes from "../screens/EventoDetalhes";
import TelaIngressos from "../screens/TelaIngressos";
import TelaAgendaEventos from "../screens/TelaAgendaEventos";
import EventoApp from "../screens/EventoApp";
import PerfilDeclararOcorrencia from "../screens/PerfilDeclararOcorrencia";

// Perfil público
import PerfilPublico from "../screens/PerfilPublico";

// Mensagens diretas
import TelaConversas from "../screens/TelaConversas";
import TelaMensagens from "../screens/TelaMensagens";
import TelaBuscaUsuarios from "../screens/TelaBuscaUsuarios";

// Comunidades
import TelaComunidade from "../screens/TelaComunidade";
import ComunidadeGrupoDetalhes from "../screens/ComunidadeGrupoDetalhes";
import ComunidadeForumDetalhes from "../screens/ComunidadeForumDetalhes";
import ComunidadeCriadorDetalhes from "../screens/ComunidadeCriadorDetalhes";
import ComunidadeNoticiaDetalhes from "../screens/ComunidadeNoticiaDetalhes";

// Notificações
import TelaNotificacoes from "../screens/TelaNotificacoes";

const Stack = createStackNavigator();

const NO_HEADER = { headerShown: false };

export default function FeedStack() {
	return (
		<Stack.Navigator screenOptions={NO_HEADER}>

			{/* ── HUB ─────────────────────────────────────────────── */}
			<Stack.Screen name="Feed" component={TelaFeed} />

			{/* ── POST & EVENTO ───────────────────────────────────── */}
			<Stack.Screen name="CriarPost"      component={CriarPost} />
			<Stack.Screen name="Detalhes"       component={EventoDetalhes} />
			<Stack.Screen name="TelaIngressos"  component={TelaIngressos} />
			<Stack.Screen name="AgendaEventos"  component={TelaAgendaEventos} />
			<Stack.Screen name="EventosApp"     component={EventoApp} />
			<Stack.Screen name="NovaOcorrencia" component={PerfilDeclararOcorrencia} />

			{/* ── PERFIL PÚBLICO ───────────────────────────────────── */}
			<Stack.Screen name="PerfilPublico"  component={PerfilPublico} />

			{/* ── MENSAGENS ────────────────────────────────────────── */}
			<Stack.Screen name="Conversas"      component={TelaConversas} />
			<Stack.Screen name="TelaMensagens"  component={TelaMensagens} />
			<Stack.Screen name="BuscaUsuarios"  component={TelaBuscaUsuarios} />

			{/* ── COMUNIDADES ──────────────────────────────────────── */}
			<Stack.Screen name="TelaComunidade"              component={TelaComunidade} />
			<Stack.Screen name="ComunidadeGrupoDetalhes"     component={ComunidadeGrupoDetalhes} />
			<Stack.Screen name="ComunidadeForumDetalhes"     component={ComunidadeForumDetalhes} />
			<Stack.Screen name="ComunidadeCriadorDetalhes"   component={ComunidadeCriadorDetalhes} />
			<Stack.Screen name="ComunidadeNoticiaDetalhes"   component={ComunidadeNoticiaDetalhes} />

			{/* ── NOTIFICAÇÕES ─────────────────────────────────────── */}
			<Stack.Screen name="Notificacoes"   component={TelaNotificacoes} />

		</Stack.Navigator>
	);
}