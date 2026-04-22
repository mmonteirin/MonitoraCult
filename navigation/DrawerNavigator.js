import { createDrawerNavigator } from '@react-navigation/drawer';
import { Image, TouchableOpacity } from "react-native";

import TabNavigator from './TabNavigator';
import CustomDrawerContent from './CustomDrawerNavigator'; 
import TelaFeed from '../screens/TelaFeed';
import PerfilOcorrencia from '../screens/PerfilOcorrencia';
import perfilMenu from '../screens/PerfilMenu';
import Suporte from '../screens/TelaSuporte';


const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
<Drawer.Navigator
  drawerContent={(props) => <CustomDrawerContent {...props} />}
  screenOptions={({ navigation }) => ({
    headerShown: true,
    headerTitle: "",
    swipeEnabled: false,
    drawerType: "back",
  headerStyle: {
    backgroundColor: "#000", },
    headerTintColor: "#fff",
    headerShadowVisible: false, 

    headerLeft: () => (
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Image
          source={{ uri: "https://i.pravatar.cc/100" }}
          style={{
            width: 35,
            height: 35,
            borderRadius: 15,
            marginLeft: 15,
          }}
        />
      </TouchableOpacity>
    ),

    headerRight: () => null,
  })}
>
       <Drawer.Screen name="Tela Inicial" component={TabNavigator} />
       <Drawer.Screen name="Feed" component={TelaFeed} />
       <Drawer.Screen name="Suas Avaliações" component={PerfilOcorrencia} />
       <Drawer.Screen name="Perfil" component={perfilMenu} />
       <Drawer.Screen name="Suporte Técnico" component={Suporte} />
    </Drawer.Navigator>
  );
}
