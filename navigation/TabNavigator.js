import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import TelaInicio from "../screens/TelaInicio";
import TelaBusca from "../screens/TelaBusca";
import TelaFeed from "../screens/TelaFeed";
import PerfilGeral from "../screens/PerfilGeral";
import EventoProximo from "../screens/EventoProximo";
import AnimatedTabIcon from "./AnimatedTabIcon";

const Tab = createBottomTabNavigator();

const icons = {
  Inicio: {
    focused: "home",
    unfocused: "home-outline",
  },
  Busca: {
    focused: "magnify",
    unfocused: "magnify",
  },
  Feed: {
    focused: "view-grid",
    unfocused: "view-grid-outline",
  },
  Ingressos: {
    focused: "ticket",
    unfocused: "ticket-outline",
  },
  Perfil: {
    focused: "account",
    unfocused: "account-outline",
  },
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ color, size, focused }) => {
          const icon = icons[route.name];
          if (!icon) return null;

          const iconName = focused ? icon.focused : icon.unfocused;

          return (
            <AnimatedTabIcon
              name={iconName}
              size={size}
              color={color}
              focused={focused}
            />
          );
        },

        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "gray",

        tabBarStyle: {
          backgroundColor: "#111",
          borderTopWidth: 0,
          height: 60,
        },

        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Inicio" component={TelaInicio} />
      <Tab.Screen name="Busca" component={TelaBusca} />
      <Tab.Screen name="Feed" component={TelaFeed} />
      <Tab.Screen name="Ingressos" component={EventoProximo} /> {/* 🔥 NOVO */}
      <Tab.Screen name="Perfil" component={PerfilGeral} />
    </Tab.Navigator>
  );
}