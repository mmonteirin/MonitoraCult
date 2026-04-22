import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import TelaInicio from "../screens/TelaInicio";
import TelaBusca from "../screens/TelaBusca";
import TelaFeed from "../screens/TelaFeed";
import PerfilGeral from "../screens/TelaPerfil";
import EventoProximo from "../screens/EventoProximo";

import AnimatedTabIcon from "./AnimatedTabIcon";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === "Inicio") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Busca") {
            iconName = "magnify";
          } else if (route.name === "Feed") {
            iconName = focused ? "rss" : "rss";
          } else if (route.name === "Ingressos"){
              iconName = focused ? "ticket" : "ticket-outline";
          } else if (route.name === "Perfil") {
            iconName = focused ? "account" : "account-outline";
          }

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
          backgroundColor: "#fff",
          height: 75,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 0.5,
         },
        
        tabBarItemStyle: {
         justifyContent: "center",
         alignItems: "center",
        },

        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 4,
        },
        
        tabBarIconStyle: {
          marginTop: 4,
        },

        tabBarShowLabel: true,
      })}
    >
      <Tab.Screen name="Inicio" component={TelaInicio} />
      <Tab.Screen name="Busca" component={TelaBusca} />
      <Tab.Screen name="Feed" component={TelaFeed} />
      <Tab.Screen name="Ingressos" component={EventoProximo} />
      <Tab.Screen name="Perfil" component={PerfilGeral} />
    </Tab.Navigator>
  );
}