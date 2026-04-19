import { createDrawerNavigator } from "@react-navigation/drawer";

import TabNavigator from "./TabNavigator";

import PerfilMenu from "../screens/perfilMenu";
import PerfilDeclararOcorrencia from "../screens/perfilDeclararOcorrencia";
import EventoDetalhes from "../screens/EventoDetalhes";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Home" component={TabNavigator} />
      <Drawer.Screen name="Menu" component={PerfilMenu} />
      <Drawer.Screen name="Ocorrencia" component={PerfilDeclararOcorrencia} />
      <Drawer.Screen name="Evento" component={EventoDetalhes} />
    </Drawer.Navigator>
  );
}