import { createDrawerNavigator } from "@react-navigation/drawer";

import TabNavigator from "./TabNavigator";
import CustomDrawerContent from "./CustomDrawerNavigator";
import TelaFeed from "../screens/TelaFeed";
import PerfilOcorrencia from "../screens/PerfilOcorrencia";
import PerfilMenu from "../screens/PerfilMenu";
import Suporte from "../screens/TelaSuporte";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: "#6200ee" },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#6200ee",
      }}
    >
      <Drawer.Screen name="Tela Inicial" component={TabNavigator} />
      <Drawer.Screen name="Feed" component={TelaFeed} />
      <Drawer.Screen name="Suas Avaliações" component={PerfilOcorrencia} />
      <Drawer.Screen name="Perfil" component={PerfilMenu} />
      <Drawer.Screen name="Suporte Técnico" component={Suporte} />
    </Drawer.Navigator>
  );
}
