import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { ActivityIndicator, View, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";

import TabNavigator from "./TabNavigator";
import CustomDrawerContent from "./CustomDrawerNavigator"; // Aponta certinho para o visual acima
import PerfilStack from "./PerfilStack";
import AdmStack from "./AdmStack";
import MapaStack from "./MapaStack";

import Suporte from "../screens/TelaSuporte";
import TelaConfiguracoes from "../screens/TelaConfiguracoes";
import TelaPainelCidade from "../screens/TelaPainelCidade";
import TelaLocaisVisitados from "../screens/TelaLocaisVisitados";
import MeusIngressos from "../screens/MeusIngressos";

import DrawerAvatar from "../components/DrawerAvatar";
import { Colors, Typography } from "../styles/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Drawer.Navigator
      key={isAdmin ? "admin" : "user"}
      initialRouteName="HomeTabs"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        drawerType: "slide",
        swipeEnabled: true,
        overlayColor: "rgba(0, 0, 0, 0.65)",

        /* 🎨 DRAWER STYLES */
        drawerStyle: {
          backgroundColor: Colors.background,
          width: SCREEN_WIDTH * 0.78,
        },
        sceneContainerStyle: {
          backgroundColor: Colors.background,
        },
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerLabelStyle: {
          fontSize: 15,
          marginLeft: -10,
          fontFamily: Typography?.medium || "System",
        },
        drawerItemStyle: {
          minHeight: 44,
          marginVertical: 1,
          borderRadius: 14,
        },
        drawerActiveBackgroundColor: "rgba(108,92,231,0.15)",

        /* 🎨 HEADER CONFIGS */
        headerShown: true,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.primary,
        headerLeft: () => <DrawerAvatar navigation={navigation} />,
      })}
    >
      {/* 🏠 TELA INICIAL */}
      <Drawer.Screen
        name="HomeTabs"
        component={TabNavigator}
        options={{
          drawerLabel: "Tela Inicial",
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant-outline" color={color} size={size} />,
        }}
      />

      {/* 👤 MEU PERFIL */}
      <Drawer.Screen
        name="Perfil"
        component={PerfilStack}
        options={{
          drawerLabel: "Meu Perfil",
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />,
        }}
      />

      {/* 📍 LOCAIS VISITADOS */}
      <Drawer.Screen
        name="LocaisVisitados"
        component={TelaLocaisVisitados}
        options={{
          drawerLabel: "Locais Visitados",
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="map-marker-multiple-outline" color={color} size={size} />,
        }}
      />

      {/* 🎫 MEUS INGRESSOS */}
      <Drawer.Screen
        name="MeusIngressosDrawer"
        component={MeusIngressos}
        options={{
          drawerLabel: "Meus Ingressos",
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="ticket-confirmation-outline" color={color} size={size} />,
        }}
      />

      {/* ⚙️ CONFIGURAÇÕES */}
      <Drawer.Screen
        name="Configuracoes"
        component={TelaConfiguracoes}
        options={{
          headerShown: false,
          drawerLabel: "Configurações",
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" color={color} size={size} />,
        }}
      />

      {/* 🌆 ROTAS OCULTAS */}
      <Drawer.Screen
        name="PainelCidade"
        component={TelaPainelCidade}
        options={{
          drawerLabel: () => null,
          title: null,
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="MapaVivo"
        component={MapaStack}
        options={{
          drawerLabel: () => null,
          title: null,
          drawerItemStyle: { display: "none" },
        }}
      />

      {/* 📞 SUPORTE */}
      <Drawer.Screen
        name="Suporte"
        component={Suporte}
        options={{
          drawerLabel: "Suporte",
          drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="lifebuoy" color={color} size={size} />,
        }}
      />

      {/* 👑 ÁREA DO ADMINISTRADOR */}
      {isAdmin === true && (
        <Drawer.Screen
          name="Admin"
          component={AdmStack}
          options={{
            drawerLabel: "Área do Organizador",
            unmountOnBlur: true,
            drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="shield-crown-outline" color={color} size={size} />,
          }}
        />
      )}
    </Drawer.Navigator>
  );
}
