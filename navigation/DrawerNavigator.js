import React, { useCallback, useMemo } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { ActivityIndicator, View, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { useColors } from "../context/ThemeContext";

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
import { Typography } from "../styles/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const { isAdmin, loading } = useAuth();
  const Colors = useColors();

  const drawerContent = useCallback((props) => <CustomDrawerContent {...props} />, []);

  const screenOptions = useCallback(({ navigation }) => ({
    drawerType: "slide",
    swipeEnabled: true,
    overlayColor: "rgba(0, 0, 0, 0.7)",

    /* 🎨 DRAWER STYLES */
    drawerStyle: {
      backgroundColor: Colors.background,
      width: SCREEN_WIDTH * 0.8,
    },
    sceneContainerStyle: {
      backgroundColor: Colors.background,
    },
    drawerActiveTintColor: Colors.primary,
    drawerInactiveTintColor: Colors.textSecondary,
    drawerLabelStyle: {
      fontSize: 16,
      marginLeft: -8,
      fontFamily: Typography?.medium || "System",
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    drawerItemStyle: {
      minHeight: 52,
      marginVertical: 2,
      borderRadius: 16,
      marginHorizontal: 8,
    },
    drawerActiveBackgroundColor: Colors.primary + "20",

    /* 🎨 HEADER CONFIGS */
    headerShown: true,
    headerTitle: "",
    headerShadowVisible: false,
    headerStyle: {
      backgroundColor: Colors.background,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTintColor: Colors.primary,
    headerLeft: () => <DrawerAvatar navigation={navigation} />,
  }), [Colors]);

  const drawerIcon = useCallback(({ color, size, iconName }) => (
    <MaterialCommunityIcons name={iconName} color={color} size={size} />
  ), []);

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
      drawerContent={drawerContent}
      screenOptions={screenOptions}
    >
      {/* 🏠 TELA INICIAL */}
      <Drawer.Screen
        name="HomeTabs"
        component={TabNavigator}
        options={{
          drawerLabel: "Tela Inicial",
          drawerIcon: (props) => drawerIcon({ ...props, iconName: "home-variant-outline" }),
        }}
      />

      {/* 👤 MEU PERFIL */}
      <Drawer.Screen
        name="Perfil"
        component={PerfilStack}
        options={{
          drawerLabel: "Meu Perfil",
          drawerIcon: (props) => drawerIcon({ ...props, iconName: "account-circle-outline" }),
        }}
      />

      {/* 📍 LOCAIS VISITADOS */}
      <Drawer.Screen
        name="LocaisVisitados"
        component={TelaLocaisVisitados}
        options={{
          drawerLabel: "Locais Visitados",
          drawerIcon: (props) => drawerIcon({ ...props, iconName: "map-marker-multiple-outline" }),
        }}
      />

      {/* 🎫 MEUS INGRESSOS */}
      <Drawer.Screen
        name="MeusIngressosDrawer"
        component={MeusIngressos}
        options={{
          drawerLabel: "Meus Ingressos",
          drawerIcon: (props) => drawerIcon({ ...props, iconName: "ticket-confirmation-outline" }),
        }}
      />

      {/* ⚙️ CONFIGURAÇÕES */}
      <Drawer.Screen
        name="Configuracoes"
        component={TelaConfiguracoes}
        options={{
          headerShown: false,
          drawerLabel: "Configurações",
          drawerIcon: (props) => drawerIcon({ ...props, iconName: "cog-outline" }),
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
          drawerIcon: (props) => drawerIcon({ ...props, iconName: "lifebuoy" }),
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
            drawerIcon: (props) => drawerIcon({ ...props, iconName: "shield-crown-outline" }),
          }}
        />
      )}
    </Drawer.Navigator>
  );
}
